"""
Analytics endpoints for multi-platform data.
All endpoints support account_id and platform filters.
"""
import logging
from fastapi import APIRouter, HTTPException, Query, Depends
from app.database.connection import get_connection
from app.routes.auth import get_current_user

logger = logging.getLogger("api")
router = APIRouter(prefix="/api/analytics", tags=["analytics"])


# ========== CAMPAIGNS ==========
@router.get("/campaigns")
def get_campaigns(
    current_user: dict = Depends(get_current_user),
    account_id: str = Query(None),
    platform: str = Query(None),
):
    """Get campaigns with optional filters."""
    conn = get_connection()

    query = "SELECT * FROM campaigns"
    params = []

    conditions = []
    if account_id:
        conditions.append("account_id = ?")
        params.append(account_id)
    if platform:
        conditions.append("platform = ?")
        params.append(platform)

    if conditions:
        query += " WHERE " + " AND ".join(conditions)

    try:
        cursor = conn.execute(query, params)
        columns = [desc[0] for desc in cursor.description] if cursor.description else []
        result = cursor.fetchall()
    finally:
        conn.close()

    # Map column names from DuckDB result
    campaigns = []
    for row in result:
        c = {}
        for i, col in enumerate(columns):
            val = row[i]
            if col in ("budget", "spent", "revenue", "ctr", "cpc", "cvr", "roas", "previous_roas", "frequency"):
                c[col] = float(val) if val is not None else None
            else:
                c[col] = val
        campaigns.append(c)

    logger.info(f"GET /api/analytics/campaigns - returned {len(campaigns)} campaigns")
    return {"campaigns": campaigns}


# ========== AD GROUPS ==========
@router.get("/ad-groups")
def get_ad_groups(
    current_user: dict = Depends(get_current_user),
    account_id: str = Query(None),
    campaign_id: str = Query(None),
):
    """Get ad groups with optional filters."""
    conn = get_connection()

    query = "SELECT * FROM ad_groups"
    params = []
    conditions = []

    if account_id:
        conditions.append("account_id = ?")
        params.append(account_id)
    if campaign_id:
        conditions.append("campaign_id = ?")
        params.append(campaign_id)

    if conditions:
        query += " WHERE " + " AND ".join(conditions)

    result = conn.execute(query, params).fetchall()
    conn.close()

    ad_groups = [
        {
            "id": row[0],
            "campaign_id": row[1],
            "account_id": row[2],
            "name": row[3],
            "impressions": row[4],
            "clicks": row[5],
            "spend": float(row[6]) if row[6] else 0,
            "conversions": row[7],
            "ctr": float(row[8]) if row[8] else 0,
            "cpc": float(row[9]) if row[9] else 0,
            "cvr": float(row[10]) if row[10] else 0,
        }
        for row in result
    ]

    logger.info(f"GET /api/analytics/ad-groups - returned {len(ad_groups)} ad groups")
    return {"ad_groups": ad_groups}


# ========== AD SETS ==========
@router.get("/ad-sets")
def get_ad_sets(
    current_user: dict = Depends(get_current_user),
    account_id: str = Query(None),
    campaign_id: str = Query(None),
):
    """Get ad sets with optional filters."""
    conn = get_connection()

    query = "SELECT * FROM ad_sets"
    params = []
    conditions = []

    if account_id:
        conditions.append("account_id = ?")
        params.append(account_id)
    if campaign_id:
        conditions.append("campaign_id = ?")
        params.append(campaign_id)

    if conditions:
        query += " WHERE " + " AND ".join(conditions)

    result = conn.execute(query, params).fetchall()
    conn.close()

    ad_sets = [
        {
            "id": row[0],
            "campaign_id": row[1],
            "account_id": row[2],
            "name": row[3],
            "budget": float(row[4]) if row[4] else None,
            "spent": float(row[5]) if row[5] else 0,
            "impressions": row[6],
            "clicks": row[7],
            "conversions": row[8],
            "revenue": float(row[9]) if row[9] else None,
            "targeting": row[10],
        }
        for row in result
    ]

    logger.info(f"GET /api/analytics/ad-sets - returned {len(ad_sets)} ad sets")
    return {"ad_sets": ad_sets}


