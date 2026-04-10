"""
Alerts endpoint for monitoring account health.

Implements anomaly detection rules to surface 2-4 critical alerts:
1. ROAS drop > 40% vs previous period (error severity)
2. Meta frequency > 5.0 — audience fatigue risk (warning severity)
3. Budget utilization 95%+ (success severity)
4. Campaign paused unexpectedly (error severity)
"""

from fastapi import APIRouter, HTTPException, Query, Header
from app.models.alerts import Alert, AlertsResponse
from app.database.connection import get_connection
from app.routes.auth import get_current_user
import logging
import sqlite3
from datetime import datetime, timedelta
from typing import Optional, List

logger = logging.getLogger("api")
router = APIRouter(prefix="/alerts", tags=["alerts"])

# Alert rule thresholds
ROAS_DROP_THRESHOLD = 0.6  # 40% drop (keep 60% of previous ROAS)


def detect_alerts(
    account_id: str,
    conn: sqlite3.Connection,
    date_from: Optional[str] = None,  # TODO: Not yet used (for Phase 2)
    date_to: Optional[str] = None     # TODO: Not yet used (for Phase 2)
) -> List[Alert]:
    """
    Detect anomalies and health issues for an account.

    Rules:
    1. ROAS drop > 40% vs previous period (current_roas < previous_roas * 0.6) → error
    2. Meta frequency > 5.0 → warning
    3. Budget utilization 95%+ → success
    4. Campaign paused unexpectedly → error

    Returns up to 4 alerts, sorted by severity (error > warning > success).

    Note: date_from and date_to parameters are reserved for Phase 2 when
    historical period-over-period comparison data becomes available.
    """
    alerts = []

    try:
        # Get campaigns for this account
        campaigns_result = conn.execute(
            """
            SELECT id, name, platform, status, budget, spent, roas, previous_roas, frequency
            FROM campaigns
            WHERE account_id = ?
            ORDER BY created_at DESC
            """,
            [account_id]
        ).fetchall()

        if not campaigns_result:
            return []

        # Convert to list of dicts for easier processing
        campaigns = []
        for row in campaigns_result:
            campaigns.append({
                'id': row[0],
                'name': row[1],
                'platform': row[2],
                'status': row[3],
                'budget': row[4],
                'spent': row[5],
                'roas': row[6],
                'previous_roas': row[7],
                'frequency': row[8]
            })

        # Rule 1: ROAS drop > 40%
        # Check if current ROAS dropped more than 40% vs previous period
        # Formula: current_roas < previous_roas * ROAS_DROP_THRESHOLD (i.e., 40% drop)
        for campaign in campaigns:
            if (campaign['roas'] is not None and campaign['previous_roas'] is not None and
                campaign['roas'] < campaign['previous_roas'] * ROAS_DROP_THRESHOLD):
                # Calculate drop percentage safely (avoid division by zero)
                if campaign['previous_roas'] and campaign['previous_roas'] != 0:
                    drop_pct = ((campaign['previous_roas'] - campaign['roas']) / campaign['previous_roas']) * 100
                else:
                    drop_pct = 100  # Default when previous ROAS is 0 or None
                alerts.append(Alert(
                    id=f"alert_roas_{campaign['id']}",
                    severity='error',
                    message=f"ROAS dropped {drop_pct:.0f}% on {campaign['platform'].capitalize()} ({campaign['name']})",
                    campaign=campaign['name'],
                    platform=campaign['platform']
                ))
                break  # Only one ROAS alert per account

        # Rule 2: Meta frequency > 5.0
        # MVP RULE 2: Frequency threshold of 5.0x based on industry best practices
        # TODO: Calibrate threshold based on historical performance data
        for campaign in campaigns:
            if campaign['platform'].lower() == 'meta' and campaign['frequency'] is not None and campaign['frequency'] > 5.0:
                alerts.append(Alert(
                    id=f"alert_freq_{campaign['id']}",
                    severity='warning',
                    message=f"Meta frequency >{campaign['frequency']:.1f}x — audience fatigue risk",
                    campaign=campaign['name'],
                    platform='meta'
                ))
                break  # Only one frequency alert

        # Rule 3: Budget utilization 95%+
        # MVP RULE 3: High budget utilization (95%+) indicates campaign is on track
        # TODO: Add predictive alert for campaigns approaching 100% utilization
        for campaign in campaigns:
            if campaign['budget'] and campaign['spent']:
                utilization = (campaign['spent'] / campaign['budget']) * 100
                if utilization >= 95:
                    alerts.append(Alert(
                        id=f"alert_budget_{campaign['id']}",
                        severity='success',
                        message=f"{campaign['platform'].upper()} on track — {utilization:.0f}% budget utilization",
                        campaign=campaign['name'],
                        platform=campaign['platform']
                    ))
                    break  # Only one budget alert

        # Rule 4: Campaign paused unexpectedly
        # Check if any previously active campaign is now paused
        for campaign in campaigns:
            if campaign['status'] == 'paused':
                alerts.append(Alert(
                    id=f"alert_paused_{campaign['id']}",
                    severity='error',
                    message=f"{campaign['platform'].upper()} '{campaign['name']}' campaign paused unexpectedly",
                    campaign=campaign['name'],
                    platform=campaign['platform']
                ))
                break  # Only one paused alert

    except Exception as e:
        logger.error(f"Error detecting alerts for account {account_id}: {str(e)}")
        return []

    # Sort by severity: error > warning > success
    severity_order = {'error': 0, 'warning': 1, 'success': 2}
    alerts.sort(key=lambda a: severity_order.get(a.severity, 3))

    # Return top 4 alerts max
    return alerts[:4]


@router.get("", response_model=AlertsResponse)
def get_alerts(
    account_id: str = Query(..., description="Account ID to fetch alerts for"),
    date_from: str = Query(None, description="Start date (YYYY-MM-DD)"),
    date_to: str = Query(None, description="End date (YYYY-MM-DD)"),
    authorization: str = Header(None)
):
    """
    Get health alerts for an account.

    Returns 2-4 alerts with color-coded severity (error/warning/success).

    Query Parameters:
    - account_id: Required. Account ID to monitor.
    - date_from: Optional. Start date for anomaly detection window.
    - date_to: Optional. End date for anomaly detection window.

    Returns:
    - 200: List of alerts (0-4 items)
    - 400: Invalid account_id
    - 401: Unauthorized (missing/invalid token)
    - 500: Database error (gracefully returns empty array)
    """
    # Verify user is authenticated
    try:
        user = get_current_user(authorization)
    except HTTPException:
        raise HTTPException(status_code=401, detail="Unauthorized")

    # SECURITY: Validate user has access to this account
    conn = get_connection()
    try:
        if user["role"] != "admin":
            # Non-admin users can only access their own accounts
            access = conn.execute(
                "SELECT 1 FROM user_accounts WHERE user_id = ? AND account_id = ?",
                [user["id"], account_id]
            ).fetchone()

            if not access:
                raise HTTPException(status_code=403, detail="Access denied to this account")
    finally:
        conn.close()

    # Validate account_id
    if not account_id or not isinstance(account_id, str):
        raise HTTPException(status_code=400, detail="Invalid account_id")

    # Check account exists and get connection for alerts detection
    conn = get_connection()
    try:
        account_result = conn.execute(
            "SELECT id FROM accounts WHERE id = ?",
            [account_id]
        ).fetchall()

        if not account_result:
            raise HTTPException(status_code=400, detail="Account not found")

        # Detect and return alerts
        alerts = detect_alerts(account_id, conn, date_from, date_to)
    finally:
        conn.close()

    return AlertsResponse(alerts=alerts)
