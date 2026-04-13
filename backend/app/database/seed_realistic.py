"""
Realistic data seeder for Ethinos CDP.
Generates 5 months of multi-client, multi-platform marketing data.

Usage:
    python -m app.database.seed_realistic
"""

import uuid
import random
import math
from datetime import date, timedelta, datetime
from pathlib import Path

# Deterministic seed for reproducibility
random.seed(42)

# ─────────────────────────────────────────────
# CONSTANTS
# ─────────────────────────────────────────────
DATE_START = date(2025, 12, 1)
DATE_END = date(2026, 4, 13)
DAYS = (DATE_END - DATE_START).days + 1  # 135 days

INDIAN_CITIES = [
    ("Mumbai", "Maharashtra"), ("Delhi", "Delhi"), ("Bangalore", "Karnataka"),
    ("Chennai", "Tamil Nadu"), ("Hyderabad", "Telangana"), ("Pune", "Maharashtra"),
    ("Ahmedabad", "Gujarat"), ("Kolkata", "West Bengal"), ("Jaipur", "Rajasthan"),
    ("Lucknow", "Uttar Pradesh"),
]

AGE_SEGMENTS = ["18-24", "25-34", "35-44", "45-54", "55-64", "65+"]
GENDER_SEGMENTS = ["Male", "Female", "Unknown"]

# ─────────────────────────────────────────────
# CLIENT DEFINITIONS
# ─────────────────────────────────────────────
CLIENTS = [
    {
        "id": "urbancart",
        "name": "UrbanCart",
        "industry": "E-commerce / D2C",
        "currency": "INR",
        "client_type": "web",
        "platforms": "google,meta",
        "brand_primary": "#FF6B35",
        "brand_secondary": "#004E89",
        "brand_accent": "#F5A623",
        "monthly_spend_inr": 2000000,  # 20L
        "roas_target": 3.5,
        "cpa_target": 450,
        "config": {"roas_threshold": 3.0, "cpa_threshold": 500, "frequency_threshold": 5.0, "quality_score_threshold": 7, "currency": "INR"},
    },
    {
        "id": "propnest",
        "name": "PropNest Realty",
        "industry": "Real Estate",
        "currency": "INR",
        "client_type": "web",
        "platforms": "google,dv360",
        "brand_primary": "#2D5F2D",
        "brand_secondary": "#8B4513",
        "brand_accent": "#DAA520",
        "monthly_spend_inr": 1000000,  # 10L
        "roas_target": 2.5,
        "cpa_target": 2000,
        "config": {"roas_threshold": 2.0, "cpa_threshold": 2500, "frequency_threshold": 4.0, "quality_score_threshold": 6, "currency": "INR"},
    },
    {
        "id": "cloudstack",
        "name": "CloudStack SaaS",
        "industry": "B2B SaaS",
        "currency": "USD",
        "client_type": "web",
        "platforms": "google,meta",
        "brand_primary": "#6366F1",
        "brand_secondary": "#8B5CF6",
        "brand_accent": "#06B6D4",
        "monthly_spend_inr": 500000,  # ~$6K USD
        "roas_target": 4.0,
        "cpa_target": 80,
        "config": {"roas_threshold": 3.5, "cpa_threshold": 100, "frequency_threshold": 6.0, "quality_score_threshold": 7, "currency": "USD"},
    },
    {
        "id": "freshbite",
        "name": "FreshBite Foods",
        "industry": "FMCG / CPG",
        "currency": "INR",
        "client_type": "web",
        "platforms": "google,dv360,meta",
        "brand_primary": "#16A34A",
        "brand_secondary": "#CA8A04",
        "brand_accent": "#DC2626",
        "monthly_spend_inr": 2500000,  # 25L
        "roas_target": 3.0,
        "cpa_target": 300,
        "config": {"roas_threshold": 2.5, "cpa_threshold": 400, "frequency_threshold": 5.0, "quality_score_threshold": 7, "currency": "INR"},
    },
]

