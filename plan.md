# CDP Implementation Plan (Compact)

## 1. Infrastructure
- **Frontend:** Next.js 14 → Cloudflare Pages (free global CDN)
- **Backend:** FastAPI → Railway Pro ($7/month)
- **Database:** PostgreSQL + Redis (Railway)
- **Storage:** Cloudflare R2 (10GB free, zero egress)
- **Cache:** Cloudflare KV (sessions)

## 2. 7-Agent LangGraph Pipeline
1. **DataIngestionAgent** — CSV → normalized DB rows
2. **ClientAnalysisAgent** — KPI computation, trends
3. **OrchestratorAgent** — coordinator, master sheet
4. **VisualizationAgent** — ECharts/Recharts configs
5. **CDPGodAgent** — omniscient knowledge base (vector DB)
6. **ChatbotAgent** — conversational interface
7. **PresentationAgent** — auto-generated .pptx decks

## 3. Phase 0 (MVP) — UI Prototype First
Build working Next.js mockup covering all 9 screens:
- Portfolio dashboard (KPI strip, client cards, top campaigns)
- Client dashboard (platform tabs, KPI cards, trends, heatmap)
- Campaign drill-down (sortable table with bulk compare)
- Reporting (dimension picker, metric selector, export)
- Chat (streaming responses, suggestion chips)
- Presentations (template gallery, generation, preview)
- Upload (drag-drop CSV, job status)
- Settings (users, templates, config)
- Role switcher (leader/manager/executive instant toggle)

**Chart types:** line, bar, stacked bar, pie, heatmap, scatter, funnel, geo map, sparklines, gauge

**Deliverable:** Deployed to Cloudflare Pages, all screens interactive with mock data.

## 4. Phase 1-7 Implementation
- Phase 1: Foundation (auth, database, connections)
- Phase 2: Data ingestion (CSV parsers, Celery queue)
- Phase 3: Dashboard wired to real API
- Phase 4: CDPGodAgent + full agent pipeline
- Phase 5: Real chatbot (SSE streaming)
- Phase 6: Custom reporting
- Phase 7: Presentation generator

## 5. Design System
| Aspect | Choice |
|--------|--------|
| Style | Dark Mode (OLED) — high contrast, eye-friendly |
| Fonts | Fira Code (headings) + Fira Sans (body) |
| Colors | Blue primary (#1E40AF) + Amber CTA (#F59E0B) |
| UI Lib | shadcn/ui + Tailwind CSS |
| No AI slop | Hand-crafted layouts, real data, professional polish |

## 6. Verification
- Phase 0: All routes render, role switcher works, charts display, dark mode works
- Phase 1-7: Smoke tests after each phase replace mocks with real data
- End-to-end: Upload CSV → pipeline → dashboard → chatbot → presentation ✓

---
*Start with Phase 0 (UI prototype). Nothing is throwaway — this becomes the production frontend.*
