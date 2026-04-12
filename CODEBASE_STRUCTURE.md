# Ethinos CDP - Codebase Structure & Architecture

## 🏗️ Project Overview
**Ethinos Marketing Platform** is a Customer Data Platform (CDP) for marketing agencies replacing manual reporting with AI-powered insights.

**Tech Stack:**
- **Frontend:** Next.js 14, React, TypeScript, Tailwind CSS, Shadcn/ui
- **Backend:** FastAPI (Python), DuckDB, SQLite
- **Deployment:** Cloudflare Pages (frontend), Railway (backend)
- **Architecture:** Multi-account with role-based access control

---

## 📁 Root Structure

```
/Users/yash/CDP/
├── frontend/               # Next.js 14 frontend application
├── backend/                # FastAPI backend application
├── CLAUDE.md              # Claude Code configuration
├── CODEBASE_STRUCTURE.md  # This file
└── .claude/
    ├── projects/          # Session memory and observations
    ├── worktrees/         # Isolated git worktrees for parallel development
    └── plans/             # Implementation plans
```

---

## 🎨 Frontend Structure (`/frontend`)

### Core App Routes
```
frontend/app/
├── (auth)/                # Authentication pages (unprotected)
│   ├── login/page.tsx
│   └── signup/page.tsx
├── (dashboard)/           # Protected dashboard routes
│   ├── page.tsx           # Portfolio overview (main dashboard)
│   ├── layout.tsx         # Sidebar + account switcher layout
│   ├── analytics/         # Analytics & diagnostic pages
│   │   ├── [platform]/    # Dynamic platform routes (google-ads, dv360, meta)
│   │   │   ├── page.tsx   # Platform overview with campaigns
│   │   │   ├── campaigns/
│   │   │   ├── ad-groups/
│   │   │   ├── keywords/
│   │   │   ├── creatives/
│   │   │   ├── funnel/    # Conversion funnel analysis
│   │   │   ├── comparison/
│   │   │   ├── geo/
│   │   │   ├── demographics/
│   │   │   ├── placement/
│   │   │   ├── channels/
│   │   │   ├── reports/
│   │   │   └── client.tsx # Client-side logic
│   ├── chat/page.tsx      # AI chatbot
│   ├── presentations/     # Generated reports
│   ├── upload/page.tsx    # Data upload
│   ├── settings/page.tsx  # User settings
│   └── globals.css        # Global styles
├── layout.tsx             # Root layout
└── page.tsx               # Homepage redirect
```

### Component Hierarchy
```
frontend/components/
├── charts/
│   ├── BarChart.tsx       # ECharts bar chart wrapper
│   ├── LineChart.tsx      # Trend/time-series chart
│   ├── PieChart.tsx       # Donut/pie visualization
│   └── AreaChart.tsx      # Area/stacked chart
├── dashboard/
│   ├── MetricCard.tsx     # KPI card (spend, conversions, ROAS, etc)
│   ├── FunnelSection.tsx  # TOFU/MOFU/BOFU stages with platform sub-cards
│   ├── PlatformSubCard.tsx # Platform drill-down (Google/DV360/Meta)
│   ├── TrendChart.tsx     # Performance trend with date selector
│   └── Sidebar.tsx        # Navigation sidebar
├── monitor/
│   └── AlertStrip.tsx     # Health alerts with [View] deep-links
├── diagnose/
│   └── RecommendationPanel.tsx # AI insights & actions
├── act/
│   └── ActionButtons.tsx   # Campaign controls
├── metrics/
│   ├── HealthDot.tsx      # Red/yellow/green/gray status indicator
│   └── MetricBreakdown.tsx # Table of metrics by dimension
├── layout/
│   ├── Header.tsx
│   ├── Footer.tsx
│   └── AccountSwitcher.tsx # Multi-account selector
└── ai/
    └── ChatInterface.tsx   # Claude AI chat
```