# ========== INSERTION ORDERS ==========
@router.get("/insertion-orders")
def get_insertion_orders(
    current_user: dict = Depends(get_current_user),
    account_id: str = Query(None),
    campaign_id: str = Query(None),
):
    """Get insertion orders with optional filters."""
    conn = get_connection()

    query = "SELECT * FROM insertion_orders"
    params = []
    conditions = []

    if account_id:
        conditions.append("account_id = ?")
        params.append(account_id)
    if campaign_id:
        conditions.append("campaign_id = ?")
        params.append(campaign_id)

    if conditions:
        query += " WHERE " + " AND ".join(conditions)

    result = conn.execute(query, params).fetchall()
    conn.close()

    ios = [
        {
            "id": row[0],
            "campaign_id": row[1],
            "account_id": row[2],
            "name": row[3],
            "budget": float(row[4]) if row[4] else 0,
            "spent": float(row[5]) if row[5] else 0,
            "impressions": row[6],
            "clicks": row[7],
            "conversions": row[8],
            "revenue": float(row[9]) if row[9] else 0,
            "pacing_percent": float(row[10]) if row[10] else 0,
        }
        for row in result
    ]

    logger.info(f"GET /api/analytics/insertion-orders - returned {len(ios)} insertion orders")
    return {"insertion_orders": ios}


# ========== LINE ITEMS ==========
@router.get("/line-items")
def get_line_items(
    current_user: dict = Depends(get_current_user),
    account_id: str = Query(None),
    insertion_order_id: str = Query(None),
):
    """Get line items with optional filters."""
    conn = get_connection()

    query = "SELECT * FROM line_items"
    params = []
    conditions = []

    if account_id:
        conditions.append("account_id = ?")
        params.append(account_id)
    if insertion_order_id:
        conditions.append("insertion_order_id = ?")
        params.append(insertion_order_id)

    if conditions:
        query += " WHERE " + " AND ".join(conditions)

    result = conn.execute(query, params).fetchall()
    conn.close()

    line_items = [
        {
            "id": row[0],
            "insertion_order_id": row[1],
            "account_id": row[2],
            "name": row[3],
            "budget": float(row[4]) if row[4] else 0,
            "spent": float(row[5]) if row[5] else 0,
            "impressions": row[6],
            "clicks": row[7],
            "conversions": row[8],
            "revenue": float(row[9]) if row[9] else 0,
            "vtc": row[10],
            "ctc": row[11],
            "vtr": float(row[12]) if row[12] else None,
        }
        for row in result
    ]

    logger.info(f"GET /api/analytics/line-items - returned {len(line_items)} line items")
    return {"line_items": line_items}


# ========== GEO DATA ==========
@router.get("/geo")
def get_geo_data(
    current_user: dict = Depends(get_current_user),
    account_id: str = Query(None),
    platform: str = Query(None),
    state: str = Query(None),
):
    """Get geographical data with optional filters."""
    conn = get_connection()

    query = "SELECT * FROM geo_data"
    params = []
    conditions = []

    if account_id:
        conditions.append("account_id = ?")
        params.append(account_id)
    if platform:
        conditions.append("platform = ?")
        params.append(platform)
    if state:
        conditions.append("state = ?")
        params.append(state)

    if conditions:
        query += " WHERE " + " AND ".join(conditions)

    result = conn.execute(query, params).fetchall()
    conn.close()

    geo = [
        {
            "id": row[0],
            "account_id": row[1],
            "platform": row[2],
            "city": row[3],
            "state": row[4],
            "impressions": row[5],
            "clicks": row[6],
            "spend": float(row[7]) if row[7] else 0,
            "conversions": row[8],
            "ctr": float(row[9]) if row[9] else 0,
            "cpc": float(row[10]) if row[10] else 0,
        }
        for row in result
    ]

    logger.info(f"GET /api/analytics/geo - returned {len(geo)} geo records")
    return {"geo": geo}


