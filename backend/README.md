# Backend - CDP Marketing Platform

FastAPI + DuckDB application for data management and agent coordination.

## Quick Start

```bash
cd backend
python -m venv venv
source venv/bin/activate
pip install -r requirements.txt
python -m uvicorn app.main:app --reload
```

Server runs at `http://localhost:8000`  
Docs at `http://localhost:8000/docs` (Swagger UI)

## Structure

```
app/
├── main.py              # FastAPI app setup, CORS, logging
├── config.py            # Environment, database, logging config
├── routes/
│   ├── health.py        # GET /health
│   ├── auth.py          # POST /login, /register, /logout
│   ├── clients.py       # GET /clients, POST /clients
│   ├── campaigns.py     # GET /campaigns, POST /campaigns
│   ├── dashboard.py     # GET /dashboard/{client_id}
│   ├── upload.py        # POST /upload (CSV parsing)
│   └── chat.py          # POST /chat (Claude API calls)
├── models/
│   ├── client.py        # Pydantic models for clients
│   ├── campaign.py      # Campaign data structures
│   └── schemas.py       # Request/response schemas
├── database/
│   ├── connection.py    # DuckDB connection pool
│   ├── schema.py        # CREATE TABLE statements
│   └── seed.py          # Sample data loader
└── services/
    ├── duckdb_service.py   # DuckDB CRUD operations
    └── claude_service.py   # Claude API integration
tests/
├── test_health.py       # /health endpoint tests
├── test_auth.py         # Auth route tests
├── test_campaigns.py    # Campaign CRUD tests
└── test_database.py     # Database schema tests
logs/
├── agents.log           # Agent actions (synced hourly)
├── api.log              # Route execution
├── database.log         # DuckDB operations
└── errors.log           # All failures
```

## DuckDB Schema (Phase 0)

Tables for multi-client, multi-platform data:

```sql
-- Clients
CREATE TABLE clients (
  id UUID PRIMARY KEY,
  name VARCHAR,
  industry VARCHAR,
  created_at TIMESTAMP
);

-- Campaigns
CREATE TABLE campaigns (
  id UUID PRIMARY KEY,
  client_id UUID,
  platform VARCHAR,  -- 'google_ads', 'dv360', 'meta'
  name VARCHAR,
  budget DECIMAL,
  created_at TIMESTAMP
);

-- Daily Metrics
CREATE TABLE metrics (
  id UUID PRIMARY KEY,
  campaign_id UUID,
  date DATE,
  impressions BIGINT,
  clicks BIGINT,
  spend DECIMAL,
  conversions INT,
  revenue DECIMAL,
  created_at TIMESTAMP
);
```

## Logging (JSON Format)

Every action produces a log entry:

```json
{
  "timestamp": "2026-04-06T15:30:45.123Z",
  "level": "INFO",
  "source": "api",
  "action": "get_campaigns",
  "client_id": "uuid-here",
  "duration_ms": 45,
  "status": "success"
}
```

## Commands

```bash
python -m uvicorn app.main:app --reload     # Dev server with auto-reload
pytest                                       # Run all tests
pytest -v backend/tests/                    # Verbose test output
pytest --cov=app backend/tests/             # Coverage report
python -c "from app.database.seed import seed; seed()"  # Load sample data
```

## Phase 1+ Changes

Local DuckDB → PostgreSQL (zero code changes, swap connection string)
Claude API → Claude CLI on Mac Mini (zero code changes, swap import)
Sample data → Real data from CSV uploads + API integrations