### Library Layer
```
frontend/lib/
├── api.ts                 # API client with mock fallbacks
│   ├── fetchWithFallback()    # Smart mock/real fallback
│   ├── fetchCampaigns()       # Campaign metrics
│   ├── fetchAdGroups()        # Google Ad Groups
│   ├── fetchAlerts()          # Health alerts
│   ├── fetchDailyMetrics()    # Time-series data
│   └── ... (13+ fetch functions)
├── mockData.ts            # Client-side mock data
│   ├── generateDailyMetrics() # Dynamic 30-day rolling data
│   ├── getMockCampaigns()     # Campaign mock data
│   ├── getMockAdGroups()      # Ad Group mock data
│   └── ... (platform-specific mock generators)
├── accountContext.tsx     # Multi-account state
│   ├── AccountProvider
│   ├── useAccount()       # Hook for selected account
│   └── Role-based filters
├── analytics.ts           # Deep-link builder
│   ├── buildCampaignDeepLink()  # URL with context
│   ├── getAnalyticsPath()
│   └── formatDateRange()
├── utils.ts               # Formatting utilities
│   ├── formatCurrency()
│   ├── formatNumber()
│   ├── formatPercentage()
│   ├── formatDate()
│   └── safeDiv()          # Division with fallback
└── constants.ts           # App-wide constants
```

### State Management
- **Account Context** (`lib/accountContext.tsx`): Multi-account hierarchy
- **URL Query Params**: Date ranges, platform filters, campaign selection
- **Component Local State**: `useState` for UI toggles (date range, sort, pagination)
- **Mock Fallbacks**: When API fails, client automatically falls back to mock data

### Key Features in Frontend
1. **Monitor→Diagnose→Act UX**: Alerts → Analytics → Recommendations flow
2. **Multi-Account Hierarchy**: Master agency account + client sub-accounts
3. **Dynamic Metrics**: Cards add/remove based on selection
4. **Rolling Date Windows**: 7D/30D/90D selectors on trend charts
5. **Deep-Linking**: Analytics URLs include account_id, campaign, date_from, date_to
6. **No-Data States**: Gray health dots when metrics are zero
7. **Responsive Tables**: 8+ columns with horizontal scroll on mobile

---

## 🔧 Backend Structure (`/backend`)

### API Routes
```
backend/app/routes/
├── auth.py                # Authentication & user management
│   ├── @router.post("/login")
│   ├── @router.post("/signup")
│   ├── @router.get("/me")
│   └── get_current_user()  # JWT validation
├── alerts.py              # HEALTH ALERTS (🎯 KEY ENDPOINT)
│   ├── @router.get("/alerts?account_id=X")
│   ├── detect_alerts()    # Anomaly detection engine
│   ├── Rule 1: ROAS drop > 40% (error)
│   ├── Rule 2: Meta frequency > 5.0 (warning)
│   ├── Rule 3: Budget utilization 95%+ (success)
│   └── Rule 4: Campaign paused (error)
├── analytics.py           # Campaign & platform metrics
│   ├── @router.get("/analytics/campaigns")
│   ├── @router.get("/analytics/ad-groups")
│   ├── @router.get("/analytics/daily-metrics")
│   └── ... (30+ endpoints for all platforms)
├── accounts.py            # Account management
│   ├── @router.get("/accounts")
│   ├── @router.get("/accounts/{id}")
│   └── @router.post("/accounts")
├── dashboard.py           # Portfolio aggregation
│   └── @router.get("/dashboard/summary")
├── chat.py                # AI chatbot
│   └── @router.post("/chat/message")
├── upload.py              # CSV/Excel upload
│   └── @router.post("/upload/campaigns")
├── funnel_stages.py       # Funnel stage lookup
│   └── @router.get("/clients")
└── __init__.py
```

### Core Application
```
backend/app/
├── main.py                # FastAPI app setup
│   ├── FastAPI() instance
│   ├── CORS middleware
│   ├── Router registration
│   ├── Lifespan context manager
│   └── Health check endpoint
├── config.py              # Environment config
│   ├── Settings class (Pydantic)
│   ├── DB_PATH (DuckDB)
│   ├── SECRET_KEY (JWT)
│   ├── CORS_ORIGINS
│   └── LOG_DIR
├── database/
│   ├── connection.py      # DuckDB connection pool
│   │   ├── init_db()      # Create schema
│   │   ├── get_connection()
│   │   └── close()
│   ├── schema.sql         # Table definitions
│   │   ├── accounts
│   │   ├── users
│   │   ├── campaigns      # ⭐ Has previous_roas for Rule 1
│   │   ├── ad_groups
│   │   ├── keywords
│   │   ├── placements
│   │   ├── creatives
│   │   └── user_accounts (role-based access)
│   └── seed.py            # Sample data generator
│       ├── seed_database()
│       ├── Standard accounts (kotak-mf)
│       └── Test campaigns for alert rules (ethinos)
├── models/
│   ├── alerts.py          # Alert & AlertsResponse Pydantic models
│   ├── campaign.py        # Campaign model
│   ├── user.py            # User model
│   └── ... (other models)
└── Procfile               # Railway deployment config
    └── web: python -m uvicorn app.main:app --port $PORT
```