# ─────────────────────────────────────────────
# CAMPAIGN TEMPLATES PER CLIENT
# ─────────────────────────────────────────────
def get_campaigns_for_client(client):
    cid = client["id"]
    platforms = client["platforms"].split(",")
    campaigns = []

    if "google" in platforms:
        google_campaigns = {
            "urbancart": [
                {"name": "Brand Search - UrbanCart", "type": "search", "stage": "bofu", "budget_pct": 0.15},
                {"name": "Generic Search - Fashion", "type": "search", "stage": "mofu", "budget_pct": 0.20},
                {"name": "Shopping - Product Catalog", "type": "shopping", "stage": "bofu", "budget_pct": 0.25},
                {"name": "PMax - Smart Bidding", "type": "pmax", "stage": "mofu", "budget_pct": 0.15},
                {"name": "Display - Retargeting", "type": "display", "stage": "mofu", "budget_pct": 0.10},
                {"name": "YouTube - Brand Story", "type": "video", "stage": "tofu", "budget_pct": 0.08},
                {"name": "Discovery - New Arrivals", "type": "discovery", "stage": "tofu", "budget_pct": 0.07},
            ],
            "propnest": [
                {"name": "Brand Search - PropNest", "type": "search", "stage": "bofu", "budget_pct": 0.20},
                {"name": "Generic Search - Flats Mumbai", "type": "search", "stage": "mofu", "budget_pct": 0.25},
                {"name": "Generic Search - Home Loans", "type": "search", "stage": "mofu", "budget_pct": 0.15},
                {"name": "Display - Property Listings", "type": "display", "stage": "tofu", "budget_pct": 0.15},
                {"name": "YouTube - Virtual Tours", "type": "video", "stage": "tofu", "budget_pct": 0.10},
                {"name": "PMax - Lead Gen", "type": "pmax", "stage": "bofu", "budget_pct": 0.15},
            ],
            "cloudstack": [
                {"name": "Brand Search - CloudStack", "type": "search", "stage": "bofu", "budget_pct": 0.20},
                {"name": "Generic Search - Cloud Hosting", "type": "search", "stage": "mofu", "budget_pct": 0.25},
                {"name": "Generic Search - SaaS Tools", "type": "search", "stage": "mofu", "budget_pct": 0.20},
                {"name": "Display - B2B Retargeting", "type": "display", "stage": "mofu", "budget_pct": 0.15},
                {"name": "YouTube - Product Demo", "type": "video", "stage": "tofu", "budget_pct": 0.10},
                {"name": "PMax - Trial Signups", "type": "pmax", "stage": "bofu", "budget_pct": 0.10},
            ],
            "freshbite": [
                {"name": "Brand Search - FreshBite", "type": "search", "stage": "bofu", "budget_pct": 0.10},
                {"name": "Generic Search - Organic Food", "type": "search", "stage": "mofu", "budget_pct": 0.15},
                {"name": "Shopping - Food Products", "type": "shopping", "stage": "bofu", "budget_pct": 0.20},
                {"name": "Display - Health Awareness", "type": "display", "stage": "tofu", "budget_pct": 0.10},
                {"name": "YouTube - Recipe Videos", "type": "video", "stage": "tofu", "budget_pct": 0.08},
                {"name": "PMax - Subscription Box", "type": "pmax", "stage": "mofu", "budget_pct": 0.12},
            ],
        }
        for c in google_campaigns.get(cid, []):
            campaigns.append({**c, "platform": "google"})

    if "dv360" in platforms:
        dv360_campaigns = {
            "propnest": [
                {"name": "DV360 - Brand Awareness Q1", "type": "display", "stage": "tofu", "budget_pct": 0.20},
                {"name": "DV360 - YouTube Pre-Roll", "type": "video", "stage": "tofu", "budget_pct": 0.15},
                {"name": "DV360 - Retargeting Sites", "type": "display", "stage": "mofu", "budget_pct": 0.15},
                {"name": "DV360 - Premium Publisher", "type": "display", "stage": "tofu", "budget_pct": 0.10},
            ],
            "freshbite": [
                {"name": "DV360 - Brand Awareness", "type": "display", "stage": "tofu", "budget_pct": 0.10},
                {"name": "DV360 - YouTube Bumper Ads", "type": "video", "stage": "tofu", "budget_pct": 0.08},
                {"name": "DV360 - Retargeting", "type": "display", "stage": "mofu", "budget_pct": 0.10},
                {"name": "DV360 - Programmatic Premium", "type": "display", "stage": "tofu", "budget_pct": 0.07},
            ],
        }
        for c in dv360_campaigns.get(cid, []):
            campaigns.append({**c, "platform": "dv360"})

    if "meta" in platforms:
        meta_campaigns = {
            "urbancart": [
                {"name": "Meta - Catalog Sales", "type": "catalog", "stage": "bofu", "budget_pct": 0.20},
                {"name": "Meta - Retargeting DPA", "type": "retargeting", "stage": "mofu", "budget_pct": 0.15},
                {"name": "Meta - Brand Awareness Reels", "type": "awareness", "stage": "tofu", "budget_pct": 0.10},
                {"name": "Meta - App Install", "type": "app_install", "stage": "bofu", "budget_pct": 0.10},
                {"name": "Meta - Lookalike Prospecting", "type": "prospecting", "stage": "tofu", "budget_pct": 0.10},
                {"name": "Meta - Lead Gen Form", "type": "lead_gen", "stage": "bofu", "budget_pct": 0.05},
            ],
            "cloudstack": [
                {"name": "Meta - B2B Lead Gen", "type": "lead_gen", "stage": "bofu", "budget_pct": 0.15},
                {"name": "Meta - Thought Leadership", "type": "awareness", "stage": "tofu", "budget_pct": 0.10},
                {"name": "Meta - Retargeting Webinar", "type": "retargeting", "stage": "mofu", "budget_pct": 0.10},
                {"name": "Meta - Trial Signup", "type": "conversion", "stage": "bofu", "budget_pct": 0.10},
            ],
            "freshbite": [
                {"name": "Meta - Brand Awareness Video", "type": "awareness", "stage": "tofu", "budget_pct": 0.08},
                {"name": "Meta - Engagement Recipes", "type": "engagement", "stage": "mofu", "budget_pct": 0.07},
                {"name": "Meta - Catalog D2C", "type": "catalog", "stage": "bofu", "budget_pct": 0.12},
                {"name": "Meta - Retargeting Cart", "type": "retargeting", "stage": "mofu", "budget_pct": 0.08},
                {"name": "Meta - Subscription Leads", "type": "lead_gen", "stage": "bofu", "budget_pct": 0.05},
            ],
        }
        for c in meta_campaigns.get(cid, []):
            campaigns.append({**c, "platform": "meta"})

    return campaigns


