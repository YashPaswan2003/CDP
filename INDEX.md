# CDP Platform — Complete Design & Project Setup

## 📁 Folder Structure

```
/Users/yash/CDP/
├── INDEX.md                  ← You are here
├── README.md                 ← Quick start (2 min read)
├── CLAUDE.md                 ← Building context & tech stack
├── plan.md                   ← 7-phase implementation roadmap
├── DESIGN_SYSTEM.md          ← Complete UI/UX specs (THE BIBLE)
├── PROJECT_STATUS.txt        ← Status summary
└── frontend/                 ← Next.js app (created in Phase 0)
```

## 📄 Document Purpose

| Document | Purpose | Read Time |
|----------|---------|-----------|
| **README.md** | Start here. Quick overview of phases and next steps | 2 min |
| **CLAUDE.md** | Tech stack, folder structure, building notes for Claude Code | 3 min |
| **plan.md** | Phases 0-7 breakdown, what to build when | 4 min |
| **DESIGN_SYSTEM.md** | COMPLETE specs: all 9 screens, colors, interactions, components, accessibility | 20 min |
| **PROJECT_STATUS.txt** | Full status summary (infrastructure, agents, phases, next steps) | 5 min |

## 🎨 Design System Highlights

### Colors (Dark Mode OLED)
- **Primary:** #1E40AF (blue)
- **Secondary:** #3B82F6 (light blue)
- **CTA:** #F59E0B (amber)
- **Background:** #0F172A (deep black)
- **Text:** #F1F5F9 (light slate)

### Fonts
- **Headings:** Fira Code (monospace, technical)
- **Body:** Fira Sans (sans-serif, readable)

### UI Framework
- shadcn/ui components
- Tailwind CSS utilities
- Lucide SVG icons (no emojis)

## 🖥️ 9 Screens Designed

1. **Portfolio Dashboard** — Overview of all clients, KPIs, top campaigns
2. **Client Dashboard** — Deep dive per client, platform tabs, trends, heatmap
3. **Campaign Drill-Down** — Sortable campaigns table, bulk compare
4. **Custom Reporting** — Dimension picker, metric selector, dynamic charts
5. **AI Chat** — Conversational interface, streaming responses
6. **Presentations** — Template gallery, auto-generation, preview
7. **CSV Upload** — Drag-drop with platform detection
8. **Settings** — Users, templates, system config
9. **Role Switcher** — Dev tool (Leader/Manager/Executive instant toggle)

## 🔧 7-Agent Backend Pipeline

| Agent | Input | Output |
|-------|-------|--------|
| DataIngestionAgent | CSV file | Normalized PostgreSQL rows |
| ClientAnalysisAgent | client_id + date_range | KPI JSON + trends |
| OrchestratorAgent | client_id | Master sheet + triggers other agents |
| VisualizationAgent | metrics query | Chart config (ECharts/Recharts) |
| CDPGodAgent | natural language | Accurate answer (omniscient knowledge base) |
| ChatbotAgent | user message | Streaming response |
| PresentationAgent | client_id + template | .pptx file in R2 |

## 🚀 Quick Start Path

### Phase 0 (UI Prototype - START HERE)
```bash
# 1. Create Next.js project
npx create-next-app@latest cdp-platform

# 2. Install dependencies
npm install shadcn-ui echarts recharts lucide-react next-auth

# 3. Copy DESIGN_SYSTEM.md and build all 9 screens
# Reference: /Users/yash/CDP/DESIGN_SYSTEM.md for every component

# 4. Deploy to Cloudflare Pages
npm run deploy
```

### Phase 1+ (Backend)
- Set up Railway PostgreSQL + Redis
- Deploy FastAPI backend
- Connect frontend to real APIs
- Build 7-agent LangGraph pipeline

## 💡 Key Principles

**No AI Slop:** Hand-crafted layouts, real data, professional polish
**Accessible:** WCAG AA compliant, keyboard navigation, focus states
**Responsive:** Works at 375px, 768px, 1024px, 1440px
**Dark Mode:** Fully tested OLED optimization
**Scalable:** Designed to grow from 10 to 100+ clients

## 📊 Tech Stack

### Frontend (Phase 0)
- Next.js 14
- TypeScript
- Tailwind CSS
- shadcn/ui
- ECharts + Recharts
- NextAuth.js

### Backend (Phases 1+)
- FastAPI (Python)
- PostgreSQL
- Redis
- Celery
- LangGraph + LangChain
- Claude AI (Haiku + Sonnet)

### Infrastructure
- **Hosting:** Cloudflare Pages (frontend) + Railway (backend)
- **Storage:** Cloudflare R2 (files)
- **Cache:** Cloudflare KV (sessions)
- **Cost:** ~$7/month (Railway Pro)

## 🔍 Where to Find Things

**Need component specs?** → DESIGN_SYSTEM.md
**Need implementation steps?** → plan.md
**Need tech stack details?** → CLAUDE.md
**Quick overview?** → README.md
**Full status?** → PROJECT_STATUS.txt

## ✅ Verification Checklist

### Phase 0 (UI Prototype)
- [ ] All 9 screens render without errors
- [ ] Role switcher toggles views correctly
- [ ] All chart types display with mock data
- [ ] Chat UI shows simulated streaming
- [ ] Upload shows progress simulation
- [ ] Dark mode works across all screens
- [ ] Responsive at 375px, 768px, 1024px, 1440px
- [ ] Deployed to Cloudflare Pages

### Phase 1-7
- [ ] Real data replaces mocks one phase at a time
- [ ] Smoke tests pass after each phase
- [ ] End-to-end: CSV → pipeline → dashboard → chat → presentation

---

**Start building Phase 0 now. Everything is designed and ready to implement.**

For detailed component specs, open `DESIGN_SYSTEM.md` in your editor.
