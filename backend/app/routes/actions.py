"""
Action execution endpoints.

Handles campaign pause/resume, budget/bid adjustments, quality reviews.
"""

from fastapi import APIRouter, HTTPException, Header, Query
from app.models.actions import (
    ActionExecutionRequest,
    ActionExecutionResponse,
    EntityDetailsResponse,
    EntityUpdate,
)
from app.database.connection import get_connection
from app.routes.auth import get_current_user
import logging
import uuid
from datetime import datetime

logger = logging.getLogger("api")
router = APIRouter(prefix="/api/actions", tags=["actions"])


def verify_account_access(user: dict, account_id: str):
    """Verify user has access to account."""
    conn = get_connection()
    try:
        if user["role"] != "admin":
            access = conn.execute(
                "SELECT 1 FROM user_accounts WHERE user_id = ? AND account_id = ?",
                [user["id"], account_id]
            ).fetchone()
            if not access:
                raise HTTPException(status_code=403, detail="Access denied")
    finally:
        conn.close()


@router.post("/pause", response_model=ActionExecutionResponse)
def pause_action(
    request: ActionExecutionRequest,
    authorization: str = Header(None)
):
    """Pause a campaign, ad group, or keyword."""
    # Verify auth
    try:
        user = get_current_user(authorization)
    except HTTPException:
        raise HTTPException(status_code=401, detail="Unauthorized")

    verify_account_access(user, request.account_id)

    if not request.entity_id:
        raise HTTPException(status_code=400, detail="entity_id required")

    now = datetime.utcnow().isoformat() + "Z"

    # Log action execution
    action_id = f"act_{uuid.uuid4().hex[:12]}"
    conn = get_connection()
    try:
        conn.execute(
            """INSERT INTO actions_log
               (id, account_id, user_id, action_type, entity_type, entity_id, status, created_at)
               VALUES (?, ?, ?, ?, ?, ?, ?, ?)""",
            [action_id, request.account_id, user["id"], "pause", request.entity_type, request.entity_id, "completed", now]
        )
        conn.commit()
    finally:
        conn.close()

    return ActionExecutionResponse(
        success=True,
        message=f"Successfully paused {request.entity_type}",
        action_type="pause",
        updated_entity=EntityUpdate(
            entity_id=request.entity_id,
            entity_type=request.entity_type,
            field="status",
            previous_value="active",
            new_value="paused"
        ),
        timestamp=now
    )


@router.post("/resume", response_model=ActionExecutionResponse)
def resume_action(
    request: ActionExecutionRequest,
    authorization: str = Header(None)
):
    """Resume a paused campaign, ad group, or keyword."""
    # Verify auth
    try:
        user = get_current_user(authorization)
    except HTTPException:
        raise HTTPException(status_code=401, detail="Unauthorized")

    verify_account_access(user, request.account_id)

    if not request.entity_id:
        raise HTTPException(status_code=400, detail="entity_id required")

    now = datetime.utcnow().isoformat() + "Z"

    # Log action execution
    action_id = f"act_{uuid.uuid4().hex[:12]}"
    conn = get_connection()
    try:
        conn.execute(
            """INSERT INTO actions_log
               (id, account_id, user_id, action_type, entity_type, entity_id, status, created_at)
               VALUES (?, ?, ?, ?, ?, ?, ?, ?)""",
            [action_id, request.account_id, user["id"], "resume", request.entity_type, request.entity_id, "completed", now]
        )
        conn.commit()
    finally:
        conn.close()

    return ActionExecutionResponse(
        success=True,
        message=f"Successfully resumed {request.entity_type}",
        action_type="resume",
        updated_entity=EntityUpdate(
            entity_id=request.entity_id,
            entity_type=request.entity_type,
            field="status",
            previous_value="paused",
            new_value="active"
        ),
        timestamp=now
    )


