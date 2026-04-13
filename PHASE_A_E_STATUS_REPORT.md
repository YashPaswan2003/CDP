# CDP Platform — Phases 2.5-3 Current State vs Phases A-E Target State

**Generated:** 2026-04-13  
**Status:** Deployed (Frontend + Backend) | UX Gaps Identified | Ready for Phase A Implementation

---

## Executive Summary

### What's Deployed ✅
- Next.js 14 frontend on Cloudflare Pages
- FastAPI backend on Railway (auto-deploys via GitHub)
- Authentication (JWT + role-based access)
- Basic dashboard, analytics, presentations, chat, monitor flows
- Security hardening (auth on all endpoints, no exception leakage, file size limits)
- 98 backend tests passing
- Zero TypeScript errors

### What's Missing ❌
- **Realistic multi-client data** (single hardcoded client mock data)
- **5-month historical data** (only 30 days)
- **Analytics visualizations** (bare tables, no charts)
- **Presentation generation** (stubs, no PPTX output)
- **Monitor severity grouping** (flat flag list)
- **Deep-linking** between views (View buttons don't navigate correctly)
- **Comparison data** (no % change indicators, no previous period overlay)

### User Impact
Dashboard blocks users with config modal → no mock data → analytics pages show empty state → presentations fail → chat returns no data.

**Result:** Platform looks broken to any user who tries it.

---

## Detailed Phase Breakdown

### Phase A: Data Foundation

**Status:** ❌ NOT STARTED

#### What Needs to Be Done

| Task | Files | Effort | Impact |
|------|-------|--------|--------|
| **A1. Seed 4 clients** | `seed_realistic.py` (NEW) | 2 hours | HIGH — enables all other phases |
| **A2. Generate 5-month daily metrics** | `seed_realistic.py` | 1.5 hours | HIGH — powers all charts + anomaly detection |
| **A3. Map campaigns to funnel stages** | `seed_realistic.py` | 1 hour | MEDIUM — funnel sections need this |
| **A4. Generate keywords + SQR data** | `seed_realistic.py` | 1.5 hours | MEDIUM — analytics sub-pages need this |

**Total Effort:** ~6 hours solo, 3-4 hours with pair programming

#### Clients to Seed

```
UrbanCart
├─ Industry: E-commerce / D2C
├─ Currency: INR
├─ Platforms: Google, Meta
├─ Monthly Spend: ₹15-25L
├─ Campaigns: 8-15 per platform
├─ Deliberate Anomaly: ROAS drop March (sale overspend)

PropNest
├─ Industry: Real Estate
├─ Currency: INR
├─ Platforms: Google, DV360
├─ Monthly Spend: ₹8-12L
├─ Campaigns: 8-15 per platform
├─ Deliberate Anomaly: Frequency 6.2x Feb (audience fatigue)

CloudStack
├─ Industry: B2B SaaS
├─ Currency: USD
├─ Platforms: Google, Meta
├─ Monthly Spend: $5-8K
├─ Campaigns: 8-15 per platform
├─ Deliberate Anomaly: CTR collapse April (ad quality)

FreshBite
├─ Industry: FMCG / CPG
├─ Currency: INR
├─ Platforms: Google, DV360, Meta
├─ Monthly Spend: ₹20-30L
├─ Campaigns: 8-15 per platform
├─ Deliberate Anomaly: Budget pacing 145% Jan (DV360)
```

#### Implementation Checklist

- [ ] Create `backend/app/database/seed_realistic.py`
- [ ] Generate accounts (Ethinos master + 4 clients)
- [ ] Generate campaigns per client/platform (80+ total)
- [ ] Generate daily_metrics (5 months × clients × platforms = 1,600+ rows)
- [ ] Inject anomalies (match detection logic in flags.py)
- [ ] Generate search_terms (50-100 per Google campaign)
- [ ] Generate creatives (20-40 per campaign)
- [ ] Generate geo_data (8-10 cities per campaign)
- [ ] Generate demographics (age/gender segments)
- [ ] Generate funnel_stages mapping
- [ ] Test seed script: `python -m app.database.seed_realistic`
- [ ] Verify counts: 5 accounts, 80+ campaigns, 1600+ daily metrics, 200+ keywords
- [ ] Deploy to Railway

#### Blockers
- None identified

#### Risk
**High:** If data isn't realistic, all downstream visualizations look wrong.

---

### Phase B: Portfolio Dashboard Redesign

**Status:** ⚠️ PARTIAL (Alert cards exist, redesign incomplete)

#### What Needs to Be Done

| Task | Files | Current | Needed |
|------|-------|---------|--------|
| **B1. Remove config modal** | `ConfigSetupModal.tsx` | Modal blocks on first visit | Delete or convert to banner |
| **B2. Alert redesign** | `AlertStrip.tsx` | 3 hardcoded alerts | Campaign-specific cards + deep-link |
| **B3. Remove funnel numbering** | `page.tsx` (dashboard) | "1/2/3 Awareness/Consideration/Conversion" | Just TOFU/MOFU/BOFU sections |
| **B4. Funnel enhancement** | `page.tsx` | Basic grid layout | Platform sub-cards + health dots + % change |
| **B5. Trend chart upgrade** | `LineChart` component | 7/30/90 day + metric toggle | +stage tabs +period overlay +anomaly markers |
| **B6. Recommendation panel** | `RecommendationPanel.tsx` | 3 static recommendations | +source +impact +quick action buttons |

**Total Effort:** ~8 hours

#### Implementation Checklist

- [ ] Remove `/components/ConfigSetupModal.tsx` or convert to banner
- [ ] Update `/frontend/app/dashboard/page.tsx`:
  - [ ] Delete modal import/usage
  - [ ] Redesign TOFU/MOFU/BOFU sections (remove numbering)
  - [ ] Add platform sub-cards per funnel section
  - [ ] Add health dots + % change indicators
  - [ ] Add [Analyze] button per section
- [ ] Update `/frontend/components/monitor/AlertStrip.tsx`:
  - [ ] Campaign-specific headline (not generic "Alert")
  - [ ] Context line with spend + metric values
  - [ ] [View Details] button with deep-link params
- [ ] Update `/frontend/components/charts/LineChart.tsx`:
  - [ ] Add stage tabs (All / TOFU / MOFU / BOFU)
  - [ ] Add period comparison toggle
  - [ ] Add anomaly markers (red dots on chart)
  - [ ] Add dashed line for previous period
- [ ] Update `/frontend/components/ai/RecommendationPanel.tsx`:
  - [ ] Add "Triggered by" source line
  - [ ] Add "Estimated impact" line
  - [ ] Add quick action buttons ([Pause], [Reduce 30%], etc.)
- [ ] Update `/backend/app/routes/flags.py`:
  - [ ] Return campaign_id, campaign_name with flags
  - [ ] Return sparkline data (last 7 days)
- [ ] Update `/frontend/lib/api.ts`:
  - [ ] fetchAlerts to return richer data
- [ ] Test: Dashboard loads without modal ✅
- [ ] Test: Alert card click → correct campaign in analytics
- [ ] Test: Funnel % changes show correctly

#### Blockers
- Depends on Phase A data (dummy data won't show realistic anomalies)

#### Risk
**High:** Dashboard is the first thing users see. If it looks broken, they abandon.

---

### Phase C: Monitor/Diagnose/Act + Analytics Pages Overhaul

**Status:** ❌ NOT STARTED (Monitor page exists but flat structure)

#### What Needs to Be Done

| Task | Files | Effort | Priority |
|------|-------|--------|----------|
| **C1. Monitor redesign** | `monitor/page.tsx` (NEW), `MonitorDiagnoseAct.tsx` | 3 hours | HIGH |
| **C2. Google Ads analytics** | `analytics/google-ads/page.tsx` | 4 hours | HIGH |
| **C3. DV360 analytics** | `analytics/dv360/page.tsx` | 3 hours | HIGH |
| **C4. Meta analytics** | `analytics/meta/page.tsx` | 3 hours | HIGH |

**Total Effort:** ~13 hours

#### C1: Monitor Redesign Checklist

- [ ] Create `/frontend/app/dashboard/monitor/page.tsx`:
  - [ ] 3 summary cards (Critical / Warning / On Track)
  - [ ] Grouped flag list below (top 3-5 per severity)
  - [ ] [View All] buttons → `/dashboard/monitor/[severity]`
- [ ] Create `/frontend/app/dashboard/monitor/[severity]/page.tsx`:
  - [ ] Platform tabs (Google / DV360 / Meta)
  - [ ] Grouped flags with campaign context
  - [ ] Sparkline per flag
  - [ ] [View Campaign] + [Take Action] buttons
- [ ] Create `/frontend/components/metrics/MetricCard.tsx`:
  - [ ] Shows current value + % change + sparkline
  - [ ] Clickable to highlight in main chart
- [ ] Update `/frontend/components/FlagBanner.tsx`:
  - [ ] Add sparkline visualization
  - [ ] Add action button

#### C2-C4: Analytics Pages Checklist (for each platform)

For Google Ads, DV360, and Meta:

- [ ] Header section:
  - [ ] Client name + date range picker
  - [ ] Period comparison toggle (vs Previous Week / Month / Off)
- [ ] Metric cards (6-8 per page):
  - [ ] Current value (large)
  - [ ] % change badge (green up / red down)
  - [ ] Sparkline (7-day trend)
  - [ ] Clickable to highlight in chart
- [ ] Main chart:
  - [ ] Chart type toggle (Line / Bar / Area)
  - [ ] Multi-metric overlay (select 1-3)
  - [ ] Date granularity (Daily / Weekly / Monthly)
  - [ ] Previous period dashed overlay
- [ ] Campaign table:
  - [ ] Sortable columns (click header)
  - [ ] % change badges on each metric
  - [ ] Expandable rows (ad groups for Google, ad sets for Meta, line items for DV360)
  - [ ] Pagination (10/25/50/100/200)
  - [ ] Status indicators (green/yellow/red dots)
- [ ] Platform-specific:
  - **Google Ads:** Keywords tab, SQR tab, geo tab, demographics tab, funnel tab, comparison tab
  - **DV360:** IO → Line Item hierarchy, video metrics (VTR/VTC/CPV), placement breakdown, pacing %
  - **Meta:** Frequency + reach prominent, audience fatigue indicator (frequency > threshold)

#### Blockers
- Depends on Phase A data
- Depends on backend `/api/analytics/*` endpoints returning comparison data

#### Risk
**CRITICAL:** Analytics pages are the product. If they don't show data convincingly, product fails.

---

### Phase D: Presentations System

**Status:** ⚠️ PARTIAL (Stubs exist, no real generation)

#### What Needs to Be Done

| Task | Files | Effort | Impact |
|------|-------|--------|--------|
| **D1. Template selector** | `TemplateSelector.tsx` (NEW) | 2 hours | HIGH |
| **D2. Slide editor** | `SlideEditor.tsx` (NEW) + sidebar + chat | 5 hours | HIGH |
| **D3. Slide types** | Template system + PPTX templates | 3 hours | MEDIUM |
| **D4. PPTX generation** | `pptx_generator.py` (NEW) | 2 hours | HIGH |
| **D5. Per-slide AI** | `presentation_agent.py` (NEW) | 2 hours | MEDIUM |

**Total Effort:** ~14 hours

#### Implementation Checklist

- [ ] Create `/frontend/components/presentations/TemplateSelector.tsx`:
  - [ ] Grid of template cards (Monthly Report, Deep Dive, QBR, Weekly Pulse)
  - [ ] Drag-drop zone for custom PPTX
- [ ] Create `/frontend/app/dashboard/presentations/[id]/page.tsx`:
  - [ ] Configuration: client selector, date range, platforms, campaigns
  - [ ] Slide editor: thumbnails (left) + preview (center) + AI chat (right)
- [ ] Create `/frontend/components/presentations/SlideEditor.tsx`:
  - [ ] Slide type selector
  - [ ] Text block editing
  - [ ] Data-bound elements (charts/tables)
- [ ] Create `/frontend/components/presentations/AIChat.tsx`:
  - [ ] Chat input + message history
  - [ ] Context: current slide, available data
  - [ ] Insert generated content into slide
- [ ] Create `/backend/app/services/pptx_generator.py`:
  - [ ] Use python-pptx to generate .pptx files
  - [ ] Support built-in templates
  - [ ] Support uploading custom .pptx with placeholder scanning
  - [ ] Generate charts (bar/line/pie) in PPTX
- [ ] Create `/backend/app/services/agents/presentation_agent.py`:
  - [ ] Per-slide AI agent
  - [ ] Context: client data, date range, slide type
  - [ ] Generate bullet points, insights, recommendations
- [ ] Create 4 built-in PPTX templates:
  - [ ] Monthly Performance Report (10-12 slides)
  - [ ] Campaign Deep Dive (8 slides)
  - [ ] Client QBR (15 slides)
  - [ ] Weekly Pulse (5 slides)
- [ ] Update `/frontend/app/dashboard/presentations/page.tsx`:
  - [ ] List existing presentations
  - [ ] [+ New] button → template selector
  - [ ] Each presentation card shows title, client, date, status
- [ ] Update `/backend/app/routes/presentations.py`:
  - [ ] POST /presentations (create with template)
  - [ ] GET /presentations (list)
  - [ ] POST /presentations/[id]/generate (PPTX)
  - [ ] GET /presentations/[id]/download
- [ ] Test: Select template → configure → open slide editor
- [ ] Test: AI chat on slide → content inserts
- [ ] Test: Generate PPTX → download → open in PowerPoint

#### Blockers
- python-pptx library needed (check requirements.txt)
- Template system design (how to parse/fill templates)

#### Risk
**MEDIUM:** Presentations is a premium feature. Can delay if Phase A-C complete.

---

### Phase E: Chat + Polish

**Status:** ⚠️ PARTIAL (Chat page exists, hardcoded UUID, no persistence)

#### What Needs to Be Done

| Task | Files | Effort | Impact |
|------|-------|--------|--------|
| **E1. Fix chat context** | `chat/page.tsx` | 1 hour | MEDIUM |
| **E2. Add persistence** | `chat/page.tsx` + API | 1 hour | MEDIUM |
| **E3. Fix deep-linking** | Various analytics pages | 2 hours | HIGH |
| **E4. Error handling** | All API calls | 1.5 hours | MEDIUM |

**Total Effort:** ~5.5 hours

#### Implementation Checklist

- [ ] Update `/frontend/app/dashboard/chat/page.tsx`:
  - [ ] Remove hardcoded UUID
  - [ ] Get `selectedAccount.id` from context
  - [ ] Add localStorage persistence (messages array)
  - [ ] Or: API-backed message history (POST /api/chat/messages)
  - [ ] Add error display (try/catch on API calls)
  - [ ] Add suggested prompts (generated based on current flags)
- [ ] Update all analytics pages to handle deep-link query params:
  - [ ] `?campaign=[name]` → filter/highlight campaign
  - [ ] `?highlight=[metric]` → highlight that column
  - [ ] `?compare=previous_week` → show comparison overlay
  - [ ] `?stage=tofu` → filter by funnel stage
- [ ] Update `/frontend/components/monitor/AlertStrip.tsx`:
  - [ ] [View Details] button builds correct deep-link URL
- [ ] Update `/frontend/components/ai/RecommendationPanel.tsx`:
  - [ ] [View] button builds deep-link to campaign
- [ ] Test: Chat page loads without hardcoded ID ✅
- [ ] Test: Messages persist on refresh ✅
- [ ] Test: All View buttons navigate correctly ✅
- [ ] Test: Query params filter/highlight correctly ✅

#### Blockers
- None identified

---

## Data Model Requirements

### Tables Needed

```
accounts (5 rows: 1 Ethinos + 4 clients)
├─ id, name, industry, currency, client_type, platforms, created_at

campaigns (80+ rows: 8-15 per client × platforms)
├─ id, account_id, name, platform, status, budget, created_at

daily_metrics (1,600+ rows: 5 months × clients × platforms)
├─ id, account_id, campaign_id, date, spend, revenue, impressions, clicks, conversions, roas, ctr, cpc, etc.

campaign_metrics (aggregate snapshots)
├─ id, account_id, campaign_id, platform, date_from, date_to, spend, revenue, etc.

search_terms (200+ rows: 50-100 per Google campaign)
├─ id, account_id, campaign_id, query, impressions, clicks, conversions, spend, etc.

creatives (200+ rows: 20-40 per campaign)
├─ id, account_id, campaign_id, format (image/video/carousel), performance_metrics

geo_data (80+ rows: 8-10 cities per campaign)
├─ id, account_id, campaign_id, city, state, impressions, conversions, spend, etc.

demographics (80+ rows: age/gender per campaign)
├─ id, account_id, campaign_id, age_range, gender, impressions, conversions, spend, etc.

funnel_stages (4 rows per client: TOFU/MOFU/BOFU/Closed-Loop)
├─ id, account_id, name (tofu/mofu/bofu), campaigns mapped

flags (50+ rows: dynamic based on anomaly detection)
├─ id, account_id, campaign_id, metric, severity (critical/warning), value, threshold, created_at
```

---

## Deployment Checklist

### Before Phase A Implementation
- [ ] Confirm database schema supports all above tables
- [ ] Verify `seed_realistic.py` can be run without conflicts
- [ ] Test seed script generates correct counts
- [ ] Deploy seeded data to Railway database

### Before Phase B-E Deployment
- [ ] All new frontend components compile (zero TypeScript errors)
- [ ] All backend API endpoints return expected data structure
- [ ] Backend tests passing (98+ tests)
- [ ] Cloudflare Pages redeploy succeeds
- [ ] Railway backend redeploy succeeds
- [ ] Manual testing: Visit each page, verify data loads

---

## Testing Verification Plan

Use `/TESTING_PROMPT.md` in Claude Chrome extension for systematic testing.

### Quick Sanity Check (15 min)

```bash
# 1. Check frontend loads
curl -I https://main.ethinos-cdp.pages.dev

# 2. Check backend health
curl https://api-production-456b.up.railway.app/health

# 3. Check database seeded (if SSH access)
ssh railway
duckdb ethinos.duckdb
  SELECT COUNT(*) FROM accounts, campaigns, daily_metrics;
```

### Full Testing Workflow (2 hours)

1. Run TESTING_PROMPT against live frontend
2. For each phase, mark: ✅ DONE / ⚠️ PARTIAL / ❌ NOT DONE
3. List missing features + blockers
4. Report findings to sprint planning

---

## Critical Success Factors

### Phase A (MUST COMPLETE FIRST)
- ✅ Realistic 4-client data seeded
- ✅ 5-month historical daily metrics generated
- ✅ Deliberate anomalies injected (for flag detection)
- ✅ Data covers all platforms (Google / DV360 / Meta)

**If Phase A fails:** All downstream visualizations are empty/fake.

### Phase B (CORE UX)
- ✅ Dashboard loads without config modal
- ✅ Alert cards show campaign context + deep-link
- ✅ Funnel sections show % change + health dots
- ✅ Trend chart shows 5-month data + anomaly markers

**If Phase B fails:** Dashboard looks unfinished.

### Phase C (PRODUCT VALUE)
- ✅ Monitor page shows red/yellow/green grouped view
- ✅ Analytics pages show metric cards + charts + sortable tables
- ✅ All platforms (Google/DV360/Meta) have consistent UX
- ✅ Deep-linking works between monitor/analytics/recommendations

**If Phase C fails:** Analytics pages are bare and unusable.

### Phase D (REVENUE FEATURE)
- ✅ Presentation builder launches
- ✅ Slide editor supports AI chat
- ✅ PPTX generation produces real files
- ✅ Download returns ~30KB .pptx

**If Phase D fails:** Premium feature unavailable.

### Phase E (POLISH)
- ✅ Chat page uses correct account context
- ✅ All View buttons navigate correctly
- ✅ Error messages don't expose internals
- ✅ Messages persist between sessions

**If Phase E fails:** UX feels janky, not production-ready.

---

## Estimated Timeline

| Phase | Effort | Solo Time | Pair Time | Start | End |
|-------|--------|-----------|-----------|-------|-----|
| A: Data | 6h | 8h | 4h | Apr 13 | Apr 14 |
| B: Dashboard | 8h | 10h | 5h | Apr 14 | Apr 15 |
| C: Analytics | 13h | 16h | 8h | Apr 15 | Apr 17 |
| D: Presentations | 14h | 18h | 9h | Apr 17 | Apr 19 |
| E: Polish | 5.5h | 7h | 3.5h | Apr 19 | Apr 19 |
| **TOTAL** | **46.5h** | **59h** | **29.5h** | **Apr 13** | **Apr 19** |

**Assumption:** 8h/day working. Pair programming cuts solo time ~40-50%.

---

## Next Steps

### Immediate (Next Session)

1. **Read TESTING_PROMPT.md** — Understand what needs testing
2. **Run testing against live frontend** — Document current gaps
3. **Create Phase A sprint** — Data seeding is the blocker for everything else
4. **Start Phase A implementation:**
   - Create `seed_realistic.py`
   - Generate 4 clients + campaigns + daily metrics
   - Deploy to Railway
5. **Verify seeded data appears in dashboard**

### Tracking

- Use GitHub Issues to track Phase A-E tasks
- Use `/caveman` for terse task updates
- Weekly sync: Demo deployed pages + review test results

---

## Success Criteria (Final)

Platform is ready for user demo when:

- ✅ 4 clients visible in account switcher
- ✅ Dashboard loads without blocking modal
- ✅ Alert cards show real anomalies + deep-link to campaigns
- ✅ Analytics pages show metric cards + charts + tables (no empty state)
- ✅ Monitor page shows red/yellow/green grouped severity view
- ✅ Presentation builder creates PPTX files
- ✅ Chat asks real questions + gets data-driven answers
- ✅ All View buttons navigate correctly
- ✅ 0 TypeScript errors
- ✅ 0 unhandled exceptions in browser console

**Current Status:** 5/10 criteria met. Phase A-E will complete remaining 5.