### Database Schema (DuckDB/SQLite)
```sql
accounts {
  id (PK)
  name
  account_type (master/client)
  parent_account_id (FK)
  created_at
}

campaigns {
  id (PK)
  account_id (FK)
  name
  platform (google/dv360/meta)
  status (active/paused/ended)
  budget
  spent
  impressions
  clicks
  conversions
  revenue
  roas
  previous_roas ⭐ (for Rule 1 detection)
  frequency ⭐ (for Rule 2)
  created_at
}

users {
  id (PK)
  email
  password_hash
  role (admin/leader/manager/executive)
  created_at
}

user_accounts {
  user_id (FK)
  account_id (FK)
  role
}
```

### Alert Rules Engine
```python
detect_alerts(account_id, conn) -> List[Alert]:
    # Rule 1: ROAS drop > 40%
    if campaign.roas < campaign.previous_roas * 0.6:
        severity = 'error'
    
    # Rule 2: Meta frequency > 5.0
    if platform == 'meta' and frequency > 5.0:
        severity = 'warning'
    
    # Rule 3: Budget utilization 95%+
    if (spent / budget) >= 0.95:
        severity = 'success'
    
    # Rule 4: Campaign paused
    if status == 'paused':
        severity = 'error'
```

---

## 🔄 Data Flow Architecture

### Frontend → Backend Flow
```
User Action (click Analyze button)
    ↓
Frontend builds deep-link with context
    ├── buildCampaignDeepLink(platform, campaign, account_id, date_from, date_to)
    └── URL: /dashboard/analytics/google-ads?campaign=X&account_id=Y&date_from=Z&date_to=W
    ↓
Component fetches data with account filter
    ├── fetchCampaigns(account_id)
    ├── fetchDailyMetrics(account_id, date_from, date_to)
    └── Uses fetchWithFallback() pattern
    ↓
Backend responds with filtered data
    └── GET /api/analytics/campaigns?account_id=ethinos
    ↓
Frontend renders with selected date range
    ├── Filter metrics: filteredDailyMetrics.filter(m => m.date >= dateFrom && m.date <= dateTo)
    ├── Update trend chart
    └── Display 8-column breakdown table
```

### Alert Detection Flow
```
User logs in → Selects account (ethinos)
    ↓
Dashboard mounts → Calls GET /api/alerts?account_id=ethinos
    ↓
Backend: detect_alerts(account_id="ethinos")
    ├── Fetch campaigns WHERE account_id = 'ethinos'
    ├── Check Rule 1: YouTube Branding (ROAS 1.1 vs 2.0) → Error
    ├── Check Rule 2: Meta Awareness (frequency 5.8 > 5.0) → Warning
    ├── Check Rule 3: DV360 Prospecting (95% budget utilization) → Success
    ├── Check Rule 4: Search Retargeting (status='paused') → Error
    └── Return sorted: [error1, error2, warning, success]
    ↓
Frontend renders AlertStrip with 4 colored dots
    ├── Red dot for ROAS drop error
    ├── Red dot for paused campaign error
    ├── Yellow dot for Meta frequency warning
    └── Green dot for budget utilization success
    ↓
User clicks [View] on ROAS alert
    └── Navigates to /dashboard/analytics/google-ads?campaign=YouTube%20Branding&account_id=ethinos&date_from=2026-04-10&date_to=2026-04-12
```

### Mock Fallback Pattern
```
fetchWithFallback(url, fallbackFn):
    try:
        response = await fetch(url)
        return response.json()
    catch (error):
        console.log('API failed, using mock data')
        return fallbackFn()  // e.g., getMockCampaigns()

// Example
fetchCampaigns = (account_id) => 
    fetchWithFallback(
        '/api/analytics/campaigns?account_id=' + account_id,
        () => ({ campaigns: getMockCampaigns() })  // ⭐ Must wrap in object
    ).then(res => res.campaigns || [])
```

---

## 🎯 Critical Features by Task

### Task 1: Mock Data Extraction Fix
**Problem:** Fallback functions returned raw arrays → `.then((res) => res.campaigns)` failed
**Location:** `frontend/lib/api.ts` (13 functions)
**Fix:** Wrap fallbacks to return `{ campaigns: getMockCampaigns() }` instead of raw array