# ─────────────────────────────────────────────
# KEYWORD TEMPLATES
# ─────────────────────────────────────────────
KEYWORDS_BY_CLIENT = {
    "urbancart": [
        ("urbancart", "Exact", 9), ("urbancart.com", "Exact", 10), ("urban cart online", "Phrase", 8),
        ("buy shoes online", "Broad", 6), ("trendy fashion india", "Broad", 5), ("online shopping deals", "Broad", 4),
        ("women dresses online", "Phrase", 6), ("men sneakers india", "Phrase", 7), ("affordable clothing", "Broad", 5),
        ("summer fashion sale", "Phrase", 6), ("kids clothing online", "Broad", 5), ("best online store india", "Broad", 4),
        ("cotton kurta for women", "Phrase", 7), ("running shoes under 2000", "Phrase", 6), ("ethnic wear online", "Broad", 5),
        ("premium leather bags", "Phrase", 5), ("free delivery shopping", "Broad", 3), ("cash on delivery fashion", "Broad", 4),
    ],
    "propnest": [
        ("propnest", "Exact", 9), ("propnest realty", "Exact", 10), ("flats in mumbai", "Phrase", 7),
        ("2bhk flat mumbai", "Phrase", 8), ("3bhk apartment pune", "Phrase", 7), ("home loan calculator", "Broad", 5),
        ("property in bangalore", "Broad", 6), ("new launch projects mumbai", "Phrase", 7), ("ready possession flats", "Phrase", 6),
        ("affordable housing india", "Broad", 4), ("builder floor delhi", "Phrase", 5), ("villa plots bangalore", "Phrase", 6),
        ("commercial property mumbai", "Phrase", 5), ("real estate investment", "Broad", 4), ("under construction projects", "Phrase", 5),
    ],
    "cloudstack": [
        ("cloudstack", "Exact", 9), ("cloudstack saas", "Exact", 10), ("cloud hosting provider", "Phrase", 7),
        ("best saas tools 2026", "Broad", 5), ("enterprise cloud platform", "Phrase", 7), ("managed kubernetes", "Phrase", 8),
        ("serverless hosting", "Broad", 6), ("aws alternative", "Phrase", 5), ("devops platform", "Broad", 6),
        ("ci cd pipeline tool", "Phrase", 7), ("docker hosting service", "Phrase", 6), ("cloud cost optimization", "Broad", 5),
        ("api management platform", "Phrase", 6), ("microservices hosting", "Phrase", 7), ("free tier cloud hosting", "Broad", 4),
    ],
    "freshbite": [
        ("freshbite", "Exact", 9), ("freshbite foods", "Exact", 10), ("organic food online", "Phrase", 7),
        ("healthy snacks india", "Broad", 6), ("subscription food box", "Phrase", 7), ("natural ingredients food", "Broad", 5),
        ("buy organic groceries", "Phrase", 6), ("vegan food delivery", "Broad", 5), ("sugar free snacks", "Phrase", 7),
        ("protein bars india", "Phrase", 8), ("cold pressed juice", "Phrase", 6), ("meal prep delivery", "Broad", 5),
        ("gluten free products", "Phrase", 6), ("farm to table food", "Broad", 4), ("healthy breakfast options", "Broad", 5),
    ],
}


# ─────────────────────────────────────────────
# PERFORMANCE PROFILES (platform + funnel stage)
# ─────────────────────────────────────────────
PERF_PROFILES = {
    # (platform, stage): (ctr%, cvr%, avg_cpc_inr, roas_multiplier, freq)
    ("google", "tofu"):  (1.5, 0.8, 8.0, 1.2, 1.5),
    ("google", "mofu"):  (3.5, 2.5, 12.0, 2.5, 2.0),
    ("google", "bofu"):  (6.0, 5.0, 18.0, 4.0, 3.0),
    ("dv360", "tofu"):   (0.8, 0.3, 3.0, 0.8, 3.5),
    ("dv360", "mofu"):   (1.5, 1.0, 5.0, 1.5, 4.0),
    ("dv360", "bofu"):   (2.5, 2.0, 8.0, 2.5, 5.0),
    ("meta", "tofu"):    (1.2, 0.5, 5.0, 1.0, 4.0),
    ("meta", "mofu"):    (2.5, 1.8, 8.0, 2.0, 5.5),
    ("meta", "bofu"):    (4.0, 4.0, 12.0, 3.5, 6.0),
}


# ─────────────────────────────────────────────
# ANOMALY INJECTION
# ─────────────────────────────────────────────
def get_anomaly_multiplier(client_id, platform, stage, day_date):
    """Returns a multiplier that degrades performance for specific client/platform/date combos."""
    m = 1.0

    # UrbanCart: ROAS drop in March on Google Search (overspend during sale)
    if client_id == "urbancart" and platform == "google" and stage == "mofu":
        if date(2026, 3, 1) <= day_date <= date(2026, 3, 20):
            m *= 0.55  # ROAS drops ~45%

    # PropNest: High frequency on DV360 in February (audience fatigue)
    if client_id == "propnest" and platform == "dv360" and stage == "tofu":
        if date(2026, 2, 1) <= day_date <= date(2026, 2, 28):
            m *= 0.7  # Performance degrades due to audience fatigue

    # CloudStack: CTR collapse on specific Google Display in April
    if client_id == "cloudstack" and platform == "google" and stage == "mofu":
        if date(2026, 4, 1) <= day_date <= date(2026, 4, 13):
            m *= 0.4  # CTR drops significantly

    # FreshBite: Budget pacing issues on DV360 in January (overspend)
    if client_id == "freshbite" and platform == "dv360":
        if date(2026, 1, 1) <= day_date <= date(2026, 1, 31):
            m *= 1.45  # Overspend (spend goes up but conversions don't scale)

    return m


