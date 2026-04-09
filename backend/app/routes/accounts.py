"""Accounts API router - GET/POST /api/accounts endpoints."""

import uuid
from datetime import datetime
from fastapi import APIRouter, HTTPException, Depends, Header
from pydantic import BaseModel, Field
from typing import List, Optional
from app.database.connection import get_connection
from app.routes.auth import get_current_user

router = APIRouter(prefix="/api", tags=["accounts"])


class Account(BaseModel):
    """Account response model with all fields including brand colors."""
    id: str
    name: str
    industry: str
    currency: str
    client_type: str
    platforms: List[str]
    brand_primary: Optional[str] = None
    brand_secondary: Optional[str] = None
    brand_accent: Optional[str] = None
    created_at: Optional[str] = None


class CreateAccountRequest(BaseModel):
    """Request model for creating a new account."""
    name: str = Field(..., min_length=1, description="Account name")
    industry: str = Field(..., min_length=1, description="Industry")
    currency: str = Field(default="INR", min_length=3, max_length=3, description="Currency code")
    client_type: str = Field(default="web", description="web or app")
    platforms: List[str] = Field(default=["google"], description="List of platforms")
    brand_primary: Optional[str] = Field(default=None, description="Primary brand color hex")
    brand_secondary: Optional[str] = Field(default=None, description="Secondary brand color hex")
    brand_accent: Optional[str] = Field(default=None, description="Accent brand color hex")


def map_account(row: tuple) -> Account:
    """Convert database row to Account model."""
    platforms = [p.strip() for p in (row[5] or "").split(",") if p.strip()]
    return Account(
        id=row[0],
        name=row[1],
        industry=row[2],
        currency=row[3],
        client_type=row[4],
        platforms=platforms,
        brand_primary=row[6],
        brand_secondary=row[7],
        brand_accent=row[8],
        created_at=str(row[9]) if row[9] else None
    )


@router.get("/accounts", response_model=List[Account])
def list_accounts(authorization: str = Header(None)):
    """List accounts accessible to the current user.

    For admin users: returns all accounts.
    For other users: returns only accounts they have access to (via user_accounts table).

    Returns:
        List[Account]: Accounts visible to the user, ordered by creation date (ASC).
    """
    # Get current user from JWT
    current_user = get_current_user(authorization)

    conn = get_connection()
    try:
        user_id = current_user["id"]
        role = current_user["role"]

        if role == "admin":
            # Admin sees all accounts, ordered by created_at ASC (so ethinos is first)
            result = conn.execute(
                """
                SELECT
                    id, name, industry, currency, client_type, platforms,
                    brand_primary, brand_secondary, brand_accent, created_at
                FROM accounts
                ORDER BY created_at ASC
                """
            ).fetchall()
        else:
            # Non-admin users see only accounts they have access to
            result = conn.execute(
                """
                SELECT a.id, a.name, a.industry, a.currency, a.client_type, a.platforms,
                       a.brand_primary, a.brand_secondary, a.brand_accent, a.created_at
                FROM accounts a
                JOIN user_accounts ua ON a.id = ua.account_id
                WHERE ua.user_id = ?
                ORDER BY a.created_at ASC
                """,
                [user_id]
            ).fetchall()

        return [map_account(row) for row in result]
    finally:
        conn.close()


@router.get("/accounts/{account_id}", response_model=Account)
def get_account(account_id: str, authorization: str = Header(None)):
    """Get a specific account by ID.

    Verifies that the current user has access to this account.

    Args:
        account_id: The ID of the account to retrieve.

    Returns:
        Account: The requested account if accessible.

    Raises:
        HTTPException: 403 if user doesn't have access, 404 if not found.
    """
    current_user = get_current_user(authorization)
    conn = get_connection()

    try:
        user_id = current_user["id"]
        role = current_user["role"]

        # Query the account
        result = conn.execute(
            """
            SELECT
                id, name, industry, currency, client_type, platforms,
                brand_primary, brand_secondary, brand_accent, created_at
            FROM accounts
            WHERE id = ?
            """,
            [account_id]
        ).fetchone()

        if not result:
            raise HTTPException(status_code=404, detail="Account not found")

        # Check access: admin sees all, others check user_accounts table
        if role != "admin":
            access = conn.execute(
                "SELECT 1 FROM user_accounts WHERE user_id = ? AND account_id = ?",
                [user_id, account_id]
            ).fetchone()

            if not access:
                raise HTTPException(status_code=403, detail="Access denied to this account")

        return map_account(result)
    finally:
        conn.close()


@router.post("/accounts", response_model=Account, status_code=201)
def create_account(request: CreateAccountRequest, authorization: str = Header(None)):
    """Create a new client account.

    Only admin users can create accounts.

    Args:
        request: Account creation request with name, industry, platforms, etc.

    Returns:
        Account: The newly created account with auto-generated ID.

    Raises:
        HTTPException: 403 if user is not admin.
    """
    current_user = get_current_user(authorization)

    if current_user["role"] != "admin":
        raise HTTPException(status_code=403, detail="Only admins can create accounts")

    conn = get_connection()
    try:
        # Generate unique account ID
        account_id = f"acc-{str(uuid.uuid4())[:8]}"

        # Convert platforms list to comma-separated string
        platforms_str = ",".join(request.platforms) if request.platforms else ""

        # Insert into database
        conn.execute(
            """
            INSERT INTO accounts
            (id, name, industry, currency, client_type, platforms,
             brand_primary, brand_secondary, brand_accent, created_at)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            """,
            [
                account_id,
                request.name,
                request.industry,
                request.currency,
                request.client_type,
                platforms_str,
                request.brand_primary,
                request.brand_secondary,
                request.brand_accent,
                datetime.now()
            ]
        )
        conn.commit()

        # Return the created account
        return Account(
            id=account_id,
            name=request.name,
            industry=request.industry,
            currency=request.currency,
            client_type=request.client_type,
            platforms=request.platforms,
            brand_primary=request.brand_primary,
            brand_secondary=request.brand_secondary,
            brand_accent=request.brand_accent,
            created_at=datetime.now().isoformat()
        )
    finally:
        conn.close()
