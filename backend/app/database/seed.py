"""
Seed database with exact mock data matching frontend mockData.ts.
All child records sum exactly to parent totals.
"""
import uuid
from datetime import datetime, timedelta
from app.database.connection import get_connection
import logging

logger = logging.getLogger("database")

# Pre-hashed passwords (generated once, used at seed time)
# These are bcrypt hashes for "admin123" and "viewer123"
# To regenerate: python -c "from passlib.context import CryptContext; c = CryptContext(schemes=['bcrypt']); print(c.hash('admin123'))"
ADMIN_PASSWORD_HASH = "$2b$12$/OHqk2waU5f4.tEWkrdgTO.RGVr6v7lRUZbzlL7q1pid36WglZdRK"  # admin123
VIEWER_PASSWORD_HASH = "$2b$12$8tjG95Tg8Zk8ZGazQ88rgevHxwT62jXfRD1DV65Sh91xmKF5Zh1De"  # viewer123


def seed_database():
    """Load all mock data into DuckDB."""
    conn = get_connection()

    # ========== ACCOUNTS ==========
    accounts = [
        {"id": "ethinos", "name": "Ethinos (All Accounts)", "industry": "Agency", "currency": "INR", "platforms": "google,dv360,meta", "client_type": "web"},
        {"id": "kotak-mf", "name": "Kotak Mutual Fund", "industry": "Financial Services", "currency": "INR", "platforms": "google,dv360,meta", "client_type": "web"},
        {"id": "qi-spine", "name": "QI Spine", "industry": "Healthcare", "currency": "INR", "platforms": "google,dv360,meta", "client_type": "web"},
    ]

    for acc in accounts:
        try:
            conn.execute(
                """
                INSERT INTO accounts (id, name, industry, currency, client_type, platforms, brand_primary, brand_secondary, brand_accent, created_at)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                """,
                [acc["id"], acc["name"], acc["industry"], acc["currency"], acc["client_type"], acc["platforms"], None, None, None, datetime.now()]
            )
        except Exception:
            pass  # Account already exists, skip

    # ========== USERS ==========
    # Using pre-hashed passwords to avoid dependency issues
    admin_hash = ADMIN_PASSWORD_HASH
    viewer_hash = VIEWER_PASSWORD_HASH

    users = [
        {"id": "user-001", "name": "Admin User", "email": "admin@ethinos.com", "password_hash": admin_hash, "role": "admin"},
        {"id": "user-002", "name": "Viewer User", "email": "viewer@ethinos.com", "password_hash": viewer_hash, "role": "viewer"},
    ]

    for user in users:
        try:
            conn.execute(
                """
                INSERT INTO users (id, name, email, password_hash, role, created_at)
                VALUES (?, ?, ?, ?, ?, ?)
                """,
                [user["id"], user["name"], user["email"], user["password_hash"], user["role"], datetime.now()]
            )
        except Exception:
            pass  # User already exists, skip

    # ========== USER_ACCOUNTS ==========
    user_accounts = [
        {"user_id": "user-001", "account_id": "ethinos"},
        {"user_id": "user-001", "account_id": "kotak-mf"},
        {"user_id": "user-001", "account_id": "qi-spine"},
        {"user_id": "user-002", "account_id": "kotak-mf"},
        {"user_id": "user-002", "account_id": "qi-spine"},
    ]

    for ua in user_accounts:
        try:
            conn.execute(
                "INSERT INTO user_accounts (user_id, account_id) VALUES (?, ?)",
                [ua["user_id"], ua["account_id"]]
            )
        except Exception:
            pass  # User-account mapping already exists, skip

    # ========== CAMPAIGNS ==========
    # All campaigns for acc-001 (TechStore) — 20 total

    # Google Ads campaigns (7)
    google_campaigns = [
        {"id": "camp-ga-001", "account_id": "kotak-mf", "name": "Summer Sale", "platform": "google", "type": "Search", "budget": 15000, "spent": 12400, "impressions": 125000, "clicks": 6200, "conversions": 310, "revenue": 46500, "ctr": 4.96, "cpc": 2.0, "cvr": 5.0, "roas": 3.75, "reach": None, "frequency": None},
        {"id": "camp-ga-002", "account_id": "kotak-mf", "name": "Brand Awareness", "platform": "google", "type": "Search", "budget": 20000, "spent": 18900, "impressions": 285000, "clicks": 8550, "conversions": 256, "revenue": 38400, "ctr": 3.0, "cpc": 2.21, "cvr": 2.99, "roas": 2.03, "reach": None, "frequency": None},
        {"id": "camp-ga-003", "account_id": "kotak-mf", "name": "Product Launch", "platform": "google", "type": "Search", "budget": 25000, "spent": 22100, "impressions": 198000, "clicks": 7920, "conversions": 475, "revenue": 71250, "ctr": 4.0, "cpc": 2.79, "cvr": 6.0, "roas": 3.22, "reach": None, "frequency": None},
        {"id": "camp-ga-004", "account_id": "kotak-mf", "name": "Retargeting", "platform": "google", "type": "Display", "budget": 12000, "spent": 11200, "impressions": 89000, "clicks": 4450, "conversions": 267, "revenue": 40050, "ctr": 5.0, "cpc": 2.52, "cvr": 6.0, "roas": 3.57, "reach": None, "frequency": None},
        {"id": "camp-ga-005", "account_id": "kotak-mf", "name": "PMax Q2", "platform": "google", "type": "PMax", "budget": 30000, "spent": 28600, "impressions": 380000, "clicks": 15200, "conversions": 760, "revenue": 114000, "ctr": 4.0, "cpc": 1.88, "cvr": 5.0, "roas": 3.99, "reach": None, "frequency": None},
        {"id": "camp-ga-006", "account_id": "kotak-mf", "name": "Shopping Feed", "platform": "google", "type": "Shopping", "budget": 18000, "spent": 17100, "impressions": 265000, "clicks": 9275, "conversions": 463, "revenue": 69450, "ctr": 3.5, "cpc": 1.84, "cvr": 4.99, "roas": 4.06, "reach": None, "frequency": None},
        {"id": "camp-ga-007", "account_id": "kotak-mf", "name": "YouTube Branding", "platform": "google", "type": "YouTube", "budget": 28000, "spent": 27100, "impressions": 140000, "clicks": 5225, "conversions": 187, "revenue": 34550, "ctr": 3.73, "cpc": 5.19, "cvr": 3.58, "roas": 1.27, "reach": None, "frequency": None},
    ]

    # DV360 campaigns (6)
    dv360_campaigns = [
        {"id": "camp-dv-001", "account_id": "kotak-mf", "name": "Q2 Brand Display", "platform": "dv360", "type": None, "budget": 35000, "spent": 30200, "impressions": 1850000, "clicks": 18500, "conversions": 370, "revenue": 55500, "ctr": 1.0, "cpc": 1.63, "cvr": 2.0, "roas": 1.84, "reach": None, "frequency": None},
        {"id": "camp-dv-002", "account_id": "kotak-mf", "name": "Retargeting Q2", "platform": "dv360", "type": None, "budget": 25000, "spent": 22800, "impressions": 920000, "clicks": 9200, "conversions": 184, "revenue": 27600, "ctr": 1.0, "cpc": 2.48, "cvr": 2.0, "roas": 1.21, "reach": None, "frequency": None},
        {"id": "camp-dv-003", "account_id": "kotak-mf", "name": "Performance Max", "platform": "dv360", "type": None, "budget": 30000, "spent": 28100, "impressions": 580000, "clicks": 11600, "conversions": 522, "revenue": 78300, "ctr": 2.0, "cpc": 2.42, "cvr": 4.5, "roas": 2.79, "reach": None, "frequency": None},
        {"id": "camp-dv-004", "account_id": "kotak-mf", "name": "YouTube PreRoll", "platform": "dv360", "type": None, "budget": 28000, "spent": 26400, "impressions": 1420000, "clicks": 14200, "conversions": 420, "revenue": 63000, "ctr": 1.0, "cpc": 1.86, "cvr": 2.96, "roas": 2.39, "reach": None, "frequency": None},
        {"id": "camp-dv-005", "account_id": "kotak-mf", "name": "Display Awareness", "platform": "dv360", "type": None, "budget": 22000, "spent": 20800, "impressions": 1380000, "clicks": 13800, "conversions": 276, "revenue": 41400, "ctr": 1.0, "cpc": 1.51, "cvr": 2.0, "roas": 1.99, "reach": None, "frequency": None},
        {"id": "camp-dv-006", "account_id": "kotak-mf", "name": "Prospecting", "platform": "dv360", "type": None, "budget": 32000, "spent": 43300, "impressions": 1090000, "clicks": 17600, "conversions": 544, "revenue": 82400, "ctr": 1.62, "cpc": 2.46, "cvr": 3.09, "roas": 1.90, "reach": None, "frequency": None},
    ]

    # Meta campaigns (7) — with objectives
    meta_campaigns = [
        {"id": "camp-meta-001", "account_id": "kotak-mf", "name": "Fashion Sale", "platform": "meta", "type": None, "objective": "Conversions", "budget": 20000, "spent": 19200, "impressions": 425000, "clicks": 12750, "conversions": 425, "revenue": 63750, "ctr": 3.0, "cpc": 1.51, "cvr": 3.33, "roas": 3.32, "reach": 285000, "frequency": 1.49},
        {"id": "camp-meta-002", "account_id": "kotak-mf", "name": "New Collection", "platform": "meta", "type": None, "objective": "Traffic", "budget": 18000, "spent": 17400, "impressions": 365000, "clicks": 8395, "conversions": 335, "revenue": 50250, "ctr": 2.3, "cpc": 2.07, "cvr": 3.99, "roas": 2.89, "reach": 248000, "frequency": 1.47},
        {"id": "camp-meta-003", "account_id": "kotak-mf", "name": "App Installs Q2", "platform": "meta", "type": None, "objective": "App Installs", "budget": 22000, "spent": 21000, "impressions": 315000, "clicks": 9450, "conversions": 567, "revenue": 85050, "ctr": 3.0, "cpc": 2.22, "cvr": 6.0, "roas": 4.05, "reach": 220000, "frequency": 1.43},
        {"id": "camp-meta-004", "account_id": "kotak-mf", "name": "Brand Awareness", "platform": "meta", "type": None, "objective": "Awareness", "budget": 15000, "spent": 14200, "impressions": 420000, "clicks": 5040, "conversions": 168, "revenue": 25200, "ctr": 1.2, "cpc": 2.82, "cvr": 3.33, "roas": 1.77, "reach": 315000, "frequency": 1.33},
        {"id": "camp-meta-005", "account_id": "kotak-mf", "name": "Retargeting", "platform": "meta", "type": None, "objective": "Conversions", "budget": 16000, "spent": 15500, "impressions": 280000, "clicks": 8400, "conversions": 420, "revenue": 63000, "ctr": 3.0, "cpc": 1.85, "cvr": 5.0, "roas": 4.06, "reach": 195000, "frequency": 1.44},
        {"id": "camp-meta-006", "account_id": "kotak-mf", "name": "Catalog Sales", "platform": "meta", "type": None, "objective": "Catalog Sales", "budget": 19000, "spent": 18300, "impressions": 310000, "clicks": 9300, "conversions": 465, "revenue": 69750, "ctr": 3.0, "cpc": 1.97, "cvr": 5.0, "roas": 3.81, "reach": 215000, "frequency": 1.44},
        {"id": "camp-meta-007", "account_id": "kotak-mf", "name": "Lead Gen", "platform": "meta", "type": None, "objective": "Lead Generation", "budget": 17000, "spent": 15300, "impressions": 195000, "clicks": 10465, "conversions": 396, "revenue": 59600, "ctr": 5.37, "cpc": 1.46, "cvr": 3.79, "roas": 3.89, "reach": 142000, "frequency": 1.37},
    ]

    # Alert rule test campaigns for ethinos account (4 campaigns to trigger each rule)
    alert_test_campaigns = [
        # Rule 1: ROAS Drop — Current ROAS < Previous ROAS × 0.8
        {"id": "camp-alert-01", "account_id": "ethinos", "name": "YouTube Branding Ethinos", "platform": "google", "type": "YouTube", "objective": None, "budget": 28000, "spent": 25000, "impressions": 140000, "clicks": 5200, "conversions": 145, "revenue": 20700, "ctr": 3.71, "cpc": 4.81, "cvr": 2.79, "roas": 1.1, "reach": None, "frequency": None, "previous_roas": 2.0},
        # Rule 2: Audience Fatigue (Meta) — Frequency > 5.0
        {"id": "camp-alert-02", "account_id": "ethinos", "name": "Meta Awareness Ethinos", "platform": "meta", "type": None, "objective": "Awareness", "budget": 20000, "spent": 19000, "impressions": 380000, "clicks": 4560, "conversions": 95, "revenue": 14250, "ctr": 1.2, "cpc": 4.17, "cvr": 2.08, "roas": 0.75, "reach": 65000, "frequency": 5.8},
        # Rule 3: Budget Utilization ≥ 95% — Spent ≥ 95% of budget
        {"id": "camp-alert-03", "account_id": "ethinos", "name": "DV360 Prospecting", "platform": "dv360", "type": None, "objective": None, "budget": 1000, "spent": 950, "impressions": 142000, "clicks": 1420, "conversions": 57, "revenue": 8550, "ctr": 1.0, "cpc": 0.67, "cvr": 4.02, "roas": 9.0, "reach": None, "frequency": None},
        # Rule 4: Paused Campaign — Campaign status = "paused"
        {"id": "camp-alert-04", "account_id": "ethinos", "name": "Search Retargeting", "platform": "google", "type": "Search", "objective": None, "budget": 15000, "spent": 8500, "impressions": 85000, "clicks": 4250, "conversions": 212, "revenue": 31800, "ctr": 5.0, "cpc": 2.0, "cvr": 4.99, "roas": 3.74, "reach": None, "frequency": None, "status_override": "paused"},
    ]

    all_campaigns = google_campaigns + dv360_campaigns + meta_campaigns + alert_test_campaigns

    for camp in all_campaigns:
        # Determine status: use status_override if present, otherwise default to "active"
        status = camp.get("status_override", "active")

        conn.execute(
            """
            INSERT INTO campaigns (id, account_id, name, platform, type, objective, status, budget, spent, impressions, clicks, conversions, revenue, ctr, cpc, cvr, roas, reach, frequency, created_at)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            """,
            [
                camp["id"], camp["account_id"], camp["name"], camp["platform"], camp["type"], camp.get("objective"), status,
                camp["budget"], camp["spent"], camp["impressions"], camp["clicks"], camp["conversions"], camp["revenue"],
                camp["ctr"], camp["cpc"], camp["cvr"], camp["roas"], camp["reach"], camp["frequency"], datetime.now()
            ]
        )

    # ========== AD GROUPS (Google only - 18 total) ==========
    ad_groups = [
        # camp-ga-001 (3 groups)
        {"id": "ag-001", "campaign_id": "camp-ga-001", "account_id": "kotak-mf", "name": "Branded Search", "impressions": 42000, "clicks": 2100, "spend": 4200, "conversions": 105, "ctr": 5.0, "cpc": 2.0, "cvr": 5.0},
        {"id": "ag-002", "campaign_id": "camp-ga-001", "account_id": "kotak-mf", "name": "Generic Search", "impressions": 38000, "clicks": 1900, "spend": 3800, "conversions": 95, "ctr": 5.0, "cpc": 2.0, "cvr": 5.0},
        {"id": "ag-003", "campaign_id": "camp-ga-001", "account_id": "kotak-mf", "name": "Competitor", "impressions": 45000, "clicks": 2200, "spend": 4400, "conversions": 110, "ctr": 4.89, "cpc": 2.0, "cvr": 5.0},
        # camp-ga-002 (2 groups)
        {"id": "ag-004", "campaign_id": "camp-ga-002", "account_id": "kotak-mf", "name": "Product Category", "impressions": 145000, "clicks": 4350, "spend": 9600, "conversions": 130, "ctr": 3.0, "cpc": 2.21, "cvr": 2.99},
        {"id": "ag-005", "campaign_id": "camp-ga-002", "account_id": "kotak-mf", "name": "Long-tail Keywords", "impressions": 140000, "clicks": 4200, "spend": 9300, "conversions": 126, "ctr": 3.0, "cpc": 2.21, "cvr": 3.0},
        # camp-ga-003 (2 groups)
        {"id": "ag-006", "campaign_id": "camp-ga-003", "account_id": "kotak-mf", "name": "New Launch", "impressions": 68000, "clicks": 2720, "spend": 7600, "conversions": 163, "ctr": 4.0, "cpc": 2.79, "cvr": 5.99},
        {"id": "ag-007", "campaign_id": "camp-ga-003", "account_id": "kotak-mf", "name": "Product Features", "impressions": 130000, "clicks": 5200, "spend": 14500, "conversions": 312, "ctr": 4.0, "cpc": 2.79, "cvr": 6.0},
        # camp-ga-004 (2 groups)
        {"id": "ag-008", "campaign_id": "camp-ga-004", "account_id": "kotak-mf", "name": "Remarketing", "impressions": 35000, "clicks": 1750, "spend": 4400, "conversions": 105, "ctr": 5.0, "cpc": 2.51, "cvr": 6.0},
        {"id": "ag-009", "campaign_id": "camp-ga-004", "account_id": "kotak-mf", "name": "Similar Audiences", "impressions": 54000, "clicks": 2700, "spend": 6800, "conversions": 162, "ctr": 5.0, "cpc": 2.52, "cvr": 6.0},
        # camp-ga-005 (2 groups)
        {"id": "ag-010", "campaign_id": "camp-ga-005", "account_id": "kotak-mf", "name": "Shopping Signals", "impressions": 195000, "clicks": 7800, "spend": 14700, "conversions": 390, "ctr": 4.0, "cpc": 1.88, "cvr": 5.0},
        {"id": "ag-011", "campaign_id": "camp-ga-005", "account_id": "kotak-mf", "name": "Audience Signals", "impressions": 185000, "clicks": 7400, "spend": 13900, "conversions": 370, "ctr": 4.0, "cpc": 1.88, "cvr": 5.0},
        # camp-ga-006 (2 groups)
        {"id": "ag-012", "campaign_id": "camp-ga-006", "account_id": "kotak-mf", "name": "Best Sellers", "impressions": 140000, "clicks": 4900, "spend": 9100, "conversions": 245, "ctr": 3.5, "cpc": 1.86, "cvr": 5.0},
        {"id": "ag-013", "campaign_id": "camp-ga-006", "account_id": "kotak-mf", "name": "New Arrivals", "impressions": 125000, "clicks": 4375, "spend": 8000, "conversions": 218, "ctr": 3.5, "cpc": 1.83, "cvr": 4.98},
        # camp-ga-007 (2 groups)
        {"id": "ag-014", "campaign_id": "camp-ga-007", "account_id": "kotak-mf", "name": "TrueView In-Stream", "impressions": 80000, "clicks": 2960, "spend": 15500, "conversions": 107, "ctr": 3.7, "cpc": 5.24, "cvr": 3.62},
        {"id": "ag-015", "campaign_id": "camp-ga-007", "account_id": "kotak-mf", "name": "Bumper Ads", "impressions": 60000, "clicks": 2265, "spend": 11600, "conversions": 80, "ctr": 3.78, "cpc": 5.12, "cvr": 3.53},
    ]

    for ag in ad_groups:
        conn.execute(
            """
            INSERT INTO ad_groups (id, campaign_id, account_id, name, impressions, clicks, spend, conversions, ctr, cpc, cvr)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            """,
            [ag["id"], ag["campaign_id"], ag["account_id"], ag["name"], ag["impressions"], ag["clicks"], ag["spend"], ag["conversions"], ag["ctr"], ag["cpc"], ag["cvr"]]
        )

    # ========== AD SETS (Meta - 18 total) ==========
    ad_sets = [
        # camp-meta-001 (3 sets)
        {"id": "as-001", "campaign_id": "camp-meta-001", "account_id": "kotak-mf", "name": "Women 25-34 Mumbai", "budget": None, "spent": 6800, "impressions": 151000, "clicks": 4530, "conversions": 151, "revenue": None, "targeting": "Women 25-34, Mumbai"},
        {"id": "as-002", "campaign_id": "camp-meta-001", "account_id": "kotak-mf", "name": "Women 25-44 National", "budget": None, "spent": 6800, "impressions": 152000, "clicks": 4560, "conversions": 152, "revenue": None, "targeting": "Women 25-44, National"},
        {"id": "as-003", "campaign_id": "camp-meta-001", "account_id": "kotak-mf", "name": "Lookalike 1%", "budget": None, "spent": 5600, "impressions": 122000, "clicks": 3660, "conversions": 122, "revenue": None, "targeting": "LAL 1% Purchasers"},
        # camp-meta-002 (2 sets)
        {"id": "as-004", "campaign_id": "camp-meta-002", "account_id": "kotak-mf", "name": "Interest Fashion", "budget": None, "spent": 8800, "impressions": 185000, "clicks": 4255, "conversions": 170, "revenue": None, "targeting": "Fashion Interest, 18-35"},
        {"id": "as-005", "campaign_id": "camp-meta-002", "account_id": "kotak-mf", "name": "Broad National", "budget": None, "spent": 8600, "impressions": 180000, "clicks": 4140, "conversions": 165, "revenue": None, "targeting": "National, All 18-45"},
        # camp-meta-003 (2 sets)
        {"id": "as-006", "campaign_id": "camp-meta-003", "account_id": "kotak-mf", "name": "App Installer 1", "budget": None, "spent": 10500, "impressions": 157500, "clicks": 4725, "conversions": 283, "revenue": None, "targeting": "App installer interest"},
        {"id": "as-007", "campaign_id": "camp-meta-003", "account_id": "kotak-mf", "name": "App Installer 2", "budget": None, "spent": 10500, "impressions": 157500, "clicks": 4725, "conversions": 284, "revenue": None, "targeting": "Technology interest"},
        # camp-meta-004 (2 sets)
        {"id": "as-008", "campaign_id": "camp-meta-004", "account_id": "kotak-mf", "name": "Broad Awareness", "budget": None, "spent": 7100, "impressions": 210000, "clicks": 2520, "conversions": 84, "revenue": None, "targeting": "National"},
        {"id": "as-009", "campaign_id": "camp-meta-004", "account_id": "kotak-mf", "name": "Interest Targeting", "budget": None, "spent": 7100, "impressions": 210000, "clicks": 2520, "conversions": 84, "revenue": None, "targeting": "Fashion, Lifestyle"},
        # camp-meta-005 (2 sets)
        {"id": "as-010", "campaign_id": "camp-meta-005", "account_id": "kotak-mf", "name": "Cart Abandoners", "budget": None, "spent": 7750, "impressions": 140000, "clicks": 4200, "conversions": 210, "revenue": None, "targeting": "Abandoned Cart 30d"},
        {"id": "as-011", "campaign_id": "camp-meta-005", "account_id": "kotak-mf", "name": "Purchaser LAL", "budget": None, "spent": 7750, "impressions": 140000, "clicks": 4200, "conversions": 210, "revenue": None, "targeting": "LAL 1% Purchasers"},
        # camp-meta-006 (3 sets)
        {"id": "as-012", "campaign_id": "camp-meta-006", "account_id": "kotak-mf", "name": "Abandoned Cart", "budget": None, "spent": 6200, "impressions": 105000, "clicks": 3150, "conversions": 158, "revenue": None, "targeting": "Abandoned Cart 30d"},
        {"id": "as-013", "campaign_id": "camp-meta-006", "account_id": "kotak-mf", "name": "Product Viewers", "budget": None, "spent": 6100, "impressions": 103000, "clicks": 3090, "conversions": 154, "revenue": None, "targeting": "Product Page Viewers 14d"},
        {"id": "as-014", "campaign_id": "camp-meta-006", "account_id": "kotak-mf", "name": "Purchasers LAL", "budget": None, "spent": 6000, "impressions": 102000, "clicks": 3060, "conversions": 153, "revenue": None, "targeting": "LAL 2% Purchasers"},
        # camp-meta-007 (2 sets)
        {"id": "as-015", "campaign_id": "camp-meta-007", "account_id": "kotak-mf", "name": "Lead Interest", "budget": None, "spent": 7650, "impressions": 97500, "clicks": 5232, "conversions": 198, "revenue": None, "targeting": "Lead gen interest"},
        {"id": "as-016", "campaign_id": "camp-meta-007", "account_id": "kotak-mf", "name": "Broad Lead", "budget": None, "spent": 7650, "impressions": 97500, "clicks": 5233, "conversions": 198, "revenue": None, "targeting": "Broad audience"},
    ]

    for aset in ad_sets:
        conn.execute(
            """
            INSERT INTO ad_sets (id, campaign_id, account_id, name, budget, spent, impressions, clicks, conversions, revenue, targeting)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            """,
            [aset["id"], aset["campaign_id"], aset["account_id"], aset["name"], aset["budget"], aset["spent"], aset["impressions"], aset["clicks"], aset["conversions"], aset["revenue"], aset["targeting"]]
        )

    # ========== INSERTION ORDERS (DV360 - 6 total) ==========
    insertion_orders = [
        {"id": "io-001", "campaign_id": "camp-dv-001", "account_id": "kotak-mf", "name": "Q2 Brand Display IO", "budget": 35000, "spent": 30200, "impressions": 1850000, "clicks": 18500, "conversions": 370, "revenue": 55500, "pacing_percent": 86.3},
        {"id": "io-002", "campaign_id": "camp-dv-002", "account_id": "kotak-mf", "name": "Retargeting Q2 IO", "budget": 25000, "spent": 22800, "impressions": 920000, "clicks": 9200, "conversions": 184, "revenue": 27600, "pacing_percent": 91.2},
        {"id": "io-003", "campaign_id": "camp-dv-003", "account_id": "kotak-mf", "name": "Performance Max IO", "budget": 30000, "spent": 28100, "impressions": 580000, "clicks": 11600, "conversions": 522, "revenue": 78300, "pacing_percent": 93.67},
        {"id": "io-004", "campaign_id": "camp-dv-004", "account_id": "kotak-mf", "name": "YouTube PreRoll IO", "budget": 28000, "spent": 26400, "impressions": 1420000, "clicks": 14200, "conversions": 420, "revenue": 63000, "pacing_percent": 94.29},
        {"id": "io-005", "campaign_id": "camp-dv-005", "account_id": "kotak-mf", "name": "Display Awareness IO", "budget": 22000, "spent": 20800, "impressions": 1380000, "clicks": 13800, "conversions": 276, "revenue": 41400, "pacing_percent": 94.55},
        {"id": "io-006", "campaign_id": "camp-dv-006", "account_id": "kotak-mf", "name": "Prospecting IO", "budget": 32000, "spent": 43300, "impressions": 1090000, "clicks": 17600, "conversions": 544, "revenue": 82400, "pacing_percent": 135.31},
    ]

    for io in insertion_orders:
        conn.execute(
            """
            INSERT INTO insertion_orders (id, campaign_id, account_id, name, budget, spent, impressions, clicks, conversions, revenue, pacing_percent)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            """,
            [io["id"], io["campaign_id"], io["account_id"], io["name"], io["budget"], io["spent"], io["impressions"], io["clicks"], io["conversions"], io["revenue"], io["pacing_percent"]]
        )

    # ========== LINE ITEMS (DV360 - 12 total) ==========
    line_items = [
        # io-001 (2 LIs)
        {"id": "li-001", "insertion_order_id": "io-001", "account_id": "kotak-mf", "name": "Homepage Display", "budget": 17500, "spent": 15600, "impressions": 960000, "clicks": 9600, "conversions": 192, "revenue": 28800, "vtc": 0, "ctc": 192, "vtr": None},
        {"id": "li-002", "insertion_order_id": "io-001", "account_id": "kotak-mf", "name": "Category Display", "budget": 17500, "spent": 14600, "impressions": 890000, "clicks": 8900, "conversions": 178, "revenue": 26700, "vtc": 0, "ctc": 178, "vtr": None},
        # io-002 (2 LIs)
        {"id": "li-003", "insertion_order_id": "io-002", "account_id": "kotak-mf", "name": "Cart Abandoners", "budget": 12500, "spent": 11400, "impressions": 460000, "clicks": 4600, "conversions": 92, "revenue": 13800, "vtc": 0, "ctc": 92, "vtr": None},
        {"id": "li-004", "insertion_order_id": "io-002", "account_id": "kotak-mf", "name": "Product Viewers", "budget": 12500, "spent": 11400, "impressions": 460000, "clicks": 4600, "conversions": 92, "revenue": 13800, "vtc": 0, "ctc": 92, "vtr": None},
        # io-003 (2 LIs)
        {"id": "li-005", "insertion_order_id": "io-003", "account_id": "kotak-mf", "name": "PMax Search", "budget": 15000, "spent": 14050, "impressions": 290000, "clicks": 5800, "conversions": 261, "revenue": 39150, "vtc": 0, "ctc": 261, "vtr": None},
        {"id": "li-006", "insertion_order_id": "io-003", "account_id": "kotak-mf", "name": "PMax Display", "budget": 15000, "spent": 14050, "impressions": 290000, "clicks": 5800, "conversions": 261, "revenue": 39150, "vtc": 0, "ctc": 261, "vtr": None},
        # io-004 (2 video LIs with VTR)
        {"id": "li-007", "insertion_order_id": "io-004", "account_id": "kotak-mf", "name": "PreRoll 15s", "budget": 14000, "spent": 13200, "impressions": 710000, "clicks": 7100, "conversions": 210, "revenue": 31500, "vtc": 84, "ctc": 126, "vtr": 62.5},
        {"id": "li-008", "insertion_order_id": "io-004", "account_id": "kotak-mf", "name": "PreRoll 30s", "budget": 14000, "spent": 13200, "impressions": 710000, "clicks": 7100, "conversions": 210, "revenue": 31500, "vtc": 84, "ctc": 126, "vtr": 54.2},
        # io-005 (2 LIs)
        {"id": "li-009", "insertion_order_id": "io-005", "account_id": "kotak-mf", "name": "Display Standard", "budget": 11000, "spent": 10400, "impressions": 690000, "clicks": 6900, "conversions": 138, "revenue": 20700, "vtc": 0, "ctc": 138, "vtr": None},
        {"id": "li-010", "insertion_order_id": "io-005", "account_id": "kotak-mf", "name": "Display Premium", "budget": 11000, "spent": 10400, "impressions": 690000, "clicks": 6900, "conversions": 138, "revenue": 20700, "vtc": 0, "ctc": 138, "vtr": None},
        # io-006 (2 LIs)
        {"id": "li-011", "insertion_order_id": "io-006", "account_id": "kotak-mf", "name": "Prospect Tier 1", "budget": 16000, "spent": 21650, "impressions": 545000, "clicks": 8800, "conversions": 272, "revenue": 41200, "vtc": 0, "ctc": 272, "vtr": None},
        {"id": "li-012", "insertion_order_id": "io-006", "account_id": "kotak-mf", "name": "Prospect Tier 2", "budget": 16000, "spent": 21650, "impressions": 545000, "clicks": 7800, "conversions": 272, "revenue": 41200, "vtc": 0, "ctc": 272, "vtr": None},
    ]

    for li in line_items:
        conn.execute(
            """
            INSERT INTO line_items (id, insertion_order_id, account_id, name, budget, spent, impressions, clicks, conversions, revenue, vtc, ctc, vtr)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            """,
            [li["id"], li["insertion_order_id"], li["account_id"], li["name"], li["budget"], li["spent"], li["impressions"], li["clicks"], li["conversions"], li["revenue"], li["vtc"], li["ctc"], li["vtr"]]
        )

    # ========== GEO DATA (24 India cities - 8 per platform) ==========
    geo_data = [
        # Google Ads (1,482,000 impressions total)
        {"id": "geo-ga-001", "account_id": "kotak-mf", "platform": "google", "city": "Mumbai", "state": "Maharashtra", "impressions": 296000, "clicks": 11360, "spend": 27480, "conversions": 544, "ctr": 3.84, "cpc": 2.42},
        {"id": "geo-ga-002", "account_id": "kotak-mf", "platform": "google", "city": "Delhi", "state": "Delhi NCR", "impressions": 267000, "clicks": 10230, "spend": 24730, "conversions": 489, "ctr": 3.83, "cpc": 2.42},
        {"id": "geo-ga-003", "account_id": "kotak-mf", "platform": "google", "city": "Bangalore", "state": "Karnataka", "impressions": 222000, "clicks": 8520, "spend": 20600, "conversions": 407, "ctr": 3.84, "cpc": 2.42},
        {"id": "geo-ga-004", "account_id": "kotak-mf", "platform": "google", "city": "Chennai", "state": "Tamil Nadu", "impressions": 178000, "clicks": 6830, "spend": 16510, "conversions": 325, "ctr": 3.84, "cpc": 2.42},
        {"id": "geo-ga-005", "account_id": "kotak-mf", "platform": "google", "city": "Hyderabad", "state": "Telangana", "impressions": 163000, "clicks": 6250, "spend": 15110, "conversions": 297, "ctr": 3.83, "cpc": 2.42},
        {"id": "geo-ga-006", "account_id": "kotak-mf", "platform": "google", "city": "Pune", "state": "Maharashtra", "impressions": 148000, "clicks": 5680, "spend": 13730, "conversions": 270, "ctr": 3.84, "cpc": 2.42},
        {"id": "geo-ga-007", "account_id": "kotak-mf", "platform": "google", "city": "Ahmedabad", "state": "Gujarat", "impressions": 111000, "clicks": 4260, "spend": 10300, "conversions": 203, "ctr": 3.84, "cpc": 2.42},
        {"id": "geo-ga-008", "account_id": "kotak-mf", "platform": "google", "city": "Kolkata", "state": "West Bengal", "impressions": 97000, "clicks": 3690, "spend": 8940, "conversions": 183, "ctr": 3.81, "cpc": 2.42},
        # DV360 (7,240,000 impressions total)
        {"id": "geo-dv-001", "account_id": "kotak-mf", "platform": "dv360", "city": "Mumbai", "state": "Maharashtra", "impressions": 1556000, "clicks": 18250, "spend": 36890, "conversions": 497, "ctr": 1.17, "cpc": 2.02},
        {"id": "geo-dv-002", "account_id": "kotak-mf", "platform": "dv360", "city": "Delhi", "state": "Delhi NCR", "impressions": 1412000, "clicks": 16570, "spend": 33510, "conversions": 451, "ctr": 1.17, "cpc": 2.02},
        {"id": "geo-dv-003", "account_id": "kotak-mf", "platform": "dv360", "city": "Bangalore", "state": "Karnataka", "impressions": 1158000, "clicks": 13590, "spend": 27470, "conversions": 370, "ctr": 1.17, "cpc": 2.02},
        {"id": "geo-dv-004", "account_id": "kotak-mf", "platform": "dv360", "city": "Chennai", "state": "Tamil Nadu", "impressions": 890000, "clicks": 10440, "spend": 21110, "conversions": 284, "ctr": 1.17, "cpc": 2.02},
        {"id": "geo-dv-005", "account_id": "kotak-mf", "platform": "dv360", "city": "Hyderabad", "state": "Telangana", "impressions": 798000, "clicks": 9360, "spend": 18930, "conversions": 255, "ctr": 1.17, "cpc": 2.02},
        {"id": "geo-dv-006", "account_id": "kotak-mf", "platform": "dv360", "city": "Pune", "state": "Maharashtra", "impressions": 614000, "clicks": 7200, "spend": 14560, "conversions": 196, "ctr": 1.17, "cpc": 2.02},
        {"id": "geo-dv-007", "account_id": "kotak-mf", "platform": "dv360", "city": "Ahmedabad", "state": "Gujarat", "impressions": 489000, "clicks": 5740, "spend": 11610, "conversions": 156, "ctr": 1.17, "cpc": 2.02},
        {"id": "geo-dv-008", "account_id": "kotak-mf", "platform": "dv360", "city": "Kolkata", "state": "West Bengal", "impressions": 323000, "clicks": 3790, "spend": 7660, "conversions": 103, "ctr": 1.17, "cpc": 2.02},
        # Meta (2,310,000 impressions total)
        {"id": "geo-meta-001", "account_id": "kotak-mf", "platform": "meta", "city": "Mumbai", "state": "Maharashtra", "impressions": 493000, "clicks": 13620, "spend": 25810, "conversions": 592, "ctr": 2.76, "cpc": 1.90},
        {"id": "geo-meta-002", "account_id": "kotak-mf", "platform": "meta", "city": "Delhi", "state": "Delhi NCR", "impressions": 440000, "clicks": 12160, "spend": 23040, "conversions": 528, "ctr": 2.76, "cpc": 1.90},
        {"id": "geo-meta-003", "account_id": "kotak-mf", "platform": "meta", "city": "Bangalore", "state": "Karnataka", "impressions": 370000, "clicks": 10230, "spend": 19380, "conversions": 444, "ctr": 2.76, "cpc": 1.90},
        {"id": "geo-meta-004", "account_id": "kotak-mf", "platform": "meta", "city": "Chennai", "state": "Tamil Nadu", "impressions": 290000, "clicks": 8020, "spend": 15200, "conversions": 348, "ctr": 2.76, "cpc": 1.90},
        {"id": "geo-meta-005", "account_id": "kotak-mf", "platform": "meta", "city": "Hyderabad", "state": "Telangana", "impressions": 265000, "clicks": 7320, "spend": 13880, "conversions": 318, "ctr": 2.76, "cpc": 1.90},
        {"id": "geo-meta-006", "account_id": "kotak-mf", "platform": "meta", "city": "Pune", "state": "Maharashtra", "impressions": 210000, "clicks": 5800, "spend": 11000, "conversions": 252, "ctr": 2.76, "cpc": 1.90},
        {"id": "geo-meta-007", "account_id": "kotak-mf", "platform": "meta", "city": "Ahmedabad", "state": "Gujarat", "impressions": 118000, "clicks": 3260, "spend": 6180, "conversions": 141, "ctr": 2.76, "cpc": 1.90},
        {"id": "geo-meta-008", "account_id": "kotak-mf", "platform": "meta", "city": "Kolkata", "state": "West Bengal", "impressions": 124000, "clicks": 3390, "spend": 6410, "conversions": 153, "ctr": 2.73, "cpc": 1.89},
    ]

    for geo in geo_data:
        conn.execute(
            """
            INSERT INTO geo_data (id, account_id, platform, city, state, impressions, clicks, spend, conversions, ctr, cpc)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            """,
            [geo["id"], geo["account_id"], geo["platform"], geo["city"], geo["state"], geo["impressions"], geo["clicks"], geo["spend"], geo["conversions"], geo["ctr"], geo["cpc"]]
        )

    # ========== DEMOGRAPHICS (age + gender) ==========
    demo_data = [
        # Google Ads age (1,482,000 total impressions)
        {"id": "demo-ga-age-001", "account_id": "kotak-mf", "platform": "google", "dimension": "age", "segment": "18-24", "impressions": 177840, "clicks": 6825, "spend": 16488, "conversions": 326},
        {"id": "demo-ga-age-002", "account_id": "kotak-mf", "platform": "google", "dimension": "age", "segment": "25-34", "impressions": 414960, "clicks": 15906, "spend": 38468, "conversions": 763},
        {"id": "demo-ga-age-003", "account_id": "kotak-mf", "platform": "google", "dimension": "age", "segment": "35-44", "impressions": 385320, "clicks": 14765, "spend": 35700, "conversions": 707},
        {"id": "demo-ga-age-004", "account_id": "kotak-mf", "platform": "google", "dimension": "age", "segment": "45-54", "impressions": 266760, "clicks": 10236, "spend": 24743, "conversions": 490},
        {"id": "demo-ga-age-005", "account_id": "kotak-mf", "platform": "google", "dimension": "age", "segment": "55-64", "impressions": 148200, "clicks": 5682, "spend": 13740, "conversions": 272},
        {"id": "demo-ga-age-006", "account_id": "kotak-mf", "platform": "google", "dimension": "age", "segment": "65+", "impressions": 88920, "clicks": 3406, "spend": 8261, "conversions": 160},
        # Google Ads gender
        {"id": "demo-ga-gender-001", "account_id": "kotak-mf", "platform": "google", "dimension": "gender", "segment": "Male", "impressions": 770640, "clicks": 29586, "spend": 71448, "conversions": 1413},
        {"id": "demo-ga-gender-002", "account_id": "kotak-mf", "platform": "google", "dimension": "gender", "segment": "Female", "impressions": 652080, "clicks": 25034, "spend": 60552, "conversions": 1198},
        {"id": "demo-ga-gender-003", "account_id": "kotak-mf", "platform": "google", "dimension": "gender", "segment": "Unknown", "impressions": 59280, "clicks": 2273, "spend": 5496, "conversions": 107},
        # DV360 age (7,240,000 total impressions)
        {"id": "demo-dv-age-001", "account_id": "kotak-mf", "platform": "dv360", "dimension": "age", "segment": "18-24", "impressions": 579200, "clicks": 6791, "spend": 13794, "conversions": 185},
        {"id": "demo-dv-age-002", "account_id": "kotak-mf", "platform": "dv360", "dimension": "age", "segment": "25-34", "impressions": 1592800, "clicks": 18684, "spend": 37843, "conversions": 509},
        {"id": "demo-dv-age-003", "account_id": "kotak-mf", "platform": "dv360", "dimension": "age", "segment": "35-44", "impressions": 2027200, "clicks": 23769, "spend": 48163, "conversions": 648},
        {"id": "demo-dv-age-004", "account_id": "kotak-mf", "platform": "dv360", "dimension": "age", "segment": "45-54", "impressions": 1592800, "clicks": 18684, "spend": 37843, "conversions": 509},
        {"id": "demo-dv-age-005", "account_id": "kotak-mf", "platform": "dv360", "dimension": "age", "segment": "55-64", "impressions": 941200, "clicks": 11040, "spend": 22381, "conversions": 301},
        {"id": "demo-dv-age-006", "account_id": "kotak-mf", "platform": "dv360", "dimension": "age", "segment": "65+", "impressions": 506800, "clicks": 5941, "spend": 12041, "conversions": 162},
        # DV360 gender
        {"id": "demo-dv-gender-001", "account_id": "kotak-mf", "platform": "dv360", "dimension": "gender", "segment": "Male", "impressions": 3982000, "clicks": 46695, "spend": 94632, "conversions": 1274},
        {"id": "demo-dv-gender-002", "account_id": "kotak-mf", "platform": "dv360", "dimension": "gender", "segment": "Female", "impressions": 2968400, "clicks": 34816, "spend": 70554, "conversions": 950},
        {"id": "demo-dv-gender-003", "account_id": "kotak-mf", "platform": "dv360", "dimension": "gender", "segment": "Unknown", "impressions": 289600, "clicks": 3395, "spend": 6880, "conversions": 92},
        # Meta age (2,310,000 total impressions)
        {"id": "demo-meta-age-001", "account_id": "kotak-mf", "platform": "meta", "dimension": "age", "segment": "18-24", "impressions": 415800, "clicks": 11484, "spend": 21742, "conversions": 499},
        {"id": "demo-meta-age-002", "account_id": "kotak-mf", "platform": "meta", "dimension": "age", "segment": "25-34", "impressions": 739200, "clicks": 20384, "spend": 38643, "conversions": 887},
        {"id": "demo-meta-age-003", "account_id": "kotak-mf", "platform": "meta", "dimension": "age", "segment": "35-44", "impressions": 554400, "clicks": 15312, "spend": 29049, "conversions": 667},
        {"id": "demo-meta-age-004", "account_id": "kotak-mf", "platform": "meta", "dimension": "age", "segment": "45-54", "impressions": 323400, "clicks": 8939, "spend": 16964, "conversions": 389},
        {"id": "demo-meta-age-005", "account_id": "kotak-mf", "platform": "meta", "dimension": "age", "segment": "55-64", "impressions": 184800, "clicks": 5108, "spend": 9688, "conversions": 222},
        {"id": "demo-meta-age-006", "account_id": "kotak-mf", "platform": "meta", "dimension": "age", "segment": "65+", "impressions": 92400, "clicks": 2552, "spend": 4841, "conversions": 111},
        # Meta gender
        {"id": "demo-meta-gender-001", "account_id": "kotak-mf", "platform": "meta", "dimension": "gender", "segment": "Male", "impressions": 1039500, "clicks": 28710, "spend": 54405, "conversions": 1249},
        {"id": "demo-meta-gender-002", "account_id": "kotak-mf", "platform": "meta", "dimension": "gender", "segment": "Female", "impressions": 1200600, "clicks": 33176, "spend": 62870, "conversions": 1442},
        {"id": "demo-meta-gender-003", "account_id": "kotak-mf", "platform": "meta", "dimension": "gender", "segment": "Unknown", "impressions": 69300, "clicks": 1914, "spend": 3631, "conversions": 85},
    ]

    for demo in demo_data:
        conn.execute(
            """
            INSERT INTO demographics (id, account_id, platform, dimension, segment, impressions, clicks, spend, conversions)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
            """,
            [demo["id"], demo["account_id"], demo["platform"], demo["dimension"], demo["segment"], demo["impressions"], demo["clicks"], demo["spend"], demo["conversions"]]
        )

    # ========== PLACEMENTS ==========
    placements = [
        # Meta placements (7)
        {"id": "place-meta-001", "account_id": "kotak-mf", "platform": "meta", "placement_name": "Facebook Feed", "placement_type": "Feed", "surface": "facebook", "impressions": 680000, "clicks": 18800, "spend": 35620, "conversions": 817, "views": None, "vtr": None, "reach": 455000, "frequency": 1.49, "ctr": 2.76},
        {"id": "place-meta-002", "account_id": "kotak-mf", "platform": "meta", "placement_name": "Instagram Feed", "placement_type": "Feed", "surface": "instagram", "impressions": 578000, "clicks": 15980, "spend": 30270, "conversions": 695, "views": None, "vtr": None, "reach": 392000, "frequency": 1.47, "ctr": 2.76},
        {"id": "place-meta-003", "account_id": "kotak-mf", "platform": "meta", "placement_name": "Instagram Stories", "placement_type": "Stories", "surface": "instagram", "impressions": 395000, "clicks": 10920, "spend": 20640, "conversions": 474, "views": None, "vtr": None, "reach": 276000, "frequency": 1.43, "ctr": 2.77},
        {"id": "place-meta-004", "account_id": "kotak-mf", "platform": "meta", "placement_name": "Instagram Reels", "placement_type": "Video", "surface": "instagram", "impressions": 298000, "clicks": 8240, "spend": 15610, "conversions": 358, "views": None, "vtr": None, "reach": 212000, "frequency": 1.41, "ctr": 2.76},
        {"id": "place-meta-005", "account_id": "kotak-mf", "platform": "meta", "placement_name": "Facebook Stories", "placement_type": "Stories", "surface": "facebook", "impressions": 175000, "clicks": 4840, "spend": 9170, "conversions": 210, "views": None, "vtr": None, "reach": 128000, "frequency": 1.37, "ctr": 2.77},
        {"id": "place-meta-006", "account_id": "kotak-mf", "platform": "meta", "placement_name": "Audience Network", "placement_type": "Network", "surface": "audience_network", "impressions": 115000, "clicks": 3180, "spend": 6030, "conversions": 138, "views": None, "vtr": None, "reach": 88000, "frequency": 1.31, "ctr": 2.77},
        {"id": "place-meta-007", "account_id": "kotak-mf", "platform": "meta", "placement_name": "Messenger", "placement_type": "Inbox", "surface": "messenger", "impressions": 69000, "clicks": 1840, "spend": 3560, "conversions": 84, "views": None, "vtr": None, "reach": 54000, "frequency": 1.28, "ctr": 2.67},
        # DV360 placements (YouTube + Display mix)
        {"id": "place-dv-001", "account_id": "kotak-mf", "platform": "dv360", "placement_name": "YouTube Bumper", "placement_type": "Video", "surface": "youtube", "impressions": 360000, "clicks": 3600, "spend": 18000, "conversions": 144, "views": 360000, "vtr": 100.0, "reach": 360000, "frequency": 1.0, "ctr": 1.0},
        {"id": "place-dv-002", "account_id": "kotak-mf", "platform": "dv360", "placement_name": "YouTube PreRoll", "placement_type": "Video", "surface": "youtube", "impressions": 1420000, "clicks": 14200, "spend": 71000, "conversions": 420, "views": 1068000, "vtr": 75.2, "reach": 1420000, "frequency": 1.0, "ctr": 1.0},
        {"id": "place-dv-003", "account_id": "kotak-mf", "platform": "dv360", "placement_name": "Display Network", "placement_type": "Display", "surface": "display", "impressions": 3680000, "clicks": 36800, "spend": 55200, "conversions": 736, "views": None, "vtr": None, "reach": 3680000, "frequency": 1.0, "ctr": 1.0},
        {"id": "place-dv-004", "account_id": "kotak-mf", "platform": "dv360", "placement_name": "Apps", "placement_type": "Display", "surface": "apps", "impressions": 1780000, "clicks": 17800, "spend": 26700, "conversions": 356, "views": None, "vtr": None, "reach": 1780000, "frequency": 1.0, "ctr": 1.0},
    ]

    for place in placements:
        conn.execute(
            """
            INSERT INTO placements (id, account_id, platform, placement_name, placement_type, surface, impressions, clicks, spend, conversions, views, vtr, reach, frequency, ctr)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            """,
            [place["id"], place["account_id"], place["platform"], place["placement_name"], place["placement_type"], place["surface"], place["impressions"], place["clicks"], place["spend"], place["conversions"], place["views"], place["vtr"], place["reach"], place["frequency"], place["ctr"]]
        )

    # ========== DAILY METRICS (30 days) ==========
    base_date = datetime.now().replace(day=1) - timedelta(days=7)  # Start 7 days before month start
    for day_offset in range(30):
        metric_date = base_date + timedelta(days=day_offset)

        # Daily totals (distributed across platform proportions)
        daily_metrics = [
            {"campaign_id": "camp-ga-001", "platform": "google", "date": metric_date, "impressions": 4167, "clicks": 207, "spend": 413, "conversions": 10, "revenue": 1550},
            {"campaign_id": "camp-dv-001", "platform": "dv360", "date": metric_date, "impressions": 61667, "clicks": 617, "spend": 1007, "conversions": 12, "revenue": 1850},
            {"campaign_id": "camp-meta-001", "platform": "meta", "date": metric_date, "impressions": 14167, "clicks": 425, "spend": 640, "conversions": 14, "revenue": 2125},
        ]

        for metric in daily_metrics:
            conn.execute(
                """
                INSERT INTO daily_metrics (id, campaign_id, account_id, platform, date, impressions, clicks, spend, conversions, revenue, views)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                """,
                [str(uuid.uuid4()), metric["campaign_id"], "kotak-mf", metric["platform"], metric["date"].date(), metric["impressions"], metric["clicks"], metric["spend"], metric["conversions"], metric["revenue"], 0]
            )

    # ========== CREATIVES ==========
    creatives = [
        {"id": "creative-001", "account_id": "kotak-mf", "campaign_id": "camp-ga-001", "platform": "google", "name": "Summer Sale Hero", "format": "Text", "size": None, "impressions": 125000, "clicks": 6200, "conversions": 310, "spend": 12400, "frequency": None, "ctr": 4.96, "cvr": 5.0, "roas": 3.75},
        {"id": "creative-002", "account_id": "kotak-mf", "campaign_id": "camp-dv-001", "platform": "dv360", "name": "Brand Banner 728x90", "format": "Display", "size": "728x90", "impressions": 850000, "clicks": 8500, "conversions": 170, "spend": 12750, "frequency": None, "ctr": 1.0, "cvr": 2.0, "roas": 1.84},
        {"id": "creative-003", "account_id": "kotak-mf", "campaign_id": "camp-meta-001", "platform": "meta", "name": "Fashion Collection Carousel", "format": "Carousel", "size": None, "impressions": 425000, "clicks": 12750, "conversions": 425, "spend": 19200, "frequency": 1.49, "ctr": 3.0, "cvr": 3.33, "roas": 3.32},
        {"id": "creative-004", "account_id": "kotak-mf", "campaign_id": "camp-ga-005", "platform": "google", "name": "PMax Dynamic", "format": "Dynamic", "size": None, "impressions": 380000, "clicks": 15200, "conversions": 760, "spend": 28600, "frequency": None, "ctr": 4.0, "cvr": 5.0, "roas": 3.99},
        {"id": "creative-005", "account_id": "kotak-mf", "campaign_id": "camp-dv-004", "platform": "dv360", "name": "YouTube Intro", "format": "Video", "size": None, "impressions": 1420000, "clicks": 14200, "conversions": 420, "spend": 26400, "frequency": None, "ctr": 1.0, "cvr": 2.96, "roas": 2.39},
    ]

    for creative in creatives:
        conn.execute(
            """
            INSERT INTO creatives (id, account_id, campaign_id, platform, name, format, size, impressions, clicks, conversions, spend, frequency, ctr, cvr, roas)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            """,
            [creative["id"], creative["account_id"], creative["campaign_id"], creative["platform"], creative["name"], creative["format"], creative["size"], creative["impressions"], creative["clicks"], creative["conversions"], creative["spend"], creative["frequency"], creative["ctr"], creative["cvr"], creative["roas"]]
        )

    # ========== SEARCH TERMS (Google only) ==========
    search_terms = [
        {"id": "st-001", "account_id": "kotak-mf", "keyword": "womens shoes", "match_type": "Phrase", "impressions": 42000, "clicks": 2100, "spend": 4200, "conversions": 105, "quality_score": 7, "ctr": 5.0, "cpc": 2.0, "cvr": 5.0},
        {"id": "st-002", "account_id": "kotak-mf", "keyword": "athletic shoes sale", "match_type": "Exact", "impressions": 38000, "clicks": 1900, "spend": 3800, "conversions": 95, "quality_score": 8, "ctr": 5.0, "cpc": 2.0, "cvr": 5.0},
        {"id": "st-003", "account_id": "kotak-mf", "keyword": "buy shoes online", "match_type": "Broad", "impressions": 45000, "clicks": 2200, "spend": 4400, "conversions": 110, "quality_score": 6, "ctr": 4.89, "cpc": 2.0, "cvr": 5.0},
        {"id": "st-004", "account_id": "kotak-mf", "keyword": "running shoes", "match_type": "Phrase", "impressions": 35000, "clicks": 1750, "spend": 3500, "conversions": 87, "quality_score": 8, "ctr": 5.0, "cpc": 2.0, "cvr": 5.0},
        {"id": "st-005", "account_id": "kotak-mf", "keyword": "casual footwear", "match_type": "Broad", "impressions": 25000, "clicks": 1250, "spend": 2500, "conversions": 62, "quality_score": 5, "ctr": 5.0, "cpc": 2.0, "cvr": 5.0},
    ]

    for term in search_terms:
        conn.execute(
            """
            INSERT INTO search_terms (id, account_id, keyword, match_type, impressions, clicks, spend, conversions, quality_score, ctr, cpc, cvr)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            """,
            [term["id"], term["account_id"], term["keyword"], term["match_type"], term["impressions"], term["clicks"], term["spend"], term["conversions"], term["quality_score"], term["ctr"], term["cpc"], term["cvr"]]
        )

    # ========== PMAX CHANNELS (Google) ==========
    pmax_channels = [
        {"id": "pmax-001", "account_id": "kotak-mf", "channel": "Search", "impressions": 152000, "clicks": 6080, "conversions": 304, "spend": 11440, "revenue": 45600, "ctr": 4.0, "cpc": 1.88, "cvr": 5.0, "roas": 3.99},
        {"id": "pmax-002", "account_id": "kotak-mf", "channel": "Display", "impressions": 114000, "clicks": 4560, "conversions": 228, "spend": 8580, "revenue": 34200, "ctr": 4.0, "cpc": 1.88, "cvr": 5.0, "roas": 3.99},
        {"id": "pmax-003", "account_id": "kotak-mf", "channel": "YouTube", "impressions": 76000, "clicks": 3040, "conversions": 152, "spend": 5720, "revenue": 22800, "ctr": 4.0, "cpc": 1.88, "cvr": 5.0, "roas": 3.99},
        {"id": "pmax-004", "account_id": "kotak-mf", "channel": "Gmail", "impressions": 38000, "clicks": 1520, "conversions": 76, "spend": 2860, "revenue": 11400, "ctr": 4.0, "cpc": 1.88, "cvr": 5.0, "roas": 3.99},
    ]

    for channel in pmax_channels:
        conn.execute(
            """
            INSERT INTO pmax_channels (id, account_id, channel, impressions, clicks, conversions, spend, revenue, ctr, cpc, cvr, roas)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            """,
            [channel["id"], channel["account_id"], channel["channel"], channel["impressions"], channel["clicks"], channel["conversions"], channel["spend"], channel["revenue"], channel["ctr"], channel["cpc"], channel["cvr"], channel["roas"]]
        )

    conn.commit()
    conn.close()

    logger.info("✅ Database seeded with complete mock data")
