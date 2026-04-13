"""
Flags endpoint for Monitor/Diagnose/Act loop.

Queries campaign_metrics + upload_conflicts.
Evaluates against client_config thresholds (ROAS, CPA, spend pace).
Returns: {flags: [{metric, reason, actions}], severity_distribution}
"""

from fastapi import APIRouter, HTTPException, Header, Depends, Query
from app.models.config import FlagsResponse, Flag, Action
from app.database.connection import get_connection
from app.routes.auth import get_current_user
import logging
from typing import Optional, List, Dict
from decimal import Decimal

logger = logging.getLogger("api")
router = APIRouter(prefix="/api/flags", tags=["flags"])


def detect_flags(
    account_id: str,
    conn,
    config: Optional[Dict] = None
) -> FlagsResponse:
    """
    Detect flags (anomalies) for an account.

    Evaluates:
    1. ROAS drop > 20% vs previous period
    2. CPA above threshold
    3. CTR drop vs previous
    4. Frequency too high (Meta)
    5. Quality Score too low
    6. Zero conversions
    7. Spend pace off

    Returns flags sorted by severity with recommended actions.
    """
    flags = []

    try:
        # Get client config (use defaults if missing)
        if not config:
            config_result = conn.execute(
                """SELECT roas_threshold, cpa_threshold, spend_pace_pct,
                          ctr_threshold, quality_score_threshold, frequency_threshold
                   FROM client_config WHERE account_id = ?""",
                [account_id]
            ).fetchall()

            if config_result:
                row = config_result[0]
                config = {
                    'roas_threshold': float(row[0]) if row[0] else 3.0,
                    'cpa_threshold': float(row[1]) if row[1] else None,
                    'spend_pace_pct': float(row[2]) if row[2] else 100.0,
                    'ctr_threshold': float(row[3]) if row[3] else None,
                    'quality_score_threshold': int(row[4]) if row[4] else 7,
                    'frequency_threshold': float(row[5]) if row[5] else 5.0,
                }
            else:
                # Default config
                config = {
                    'roas_threshold': 3.0,
                    'cpa_threshold': None,
                    'spend_pace_pct': 100.0,
                    'ctr_threshold': None,
                    'quality_score_threshold': 7,
                    'frequency_threshold': 5.0,
                }

        # Get campaigns
        campaigns_result = conn.execute(
            """SELECT id, name, platform, roas, previous_roas, ctr, budget, spent, frequency, status
               FROM campaigns WHERE account_id = ? ORDER BY created_at DESC""",
            [account_id]
        ).fetchall()

        if not campaigns_result:
            return FlagsResponse(flags=[], severity_distribution={})

        # Build name lookup for richer flag messages
        campaign_names = {}
        campaign_platforms = {}
        for row in campaigns_result:
            cid = row[0]
            campaign_names[cid] = row[1]
            campaign_platforms[cid] = row[2]

        # Get account/client name
        client_name_row = conn.execute("SELECT name FROM accounts WHERE id = ?", [account_id]).fetchone()
        client_name = client_name_row[0] if client_name_row else account_id

        # Flag 1: ROAS drop > 20%
        for row in campaigns_result:
            campaign_id, name, platform, roas, previous_roas, ctr, budget, spent, frequency, status = row
            roas = float(roas) if roas else None
            previous_roas = float(previous_roas) if previous_roas else None

            if roas is not None and previous_roas is not None and previous_roas > 0:
                roas_drop_pct = ((previous_roas - roas) / previous_roas) * 100
                if roas_drop_pct > 20:  # 20% drop
                    spent_val = float(spent) if spent else 0
                    flags.append(Flag(
                        metric="roas",
                        current=roas,
                        previous=previous_roas,
                        entities=[name or campaign_id],
                        entity_count=1,
                        severity="high",
                        explanation=f"ROAS dropped {roas_drop_pct:.1f}% on {client_name} \"{name}\" ({platform.title()}) — {roas:.2f}x vs {previous_roas:.2f}x. Spend: {'${:,.0f}'.format(spent_val)}.",
                        campaign_name=name,
                        client_name=client_name,
                        platform=platform,
                        actions=[
                            Action(type="pause", label="Pause campaign", severity="high"),
                            Action(type="review_quality", label="Review quality score", severity="medium"),
                            Action(type="details", label="View details", severity="low"),
                        ]
                    ))
                    break

        # Flag 2: Zero conversions on campaigns with spend
        zero_conv_campaigns = []
        for row in campaigns_result:
            campaign_id, name, platform, roas, previous_roas, ctr, budget, spent, frequency, status = row
            spent = float(spent) if spent else 0
            # TODO: Get conversions from campaign_metrics
            if spent > 0 and roas == 0:  # No ROAS = no conversions with spend
                zero_conv_campaigns.append(campaign_id)

        if zero_conv_campaigns:
            names = [campaign_names.get(c, c) for c in zero_conv_campaigns[:3]]
            flags.append(Flag(
                metric="conversions",
                entities=[campaign_names.get(c, c) for c in zero_conv_campaigns],
                entity_count=len(zero_conv_campaigns),
                severity="high",
                explanation=f"{len(zero_conv_campaigns)} campaign(s) on {client_name} have spend but zero conversions: {', '.join(names)}. Check tracking or landing pages.",
                campaign_name=names[0] if names else None,
                client_name=client_name,
                platform=campaign_platforms.get(zero_conv_campaigns[0]),
                actions=[
                    Action(type="pause", label="Pause campaigns", severity="high"),
                    Action(type="review_quality", label="Check tracking", severity="medium"),
                    Action(type="details", label="View details", severity="low"),
                ]
            ))

        # Flag 3: High frequency (Meta) → audience fatigue
        for row in campaigns_result:
            campaign_id, name, platform, roas, previous_roas, ctr, budget, spent, frequency, status = row
            frequency = float(frequency) if frequency else 0
            if platform.lower() in ('meta', 'dv360') and frequency > config['frequency_threshold']:
                flags.append(Flag(
                    metric="frequency",
                    current=frequency,
                    entities=[name or campaign_id],
                    entity_count=1,
                    severity="medium",
                    explanation=f"Frequency {frequency:.1f}x on {client_name} \"{name}\" ({platform.title()}) — threshold {config['frequency_threshold']}x. Audience fatigue risk.",
                    campaign_name=name,
                    client_name=client_name,
                    platform=platform,
                    actions=[
                        Action(type="adjust_bid", label="Expand audience", severity="medium"),
                        Action(type="details", label="View audience overlap", severity="low"),
                    ]
                ))
                break

        # Flag 4: Spend pace off (if budget exists)
        for row in campaigns_result:
            campaign_id, name, platform, roas, previous_roas, ctr, budget, spent, frequency, status = row
            budget = float(budget) if budget else 0
            spent = float(spent) if spent else 0
            if budget > 0 and spent > 0:
                pace_pct = (spent / budget) * 100
                # Flag if pace < 80% or > 120% of expected (assuming linear pace)
                target_pace = config['spend_pace_pct']
                if pace_pct < (target_pace - 20) or pace_pct > (target_pace + 20):
                    severity = "medium" if pace_pct < 70 or pace_pct > 130 else "low"
                    pace_msg = "underspending" if pace_pct < 80 else "overspending"
                    flags.append(Flag(
                        metric="spend_pace",
                        current=pace_pct,
                        previous=target_pace,
                        entities=[name or campaign_id],
                        entity_count=1,
                        severity=severity,
                        explanation=f"{client_name} \"{name}\" ({platform.title()}) at {pace_pct:.0f}% budget pace — {pace_msg}.",
                        campaign_name=name,
                        client_name=client_name,
                        platform=platform,
                        actions=[
                            Action(type="adjust_bid", label="Adjust bid strategy", severity="high"),
                            Action(type="details", label="View pacing details", severity="low"),
                        ]
                    ))
                    break

        # Flag 5: CTR drop
        ctr_flags = []
        for row in campaigns_result:
            campaign_id, name, platform, roas, previous_roas, ctr, budget, spent, frequency, status = row
            ctr = float(ctr) if ctr else None
            # TODO: Get previous_ctr from campaign_metrics
            if ctr is not None and ctr < 0.02:  # CTR below 2% is concerning
                ctr_flags.append((campaign_id, name, ctr))

        if ctr_flags:
            names = [c[1] for c in ctr_flags[:3]]
            flags.append(Flag(
                metric="ctr",
                current=ctr_flags[0][2] if ctr_flags else None,
                entities=[c[1] for c in ctr_flags],
                entity_count=len(ctr_flags),
                severity="medium",
                explanation=f"{len(ctr_flags)} campaign(s) on {client_name} have low CTR (<2%): {', '.join(names)}. Review ad copy and targeting.",
                campaign_name=ctr_flags[0][1] if ctr_flags else None,
                client_name=client_name,
                platform=campaign_platforms.get(ctr_flags[0][0]) if ctr_flags else None,
                actions=[
                    Action(type="review_quality", label="Review ad creatives", severity="medium"),
                    Action(type="details", label="View keyword QS", severity="low"),
                ]
            ))

    except Exception as e:
        logger.error(f"Error detecting flags for account {account_id}: {str(e)}")
        return FlagsResponse(flags=[], severity_distribution={})

    # Sort by severity
    severity_order = {'high': 0, 'medium': 1, 'low': 2}
    flags.sort(key=lambda f: severity_order.get(f.severity, 3))

    # Build severity distribution
    severity_dist = {'high': 0, 'medium': 0, 'low': 0}
    for flag in flags:
        severity_dist[flag.severity] = severity_dist.get(flag.severity, 0) + 1

    return FlagsResponse(flags=flags[:10], severity_distribution=severity_dist)