# ========== DEMOGRAPHICS ==========
@router.get("/demographics")
def get_demographics(
    current_user: dict = Depends(get_current_user),
    account_id: str = Query(None),
    platform: str = Query(None),
    dimension: str = Query(None),
):
    """Get demographic data with optional filters."""
    conn = get_connection()

    query = "SELECT * FROM demographics"
    params = []
    conditions = []

    if account_id:
        conditions.append("account_id = ?")
        params.append(account_id)
    if platform:
        conditions.append("platform = ?")
        params.append(platform)
    if dimension:
        conditions.append("dimension = ?")
        params.append(dimension)

    if conditions:
        query += " WHERE " + " AND ".join(conditions)

    result = conn.execute(query, params).fetchall()
    conn.close()

    demographics = [
        {
            "id": row[0],
            "account_id": row[1],
            "platform": row[2],
            "dimension": row[3],
            "segment": row[4],
            "impressions": row[5],
            "clicks": row[6],
            "spend": float(row[7]) if row[7] else 0,
            "conversions": row[8],
        }
        for row in result
    ]

    logger.info(f"GET /api/analytics/demographics - returned {len(demographics)} demographic records")
    return {"demographics": demographics}


# ========== PLACEMENTS ==========
@router.get("/placements")
def get_placements(
    current_user: dict = Depends(get_current_user),
    account_id: str = Query(None),
    platform: str = Query(None),
):
    """Get placement data with optional filters."""
    conn = get_connection()

    query = "SELECT * FROM placements"
    params = []
    conditions = []

    if account_id:
        conditions.append("account_id = ?")
        params.append(account_id)
    if platform:
        conditions.append("platform = ?")
        params.append(platform)

    if conditions:
        query += " WHERE " + " AND ".join(conditions)

    result = conn.execute(query, params).fetchall()
    conn.close()

    placements = [
        {
            "id": row[0],
            "account_id": row[1],
            "platform": row[2],
            "placement_name": row[3],
            "placement_type": row[4],
            "surface": row[5],
            "impressions": row[6],
            "clicks": row[7],
            "spend": float(row[8]) if row[8] else 0,
            "conversions": row[9],
            "views": row[10],
            "vtr": float(row[11]) if row[11] else None,
            "reach": row[12],
            "frequency": float(row[13]) if row[13] else None,
            "ctr": float(row[14]) if row[14] else 0,
        }
        for row in result
    ]

    logger.info(f"GET /api/analytics/placements - returned {len(placements)} placements")
    return {"placements": placements}


# ========== CREATIVES ==========
@router.get("/creatives")
def get_creatives(
    current_user: dict = Depends(get_current_user),
    account_id: str = Query(None),
    platform: str = Query(None),
    campaign_id: str = Query(None),
):
    """Get creative data with optional filters."""
    conn = get_connection()

    query = "SELECT * FROM creatives"
    params = []
    conditions = []

    if account_id:
        conditions.append("account_id = ?")
        params.append(account_id)
    if platform:
        conditions.append("platform = ?")
        params.append(platform)
    if campaign_id:
        conditions.append("campaign_id = ?")
        params.append(campaign_id)

    if conditions:
        query += " WHERE " + " AND ".join(conditions)

    result = conn.execute(query, params).fetchall()
    conn.close()

    creatives = [
        {
            "id": row[0],
            "account_id": row[1],
            "campaign_id": row[2],
            "platform": row[3],
            "name": row[4],
            "format": row[5],
            "size": row[6],
            "impressions": row[7],
            "clicks": row[8],
            "conversions": row[9],
            "spend": float(row[10]) if row[10] else 0,
            "frequency": float(row[11]) if row[11] else None,
            "ctr": float(row[12]) if row[12] else 0,
            "cvr": float(row[13]) if row[13] else 0,
            "roas": float(row[14]) if row[14] else 0,
        }
        for row in result
    ]

    logger.info(f"GET /api/analytics/creatives - returned {len(creatives)} creatives")
    return {"creatives": creatives}


