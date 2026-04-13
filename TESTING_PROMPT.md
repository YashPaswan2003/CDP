# CDP Platform Testing Prompt for Claude Chrome

Use this prompt in Claude Chrome extension to test the deployed platform and identify gaps.

---

## TESTING PROMPT

You are QA testing a marketing agency platform deployed at:
- **Frontend:** https://main.ethinos-cdp.pages.dev
- **Backend:** https://api-production-456b.up.railway.app

### Test Scope: Phases 2.5-3 Current State vs Phases A-E Target State

**Your goal:** Verify which features work, which are missing, and document blockers.

---

### Phase A: Data Foundation Testing

#### A1. Client Portfolio (4 Clients)
```
Expected: 4 clients under Ethinos master agency
- UrbanCart (E-commerce, INR, Google+Meta)
- PropNest (Real Estate, INR, Google+DV360)
- CloudStack (SaaS, USD, Google+Meta)
- FreshBite (FMCG, INR, Google+DV360+Meta)

Test Steps:
1. Open /dashboard
2. Click account switcher (top-left)
3. Verify all 4 client accounts appear
4. Select each client → check if dashboard loads without errors
5. For each client, check if campaigns appear in analytics pages
```

#### A2. Historical Data (5 Months)
```
Expected: Daily metrics from 2025-12-01 to 2026-04-13 (~1,600+ rows)

Test Steps:
1. Open /dashboard/analytics/google-ads
2. Set date range to "Last 5 months"
3. Check if trend chart shows 5-month continuous line (no gaps)
4. Look for deliberate anomalies:
   - UrbanCart: ROAS drop in March
   - PropNest: High frequency in February
   - CloudStack: CTR collapse in April
   - FreshBite: Budget pacing issues in January
5. Report: Are anomalies visible in charts?
```

#### A3. Funnel Stages
```
Expected: Campaigns mapped to TOFU/MOFU/BOFU with proper metrics

Test Steps:
1. Open /dashboard
2. Scroll to TOFU/MOFU/BOFU sections
3. Check if each stage shows:
   - Impressions/Reach (TOFU)
   - Clicks/CTR/CPC (MOFU)
   - Conversions/Revenue/ROAS/CPA (BOFU)
4. Verify stage data aggregates across platforms (Google+DV360+Meta)
```

---

### Phase B: Portfolio Dashboard Redesign Testing

#### B1. Config Modal Removed
```
Test: Onboarding modal should NOT appear on first visit

Steps:
1. Clear cookies and localStorage (DevTools → Application)
2. Reload /dashboard
3. Expected: Dashboard loads directly (no modal)
4. If modal appears: B1 NOT DONE ❌
5. If banner appears (subtle, not blocking): B1 PARTIALLY DONE ⚠️
6. If nothing appears and config is optional: B1 DONE ✅
```

#### B2. Alert System Redesign
```
Test: Alerts show campaign-specific context + deep-link to analytics

Steps:
1. Open /dashboard
2. Look for alert cards with:
   - Severity color (red/amber/green left border)
   - Headline: "ROAS dropped 42% on UrbanCart Google Search"
   - Context: "Campaign: Summer Sale | Spend: ₹2.4L | ROAS: 1.8x (was 3.1x)"
   - [View Details] button
3. Click [View Details]
4. Expected: Routes to /dashboard/analytics/[platform]/campaigns with:
   - Campaign filtered/highlighted
   - Metric comparison shown (this week vs last week)
   - Status: DONE ✅ or PARTIAL ⚠️ or NOT DONE ❌
```

#### B3. Funnel Numbering Removed
```
Test: No "1/2/3" pipeline graphic, just TOFU/MOFU/BOFU sections

Steps:
1. Open /dashboard
2. Scroll to funnel sections
3. Check: Are numbered circles gone?
4. Check: Are "Awareness/Consideration/Conversion" decorative labels gone?
5. Just raw sections showing metrics: DONE ✅
```

#### B4. Funnel Sections Enhancement
```
Test: Each funnel section shows platform breakdown, health dots, % change

Expected per section:
- Google / DV360 / Meta sub-cards
- Red/yellow/green health dots per metric
- "+12% ↑" or "-8% ↓" % change next to metrics
- [Analyze] button → links to /dashboard/analytics/[platform]?stage=tofu

Status: DONE ✅ / PARTIAL ⚠️ / NOT DONE ❌
```

#### B5. Performance Trend Chart
```
Test: Multi-metric, multi-stage, comparison overlay

Steps:
1. Open /dashboard → scroll to "Performance Trend" chart
2. Check for tabs:
   - Stage tabs: All / TOFU / MOFU / BOFU
   - Platform tabs: All / Google / DV360 / Meta
3. Check for metric toggles: Spend, Revenue, Impressions, etc.
4. Try clicking "Previous Period" toggle
5. Expected: Dashed line appears showing previous week/month data
6. Look for red dot markers on anomaly dates (March for UrbanCart, etc.)

Status: DONE ✅ / PARTIAL ⚠️ / NOT DONE ❌
```

#### B6. Recommendation Panel
```
Test: Each recommendation shows source, impact estimate, quick action

Expected:
- Source: "Triggered by: CTR collapse flag on CloudStack Display"
- Impact: "Estimated impact: +₹12K revenue/week"
- Buttons: [View] [Pause Campaign] [Reduce Budget 30%]

Steps:
1. Open /dashboard → scroll to recommendations
2. Check structure above
3. Click action button → verify it executes (or pre-fills form)

Status: DONE ✅ / PARTIAL ⚠️ / NOT DONE ❌
```

---

### Phase C: Monitor/Diagnose/Act + Analytics Pages Testing

