# Ethinos Marketing Platform - Claude Configuration

## Project Overview
Marketing agency CDP (rebranded as Ethinos) replacing manual daily reporting. Multi-account hierarchy (master agency account + client accounts), multi-platform (Google Ads, DV360, Meta). Role-based dashboards (admin/leader/manager/executive). AI chatbot, custom reporting, auto-generated presentations.

**Stack:** Next.js 14 (Cloudflare Pages) + FastAPI (Railway) + PostgreSQL + Redis + Claude AI

## Building with Claude Code
- **Phase 0 (UI/UX Complete):** Interactive frontend prototype with all screens, chart types, simulated flows ✅ COMPLETE
- **Phase 1-7:** Backend + agents on Railway, frontend wired to real APIs (pending)
- **Infrastructure:** Cloudflare (free tier: Pages, R2, KV, Workers) + Railway Pro ($7/month)

## Key Commands
```bash
# Start dev server
cd frontend && npm run dev

# Build for production
cd frontend && npm run build

# Deploy to Cloudflare Pages
npm run deploy

# Run Python backend (Phase 1+)
cd backend && python -m uvicorn app.main:app --reload
```

## File Structure (Phase 0 Complete)
```
frontend/
  ├── app/
  │   ├── (auth)/
  │   │   ├── login/page.tsx
  │   │   └── signup/page.tsx
  │   ├── (dashboard)/
  │   │   ├── page.tsx                           (portfolio overview)
  │   │   ├── layout.tsx                         (sidebar + account switcher)
  │   │   ├── analytics/
  │   │   │   ├── google-ads/
  │   │   │   │   ├── page.tsx                   (overview with date picker + dynamic metric cards)
  │   │   │   │   ├── campaigns/page.tsx         (campaign table)
  │   │   │   │   ├── ad-groups/page.tsx         (ad group table)
  │   │   │   │   ├── keywords/page.tsx          (keyword performance)
  │   │   │   │   ├── sqr/page.tsx               (search query report)
  │   │   │   │   ├── creatives/page.tsx         (creative metrics)
  │   │   │   │   ├── channels/page.tsx          (PMax channels)
  │   │   │   │   ├── funnel/page.tsx            (conversion funnel)
  │   │   │   │   ├── comparison/page.tsx        (period comparison)
  │   │   │   │   └── reports/page.tsx           (custom reporting)
  │   │   │   ├── dv360/
  │   │   │   │   ├── page.tsx                   (overview with campaign metrics)
  │   │   │   │   ├── insertion-orders/page.tsx  (IO table)
  │   │   │   │   ├── line-items/page.tsx        (line items table)
  │   │   │   │   ├── channels/page.tsx          (YouTube/Display placements)
  │   │   │   │   ├── creatives/page.tsx         (creative metrics)
  │   │   │   │   ├── funnel/page.tsx            (conversion funnel)
  │   │   │   │   ├── comparison/page.tsx        (period comparison)
  │   │   │   │   └── reports/page.tsx           (custom reporting)
  │   │   │   └── meta/
  │   │   │       ├── page.tsx                   (overview with campaign metrics)
  │   │   │       ├── campaigns/page.tsx         (campaign table)
  │   │   │       ├── ad-sets/page.tsx           (ad sets table)
  │   │   │       ├── ads/page.tsx               (ad creative metrics)
  │   │   │       ├── funnel/page.tsx            (conversion funnel)
  │   │   │       ├── comparison/page.tsx        (period comparison)
  │   │   │       └── reports/page.tsx           (custom reporting)
  │   │   ├── chat/page.tsx
  │   │   ├── presentations/page.tsx
  │   │   ├── upload/page.tsx
  │   │   └── settings/page.tsx
  │   └── globals.css
  ├── components/
  │   ├── charts/                      (ECharts/Recharts wrappers)
  │   ├── dashboard/
  │   ├── layout/
  │   └── ...
  ├── lib/
  │   ├── accountContext.tsx           (multi-account hierarchy + role-based access)
  │   ├── mockData.ts                  (platform-specific mock data)
  │   └── utils.ts                     (formatting utilities)
  └── next.config.ts
```

