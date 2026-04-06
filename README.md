# CDP Marketing Platform

Marketing agency CDP — automate daily executive reporting across multiple ad platforms (Google Ads, DV360, Meta).

## Quick Start

**Project folder:** `/Users/yash/CDP/`

**Files:**
- `CLAUDE.md` — Building context, stack, commands
- `plan.md` — Implementation phases (compact)
- `DESIGN_SYSTEM.md` — All 9 screen specs, components, colors, interactions

## Phase 0: UI Prototype (Start Here)

Build an interactive Next.js mockup with all 9 screens working with mock data:

1. **Portfolio Dashboard** — KPI overview, client cards, top campaigns
2. **Client Dashboard** — Platform tabs, KPI cards, trend lines, heatmaps
3. **Campaign Drill-Down** — Sortable table, inline ad groups, bulk compare
4. **Custom Reporting** — Dimension picker, metric selector, dynamic charts
5. **AI Chat** — Conversational chatbot interface with streaming responses
6. **Presentations** — Template gallery, generation flow, preview, download
7. **CSV Upload** — Drag-drop, platform detection, job status tracking
8. **Settings** — Users, templates, system config
9. **Role Switcher** — Dev tool to toggle Leader/Manager/Executive views

**Design System:**
- Dark Mode (OLED) — #0F172A background, slate colors
- Fira Code (headings) + Fira Sans (body)
- Blue primary (#1E40AF) + Amber CTA (#F59E0B)
- 10 chart types (line, bar, stacked, pie, heatmap, scatter, funnel, geo, sparkline, gauge)

**Deliverable:** Deployed to Cloudflare Pages, fully interactive prototype with no backend.

## Architecture

```
Frontend (Cloudflare Pages)  ←→  FastAPI (Railway)
   Next.js 14                    Python + LangGraph
   shadcn/ui                     7 Agents (CSV → PDFs)
   Tailwind + ECharts            PostgreSQL + Redis
   Mock Data (Phase 0)           LangChain + Claude AI
```

## 7 Agents (Phases 1+)

1. **DataIngestionAgent** — CSV → PostgreSQL (normalized)
2. **ClientAnalysisAgent** — KPI computation, trends
3. **OrchestratorAgent** — Master coordinator
4. **VisualizationAgent** — Chart configs
5. **CDPGodAgent** — Omniscient knowledge base
6. **ChatbotAgent** — Conversational AI
7. **PresentationAgent** — Auto-generated .pptx decks

## Next Steps

1. Create Next.js project: `npx create-next-app@latest cdp-platform`
2. Install dependencies: `shadcn/ui`, `echarts`, `recharts`, `lucide-react`, `fira` fonts
3. Set up folder structure: `app/`, `components/`, `lib/`
4. Build mock data: `lib/mockData.ts`
5. Implement all 9 screens (reference `DESIGN_SYSTEM.md`)
6. Deploy to Cloudflare Pages: `npm run deploy`
7. Share prototype URL for feedback
8. Once approved, move to Phase 1 (backend on Railway)

---

**Design System:** See `DESIGN_SYSTEM.md` for complete component specs, colors, typography, spacing, interactions, accessibility.

**Implementation Plan:** See `plan.md` for Phase 0-7 breakdown and verification steps.

**Building Context:** See `CLAUDE.md` for tech stack, commands, folder structure, handoff notes.
