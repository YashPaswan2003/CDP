import uuid
import json
from datetime import datetime
from fastapi import APIRouter, HTTPException
from app.models.auth import RegisterRequest, LoginRequest, AuthResponse
from app.database.connection import get_connection
import logging

logger = logging.getLogger("api")
router = APIRouter(prefix="/auth", tags=["auth"])

# In-memory user store for Phase 0 (replace with database in Phase 1)
users_db = {
    "demo@example.com": {
        "user_id": "550e8400-e29b-41d4-a716-446655440099",
        "password": "demo123",  # In production, use hashed passwords
        "name": "Demo User"
    }
}

tokens_db = {}  # Simple token store for Phase 0

@router.post("/register", response_model=AuthResponse)
def register(request: RegisterRequest):
    """Register a new user."""
    if request.email in users_db:
        logger.error(f"Registration failed: {request.email} already exists")
        raise HTTPException(status_code=400, detail="Email already registered")

    user_id = str(uuid.uuid4())
    users_db[request.email] = {
        "user_id": user_id,
        "password": request.password,
        "name": request.name
    }

    # Generate token
    token = str(uuid.uuid4())
    tokens_db[token] = {"email": request.email, "user_id": user_id}

    logger.info(f"User registered: {request.email}")

    return AuthResponse(
        access_token=token,
        token_type="bearer",
        user_id=user_id,
        email=request.email,
        name=request.name
    )

@router.post("/login", response_model=AuthResponse)
def login(request: LoginRequest):
    """Login with email and password."""
    if request.email not in users_db:
        logger.error(f"Login failed: {request.email} not found")
        raise HTTPException(status_code=401, detail="Invalid credentials")

    user = users_db[request.email]
    if user["password"] != request.password:
        logger.error(f"Login failed: Invalid password for {request.email}")
        raise HTTPException(status_code=401, detail="Invalid credentials")

    # Generate token
    token = str(uuid.uuid4())
    tokens_db[token] = {"email": request.email, "user_id": user["user_id"]}

    logger.info(f"User logged in: {request.email}")

    return AuthResponse(
        access_token=token,
        token_type="bearer",
        user_id=user["user_id"],
        email=request.email,
        name=user["name"]
    )

@router.post("/logout")
def logout(token: str = None):
    """Logout by invalidating token."""
    if token and token in tokens_db:
        del tokens_db[token]
        logger.info("User logged out")
        return {"status": "logged_out"}

    return {"status": "already_logged_out"}

def verify_token(token: str):
    """Verify JWT token (mock implementation for Phase 0)."""
    if token not in tokens_db:
        raise HTTPException(status_code=401, detail="Invalid token")
    return tokens_db[token]