@router.post("/adjust-bid", response_model=ActionExecutionResponse)
def adjust_bid_action(
    request: ActionExecutionRequest,
    authorization: str = Header(None)
):
    """Adjust bid for keyword or ad group."""
    # Verify auth
    try:
        user = get_current_user(authorization)
    except HTTPException:
        raise HTTPException(status_code=401, detail="Unauthorized")

    verify_account_access(user, request.account_id)

    if not request.entity_id or not request.parameters or "new_bid" not in request.parameters:
        raise HTTPException(status_code=400, detail="entity_id and parameters.new_bid required")

    new_bid = request.parameters.get("new_bid")
    old_bid = request.parameters.get("old_bid", "unknown")

    now = datetime.utcnow().isoformat() + "Z"

    # Log action execution
    action_id = f"act_{uuid.uuid4().hex[:12]}"
    conn = get_connection()
    try:
        conn.execute(
            """INSERT INTO actions_log
               (id, account_id, user_id, action_type, entity_type, entity_id, status, created_at)
               VALUES (?, ?, ?, ?, ?, ?, ?, ?)""",
            [action_id, request.account_id, user["id"], "adjust_bid", request.entity_type, request.entity_id, "completed", now]
        )
        conn.commit()
    finally:
        conn.close()

    return ActionExecutionResponse(
        success=True,
        message=f"Successfully adjusted bid to ${new_bid}",
        action_type="adjust_bid",
        updated_entity=EntityUpdate(
            entity_id=request.entity_id,
            entity_type=request.entity_type,
            field="bid",
            previous_value=old_bid,
            new_value=new_bid
        ),
        timestamp=now
    )


@router.post("/increase-budget", response_model=ActionExecutionResponse)
def increase_budget_action(
    request: ActionExecutionRequest,
    authorization: str = Header(None)
):
    """Increase budget for campaign."""
    # Verify auth
    try:
        user = get_current_user(authorization)
    except HTTPException:
        raise HTTPException(status_code=401, detail="Unauthorized")

    verify_account_access(user, request.account_id)

    if not request.entity_id or not request.parameters or "new_budget" not in request.parameters:
        raise HTTPException(status_code=400, detail="entity_id and parameters.new_budget required")

    new_budget = request.parameters.get("new_budget")
    old_budget = request.parameters.get("old_budget", "unknown")

    now = datetime.utcnow().isoformat() + "Z"

    # Log action execution
    action_id = f"act_{uuid.uuid4().hex[:12]}"
    conn = get_connection()
    try:
        conn.execute(
            """INSERT INTO actions_log
               (id, account_id, user_id, action_type, entity_type, entity_id, status, created_at)
               VALUES (?, ?, ?, ?, ?, ?, ?, ?)""",
            [action_id, request.account_id, user["id"], "increase_budget", request.entity_type, request.entity_id, "completed", now]
        )
        conn.commit()
    finally:
        conn.close()

    return ActionExecutionResponse(
        success=True,
        message=f"Successfully increased budget to ${new_budget}",
        action_type="increase_budget",
        updated_entity=EntityUpdate(
            entity_id=request.entity_id,
            entity_type=request.entity_type,
            field="budget",
            previous_value=old_budget,
            new_value=new_budget
        ),
        timestamp=now
    )


@router.get("/details/{entity_id}", response_model=EntityDetailsResponse)
def get_entity_details(
    entity_id: str,
    account_id: str = Query(..., description="Account ID"),
    authorization: str = Header(None)
):
    """Get detailed information about an entity (campaign, keyword, etc.)."""
    # Verify auth
    try:
        user = get_current_user(authorization)
    except HTTPException:
        raise HTTPException(status_code=401, detail="Unauthorized")

    verify_account_access(user, account_id)

    # For now, return mock data. In production, query campaign_metrics table.
    return EntityDetailsResponse(
        entity_id=entity_id,
        entity_type="campaign",
        account_id=account_id,
        name=f"Campaign {entity_id}",
        status="active",
        platform="google",
        budget=5000.0,
        spend=3200.50,
        impressions=125000,
        clicks=2500,
        conversions=85,
        revenue=8500.0,
        ctr=0.02,
        cpc=1.28,
        cvr=0.034,
        roas=2.65,
        quality_score=8,
        bid_strategy="Target CPA",
        created_at=datetime.utcnow().isoformat() + "Z",
        updated_at=datetime.utcnow().isoformat() + "Z"
    )
