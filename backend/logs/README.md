# Logging Infrastructure

Structured JSON logs for multi-agent debugging and visibility. Synced to GitHub every hour.

## Log Files

- **agents.log** — Agent actions: CodeWriter deployments, TestingAgent validations, UIUXAgent screenshots, IntegrationAgent merges
- **api.log** — FastAPI route execution: request timestamps, response times, status codes
- **database.log** — DuckDB operations: schema creation, data inserts, query performance
- **errors.log** — All failures: exceptions, validation errors, failed deployments

## Log Format (JSON Lines)

Each line is a complete JSON object:

```json
{
  "timestamp": "2026-04-06T15:30:45.123Z",
  "level": "INFO",
  "source": "CodeWriter",
  "action": "create_component",
  "component": "DashboardCard",
  "file": "frontend/components/dashboard/DashboardCard.tsx",
  "duration_ms": 245,
  "status": "success"
}
```

### Fields
- **timestamp** — ISO 8601 UTC
- **level** — INFO, WARNING, ERROR, DEBUG
- **source** — Agent name or service (CodeWriter, TestingAgent, api, database, etc.)
- **action** — What happened (create_component, run_test, deploy, etc.)
- **duration_ms** — How long the action took
- **status** — success, failure, pending

## How Agents Use Logs

1. **CodeWriter** reads errors.log to understand test failures
2. **TestingAgent** writes to api.log and database.log during test runs
3. **UIUXAgent** reads agents.log to track component changes
4. **IntegrationAgent** merges PRs and records action in agents.log

## GitHub Sync

Logs are synced every hour via `.github/workflows/sync-logs.yml`. Agents read from the remote GitHub logs to coordinate work.

## To View Logs Locally

```bash
# All logs combined (latest entries)
tail -f backend/logs/*.log

# Watch errors only
tail -f backend/logs/errors.log

# Parse JSON logs
jq . backend/logs/api.log
```
