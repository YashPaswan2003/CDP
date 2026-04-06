from fastapi import APIRouter, HTTPException, Query
from app.models.dashboard import DashboardResponse, CampaignMetrics, MetricRow
from app.database.connection import get_connection
from datetime import datetime
import logging

logger = logging.getLogger("api")
router = APIRouter(prefix="/dashboard", tags=["dashboard"])

@router.get("/{client_id}", response_model=DashboardResponse)
def get_dashboard(
    client_id: str,
    start_date: str = Query(None),
    end_date: str = Query(None)
):
    """Get dashboard metrics for a client."""
    conn = get_connection()

    # Get client info
    client_result = conn.execute(
        "SELECT name FROM clients WHERE id = ?",
        [client_id]
    ).fetchall()

    if not client_result:
        raise HTTPException(status_code=404, detail="Client not found")

    client_name = client_result[0][0]

    # Get campaigns for client
    campaigns_result = conn.execute(
        "SELECT id, name, platform, budget FROM campaigns WHERE client_id = ?",
        [client_id]
    ).fetchall()

    # Build date filter
    date_filter = ""
    params = [client_id]
    if start_date:
        date_filter += " AND m.date >= ?"
        params.append(start_date)
    if end_date:
        date_filter += " AND m.date <= ?"
        params.append(end_date)

    campaigns = []
    total_spend = 0
    total_revenue = 0
    total_impressions = 0
    total_clicks = 0
    total_conversions = 0

    for campaign_id, campaign_name, platform, budget in campaigns_result:
        # Get metrics for this campaign
        metrics_result = conn.execute(
            f"""
            SELECT m.date, m.impressions, m.clicks, m.spend, m.conversions, m.revenue
            FROM metrics m
            JOIN campaigns c ON m.campaign_id = c.id
            WHERE m.campaign_id = ? {date_filter}
            ORDER BY m.date
            """,
            [campaign_id] + params[1:]
        ).fetchall()

        if not metrics_result:
            continue

        # Calculate aggregates
        campaign_spend = sum(float(row[3]) for row in metrics_result)
        campaign_revenue = sum(float(row[5]) for row in metrics_result)
        campaign_impressions = sum(int(row[1]) for row in metrics_result)
        campaign_clicks = sum(int(row[2]) for row in metrics_result)
        campaign_conversions = sum(int(row[4]) for row in metrics_result)

        # Calculate KPIs
        cpc = campaign_spend / campaign_clicks if campaign_clicks > 0 else 0
        conversion_rate = (campaign_conversions / campaign_clicks * 100) if campaign_clicks > 0 else 0
        roas = campaign_revenue / campaign_spend if campaign_spend > 0 else 0

        # Build metric rows
        metric_rows = [
            MetricRow(
                date=row[0],
                impressions=int(row[1]),
                clicks=int(row[2]),
                spend=float(row[3]),
                conversions=int(row[4]),
                revenue=float(row[5]),
                platform=platform,
                campaign_name=campaign_name
            )
            for row in metrics_result
        ]

        campaigns.append(CampaignMetrics(
            campaign_id=str(campaign_id),
            campaign_name=campaign_name,
            platform=platform,
            budget=float(budget) if budget else 0,
            total_spend=campaign_spend,
            total_impressions=campaign_impressions,
            total_clicks=campaign_clicks,
            total_conversions=campaign_conversions,
            total_revenue=campaign_revenue,
            average_cpc=cpc,
            conversion_rate=conversion_rate,
            roas=roas,
            metrics=metric_rows
        ))

        total_spend += campaign_spend
        total_revenue += campaign_revenue
        total_impressions += campaign_impressions
        total_clicks += campaign_clicks
        total_conversions += campaign_conversions

    conn.close()

    logger.info(f"GET /dashboard/{client_id} - returned {len(campaigns)} campaigns")

    return DashboardResponse(
        client_id=client_id,
        client_name=client_name,
        total_spend=total_spend,
        total_revenue=total_revenue,
        total_impressions=total_impressions,
        total_clicks=total_clicks,
        total_conversions=total_conversions,
        campaigns=campaigns,
        date_range={"start": start_date, "end": end_date}
    )