### Task 2: NaN/Display Guards
**Problem:** Division by zero created NaN/Infinity values
**Locations:** 
- `frontend/app/dashboard/page.tsx` (reach display, ROAS subtitle)
- `frontend/lib/analytics.ts` (safe division helper)
**Fix:** Add checks before division, use fallback text "—" when undefined

### Task 3: Trend Chart Date Range
**Problem:** Mock data was March 8 – April 6, but filter was April 2026
**Location:** `frontend/lib/mockData.ts` generateDailyMetrics()
**Fix:** Generate dynamic 30-day rolling window from current date

### Task 4: Alert Rule Seed Data
**Problem:** No campaigns triggered alert rules
**Location:** `backend/app/database/seed.py`
**Fix:** Add test campaigns under ethinos account:
- YouTube Branding (ROAS drop)
- Meta Awareness (frequency 5.8)
- DV360 Prospecting (95% utilization)
- Search Retargeting (paused status)

### Task 5: Deep-Link Context Enrichment
**Problem:** Navigation links lost account/date context
**Locations:** `frontend/lib/analytics.ts`, `components/monitor/AlertStrip.tsx`
**Fix:** Pass optional account_id, date_from, date_to to buildCampaignDeepLink()

### Task 6: Analyze Buttons on Platform Cards
**Problem:** No way to navigate from portfolio to analytics
**Location:** `frontend/app/dashboard/page.tsx` FunnelSection
**Fix:** Add "Analyze →" link on each platform sub-card with proper context

### Task 7: No-Data Health Dot State
**Problem:** Health dots showed green for zero metrics (misleading)
**Location:** `frontend/components/metrics/HealthDot.tsx`
**Fix:** Add "no-data" state showing gray dot when current=0 && previous=0

### Task 8: 8-Column Analytics Table
**Problem:** Table showed only 3 metrics (Spend, Conversions, ROAS)
**Location:** `frontend/app/dashboard/analytics/[platform]/client.tsx`
**Fix:** Expand to: Impressions, Clicks, CTR, CPC, CVR, Conversions, Spend, ROAS

### Task 9: 7/30/90-Day Trend Selector
**Problem:** Month dropdown was static calendar-based
**Location:** `frontend/app/dashboard/page.tsx`
**Fix:** Replace with pill buttons for 7/30/90-day rolling windows

---

## 🌐 API Contract

### GET /api/alerts
```
Query Params:
  - account_id (required): string
  - date_from (optional): YYYY-MM-DD
  - date_to (optional): YYYY-MM-DD
  - Authorization (header): Bearer {token}

Response:
{
  "alerts": [
    {
      "id": "alert_roas_camp-001",
      "severity": "error",
      "message": "ROAS dropped 45% on google (YouTube Branding Ethinos)",
      "campaign": "YouTube Branding Ethinos",
      "platform": "google"
    },
    ...
  ]
}
```

### GET /api/analytics/campaigns
```
Query Params:
  - account_id (required): string
  - date_from (optional): YYYY-MM-DD
  - date_to (optional): YYYY-MM-DD

Response:
{
  "campaigns": [
    {
      "id": "camp-ga-001",
      "account_id": "ethinos",
      "name": "YouTube Branding Ethinos",
      "platform": "google",
      "status": "active",
      "budget": 28000,
      "spent": 27100,
      "impressions": 140000,
      "clicks": 5225,
      "conversions": 187,
      "revenue": 34550,
      "roas": 1.1,
      "previous_roas": 2.0,
      "frequency": null
    },
    ...
  ]
}
```

---

## 🚀 Deployment Status

| Layer | Status | Location |
|-------|--------|----------|
| Frontend | ✅ LIVE | https://main.ethinos-cdp.pages.dev |
| Backend Code | ✅ Committed | GitHub repo (37d783b+) |
| Backend Container | ⏳ Pending | Railway (needs manual redeploy) |

---

## 📊 Statistics
- **Frontend Routes:** 51+ pages (prerendered)
- **Backend Endpoints:** 40+ endpoints
- **Database Tables:** 8 tables
- **Mock Data Functions:** 13+ generators
- **Component Files:** 30+
- **Lines of Code:** ~15,000 (frontend) + ~10,000 (backend)

---