#### C1. Monitor Severity-Grouped Dashboard
```
Test: Red/Yellow/Green summary cards + grouped drilldown

Steps:
1. Open /dashboard (should have Monitor section)
2. Look for 3 summary cards:
   - 🔴 Critical (X items) [View All]
   - 🟡 Warning (X items) [View All]
   - 🟢 On Track (X items) [View All]
3. Click [View All] on Critical
4. Expected route: /dashboard/monitor/critical
5. Page shows all critical flags grouped by platform (Google / DV360 / Meta tabs)
6. Each flag card has:
   - Campaign + client name
   - Affected metric with sparkline
   - [View Campaign] → analytics deep-link
   - [Take Action] → action execution

Status: DONE ✅ / PARTIAL ⚠️ / NOT DONE ❌
```

#### C2-C4. Analytics Pages (Google/DV360/Meta)
```
Test: Metric cards with % change, main chart, sortable campaign table

For each platform (Google Ads / DV360 / Meta):

Steps:
1. Open /dashboard/analytics/[google-ads|dv360|meta]
2. Check Header:
   - Client name showing
   - Date range picker
   - "Compare: vs Previous Week/Month/Off" toggle
3. Check Metric Cards (6-8 cards):
   - Spend, Revenue, Impressions, Clicks, CTR, CPC, Conversions, ROAS
   - Each shows: current value + % change (green up / red down)
   - Sparkline mini-chart on each
4. Check Main Chart:
   - Line/Bar/Area toggle
   - Multi-metric selector (pick 1-3 metrics)
   - Date granularity: Daily/Weekly/Monthly
   - Previous period dashed overlay
5. Check Campaign Table:
   - 13 columns (Name, Status, Type, Budget, Spend, Impressions, Clicks, CTR, CPC, Conversions, CVR, Revenue, ROAS)
   - % change badge on each metric column
   - Sortable (click header)
   - Pagination: 10/25/50/100/200 rows selector
   - Row click → expands to sub-items (ad groups for Google, ad sets for Meta, line items for DV360)

Expected per platform:
- Google Ads: Full hierarchy (campaigns → ad groups → keywords)
- DV360: IO → Line Item hierarchy + video metrics + pacing %
- Meta: Campaign → Ad Set → Ad hierarchy + frequency metric + audience fatigue

Status: DONE ✅ / PARTIAL ⚠️ / NOT DONE ❌
```

---

### Phase D: Presentations System Testing

#### D1. Presentation Builder UI
```
Test: Template selection → slide editor → AI chat → PPTX download

Steps:
1. Open /dashboard/presentations
2. Expected: List of existing presentations (or empty state)
3. Click [+ New Presentation]
4. Expected: Template selection grid with:
   - Monthly Performance Report
   - Campaign Deep Dive
   - Client QBR
   - Weekly Pulse
   - Upload Custom PPTX option
5. Select "Monthly Performance Report"
6. Expected: Configuration page
   - Client selector (dropdown with 4 clients)
   - Date range picker
   - Platform checkboxes (Google/DV360/Meta)
   - Campaign selector (optional)
7. Click "Next"
8. Expected: Slide editor opens with:
   - Left sidebar: Slide thumbnails
   - Center: Slide preview/editor
   - Right sidebar: AI Chat panel
9. Try AI chat: Type "Show top 10 keywords by conversions"
10. Expected: AI generates content and inserts into slide
11. Click "Generate PPTX"
12. Expected: File downloads (~30KB .pptx file)
13. Open in PowerPoint: Verify content is real (not placeholder)

Status: DONE ✅ / PARTIAL ⚠️ / NOT DONE ❌
```

---

### Phase E: Chat + Polish Testing

#### E1. Chat Page
```
Test: No hardcoded UUID, persistent messages, error handling

Steps:
1. Open /dashboard/chat
2. Check: Account context (should show selected client name)
3. Type: "What's the ROAS for UrbanCart?"
4. Expected: Real data-driven response (not error)
5. Refresh page
6. Expected: Message history persists (localStorage or backend)
7. Trigger error: Ask about non-existent client
8. Expected: Error message shown (not 500 crash)

Status: DONE ✅ / PARTIAL ⚠️ / NOT DONE ❌
```

#### E2. Deep-Linking
```
Test: All "View" buttons navigate correctly

Steps:
1. Dashboard alerts → click [View Details] → lands on correct campaign + metric
2. Monitor critical items → click [View Campaign] → lands on analytics filtered
3. Recommendation → click [View] → lands on relevant campaign
4. Funnel metric → click [Analyze] → lands on analytics filtered by stage
5. Check URL params are preserved for filtering

Status: DONE ✅ / PARTIAL ⚠️ / NOT DONE ❌
```

---

## Output Format

For each section, provide:

```
### [Phase].[Task]

Status: ✅ DONE / ⚠️ PARTIAL / ❌ NOT DONE

Current: [What currently exists / error message if broken]

Expected: [From spec]

Missing:
- [Item 1]
- [Item 2]

Blockers:
- [If any API calls fail / missing data]

Notes:
- [Additional context]
```

---

## Priority for Next Sprint

**CRITICAL (Must complete):**
- Phase A: Data seeding (affects all other phases)
- Phase B: Dashboard redesign (core user experience)
- Phase C: Monitor/Analytics pages (main product value)

**HIGH (Next):**
- Phase D: Presentations (revenue feature)
- Phase E: Chat + deep-linking (UX polish)

---

## Quick Commands

```bash
# Check backend health
curl https://api-production-456b.up.railway.app/health

# Check frontend build
curl https://main.ethinos-cdp.pages.dev -I

# View backend logs (if Railway access available)
# Dashboard: https://dashboard.railway.app
```

---

**Report to:** This testing output feeds into the Phase A-E implementation plan.