# ========== SEARCH TERMS ==========
@router.get("/search-terms")
def get_search_terms(
    current_user: dict = Depends(get_current_user),
    account_id: str = Query(None),
):
    """Get search term data."""
    conn = get_connection()

    query = "SELECT * FROM search_terms"
    params = []

    if account_id:
        query += " WHERE account_id = ?"
        params.append(account_id)

    result = conn.execute(query, params).fetchall()
    conn.close()

    terms = [
        {
            "id": row[0],
            "account_id": row[1],
            "keyword": row[2],
            "match_type": row[3],
            "impressions": row[4],
            "clicks": row[5],
            "spend": float(row[6]) if row[6] else 0,
            "conversions": row[7],
            "quality_score": row[8],
            "ctr": float(row[9]) if row[9] else 0,
            "cpc": float(row[10]) if row[10] else 0,
            "cvr": float(row[11]) if row[11] else 0,
        }
        for row in result
    ]

    logger.info(f"GET /api/analytics/search-terms - returned {len(terms)} search terms")
    return {"search_terms": terms}


# ========== PMAX CHANNELS ==========
@router.get("/pmax-channels")
def get_pmax_channels(
    current_user: dict = Depends(get_current_user),
    account_id: str = Query(None),
):
    """Get PMax channel data."""
    conn = get_connection()

    query = "SELECT * FROM pmax_channels"
    params = []

    if account_id:
        query += " WHERE account_id = ?"
        params.append(account_id)

    result = conn.execute(query, params).fetchall()
    conn.close()

    channels = [
        {
            "id": row[0],
            "account_id": row[1],
            "channel": row[2],
            "impressions": row[3],
            "clicks": row[4],
            "conversions": row[5],
            "spend": float(row[6]) if row[6] else 0,
            "revenue": float(row[7]) if row[7] else 0,
            "ctr": float(row[8]) if row[8] else 0,
            "cpc": float(row[9]) if row[9] else 0,
            "cvr": float(row[10]) if row[10] else 0,
            "roas": float(row[11]) if row[11] else 0,
        }
        for row in result
    ]

    logger.info(f"GET /api/analytics/pmax-channels - returned {len(channels)} PMax channels")
    return {"pmax_channels": channels}


# ========== DAILY METRICS ==========
@router.get("/daily-metrics")
def get_daily_metrics(
    current_user: dict = Depends(get_current_user),
    account_id: str = Query(None),
    campaign_id: str = Query(None),
    platform: str = Query(None),
):
    """Get daily metrics with optional filters."""
    conn = get_connection()

    query = "SELECT * FROM daily_metrics ORDER BY date"
    params = []
    conditions = []

    if account_id:
        conditions.append("account_id = ?")
        params.append(account_id)
    if campaign_id:
        conditions.append("campaign_id = ?")
        params.append(campaign_id)
    if platform:
        conditions.append("platform = ?")
        params.append(platform)

    if conditions:
        query = query.replace("ORDER BY date", "WHERE " + " AND ".join(conditions) + " ORDER BY date")

    result = conn.execute(query, params).fetchall()
    conn.close()

    metrics = [
        {
            "id": row[0],
            "campaign_id": row[1],
            "account_id": row[2],
            "platform": row[3],
            "date": str(row[4]),
            "impressions": row[5],
            "clicks": row[6],
            "spend": float(row[7]) if row[7] else 0,
            "conversions": row[8],
            "revenue": float(row[9]) if row[9] else 0,
            "views": row[10],
        }
        for row in result
    ]

    logger.info(f"GET /api/analytics/daily-metrics - returned {len(metrics)} daily metric records")
    return {"daily_metrics": metrics}


