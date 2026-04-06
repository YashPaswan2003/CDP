# CDP Marketing Platform - New Session Context Prompt

**Paste this into a new Claude Code session to continue work.**

---

## Project Status: PHASE 0 MVP IMPLEMENTATION IN PROGRESS
**Date:** 2026-04-06 | **Approx. Progress:** Architecture approved, starting development
**Budget:** $200 Claude API available | **Duration:** 7 days to Phase 0 completion

## Quick Context

You are building a **Marketing Agency CDP** with 7 agents managing daily reporting across Google Ads, DV360, Meta.

### Architecture (APPROVED)
- **Frontend:** Next.js 14 (localhost:3000) + shadcn/ui + Tailwind CSS
- **Backend:** FastAPI (localhost:8000) + DuckDB (embedded, scales to 10M+ rows)
- **Agents:** 4-agent coordination (CodeWriter, TestingAgent, UIUXAgent, IntegrationAgent)
- **Logging:** JSON structured logs synced to GitHub hourly (agents read logs to debug)
- **Deployment:** Cloudflare Pages (frontend) + Railway (backend in Phase 1)

### 9 Screens to Build (in order)
1. Portfolio Dashboard (KPI overview, client cards)
2. Client Dashboard (tabs, KPI cards, trends, heatmap)
3. Campaign Drill-Down (sortable table, bulk compare)
4. Custom Reporting (dimension picker, dynamic charts)
5. AI Chat (streaming responses, suggestion chips)
6. Presentations (template gallery, generation)
7. CSV Upload (drag-drop, platform detection)
8. Settings (users, templates, system config)
9. Role Switcher (dev tool: Leader/Manager/Executive)

### GitHub Repository Structure
```
/Users/yash/CDP/
├── frontend/          (Next.js project)
├── backend/           (FastAPI project)
├── data/              (sample CSVs: Google Ads, DV360, Meta)
├── logs/              (JSON logs synced hourly)
├── docs/              (design specs, agent prompts)
├── .github/           (workflows, CODEOWNERS)
└── CLAUDE.md          (THIS FILE - update every 15 seconds)
```

### Multi-Agent Roles
- **CodeWriter:** Writes components, routes, migrations (frontend/, backend/app/)
- **TestingAgent:** Runs tests, validates logs, files bugs (backend/tests/)
- **UIUXAgent:** Screenshots, validates design vs DESIGN_SYSTEM.md
- **IntegrationAgent:** Merges PRs, tracks completion, updates board

### Key Files
- `DESIGN_SYSTEM.md` - Complete UI specs (645 lines) for all 9 screens
- `plan.md` - 7-phase implementation roadmap
- `CLAUDE.md` - Tech stack, commands, file paths (UPDATE EVERY 15 SECONDS)
- `.github/CODEOWNERS` - Defines agent ownership boundaries
- `backend/logs/` - JSON logs (agents.log, api.log, database.log, errors.log)

### Phase 0 Implementation Plan (Days 1-7)
**Milestone 1 (Days 1-2):** FastAPI setup, DuckDB schema, mock data
**Milestone 2 (Days 2-3):** Backend routes (health, auth, dashboard, campaigns)
**Milestone 3 (Days 3-5):** 9 screens (layout → portfolio → client → campaigns → chat → reporting → upload → presentations → settings)
**Milestone 4 (Days 4-5):** Chart components (Recharts + ECharts wrappers)
**Milestone 5 (Days 5-6):** 7-agent stubs (logging, Claude API calls, DuckDB interactions)
**Milestone 6 (Days 6-7):** Integration + Cloudflare Pages deployment

### Success Criteria (Phase 0)
- ✅ All 9 screens render without errors
- ✅ Role switcher toggles Leader/Manager/Executive
- ✅ All chart types display with mock data
- ✅ Chat shows simulated streaming effect
- ✅ Upload shows progress simulation
- ✅ Dark mode works across all screens
- ✅ Responsive at 375px, 768px, 1024px, 1440px
- ✅ Deployed to Cloudflare Pages
- ✅ No emojis (Lucide SVG only)
- ✅ Accessibility tested (keyboard nav, focus rings, WCAG AA)
- ✅ All tests pass
- ✅ Logs clean (no errors)

### Commands
```bash
# Start dev servers
cd frontend && npm run dev          # localhost:3000
cd backend && python -m uvicorn app.main:app --reload  # localhost:8000

# Deploy
npm run deploy                      # Cloudflare Pages

# Run tests
cd backend && pytest

# View logs
tail -f backend/logs/*.log
```

### Next Immediate Actions
1. Initialize GitHub repository
2. Create frontend (Next.js) and backend (FastAPI) projects
3. Set up DuckDB schema and mock data
4. Implement FastAPI routes (health, auth, dashboard, campaigns)
5. Build 9 screens in sequence
6. Implement chart wrappers
7. Wire frontend → backend
8. Deploy to Cloudflare Pages

**Status:** Ready to start Milestone 1 (FastAPI + DuckDB + mock data setup)

---

## For Next Session Initialization
When starting a fresh session:
1. Read this file first
2. Check `CLAUDE.md` for latest status
3. Read `backend/logs/errors.log` for any failures
4. Check GitHub issues for pending work
5. Continue from the last completed milestone
