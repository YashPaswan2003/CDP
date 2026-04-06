# GitHub Workflows & CI/CD

## Log Synchronization (sync-logs.yml)

**Schedule:** Every hour (0 minute of each hour)  
**Purpose:** Sync `backend/logs/` to GitHub so agents can read logs for debugging  
**Triggered by:** Cron schedule or manual dispatch

This workflow ensures agents have visibility into failures across the team:
- TestingAgent reads errors.log to understand test failures
- CodeWriter reads api.log to debug route issues
- UIUXAgent reads agents.log to track component deployments
- IntegrationAgent uses all logs to coordinate merges

## CODEOWNERS

Agent responsibilities defined in `.github/CODEOWNERS`:

```
CodeWriter    → frontend/app/, backend/app/
TestingAgent  → backend/tests/, *.test.tsx
UIUXAgent     → frontend/components/charts/, DESIGN_SYSTEM.md
IntegrationAgent → .github/, CLAUDE.md
```

GitHub auto-requests reviews from appropriate agents when files change.

## Running Workflows

### Manual Trigger (Log Sync)
```bash
gh workflow run sync-logs.yml
```

### View Workflow Runs
```bash
gh run list
gh run view <RUN_ID>
```

### View Workflow Logs
```bash
gh run view <RUN_ID> --log
```
