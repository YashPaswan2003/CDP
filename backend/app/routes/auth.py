from jose import JWTError, jwt
import bcrypt
from datetime import datetime, timedelta
from fastapi import APIRouter, HTTPException, Header
from app.models.auth import RegisterRequest, LoginRequest, AuthResponse, User
from app.database.connection import get_connection
from app.config import settings
import logging

logger = logging.getLogger("api")
router = APIRouter(prefix="/auth", tags=["auth"])

# JWT configuration
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_HOURS = 24


def hash_password(password: str) -> str:
    """Hash password using bcrypt."""
    return bcrypt.hashpw(password.encode('utf-8'), bcrypt.gensalt(rounds=12)).decode('utf-8')


def verify_password(plain_password: str, hashed_password: str) -> bool:
    """Verify plain password against bcrypt hash."""
    return bcrypt.checkpw(plain_password.encode('utf-8'), hashed_password.encode('utf-8'))


def create_access_token(user_id: str, role: str, name: str) -> str:
    """Create JWT access token."""
    payload = {
        "sub": user_id,
        "role": role,
        "name": name,
        "exp": datetime.utcnow() + timedelta(hours=ACCESS_TOKEN_EXPIRE_HOURS)
    }
    return jwt.encode(payload, settings.SECRET_KEY, algorithm=ALGORITHM)


def get_current_user(authorization: str = Header(None)):
    """FastAPI dependency to extract and verify JWT from Authorization header."""
    if not authorization:
        raise HTTPException(status_code=401, detail="Missing authorization header")

    try:
        token = authorization.replace("Bearer ", "")
        payload = jwt.decode(token, settings.SECRET_KEY, algorithms=[ALGORITHM])
        user_id: str = payload.get("sub")
        role: str = payload.get("role")
        name: str = payload.get("name")

        if not user_id or not role:
            raise HTTPException(status_code=401, detail="Invalid token")

        return {"id": user_id, "role": role, "name": name}
    except JWTError:
        raise HTTPException(status_code=401, detail="Invalid token")


@router.post("/register", response_model=AuthResponse)
def register(request: RegisterRequest):
    """Register a new user — inserts into users table."""
    conn = get_connection()

    # Check if user already exists
    existing = conn.execute(
        "SELECT id FROM users WHERE email = ?",
        [request.email]
    ).fetchall()

    if existing:
        logger.error(f"Registration failed: {request.email} already exists")
        raise HTTPException(status_code=400, detail="Email already registered")

    # Hash password
    password_hash = hash_password(request.password)

    # Insert user into database (default role is 'viewer')
    user_id = None
    try:
        conn.execute(
            "INSERT INTO users (name, email, password_hash, role) VALUES (?, ?, ?, ?)",
            [request.name, request.email, password_hash, "viewer"]
        )
        # Retrieve the inserted user's ID
        result = conn.execute(
            "SELECT id FROM users WHERE email = ?",
            [request.email]
        ).fetchall()
        user_id = result[0][0] if result else None
    except Exception as e:
        logger.error(f"Registration failed: {str(e)}")
        raise HTTPException(status_code=500, detail="Registration failed")

    if not user_id:
        raise HTTPException(status_code=500, detail="Failed to create user")

    # Create JWT token
    token = create_access_token(user_id, "viewer", request.name)

    logger.info(f"User registered: {request.email} (id={user_id})")

    return AuthResponse(
        access_token=token,
        token_type="bearer",
        user=User(id=user_id, name=request.name, role="viewer")
    )


@router.post("/login", response_model=AuthResponse)
def login(request: LoginRequest):
    """Login with email and password — queries users table, returns JWT."""
    conn = get_connection()

    # Query user from database
    result = conn.execute(
        "SELECT id, name, password_hash, role FROM users WHERE email = ?",
        [request.email]
    ).fetchall()

    if not result:
        logger.error(f"Login failed: {request.email} not found")
        raise HTTPException(status_code=401, detail="Invalid credentials")

    user_id, name, password_hash, role = result[0]

    # Verify password
    if not verify_password(request.password, password_hash):
        logger.error(f"Login failed: Invalid password for {request.email}")
        raise HTTPException(status_code=401, detail="Invalid credentials")

    # Create JWT token
    token = create_access_token(user_id, role, name)

    logger.info(f"User logged in: {request.email} (id={user_id}, role={role})")

    return AuthResponse(
        access_token=token,
        token_type="bearer",
        user=User(id=user_id, name=name, role=role)
    )


@router.get("/me")
def get_current_user_info(current_user=None):
    """Get current user info from JWT token."""
    # This is automatically called through the dependency
    # In actual usage, include Depends(get_current_user) in the endpoint signature
    pass


@router.post("/logout")
def logout(authorization: str = Header(None)):
    """Logout — stateless JWT, just return success."""
    if not authorization:
        return {"status": "logged_out"}

    # In a stateless JWT system, client just deletes the token
    logger.info("User logged out")
    return {"status": "logged_out"}
