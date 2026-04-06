# Sample Data - CDP Marketing Platform

CSV files representing real advertising platform exports for Phase 0 testing.

## Files

- **google_ads_sample.csv** — Google Ads campaign metrics
- **dv360_sample.csv** — DV360 (Display & Video 360) metrics
- **meta_sample.csv** — Meta (Facebook/Instagram) ads metrics

## Schema

All files follow a consistent structure:

```
date,campaign_id,campaign_name,platform,impressions,clicks,spend,conversions,revenue
2026-04-01,uuid-1,Campaign A,google_ads,50000,2500,1250.00,45,4500.00
2026-04-02,uuid-1,Campaign A,google_ads,51000,2600,1300.00,50,5000.00
...
```

### Fields
- **date** — YYYY-MM-DD
- **campaign_id** — UUID (matches database)
- **campaign_name** — Human-readable name
- **platform** — 'google_ads', 'dv360', or 'meta'
- **impressions** — Total impressions served
- **clicks** — Total clicks
- **spend** — Cost in USD
- **conversions** — Number of conversions
- **revenue** — Revenue in USD (for ecommerce)

## Clients in Sample Data

### 1. TechStore E-commerce
- Industry: Retail / E-commerce
- Platforms: Google Ads, Meta
- Campaigns: Product launch, seasonal promotions, retargeting
- Metrics: High impression volume, conversion-focused

### 2. RealEstate Luxury
- Industry: Real Estate
- Platforms: DV360, Google Ads
- Campaigns: Property showcases, lead generation
- Metrics: Lower volume, high-value conversions

## Data Volume

Each platform file contains ~5,000 rows (60 days × 3 campaigns × multiple clients)

## Usage in Phase 0

1. **Backend Loading** — `app/database/seed.py` imports CSVs on startup
2. **DuckDB Storage** — Data loaded into `metrics` table
3. **API Queries** — Dashboard endpoints query DuckDB and return filtered results
4. **Frontend Mocks** — `frontend/lib/mockData.ts` pulls from backend API

## Phase 1+ Changes

CSV files → Real API exports (Google Ads API, DV360 API, Meta Marketing API)
Manual loading → Automated ETL pipeline (daily ingestion)
Sample clients → Multiple real clients (SaaS multi-tenancy)