def get_frequency_anomaly(client_id, platform, day_date, base_freq):
    """Returns inflated frequency for specific anomaly periods."""
    if client_id == "propnest" and platform == "dv360":
        if date(2026, 2, 1) <= day_date <= date(2026, 2, 28):
            return base_freq * 2.5  # High frequency = audience fatigue
    if client_id == "freshbite" and platform == "meta":
        if date(2026, 3, 10) <= day_date <= date(2026, 3, 25):
            return base_freq * 1.8
    return base_freq


# ─────────────────────────────────────────────
# DATA GENERATORS
# ─────────────────────────────────────────────
def _uid():
    return str(uuid.uuid4())[:12]


def generate_daily_metric(campaign_id, account_id, platform, stage, day_date, daily_budget, client_id):
    """Generate one day of metrics for a campaign."""
    profile = PERF_PROFILES.get((platform, stage), (2.0, 1.5, 10.0, 2.0, 3.0))
    base_ctr, base_cvr, base_cpc, roas_mult, base_freq = profile

    # Day-of-week variation
    dow = day_date.weekday()
    weekend_mult = 0.7 if dow >= 5 else 1.0
    monday_mult = 1.15 if dow == 0 else 1.0

    # Month-over-month growth trend (slight improvement)
    months_elapsed = (day_date.year - DATE_START.year) * 12 + (day_date.month - DATE_START.month)
    trend_mult = 1.0 + months_elapsed * 0.03  # 3% improvement per month

    # Random daily noise
    noise = random.uniform(0.85, 1.15)

    # Anomaly injection
    anomaly = get_anomaly_multiplier(client_id, platform, stage, day_date)

    # Calculate metrics
    spend = daily_budget * weekend_mult * monday_mult * noise
    if client_id == "freshbite" and platform == "dv360" and date(2026, 1, 1) <= day_date <= date(2026, 1, 31):
        spend *= 1.45  # Budget pacing issue

    cpc = base_cpc * random.uniform(0.8, 1.2) / anomaly
    clicks = max(1, int(spend / cpc))
    ctr = base_ctr * noise * trend_mult * anomaly / 100.0
    impressions = max(clicks, int(clicks / max(ctr, 0.001)))

    cvr = base_cvr * noise * trend_mult * anomaly / 100.0
    conversions = max(0, int(clicks * cvr))

    revenue_per_conv = (spend / max(conversions, 1)) * roas_mult * trend_mult * anomaly
    revenue = conversions * revenue_per_conv

    views = int(impressions * random.uniform(0.2, 0.5)) if platform in ("dv360", "meta") or stage == "tofu" else 0
    reach = int(impressions * random.uniform(0.6, 0.85))
    frequency = get_frequency_anomaly(client_id, platform, day_date, base_freq * random.uniform(0.8, 1.3))

    cpm = (spend / max(impressions, 1)) * 1000
    cpa = spend / max(conversions, 1)
    vtr = views / max(impressions, 1) if views > 0 else 0

    return {
        "id": _uid(),
        "campaign_id": campaign_id,
        "account_id": account_id,
        "platform": platform,
        "date": day_date.isoformat(),
        "impressions": impressions,
        "clicks": clicks,
        "spend": round(spend, 2),
        "conversions": conversions,
        "revenue": round(revenue, 2),
        "views": views,
        "reach": reach,
        "frequency": round(frequency, 2),
        "cpm": round(cpm, 2),
        "cpa": round(cpa, 2),
        "vtr": round(vtr, 4),
    }


def generate_campaign_totals(daily_rows):
    """Aggregate daily metrics into campaign totals."""
    totals = {"impressions": 0, "clicks": 0, "spend": 0, "conversions": 0, "revenue": 0, "reach": 0}
    for row in daily_rows:
        totals["impressions"] += row["impressions"]
        totals["clicks"] += row["clicks"]
        totals["spend"] += row["spend"]
        totals["conversions"] += row["conversions"]
        totals["revenue"] += row["revenue"]
        totals["reach"] += row["reach"]

    imp = totals["impressions"]
    clk = totals["clicks"]
    spend = totals["spend"]
    conv = totals["conversions"]
    rev = totals["revenue"]

    return {
        **totals,
        "ctr": round(clk / max(imp, 1), 4),
        "cpc": round(spend / max(clk, 1), 4),
        "cvr": round(conv / max(clk, 1), 4),
        "roas": round(rev / max(spend, 1), 4),
        "frequency": round(imp / max(totals["reach"], 1), 2),
    }


def generate_previous_period_roas(daily_rows):
    """Calculate ROAS from the previous 30 days vs current 30 days."""
    if len(daily_rows) < 60:
        return None
    recent = daily_rows[-30:]
    prev = daily_rows[-60:-30]
    recent_spend = sum(r["spend"] for r in recent)
    recent_rev = sum(r["revenue"] for r in recent)
    return round(recent_rev / max(recent_spend, 1), 4) if recent_spend > 0 else None


