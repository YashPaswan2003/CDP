"""Accounts API router - GET/POST /api/accounts endpoints."""

import uuid
from datetime import datetime
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, Field
from typing import List, Optional
from app.database.connection import get_connection

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


@router.get("/accounts", response_model=List[Account])
def list_accounts():
    """List all accounts from the database.

    Returns:
        List[Account]: All accounts with their metadata and brand colors.
    """
    conn = get_connection()
    try:
        result = conn.execute(
            """
            SELECT
                id, name, industry, currency, client_type, platforms,
                brand_primary, brand_secondary, brand_accent, created_at
            FROM accounts
            ORDER BY created_at DESC
            """
        ).fetchall()

        accounts = []
        for row in result:
            # Parse platforms from comma-separated string
            platforms = [p.strip() for p in (row[5] or "").split(",") if p.strip()]

            account = Account(
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
            accounts.append(account)

        return accounts
    finally:
        conn.close()


@router.post("/accounts", response_model=Account, status_code=201)
def create_account(request: CreateAccountRequest):
    """Create a new client account.

    Args:
        request: Account creation request with name, industry, platforms, etc.

    Returns:
        Account: The newly created account with auto-generated ID.
    """
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