## 🔗 Key Files Reference
- **Main Dashboard:** `/frontend/app/dashboard/page.tsx`
- **API Client:** `/frontend/lib/api.ts`
- **Alert Engine:** `/backend/app/routes/alerts.py`
- **Mock Data:** `/frontend/lib/mockData.ts`
- **Database Schema:** `/backend/app/database/schema.sql`
- **Seed Data:** `/backend/app/database/seed.py`
- **Account Context:** `/frontend/lib/accountContext.tsx`
- **Deep-Links:** `/frontend/lib/analytics.ts`

---

## 🎨 Architecture Diagram (Text)

```
┌─────────────────────────────────────────────────────────────┐
│                      USER BROWSER                           │
│                                                              │
│  ┌──────────────────────────────────────────────────────┐   │
│  │  Frontend (Next.js 14 on Cloudflare Pages)         │   │
│  │                                                      │   │
│  │  ┌─────────────────────────────────────────────┐   │   │
│  │  │ Dashboard (Monitor)                          │   │   │
│  │  │ • Portfolio Overview (TOFU/MOFU/BOFU)       │   │   │
│  │  │ • Health Dots (4 alert types)               │   │   │
│  │  │ • Trend Chart (7D/30D/90D)                  │   │   │
│  │  └─────────────────────────────────────────────┘   │   │
│  │                      │                              │   │
│  │                      ├─→ Diagnose                   │   │
│  │                      │   ├─ Click [View] Alert    │   │
│  │                      │   └─ Navigate to Analytics  │   │
│  │                      │                              │   │
│  │                      └─→ Act                        │   │
│  │                          ├─ Click [Analyze →]      │   │
│  │                          └─ View 8-column table     │   │
│  │                                                      │   │
│  │  ┌─────────────────────────────────────────────┐   │   │
│  │  │ Analytics Pages                             │   │   │
│  │  │ • Google Ads / DV360 / Meta breakdowns     │   │   │
│  │  │ • 8 columns: Impr, Clicks, CTR, CPC, CVR  │   │   │
│  │  │ • Responsive tables with horizontal scroll │   │   │
│  │  └─────────────────────────────────────────────┘   │   │
│  └──────────────────────────────────────────────────────┘   │
│                          │                                   │
│         API Client (fetchWithFallback)                      │
│         Mock Fallback Layer                                 │
└─────────────────────────────────────────────────────────────┘
                          │
                    HTTP/REST API
                          │
┌─────────────────────────────────────────────────────────────┐
│                   BACKEND (Railway)                          │
│                                                              │
│  ┌──────────────────────────────────────────────────────┐   │
│  │  FastAPI Application                               │   │
│  │                                                      │   │
│  │  ┌─────────────────────────────────────────────┐   │   │
│  │  │ Alerts Router          [KEY]                │   │   │
│  │  │ GET /api/alerts?account_id=X               │   │   │
│  │  │   ├─ detect_alerts()                        │   │   │
│  │  │   ├─ Rule 1: ROAS drop 40%                 │   │   │
│  │  │   ├─ Rule 2: Meta frequency > 5.0          │   │   │
│  │  │   ├─ Rule 3: Budget 95%+                   │   │   │
│  │  │   └─ Rule 4: Campaign paused               │   │   │
│  │  └─────────────────────────────────────────────┘   │   │
│  │                                                      │   │
│  │  ┌─────────────────────────────────────────────┐   │   │
│  │  │ Analytics Router                            │   │   │
│  │  │ GET /api/analytics/campaigns               │   │   │
│  │  │ GET /api/analytics/daily-metrics           │   │   │
│  │  │ ... (30+ endpoints)                        │   │   │
│  │  └─────────────────────────────────────────────┘   │   │
│  │                                                      │   │
│  │  ┌─────────────────────────────────────────────┐   │   │
│  │  │ Auth Router                                 │   │   │
│  │  │ POST /auth/login                           │   │   │
│  │  │ POST /auth/signup                          │   │   │
│  │  └─────────────────────────────────────────────┘   │   │
│  └──────────────────────────────────────────────────────┘   │
│                          │                                   │
│               DuckDB/SQLite Database                         │
│                                                              │
│  ┌──────────────────────────────────────────────────────┐   │
│  │ Tables:                                              │   │
│  │ • accounts (master agency + clients)               │   │
│  │ • users (with role-based access)                   │   │
│  │ • campaigns (with previous_roas for Rule 1)        │   │
│  │ • ad_groups, keywords, placements, creatives       │   │
│  │ • user_accounts (role mapping)                     │   │
│  └──────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────┘
```

---

Generated: 2026-04-12 | Graphify Integration Complete