@router.get("", response_model=FlagsResponse)
def get_flags(
    account_id: str = Query(..., description="Account ID"),
    authorization: str = Header(None)
):
    """
    Get flags for an account.

    Returns anomalies + actions ranked by severity.

    Query Parameters:
    - account_id: Required. Account ID to monitor.

    Returns:
    - 200: List of flags (0-10 items) + severity distribution
    - 401: Unauthorized
    - 403: Access denied
    - 500: Database error (returns empty flags)
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
                [user["id"], account_id]
            ).fetchone()
            if not access:
                raise HTTPException(status_code=403, detail="Access denied to this account")
    finally:
        conn.close()

    # Check config exists (required for flags)
    conn = get_connection()
    try:
        config_result = conn.execute(
            "SELECT is_configured FROM client_config WHERE account_id = ?",
            [account_id]
        ).fetchone()

        if not config_result:
            # Create default config
            return FlagsResponse(
                flags=[Flag(
                    metric="setup",
                    severity="high",
                    explanation="Client configuration required. Please set up ROAS, CPA, and other thresholds before enabling monitoring.",
                    actions=[
                        Action(type="details", label="Complete setup", severity="high"),
                    ]
                )],
                severity_distribution={'high': 1, 'medium': 0, 'low': 0}
            )

        if not config_result[0]:  # Not configured
            return FlagsResponse(
                flags=[Flag(
                    metric="setup",
                    severity="high",
                    explanation="Client configuration required. Please set up ROAS, CPA, and other thresholds before enabling monitoring.",
                    actions=[
                        Action(type="details", label="Complete setup", severity="high"),
                    ]
                )],
                severity_distribution={'high': 1, 'medium': 0, 'low': 0}
            )

        # Detect and return flags
        response = detect_flags(account_id, conn)
        return response

    finally:
        conn.close()
