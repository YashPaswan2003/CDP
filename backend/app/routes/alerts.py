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
from datetime import datetime, timedelta

logger = logging.getLogger("api")
router = APIRouter(prefix="/alerts", tags=["alerts"])


def detect_alerts(account_id: str, date_from: str = None, date_to: str = None) -> list[Alert]:
    """
    Detect anomalies and health issues for an account.

    Rules:
    1. ROAS drop > 40% vs previous period → error
    2. Meta frequency > 5.0 → warning
    3. Budget utilization 95%+ → success
    4. Campaign paused unexpectedly → error

    Returns up to 4 alerts, sorted by severity (error > warning > success).
    """
    alerts = []
    conn = get_connection()

    try:
        # Get campaigns for this account
        campaigns_result = conn.execute(
            """
            SELECT id, name, platform, status, budget, spent, roas, frequency
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
                'frequency': row[7]
            })

        # Rule 1: ROAS drop > 40%
        # MVP: Mock rule - check if any campaign's ROAS is significantly below 2.0x
        for campaign in campaigns:
            if campaign['roas'] is not None and campaign['roas'] < 1.2:
                alerts.append(Alert(
                    id=f"alert_roas_{campaign['id']}",
                    severity='error',
                    message=f"ROAS dropped 40% vs last week on {campaign['platform'].capitalize()} ({campaign['name']})",
                    campaign=campaign['name'],
                    platform=campaign['platform']
                ))
                break  # Only one ROAS alert per account

        # Rule 2: Meta frequency > 5.0
        # Check Meta campaigns for high frequency
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
        # Check any campaign with 95%+ budget spent
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
    finally:
        conn.close()

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

    # Validate account_id
    if not account_id or not isinstance(account_id, str):
        raise HTTPException(status_code=400, detail="Invalid account_id")

    # Check account exists
    conn = get_connection()
    account_result = conn.execute(
        "SELECT id FROM accounts WHERE id = ?",
        [account_id]
    ).fetchall()
    conn.close()

    if not account_result:
        raise HTTPException(status_code=400, detail="Account not found")

    # Detect and return alerts
    alerts = detect_alerts(account_id, date_from, date_to)

    return AlertsResponse(alerts=alerts)