# ========== FUNNEL (TOFU/MOFU/BOFU) ==========
@router.get("/funnel")
def get_funnel(
    current_user: dict = Depends(get_current_user),
    account_id: str = Query(None),
    date_from: str = Query(None),
    date_to: str = Query(None),
    platform: str = Query(None),
    client_type: str = Query(None),
):
    """Get TOFU/MOFU/BOFU funnel data from campaign_metrics table.

    Phase 5: Returns aggregated funnel stages (TOFU/MOFU/BOFU) instead of 6-stage drop.

    Parameters:
    - account_id: Filter by account (optional)
    - date_from: Start date (optional, YYYY-MM-DD format)
    - date_to: End date (optional, YYYY-MM-DD format)
    - platform: Filter by platform (optional)
    - client_type: Filter by client type (optional, for legacy compatibility)

    Returns: {
        "funnel": {
            "tofu": {"impressions": X, "clicks": Y, "cost": Z, "reach": W},
            "mofu": {...},
            "bofu": {...}
        }
    }
    """
    conn = get_connection()

    # Build query for campaign_metrics table aggregated by funnel_stage
    query = """
        SELECT
            funnel_stage,
            SUM(COALESCE(impressions, 0)) as impressions,
            SUM(COALESCE(clicks, 0)) as clicks,
            SUM(COALESCE(cost, 0)) as cost,
            SUM(COALESCE(reach, 0)) as reach
        FROM campaign_metrics
        WHERE 1=1
    """
    params = []

    if account_id:
        query += " AND account_id = ?"
        params.append(account_id)

    if date_from:
        query += " AND date_from >= ?"
        params.append(date_from)

    if date_to:
        query += " AND date_to <= ?"
        params.append(date_to)

    if platform:
        query += " AND platform = ?"
        params.append(platform)

    query += " GROUP BY funnel_stage"

    result = conn.execute(query, params).fetchall()
    conn.close()

    # Parse results into three-stage funnel
    funnel_data = {}
    for row in result:
        if row[0]:  # Only if funnel_stage is not null
            stage_key = row[0].lower()  # tofu, mofu, bofu
            funnel_data[stage_key] = {
                "impressions": row[1],
                "clicks": row[2],
                "cost": float(row[3]) if row[3] else 0,
                "reach": row[4],
            }

    # Ensure all three stages are present (even if empty)
    funnel = {
        "tofu": funnel_data.get("tofu", {"impressions": 0, "clicks": 0, "cost": 0, "reach": 0}),
        "mofu": funnel_data.get("mofu", {"impressions": 0, "clicks": 0, "cost": 0, "reach": 0}),
        "bofu": funnel_data.get("bofu", {"impressions": 0, "clicks": 0, "cost": 0, "reach": 0}),
    }

    logger.info(f"GET /api/analytics/funnel - account_id={account_id}, date_from={date_from}, date_to={date_to}")
    return {"funnel": funnel}


# ========== SUMMARY ==========
@router.get("/summary")
def get_summary(
    current_user: dict = Depends(get_current_user),
    account_id: str = Query(None),
    date_from: str = Query(None),
    date_to: str = Query(None),
):
    """Get summary metrics for an account.

    Phase 5: Basic aggregated metrics across all campaigns.

    Parameters:
    - account_id: Filter by account (optional)
    - date_from: Start date (optional, YYYY-MM-DD format)
    - date_to: End date (optional, YYYY-MM-DD format)

    Returns: {
        "summary": {
            "total_impressions": X,
            "total_clicks": Y,
            "total_cost": Z,
            "total_conversions": W,
            "total_reach": V
        }
    }
    """
    conn = get_connection()

    # Build query to aggregate all campaign metrics
    query = """
        SELECT
            SUM(COALESCE(impressions, 0)) as total_impressions,
            SUM(COALESCE(clicks, 0)) as total_clicks,
            SUM(COALESCE(cost, 0)) as total_cost,
            SUM(COALESCE(reach, 0)) as total_reach
        FROM campaign_metrics
        WHERE 1=1
    """
    params = []

    if account_id:
        query += " AND account_id = ?"
        params.append(account_id)

    if date_from:
        query += " AND date_from >= ?"
        params.append(date_from)

    if date_to:
        query += " AND date_to <= ?"
        params.append(date_to)

    result = conn.execute(query, params).fetchone()
    conn.close()

    # Parse results
    summary = {
        "total_impressions": result[0] if result and result[0] else 0,
        "total_clicks": result[1] if result and result[1] else 0,
        "total_cost": float(result[2]) if result and result[2] else 0,
        "total_reach": result[3] if result and result[3] else 0,
    }

    logger.info(f"GET /api/analytics/summary - account_id={account_id}, date_from={date_from}, date_to={date_to}")
    return {"summary": summary}


