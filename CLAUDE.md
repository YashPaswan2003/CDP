# CDP Marketing Platform - Claude Configuration

## Project Overview
Marketing agency CDP replacing manual daily reporting. Multi-client, multi-platform (Google Ads, DV360, Meta). 7-agent LangGraph backend. Role-based dashboards (leader/manager/executive). AI chatbot, custom reporting, auto-generated presentations.

**Stack:** Next.js 14 (Cloudflare Pages) + FastAPI (Railway) + PostgreSQL + Redis + Claude AI

## Building with Claude Code
- **Phase 0 (UI Prototype):** Build interactive mockup first (all screens, all chart types, simulated flows)
- **Phase 1-7:** Backend + agents on Railway, frontend wired to real APIs
- **Infrastructure:** Cloudflare (free tier: Pages, R2, KV, Workers) + Railway Pro ($7/month)

## Key Commands
```bash
# Start dev server (Phase 0)
cd frontend && npm run dev

# Deploy to Cloudflare Pages
npm run deploy

# Run Python backend (Phase 1+)
cd backend && python -m uvicorn app.main:app --reload
```

## File Structure (Phase 0)
```
frontend/
  ├── app/
  │   ├── (auth)
  │   ├── (dashboard)
  │   │   ├── page.tsx                 (portfolio overview)
  │   │   ├── clients/[id]/page.tsx    (client dashboard)
  │   │   ├── chat/page.tsx
  │   │   ├── presentations/page.tsx
  │   │   ├── upload/page.tsx
  │   │   └── ...
  │   └── globals.css
  ├── components/
  │   ├── charts/                      (ECharts/Recharts wrappers)
  │   ├── dashboard/
  │   ├── layout/
  │   └── ...
  ├── lib/
  │   ├── mockData.ts                  (mock data for all screens)
  │   └── utils.ts
  └── next.config.ts
```

## Design System
- **Style:** Dark Mode (OLED) — high contrast, eye-friendly
- **Typography:** Fira Code (headings) + Fira Sans (body)
- **Colors:** Blue (#1E40AF primary, #3B82F6 secondary) + Amber CTA (#F59E0B)
- **UI Framework:** shadcn/ui + Tailwind CSS
- **Charts:** Apache ECharts (complex) + Recharts (simple)

## Mock Data Structure
2 sample clients (e-commerce + real estate) with:
- Campaign data across 3 platforms
- Daily metrics (impressions, clicks, spend, conversions, revenue)
- KPI cards, trend lines, heatmaps, geo data
- Simulated chat responses + presentation generation

## 🚀 Development Status (Real-Time Updates)
**Status:** Phase 0 Implementation Plan Complete - Ready for Execution  
**Date:** 2026-04-06 15:15 UTC+5:30  
**Current Milestone:** Plan written (Chunks 1-5 detailed)  
**Agents Active:** CodeWriter, TestingAgent, UIUXAgent, IntegrationAgent  
**Plan Location:** `/Users/yash/CDP/docs/superpowers/plans/2026-04-06-cdp-phase0-implementation.md`  

### Architecture Approvals ✅
- ✅ Section 1: Tech Stack (Next.js + FastAPI + DuckDB + Claude API)
- ✅ Section 2: Debugging (JSON logging, GitHub sync, agent log visibility)
- ✅ Section 2.5: Multi-Agent Coordination (CodeWriter, TestingAgent, UIUXAgent, IntegrationAgent)
- ✅ Section 3: File Structure (frontend/, backend/, data/, logs/, docs/)
- ✅ Section 4: 7-Agent Coordination (DataIngestion, ClientAnalysis, Orchestrator, Visualization, CDPGod, Chatbot, Presentation)
- ✅ Section 5: GitHub Setup (CODEOWNERS, workflows, hourly log sync)
- ✅ Section 6: Implementation Plan (6 milestones, Days 1-7, parallel work)

### Milestone Progress
```
Milestone 1: FastAPI setup + DuckDB schema + mock data ⏳ IN PROGRESS
Milestone 2: Backend API routes (health, auth, clients, campaigns)
Milestone 3: 9 screens (portfolio → client → campaigns → chat → reporting → upload → presentations → settings)
Milestone 4: Chart components (Recharts + ECharts wrappers)
Milestone 5: 7-agent stubs (Claude API calls, DuckDB interactions, logging)
Milestone 6: Integration + Cloudflare Pages deployment
```

### Key Notes
- **Phase 0 is throwaway-free** — this prototype becomes the real frontend
- **Multi-agent workflow:** CodeWriter writes code → TestingAgent validates tests in parallel → UIUXAgent screenshots → IntegrationAgent merges
- **Logging critical:** Every action produces JSON log (timestamp, level, source, action, duration_ms, status)
- **GitHub visibility:** Logs synced hourly, agents read logs to understand failures
- **Mock data:** 2 clients (TechStore E-commerce, RealEstate Luxury), 3 platforms (Google Ads, DV360, Meta), ~15K rows per platform
- **Budget:** $200 Claude API available (estimated $5-15 for MVP)

## Handoff Notes
- Mock API calls (`lib/mockData.ts`) → real API calls (`backend/api/*`) in Phase 1
- Local DuckDB (MVP) → PostgreSQL (production) with zero code changes
- Claude API (Phase 0) → Claude CLI on Mac Mini (Phase 1+) with zero code changes
- Token count: Keep plan file lean. Use this CLAUDE.md for detailed context.

## Quick Links
- Plan: [plan.md](plan.md)
- Design System: [DESIGN_SYSTEM.md](DESIGN_SYSTEM.md) (645 lines, all specs)
- New Session Prompt: [NEW_SESSION_PROMPT.md](NEW_SESSION_PROMPT.md)
- UI/UX System: Dark Mode OLED + Fira fonts (see Design System above)
- Repo: `/Users/yash/CDP`
- Railway Dashboard: [dashboard.railway.app](https://dashboard.railway.app)
- Cloudflare Pages: Deploy via wrangler