# ─────────────────────────────────────────────
# MAIN SEED FUNCTION
# ─────────────────────────────────────────────
def seed_all(conn):
    """Seed all tables with realistic data."""
    print("Seeding Ethinos CDP with realistic multi-client data...")

    # ── 1. ACCOUNTS ──
    print("  [1/10] Accounts...")
    # Update master agency account (may already exist from seed.py)
    existing = conn.execute("SELECT COUNT(*) FROM accounts WHERE id = 'ethinos'").fetchone()[0]
    if existing:
        conn.execute("""
            UPDATE accounts SET name='Ethinos Digital (All Accounts)', industry='Digital Agency',
            platforms='google,dv360,meta', brand_primary='#5C6BC0', brand_secondary='#4338CA', brand_accent='#F59E0B'
            WHERE id = 'ethinos'
        """)
    else:
        conn.execute("""
            INSERT INTO accounts (id, name, industry, currency, client_type, platforms, brand_primary, brand_secondary, brand_accent)
            VALUES ('ethinos', 'Ethinos Digital (All Accounts)', 'Digital Agency', 'INR', 'web', 'google,dv360,meta', '#5C6BC0', '#4338CA', '#F59E0B')
        """)
    for client in CLIENTS:
        conn.execute("""
            INSERT INTO accounts (id, name, industry, currency, client_type, platforms, brand_primary, brand_secondary, brand_accent)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
        """, [client["id"], client["name"], client["industry"], client["currency"],
              client["client_type"], client["platforms"], client["brand_primary"],
              client["brand_secondary"], client["brand_accent"]])

    # ── 1b. USER_ACCOUNTS (link admin to new clients) ──
    print("  [1b/10] Linking users to new accounts...")
    for client in CLIENTS:
        try:
            conn.execute("INSERT INTO user_accounts (user_id, account_id) VALUES ('user-001', ?)", [client["id"]])
        except Exception:
            pass  # Already linked
        try:
            conn.execute("INSERT INTO user_accounts (user_id, account_id) VALUES ('user-002', ?)", [client["id"]])
        except Exception:
            pass  # Already linked

    # ── 2. CLIENT CONFIG ──
    print("  [2/10] Client configs...")
    for client in CLIENTS:
        cfg = client["config"]
        conn.execute("""
            INSERT INTO client_config (id, account_id, roas_threshold, cpa_threshold, frequency_threshold, quality_score_threshold, currency, is_configured)
            VALUES (?, ?, ?, ?, ?, ?, ?, TRUE)
        """, [_uid(), client["id"], cfg["roas_threshold"], cfg["cpa_threshold"],
              cfg["frequency_threshold"], cfg["quality_score_threshold"], cfg["currency"]])

    # ── 3. CAMPAIGNS + DAILY METRICS ──
    print("  [3/10] Campaigns + daily metrics (this takes a moment)...")
    all_campaign_rows = []
    all_daily_rows = []

    for client in CLIENTS:
        campaign_templates = get_campaigns_for_client(client)
        monthly_budget = client["monthly_spend_inr"]

        for ct in campaign_templates:
            cid = f"{client['id']}_{ct['platform']}_{ct['name'][:20].replace(' ', '_').lower()}"
            daily_budget = (monthly_budget * ct["budget_pct"]) / 30.0

            # Generate daily metrics
            campaign_dailies = []
            for d in range(DAYS):
                day_date = DATE_START + timedelta(days=d)
                row = generate_daily_metric(
                    cid, client["id"], ct["platform"], ct["stage"],
                    day_date, daily_budget, client["id"]
                )
                campaign_dailies.append(row)
                all_daily_rows.append(row)

            # Aggregate totals
            totals = generate_campaign_totals(campaign_dailies)
            prev_roas = generate_previous_period_roas(campaign_dailies)

            status = "active" if random.random() > 0.1 else "paused"
            budget = monthly_budget * ct["budget_pct"]

            all_campaign_rows.append({
                "id": cid,
                "account_id": client["id"],
                "name": ct["name"],
                "platform": ct["platform"],
                "type": ct["type"],
                "objective": ct.get("type", ""),
                "status": status,
                "budget": round(budget, 2),
                "funnel_stage": ct["stage"],
                "previous_roas": prev_roas,
                **totals,
            })

    # Insert campaigns
    for c in all_campaign_rows:
        conn.execute("""
            INSERT INTO campaigns (id, account_id, name, platform, type, objective, status, budget, spent, impressions, clicks, conversions, revenue, ctr, cpc, cvr, roas, previous_roas, reach, frequency, funnel_stage)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        """, [c["id"], c["account_id"], c["name"], c["platform"], c["type"], c["objective"],
              c["status"], c["budget"], c["spend"], c["impressions"], c["clicks"],
              c["conversions"], c["revenue"], c["ctr"], c["cpc"], c["cvr"], c["roas"],
              c["previous_roas"], c["reach"], c["frequency"], c["funnel_stage"]])

    # Insert daily metrics in batches
    print(f"  [4/10] Inserting {len(all_daily_rows)} daily metric rows...")
    batch_size = 500
    for i in range(0, len(all_daily_rows), batch_size):
        batch = all_daily_rows[i:i+batch_size]
        for row in batch:
            conn.execute("""
                INSERT INTO daily_metrics (id, campaign_id, account_id, platform, date, impressions, clicks, spend, conversions, revenue, views, reach, frequency, cpm, cpa, vtr)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            """, [row["id"], row["campaign_id"], row["account_id"], row["platform"],
                  row["date"], row["impressions"], row["clicks"], row["spend"],
                  row["conversions"], row["revenue"], row["views"], row["reach"],
                  row["frequency"], row["cpm"], row["cpa"], row["vtr"]])

    # ── 5. AD GROUPS (Google campaigns only) ──
    print("  [5/10] Ad groups...")
    for c in all_campaign_rows:
        if c["platform"] != "google":
            continue
        num_groups = random.randint(2, 4)
        group_names = {
            "search": ["Branded Terms", "Generic High-Intent", "Long-Tail Queries", "Competitor Terms"],
            "shopping": ["Top Products", "Mid-Range", "Sale Items", "New Arrivals"],
            "display": ["In-Market Audiences", "Affinity Segments", "Custom Intent", "Remarketing"],
            "video": ["Skippable In-Stream", "Bumper Ads", "Discovery", "Non-Skippable"],
            "pmax": ["Asset Group 1", "Asset Group 2", "Asset Group 3"],
            "discovery": ["Lifestyle", "Product Focus", "Seasonal"],
        }
        names = group_names.get(c["type"], ["Group A", "Group B", "Group C"])[:num_groups]
        for j, gname in enumerate(names):
            share = random.uniform(0.15, 0.45)
            imp = int(c["impressions"] * share)
            clk = int(c["clicks"] * share)
            spd = round(c["spend"] * share, 2)
            cvn = int(c["conversions"] * share)
            conn.execute("""
                INSERT INTO ad_groups (id, campaign_id, account_id, name, impressions, clicks, spend, conversions, ctr, cpc, cvr)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            """, [f"{c['id']}_ag{j}", c["id"], c["account_id"], gname, imp, clk, spd, cvn,
                  round(clk/max(imp,1), 4), round(spd/max(clk,1), 4), round(cvn/max(clk,1), 4)])

    # ── 6. AD SETS (Meta campaigns only) ──
    print("  [6/10] Ad sets...")
    for c in all_campaign_rows:
        if c["platform"] != "meta":
            continue
        targeting_options = ["Lookalike 1%", "Interest: Fashion", "Broad Audience", "Custom Audience - Website Visitors",
                            "Interest: Food & Health", "Lookalike 3%", "Custom: Email List", "Interest: Technology"]
        num_sets = random.randint(2, 4)
        for j in range(num_sets):
            share = random.uniform(0.2, 0.4)
            imp = int(c["impressions"] * share)
            clk = int(c["clicks"] * share)
            spd = round(c["spend"] * share, 2)
            cvn = int(c["conversions"] * share)
            rev = round(c["revenue"] * share, 2)
            conn.execute("""
                INSERT INTO ad_sets (id, campaign_id, account_id, name, budget, spent, impressions, clicks, conversions, revenue, targeting)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            """, [f"{c['id']}_as{j}", c["id"], c["account_id"], f"AdSet {j+1} - {c['name'][:15]}",
                  round(c["budget"]*share, 2), spd, imp, clk, cvn, rev,
                  random.choice(targeting_options)])

    # ── 7. INSERTION ORDERS + LINE ITEMS (DV360 only) ──
    print("  [7/10] Insertion orders + line items...")
    for c in all_campaign_rows:
        if c["platform"] != "dv360":
            continue
        io_id = f"{c['id']}_io"
        pacing = round(c["spend"] / max(c["budget"], 1) * 100, 1)
        conn.execute("""
            INSERT INTO insertion_orders (id, campaign_id, account_id, name, budget, spent, impressions, clicks, conversions, revenue, pacing_percent)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        """, [io_id, c["id"], c["account_id"], f"IO - {c['name']}", c["budget"], c["spend"],
              c["impressions"], c["clicks"], c["conversions"], c["revenue"], pacing])

        for j in range(random.randint(2, 3)):
            share = random.uniform(0.3, 0.5)
            vtc = int(c["conversions"] * share * 0.3)
            ctc = int(c["conversions"] * share * 0.7)
            vtr_val = round(random.uniform(0.15, 0.45), 4)
            conn.execute("""
                INSERT INTO line_items (id, insertion_order_id, account_id, name, budget, spent, impressions, clicks, conversions, revenue, vtc, ctc, vtr)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            """, [f"{io_id}_li{j}", io_id, c["account_id"], f"LI {j+1} - {c['type'].title()}",
                  round(c["budget"]*share, 2), round(c["spend"]*share, 2),
                  int(c["impressions"]*share), int(c["clicks"]*share),
                  int(c["conversions"]*share), round(c["revenue"]*share, 2),
                  vtc, ctc, vtr_val])

    # ── 8. KEYWORDS (Google Search campaigns) ──
    print("  [8/10] Keywords...")
    for client in CLIENTS:
        keywords = KEYWORDS_BY_CLIENT.get(client["id"], [])
        search_campaigns = [c for c in all_campaign_rows if c["account_id"] == client["id"] and c["platform"] == "google" and c["type"] == "search"]
        for kw, match_type, qs in keywords:
            # Distribute keywords across search campaigns
            camp = random.choice(search_campaigns) if search_campaigns else None
            if not camp:
                continue
            share = random.uniform(0.02, 0.12)
            imp = int(camp["impressions"] * share)
            clk = int(camp["clicks"] * share)
            spd = round(camp["spend"] * share, 2)
            cvn = int(camp["conversions"] * share)
            conn.execute("""
                INSERT INTO search_terms (id, account_id, keyword, match_type, impressions, clicks, spend, conversions, quality_score, ctr, cpc, cvr)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            """, [_uid(), client["id"], kw, match_type, imp, clk, spd, cvn, qs,
                  round(clk/max(imp,1), 4), round(spd/max(clk,1), 4), round(cvn/max(clk,1), 4)])

    # ── 9. GEO DATA ──
    print("  [9/10] Geo data...")
    for client in CLIENTS:
        platforms = client["platforms"].split(",")
        client_campaigns = [c for c in all_campaign_rows if c["account_id"] == client["id"]]
        total_imp = sum(c["impressions"] for c in client_campaigns)
        total_clk = sum(c["clicks"] for c in client_campaigns)
        total_spd = sum(c["spend"] for c in client_campaigns)
        total_cvn = sum(c["conversions"] for c in client_campaigns)

        for platform in platforms:
            plat_share = {"google": 0.45, "meta": 0.35, "dv360": 0.20}.get(platform, 0.33)
            for city, state in INDIAN_CITIES:
                city_share = random.uniform(0.03, 0.18)
                imp = int(total_imp * plat_share * city_share)
                clk = int(total_clk * plat_share * city_share)
                spd = round(total_spd * plat_share * city_share, 2)
                cvn = int(total_cvn * plat_share * city_share)
                conn.execute("""
                    INSERT INTO geo_data (id, account_id, platform, city, state, impressions, clicks, spend, conversions, ctr, cpc)
                    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                """, [_uid(), client["id"], platform, city, state, imp, clk, spd, cvn,
                      round(clk/max(imp,1), 4), round(spd/max(clk,1), 4)])

    # ── 10. DEMOGRAPHICS ──
    print(" [10/10] Demographics...")
    for client in CLIENTS:
        platforms = client["platforms"].split(",")
        client_campaigns = [c for c in all_campaign_rows if c["account_id"] == client["id"]]
        total_imp = sum(c["impressions"] for c in client_campaigns)
        total_clk = sum(c["clicks"] for c in client_campaigns)
        total_spd = sum(c["spend"] for c in client_campaigns)
        total_cvn = sum(c["conversions"] for c in client_campaigns)

        for platform in platforms:
            plat_share = {"google": 0.45, "meta": 0.35, "dv360": 0.20}.get(platform, 0.33)
            # Age segments
            age_weights = [0.08, 0.30, 0.28, 0.18, 0.10, 0.06]
            for seg, w in zip(AGE_SEGMENTS, age_weights):
                imp = int(total_imp * plat_share * w * random.uniform(0.85, 1.15))
                clk = int(total_clk * plat_share * w * random.uniform(0.85, 1.15))
                spd = round(total_spd * plat_share * w * random.uniform(0.85, 1.15), 2)
                cvn = int(total_cvn * plat_share * w * random.uniform(0.85, 1.15))
                conn.execute("""
                    INSERT INTO demographics (id, account_id, platform, dimension, segment, impressions, clicks, spend, conversions)
                    VALUES (?, ?, ?, 'age', ?, ?, ?, ?, ?)
                """, [_uid(), client["id"], platform, seg, imp, clk, spd, cvn])

            # Gender segments
            gender_weights = [0.48, 0.45, 0.07]
            for seg, w in zip(GENDER_SEGMENTS, gender_weights):
                imp = int(total_imp * plat_share * w * random.uniform(0.85, 1.15))
                clk = int(total_clk * plat_share * w * random.uniform(0.85, 1.15))
                spd = round(total_spd * plat_share * w * random.uniform(0.85, 1.15), 2)
                cvn = int(total_cvn * plat_share * w * random.uniform(0.85, 1.15))
                conn.execute("""
                    INSERT INTO demographics (id, account_id, platform, dimension, segment, impressions, clicks, spend, conversions)
                    VALUES (?, ?, ?, 'gender', ?, ?, ?, ?, ?)
                """, [_uid(), client["id"], platform, seg, imp, clk, spd, cvn])

    # ── CREATIVES ──
    print("  [bonus] Creatives + placements...")
    creative_formats = {
        "google": [("Image 300x250", "image", "300x250"), ("Video 1920x1080", "video", "1920x1080"), ("Responsive Display", "image", "responsive")],
        "meta": [("Carousel 1080x1080", "carousel", "1080x1080"), ("Video Reel 1080x1920", "video", "1080x1920"), ("Static Feed 1080x1080", "image", "1080x1080")],
        "dv360": [("Banner 728x90", "image", "728x90"), ("Video Pre-Roll 1280x720", "video", "1280x720"), ("Native Display", "image", "native")],
    }
    for c in all_campaign_rows:
        formats = creative_formats.get(c["platform"], [])
        for cname, fmt, size in formats[:2]:  # 2 creatives per campaign
            share = random.uniform(0.3, 0.6)
            conn.execute("""
                INSERT INTO creatives (id, account_id, campaign_id, platform, name, format, size, impressions, clicks, conversions, spend, frequency, ctr, cvr, roas)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            """, [_uid(), c["account_id"], c["id"], c["platform"], f"{cname} - {c['name'][:20]}",
                  fmt, size, int(c["impressions"]*share), int(c["clicks"]*share),
                  int(c["conversions"]*share), round(c["spend"]*share, 2),
                  round(c["frequency"]*random.uniform(0.8, 1.2), 2),
                  round(c["ctr"]*random.uniform(0.9, 1.1), 4),
                  round(c["cvr"]*random.uniform(0.9, 1.1), 4),
                  round(c["roas"]*random.uniform(0.9, 1.1), 4)])

    # ── PLACEMENTS ──
    placement_map = {
        "google": [("Search Network", "search"), ("Display Network", "display"), ("YouTube", "video"), ("Gmail", "email")],
        "meta": [("Facebook Feed", "feed"), ("Instagram Feed", "feed"), ("Instagram Stories", "stories"), ("Instagram Reels", "reels"), ("Messenger", "messaging")],
        "dv360": [("YouTube In-Stream", "video"), ("Display Premium", "display"), ("Native Ads", "native")],
    }
    for client in CLIENTS:
        platforms = client["platforms"].split(",")
        client_campaigns = [c for c in all_campaign_rows if c["account_id"] == client["id"]]
        for platform in platforms:
            plat_camps = [c for c in client_campaigns if c["platform"] == platform]
            total_imp = sum(c["impressions"] for c in plat_camps)
            total_clk = sum(c["clicks"] for c in plat_camps)
            total_spd = sum(c["spend"] for c in plat_camps)
            total_cvn = sum(c["conversions"] for c in plat_camps)

            for pname, ptype in placement_map.get(platform, []):
                share = random.uniform(0.1, 0.35)
                imp = int(total_imp * share)
                clk = int(total_clk * share)
                spd = round(total_spd * share, 2)
                cvn = int(total_cvn * share)
                views = int(imp * 0.35) if ptype == "video" else 0
                conn.execute("""
                    INSERT INTO placements (id, account_id, platform, placement_name, placement_type, surface, impressions, clicks, spend, conversions, views, vtr, reach, frequency, ctr)
                    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                """, [_uid(), client["id"], platform, pname, ptype, platform,
                      imp, clk, spd, cvn, views,
                      round(views/max(imp,1), 4) if views else 0,
                      int(imp * 0.7), round(random.uniform(1.5, 6.0), 2),
                      round(clk/max(imp,1), 4)])

    # ── PMAX CHANNELS (Google PMax campaigns) ──
    pmax_campaigns = [c for c in all_campaign_rows if c["type"] == "pmax"]
    channels = ["Search", "Shopping", "YouTube", "Display", "Discover", "Gmail"]
    for c in pmax_campaigns:
        for ch in channels:
            share = random.uniform(0.08, 0.25)
            imp = int(c["impressions"] * share)
            clk = int(c["clicks"] * share)
            spd = round(c["spend"] * share, 2)
            cvn = int(c["conversions"] * share)
            rev = round(c["revenue"] * share, 2)
            conn.execute("""
                INSERT INTO pmax_channels (id, account_id, channel, impressions, clicks, conversions, spend, revenue, ctr, cpc, cvr, roas)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            """, [_uid(), c["account_id"], ch, imp, clk, cvn, spd, rev,
                  round(clk/max(imp,1), 4), round(spd/max(clk,1), 4),
                  round(cvn/max(clk,1), 4), round(rev/max(spd,1), 4)])

    conn.commit()

    # Print summary
    counts = {
        "accounts": conn.execute("SELECT count(*) FROM accounts").fetchone()[0],
        "campaigns": conn.execute("SELECT count(*) FROM campaigns").fetchone()[0],
        "daily_metrics": conn.execute("SELECT count(*) FROM daily_metrics").fetchone()[0],
        "ad_groups": conn.execute("SELECT count(*) FROM ad_groups").fetchone()[0],
        "ad_sets": conn.execute("SELECT count(*) FROM ad_sets").fetchone()[0],
        "insertion_orders": conn.execute("SELECT count(*) FROM insertion_orders").fetchone()[0],
        "line_items": conn.execute("SELECT count(*) FROM line_items").fetchone()[0],
        "search_terms": conn.execute("SELECT count(*) FROM search_terms").fetchone()[0],
        "geo_data": conn.execute("SELECT count(*) FROM geo_data").fetchone()[0],
        "demographics": conn.execute("SELECT count(*) FROM demographics").fetchone()[0],
        "creatives": conn.execute("SELECT count(*) FROM creatives").fetchone()[0],
        "placements": conn.execute("SELECT count(*) FROM placements").fetchone()[0],
        "pmax_channels": conn.execute("SELECT count(*) FROM pmax_channels").fetchone()[0],
        "client_config": conn.execute("SELECT count(*) FROM client_config").fetchone()[0],
    }

    print("\n  ✅ Seeding complete! Summary:")
    for table, count in counts.items():
        print(f"    {table}: {count}")
    print(f"\n  Date range: {DATE_START} → {DATE_END} ({DAYS} days)")
    print(f"  Clients: {', '.join(c['name'] for c in CLIENTS)}")


# ─────────────────────────────────────────────
# ENTRY POINT
# ─────────────────────────────────────────────
if __name__ == "__main__":
    import duckdb
    from app.database.schema import create_tables

    db_path = str(Path(__file__).parent.parent.parent.parent / "ethinos.duckdb")
    print(f"Database: {db_path}")

    conn = duckdb.connect(db_path)

    # Drop and recreate all tables to pick up schema changes
    from app.database.schema import drop_all_tables
    print("Dropping existing tables...")
    drop_all_tables(conn)
    create_tables(conn)

    seed_all(conn)
    conn.close()
    print("\n  Done! Database seeded successfully.")