# ========== PERIOD COMPARISON ==========
@router.get("/period-comparison")
def get_period_comparison(
    current_user: dict = Depends(get_current_user),
    account_id: str = Query(None),
    platform: str = Query(None),
    period: str = Query("month", description="Comparison period: week, month, quarter"),
):
    """Get period-over-period comparison from real data."""
    conn = get_connection()
    try:
        from datetime import date, timedelta

        today = date.today()
        if period == "week":
            current_start = today - timedelta(days=7)
            prev_start = current_start - timedelta(days=7)
            prev_end = current_start - timedelta(days=1)
        elif period == "quarter":
            current_start = today - timedelta(days=90)
            prev_start = current_start - timedelta(days=90)
            prev_end = current_start - timedelta(days=1)
        else:  # month
            current_start = today - timedelta(days=30)
            prev_start = current_start - timedelta(days=30)
            prev_end = current_start - timedelta(days=1)

        where_clause = "date BETWEEN ? AND ?"
        params_current = [current_start.isoformat(), today.isoformat()]
        params_prev = [prev_start.isoformat(), prev_end.isoformat()]

        if account_id:
            where_clause += " AND account_id = ?"
            params_current.append(account_id)
            params_prev.append(account_id)
        if platform:
            where_clause += " AND platform = ?"
            params_current.append(platform)
            params_prev.append(platform)

        query = f"""
            SELECT COALESCE(SUM(impressions), 0), COALESCE(SUM(clicks), 0),
                   COALESCE(SUM(conversions), 0), COALESCE(SUM(spend), 0),
                   COALESCE(SUM(revenue), 0)
            FROM daily_metrics WHERE {where_clause}
        """

        cur = conn.execute(query, params_current).fetchone()
        prev = conn.execute(query, params_prev).fetchone()

        def pct_change(curr, prev_val):
            if prev_val and prev_val > 0:
                return round((curr - prev_val) / prev_val * 100, 1)
            return 0

        c_imp, c_clk, c_conv, c_spend, c_rev = [float(x) for x in cur]
        p_imp, p_clk, p_conv, p_spend, p_rev = [float(x) for x in prev]

        c_roas = round(c_rev / c_spend, 2) if c_spend > 0 else 0
        p_roas = round(p_rev / p_spend, 2) if p_spend > 0 else 0
        c_ctr = round(c_clk / c_imp * 100, 2) if c_imp > 0 else 0
        p_ctr = round(p_clk / p_imp * 100, 2) if p_imp > 0 else 0
        c_cpc = round(c_spend / c_clk, 2) if c_clk > 0 else 0
        p_cpc = round(p_spend / p_clk, 2) if p_clk > 0 else 0
        c_cvr = round(c_conv / c_clk * 100, 2) if c_clk > 0 else 0
        p_cvr = round(p_conv / p_clk * 100, 2) if p_clk > 0 else 0
        c_cpa = round(c_spend / c_conv, 2) if c_conv > 0 else 0
        p_cpa = round(p_spend / p_conv, 2) if p_conv > 0 else 0

        comparison = {
            period: [
                {"metric": "Impressions", "currentValue": c_imp, "previousValue": p_imp, "changePercent": pct_change(c_imp, p_imp)},
                {"metric": "Clicks", "currentValue": c_clk, "previousValue": p_clk, "changePercent": pct_change(c_clk, p_clk)},
                {"metric": "Conversions", "currentValue": c_conv, "previousValue": p_conv, "changePercent": pct_change(c_conv, p_conv)},
                {"metric": "Spend", "currentValue": c_spend, "previousValue": p_spend, "changePercent": pct_change(c_spend, p_spend)},
                {"metric": "Revenue", "currentValue": c_rev, "previousValue": p_rev, "changePercent": pct_change(c_rev, p_rev)},
                {"metric": "ROAS", "currentValue": c_roas, "previousValue": p_roas, "changePercent": pct_change(c_roas, p_roas)},
                {"metric": "CTR", "currentValue": c_ctr, "previousValue": p_ctr, "changePercent": pct_change(c_ctr, p_ctr)},
                {"metric": "CPC", "currentValue": c_cpc, "previousValue": p_cpc, "changePercent": pct_change(c_cpc, p_cpc)},
                {"metric": "CVR", "currentValue": c_cvr, "previousValue": p_cvr, "changePercent": pct_change(c_cvr, p_cvr)},
                {"metric": "CPA", "currentValue": c_cpa, "previousValue": p_cpa, "changePercent": pct_change(c_cpa, p_cpa)},
            ]
        }

        logger.info(f"GET /api/analytics/period-comparison - {period} comparison for account={account_id} platform={platform}")
        return comparison
    finally:
        conn.close()