## Design System
- **Style:** Dark Mode (OLED) — high contrast, eye-friendly
- **Typography:** Fira Code (headings) + Fira Sans (body)
- **Colors:** Blue (#1E40AF primary, #3B82F6 secondary) + Amber CTA (#F59E0B)
- **UI Framework:** shadcn/ui + Tailwind CSS
- **Charts:** Apache ECharts (complex) + Recharts (simple)
- **Pagination:** Default 10 rows per table, configurable up to 200 rows

## Mock Data Structure
### Accounts
- 1 Ethinos master agency account (aggregates all client data)
- 3 client accounts (e-commerce, real estate, SaaS) with separate data per account

### Data Models
```typescript
interface Campaign {
  id: string;
  name: string;
  platform: "google" | "dv360" | "meta";
  status: "active" | "paused" | "ended";
  budget: number;
  impressions: number;
  clicks: number;
  spend: number;
  conversions: number;
  revenue: number;
  ctr: number;
  cpc: number;
  cvr: number;
  roas: number;
}

interface AdGroup {
  id: string;
  campaignId: string;
  name: string;
  impressions: number;
  clicks: number;
  spend: number;
  conversions: number;
  ctr: number;
  cpc: number;
  cvr: number;
}
```

### Available Mock Functions
- `getMockCampaigns()` — 10 campaigns (4 Google, 3 DV360, 3 Meta)
- `getMockAdGroups()` — 9 ad groups linked to Google campaigns
- `getSearchTerms()` — Search query performance data
- `getCreatives()` — Creative performance across platforms
- `getLineItems()` — DV360 line item data
- `getInsertionOrders()` — DV360 insertion order data
- `getPlacements()` — DV360 placement/channel data
- `getAdSets()` — Meta ad set data
- `getPMaxChannels()` — Google PMax channel data
- `getPeriodComparisons()` — Month-over-month comparison data
- `generateDailyMetrics()` — Time-series metrics for trends

## 🚀 Development Status
**Status:** Phase 0 Complete - All Critical Issues Resolved  
**Date:** 2026-04-07 13:29 UTC+5:30  
**Build Status:** ✅ Production build successful (zero TypeScript errors)  

### Phase 2 Fixes Completed (Apr 7, 2026)
All 8 critical issues from user feedback resolved:

1. ✅ **Ethinos Master Account** — Added synthetic account aggregating all client data
2. ✅ **Clients Visibility** — Hidden from individual client accounts, visible only in Ethinos
3. ✅ **Campaigns Removed** — Removed from main sidebar navigation
4. ✅ **23 Analytics Sub-Pages** — All created and compiling (Google Ads 9, DV360 8, Meta 7)
5. ✅ **Google Ads Date Picker** — Added for trend filtering (30-day default)
6. ✅ **Dynamic Metric Cards** — Cards add/remove based on selected metrics
7. ✅ **DV360 Campaign Metrics** — Overview shows campaign-level data (not insertion orders)
8. ✅ **Meta Campaign Metrics** — Overview shows campaign-level data (not ad sets)
9. ✅ **Table Pagination** — All tables default to 10 rows, configurable up to 200

### Completion Summary
- **Account System:** Ethinos master account + role-based visibility logic ✅
- **Navigation:** Cleaned sidebar (removed Campaigns, fixed Clients visibility) ✅
- **Analytics Pages:** All 23 sub-pages implemented with consistent patterns ✅
- **Data Integration:** Campaign/AdGroup interfaces + mock functions ✅
- **UI/UX:** Date picker, dynamic cards, pagination patterns across all pages ✅
- **Build Verification:** Zero errors, successful production build ✅

### Key Implementation Patterns
- **Account Filtering:** `getMockCampaigns().filter(c => c.platform === "dv360")`
- **Sub-Nav Active State:** `usePathname()` for accurate active tab detection
- **Pagination:** `useState(10)` with selector [10, 25, 50, 100, 200]
- **Date Filtering:** `<input type="date">` with 30-day default range
- **Currency Formatting:** `formatCurrency(value, currency)` with multi-currency support

## Critical Notes for Next Phase
- All mock data is in `lib/mockData.ts` — ready to swap for backend API calls
- Account context in `lib/accountContext.tsx` — role-based access control in place
- Sub-page structure follows consistent pattern — easy to extend to real APIs
- No breaking changes — Phase 1 can wire to real backend without refactoring frontend

## Handoff Notes (Phase 0 → Phase 1)
- Mock API calls (`lib/mockData.ts`) → real API calls (`backend/api/*`) — zero frontend changes needed
- Local mock accounts → real PostgreSQL accounts — context layer handles both
- Platform filtering logic → real platform-specific APIs — same component patterns work
- Date filtering UI → backend date range parameters — parameters already in place
- Mock metrics → real platform metrics — interfaces match expected data shapes

## Quick Links
- Repo: `/Users/yash/CDP`
- Frontend: `/Users/yash/CDP/frontend`
- Design System: [DESIGN_SYSTEM.md](DESIGN_SYSTEM.md)
- Railway Dashboard: [dashboard.railway.app](https://dashboard.railway.app)
- Cloudflare Pages: Deploy via wrangler

## Skills

- **caveman** (`~/.claude/skills/caveman/SKILL.md`) — Ultra-compressed communication mode. Cuts ~75% output tokens. Trigger: `/caveman`
- **graphify** (`~/.claude/skills/graphify/SKILL.md`) — Codebase knowledge graph builder. Trigger: `/graphify`

When the user types `/caveman` or `/graphify`, invoke the Skill tool with the matching skill name before doing anything else.

## graphify

This project has a graphify knowledge graph at graphify-out/.

Rules:
- Before answering architecture or codebase questions, read graphify-out/GRAPH_REPORT.md for god nodes and community structure
- If graphify-out/wiki/index.md exists, navigate it instead of reading raw files
- After modifying code files in this session, run `python3 -c "from graphify.watch import _rebuild_code; from pathlib import Path; _rebuild_code(Path('.'))"` to keep the graph current
