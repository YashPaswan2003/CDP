"""
Client configuration endpoint.

Handles get/set client objectives + thresholds.
Auto-populated from upload service, user confirms during account setup.
"""

from fastapi import APIRouter, HTTPException, Header, Depends, Query
from app.models.config import ClientConfigRequest, ClientConfig
from app.database.connection import get_connection
from app.routes.auth import get_current_user
import logging
import uuid
from datetime import datetime

logger = logging.getLogger("api")
router = APIRouter(prefix="/api/config", tags=["config"])


@router.get("", response_model=ClientConfig)
def get_config(
    account_id: str = Query(..., description="Account ID"),
    authorization: str = Header(None)
):
    """Get client config for an account. Creates default if missing."""
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
                [user["id"], account_id]
            ).fetchone()
            if not access:
                raise HTTPException(status_code=403, detail="Access denied")
    finally:
        conn.close()

    conn = get_connection()
    try:
        # Get or create config
        result = conn.execute(
            """SELECT id, account_id, roas_threshold, cpa_threshold, spend_pace_pct,
                      ctr_threshold, cvr_threshold, quality_score_threshold, frequency_threshold,
                      currency, is_configured, created_at, updated_at
               FROM client_config WHERE account_id = ?""",
            [account_id]
        ).fetchall()

        if result:
            row = result[0]
            # Convert datetime to ISO string if needed
            created_at = row[11].isoformat() if hasattr(row[11], 'isoformat') else row[11]
            updated_at = row[12].isoformat() if hasattr(row[12], 'isoformat') else row[12]

            return ClientConfig(
                id=row[0],
                account_id=row[1],
                roas_threshold=float(row[2]),
                cpa_threshold=float(row[3]) if row[3] else None,
                spend_pace_pct=float(row[4]),
                ctr_threshold=float(row[5]) if row[5] else None,
                cvr_threshold=float(row[6]) if row[6] else None,
                quality_score_threshold=int(row[7]),
                frequency_threshold=float(row[8]),
                currency=row[9],
                is_configured=bool(row[10]),
                created_at=created_at,
                updated_at=updated_at
            )

        # Create default config
        config_id = f"cfg_{uuid.uuid4().hex[:12]}"
        now = datetime.utcnow().isoformat() + "Z"
        conn.execute(
            """INSERT INTO client_config
               (id, account_id, roas_threshold, spend_pace_pct, quality_score_threshold,
                frequency_threshold, currency, is_configured, created_at, updated_at)
               VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)""",
            [config_id, account_id, 3.0, 100.0, 7, 5.0, "INR", False, now, now]
        )
        conn.commit()

        return ClientConfig(
            id=config_id,
            account_id=account_id,
            roas_threshold=3.0,
            cpa_threshold=None,
            spend_pace_pct=100.0,
            ctr_threshold=None,
            cvr_threshold=None,
            quality_score_threshold=7,
            frequency_threshold=5.0,
            currency="INR",
            is_configured=False,
            created_at=now,
            updated_at=now
        )
    finally:
        conn.close()


@router.post("", response_model=ClientConfig)
def set_config(
    account_id: str = Query(..., description="Account ID"),
    request: ClientConfigRequest = None,
    authorization: str = Header(None)
):
    """Save client config for an account."""
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
                [user["id"], account_id]
            ).fetchone()
            if not access:
                raise HTTPException(status_code=403, detail="Access denied")
    finally:
        conn.close()

    if not request:
        raise HTTPException(status_code=400, detail="Config data required")

    conn = get_connection()
    try:
        # Check if config exists
        existing = conn.execute(
            "SELECT id FROM client_config WHERE account_id = ?",
            [account_id]
        ).fetchone()

        now = datetime.utcnow().isoformat() + "Z"

        if existing:
            # Update
            conn.execute(
                """UPDATE client_config
                   SET roas_threshold = ?, cpa_threshold = ?, spend_pace_pct = ?,
                       ctr_threshold = ?, cvr_threshold = ?, quality_score_threshold = ?,
                       frequency_threshold = ?, currency = ?, is_configured = ?, updated_at = ?
                   WHERE account_id = ?""",
                [request.roas_threshold, request.cpa_threshold, request.spend_pace_pct,
                 request.ctr_threshold, request.cvr_threshold, request.quality_score_threshold,
                 request.frequency_threshold, request.currency, True, now, account_id]
            )
            config_id = existing[0]
        else:
            # Create
            config_id = f"cfg_{uuid.uuid4().hex[:12]}"
            conn.execute(
                """INSERT INTO client_config
                   (id, account_id, roas_threshold, cpa_threshold, spend_pace_pct,
                    ctr_threshold, cvr_threshold, quality_score_threshold,
                    frequency_threshold, currency, is_configured, created_at, updated_at)
                   VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)""",
                [config_id, account_id, request.roas_threshold, request.cpa_threshold,
                 request.spend_pace_pct, request.ctr_threshold, request.cvr_threshold,
                 request.quality_score_threshold, request.frequency_threshold,
                 request.currency, True, now, now]
            )

        conn.commit()

        # Return updated config
        result = conn.execute(
            """SELECT id, account_id, roas_threshold, cpa_threshold, spend_pace_pct,
                      ctr_threshold, cvr_threshold, quality_score_threshold, frequency_threshold,
                      currency, is_configured, created_at, updated_at
               FROM client_config WHERE account_id = ?""",
            [account_id]
        ).fetchall()

        if result:
            row = result[0]
            # Convert datetime to ISO string if needed
            created_at = row[11].isoformat() if hasattr(row[11], 'isoformat') else row[11]
            updated_at = row[12].isoformat() if hasattr(row[12], 'isoformat') else row[12]

            return ClientConfig(
                id=row[0],
                account_id=row[1],
                roas_threshold=float(row[2]),
                cpa_threshold=float(row[3]) if row[3] else None,
                spend_pace_pct=float(row[4]),
                ctr_threshold=float(row[5]) if row[5] else None,
                cvr_threshold=float(row[6]) if row[6] else None,
                quality_score_threshold=int(row[7]),
                frequency_threshold=float(row[8]),
                currency=row[9],
                is_configured=bool(row[10]),
                created_at=created_at,
                updated_at=updated_at
            )
    finally:
        conn.close()

    raise HTTPException(status_code=500, detail="Failed to save config")
