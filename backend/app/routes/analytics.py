"""
Analytics endpoints for multi-platform data.
All endpoints support account_id and platform filters.
"""
import logging
from fastapi import APIRouter, HTTPException, Query
from app.database.connection import get_connection

logger = logging.getLogger("api")
router = APIRouter(prefix="/api/analytics", tags=["analytics"])


# ========== CAMPAIGNS ==========
@router.get("/campaigns")
def get_campaigns(
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

    result = conn.execute(query, params).fetchall()
    conn.close()

    campaigns = [
        {
            "id": row[0],
            "account_id": row[1],
            "name": row[2],
            "platform": row[3],
            "type": row[4],
            "objective": row[5],
            "status": row[6],
            "budget": float(row[7]) if row[7] else 0,
            "spent": float(row[8]) if row[8] else 0,
            "impressions": row[9],
            "clicks": row[10],
            "conversions": row[11],
            "revenue": float(row[12]) if row[12] else 0,
            "ctr": float(row[13]) if row[13] else 0,
            "cpc": float(row[14]) if row[14] else 0,
            "cvr": float(row[15]) if row[15] else 0,
            "roas": float(row[16]) if row[16] else 0,
            "reach": row[17],
            "frequency": float(row[18]) if row[18] else None,
        }
        for row in result
    ]

    logger.info(f"GET /api/analytics/campaigns - returned {len(campaigns)} campaigns")
    return {"campaigns": campaigns}


# ========== AD GROUPS ==========
@router.get("/ad-groups")
def get_ad_groups(account_id: str = Query(None), campaign_id: str = Query(None)):
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
def get_ad_sets(account_id: str = Query(None), campaign_id: str = Query(None)):
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
def get_insertion_orders(account_id: str = Query(None), campaign_id: str = Query(None)):
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
def get_geo_data(account_id: str = Query(None), platform: str = Query(None), state: str = Query(None)):
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
def get_placements(account_id: str = Query(None), platform: str = Query(None)):
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
def get_search_terms(account_id: str = Query(None)):
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
def get_pmax_channels(account_id: str = Query(None)):
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


# ========== FUNNEL ==========
@router.get("/funnel")
def get_funnel(platform: str, client_type: str = "web"):
    """Get funnel data for a platform and client type."""
    if platform not in ["google", "dv360", "meta"]:
        raise HTTPException(status_code=400, detail="Invalid platform")

    if client_type not in ["web", "app"]:
        raise HTTPException(status_code=400, detail="Invalid client_type")

    # Platform totals from mock data
    platform_data = {
        "google": {
            "clicks": 56820,
            "conversions": 2718,
        },
        "dv360": {
            "clicks": 84900,
            "conversions": 2316,
        },
        "meta": {
            "clicks": 63800,
            "conversions": 2776,
        },
    }

    data = platform_data.get(platform, {})
    clicks = data.get("clicks", 0)
    conversions = data.get("conversions", 0)

    # Define funnels by client type
    if client_type == "app":
        # App funnel: Impressions → Clicks → App Open → Add to Cart → Checkout → Purchase
        app_open = int(clicks * 0.75)
        add_to_cart = int(app_open * 0.40)
        checkout = int(add_to_cart * 0.50)
        purchase = conversions

        funnel = [
            {
                "stage": "Impressions",
                "value": 1000000,  # Placeholder aggregate
                "dropoffPercent": 0,
            },
            {
                "stage": "Clicks",
                "value": clicks,
                "dropoffPercent": 100 - (app_open / clicks * 100) if clicks else 0,
            },
            {
                "stage": "App Open",
                "value": app_open,
                "dropoffPercent": 100 - (add_to_cart / app_open * 100) if app_open else 0,
            },
            {
                "stage": "Add to Cart",
                "value": add_to_cart,
                "dropoffPercent": 100 - (checkout / add_to_cart * 100) if add_to_cart else 0,
            },
            {
                "stage": "Checkout",
                "value": checkout,
                "dropoffPercent": 100 - (purchase / checkout * 100) if checkout else 0,
            },
            {
                "stage": "Purchase",
                "value": purchase,
                "dropoffPercent": 0,
            },
        ]
    else:
        # Web funnel: Impressions → Clicks → Page Visit → View Item → Begin Checkout → Purchase
        page_visit = int(clicks * 0.85)
        view_item = int(page_visit * 0.60)
        begin_checkout = int(view_item * 0.30)
        purchase = conversions

        funnel = [
            {
                "stage": "Impressions",
                "value": 1000000,  # Placeholder aggregate
                "dropoffPercent": 0,
            },
            {
                "stage": "Clicks",
                "value": clicks,
                "dropoffPercent": 100 - (page_visit / clicks * 100) if clicks else 0,
            },
            {
                "stage": "Page Visit",
                "value": page_visit,
                "dropoffPercent": 100 - (view_item / page_visit * 100) if page_visit else 0,
            },
            {
                "stage": "View Item",
                "value": view_item,
                "dropoffPercent": 100 - (begin_checkout / view_item * 100) if view_item else 0,
            },
            {
                "stage": "Begin Checkout",
                "value": begin_checkout,
                "dropoffPercent": 100 - (purchase / begin_checkout * 100) if begin_checkout else 0,
            },
            {
                "stage": "Purchase",
                "value": purchase,
                "dropoffPercent": 0,
            },
        ]

    logger.info(f"GET /api/analytics/funnel - returned funnel for {platform} ({client_type})")
    return {"funnel": funnel}


# ========== PERIOD COMPARISON ==========
@router.get("/period-comparison")
def get_period_comparison():
    """Get month-over-month comparison data."""
    comparison = {
        "month": [
            {"metric": "Impressions", "previousValue": 8200000, "currentValue": 10952000, "changePercent": 33.6},
            {"metric": "Clicks", "previousValue": 280000, "currentValue": 205520, "changePercent": -26.7},
            {"metric": "Conversions", "previousValue": 8200, "currentValue": 7810, "changePercent": -4.8},
            {"metric": "Spend", "previousValue": 380000, "currentValue": 429900, "changePercent": 13.1},
            {"metric": "Revenue", "previousValue": 1050000, "currentValue": 1180000, "changePercent": 12.4},
            {"metric": "ROAS", "previousValue": 2.76, "currentValue": 2.75, "changePercent": -0.4},
            {"metric": "CTR", "previousValue": 3.41, "currentValue": 1.88, "changePercent": -44.9},
            {"metric": "CPC", "previousValue": 1.36, "currentValue": 2.09, "changePercent": 53.7},
            {"metric": "CVR", "previousValue": 2.93, "currentValue": 3.8, "changePercent": 29.7},
        ]
    }

    logger.info("GET /api/analytics/period-comparison - returned month comparison data")
    return comparison
