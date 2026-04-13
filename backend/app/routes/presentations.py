"""Presentation generation and management endpoints."""

from fastapi import APIRouter, HTTPException, Header, Query
from pydantic import BaseModel
from typing import Optional, List
from app.routes.auth import get_current_user
from app.services.agents import ReportAgent
from app.database.connection import get_connection
import logging
import uuid
from datetime import datetime

logger = logging.getLogger("api")
router = APIRouter(prefix="/api/presentations", tags=["presentations"])


class PresentationGenerateRequest(BaseModel):
    """Request to generate a presentation."""

    client_id: str
    date_from: str
    date_to: str
    metrics: Optional[dict] = None


class PresentationMetadata(BaseModel):
    """Presentation metadata."""

    id: str
    account_id: str
    client_id: str
    status: str  # pending, generating, ready, failed
    date_from: str
    date_to: str
    created_at: str
    download_url: Optional[str] = None


class PresentationListResponse(BaseModel):
    """Response with list of presentations."""

    presentations: List[PresentationMetadata]


@router.post("/generate", response_model=PresentationMetadata)
def generate_presentation(
    request: PresentationGenerateRequest,
    account_id: str = Query(..., description="Account ID"),
    authorization: str = Header(None),
):
    """Generate a presentation for a client.

    For now, returns a placeholder. Full PPTX generation is next.
    """
    # Verify auth
    try:
        user = get_current_user(authorization)
    except HTTPException:
        raise HTTPException(status_code=401, detail="Unauthorized")

    # Check access
    conn = get_connection()
    try:
        if user["role"] != "admin":
            access = conn.execute(
                "SELECT 1 FROM user_accounts WHERE user_id = ? AND account_id = ?",
                [user["id"], account_id],
            ).fetchone()
            if not access:
                raise HTTPException(status_code=403, detail="Access denied")
    finally:
        conn.close()

    # Generate presentation ID
    presentation_id = f"pres_{uuid.uuid4().hex[:12]}"
    now = datetime.utcnow().isoformat() + "Z"

    # In production, would:
    # 1. Call ReportAgent to generate content
    # 2. Use python-pptx to create PPTX file
    # 3. Store in S3/file system
    # 4. Return download URL

    # For Phase 3, return placeholder with status "ready"
    return PresentationMetadata(
        id=presentation_id,
        account_id=account_id,
        client_id=request.client_id,
        status="ready",
        date_from=request.date_from,
        date_to=request.date_to,
        created_at=now,
        download_url=f"/api/presentations/{presentation_id}/download",
    )


@router.get("/", response_model=PresentationListResponse)
def list_presentations(
    account_id: str = Query(..., description="Account ID"),
    authorization: str = Header(None),
):
    """List presentations for an account."""
    # Verify auth
    try:
        user = get_current_user(authorization)
    except HTTPException:
        raise HTTPException(status_code=401, detail="Unauthorized")

    # Check access
    conn = get_connection()
    try:
        if user["role"] != "admin":
            access = conn.execute(
                "SELECT 1 FROM user_accounts WHERE user_id = ? AND account_id = ?",
                [user["id"], account_id],
            ).fetchone()
            if not access:
                raise HTTPException(status_code=403, detail="Access denied")
    finally:
        conn.close()

    # Return empty list for now (no presentations table yet)
    return PresentationListResponse(presentations=[])


@router.get("/{presentation_id}", response_model=PresentationMetadata)
def get_presentation(
    presentation_id: str,
    account_id: str = Query(..., description="Account ID"),
    authorization: str = Header(None),
):
    """Get presentation metadata."""
    # Verify auth
    try:
        user = get_current_user(authorization)
    except HTTPException:
        raise HTTPException(status_code=401, detail="Unauthorized")

    # Check access
    conn = get_connection()
    try:
        if user["role"] != "admin":
            access = conn.execute(
                "SELECT 1 FROM user_accounts WHERE user_id = ? AND account_id = ?",
                [user["id"], account_id],
            ).fetchone()
            if not access:
                raise HTTPException(status_code=403, detail="Access denied")
    finally:
        conn.close()

    # Return mock presentation (in production, would query database)
    now = datetime.utcnow().isoformat() + "Z"
    return PresentationMetadata(
        id=presentation_id,
        account_id=account_id,
        client_id="client_001",
        status="ready",
        date_from="2026-03-01",
        date_to="2026-03-31",
        created_at=now,
        download_url=f"/api/presentations/{presentation_id}/download",
    )


@router.get("/{presentation_id}/download")
def download_presentation(
    presentation_id: str,
    account_id: str = Query(..., description="Account ID"),
    authorization: str = Header(None),
):
    """Download presentation PPTX file.

    For Phase 3, returns placeholder. Full download functionality in next iteration.
    """
    # Verify auth
    try:
        user = get_current_user(authorization)
    except HTTPException:
        raise HTTPException(status_code=401, detail="Unauthorized")

    # Check access
    conn = get_connection()
    try:
        if user["role"] != "admin":
            access = conn.execute(
                "SELECT 1 FROM user_accounts WHERE user_id = ? AND account_id = ?",
                [user["id"], account_id],
            ).fetchone()
            if not access:
                raise HTTPException(status_code=403, detail="Access denied")
    finally:
        conn.close()

    # In production, would return file download
    raise HTTPException(
        status_code=501,
        detail="PPTX download not yet implemented. Coming in Phase 3.1",
    )
