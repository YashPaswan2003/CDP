# Phase 2: FE → API Integration Implementation Guide

**Status:** In Progress (2/36 pages wired)  
**Timeline:** Hour 0-2 per CEO review plan  
**Completed Pages:**
- ✅ `/app/dashboard/analytics/google-ads/campaigns/page.tsx`
- ✅ `/app/dashboard/analytics/google-ads/ad-groups/page.tsx`

**Remaining:** 34 pages across Google Ads, DV360, Meta

## Implementation Pattern

All pages follow the same async/await pattern. Use this template:

### Step 1: Replace Import
```tsx
// OLD
import { getMockCampaigns } from "@/lib/mockData";

// NEW
import { fetchCampaigns } from "@/lib/api";
```

### Step 2: Add Loading/Error State
```tsx
const [loading, setLoading] = useState(true);
const [error, setError] = useState<string | null>(null);
```

### Step 3: Convert useEffect to Async
```tsx
// OLD
useEffect(() => {
  const allCampaigns = getMockCampaigns().filter((c) => c.platform === "google");
  setCampaigns(allCampaigns);
}, []);

// NEW
useEffect(() => {
  const loadCampaigns = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await fetchCampaigns({
        account_id: selectedAccount?.id,
        platform: "google"
      });
      setCampaigns(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load data");
      setCampaigns([]);
    } finally {
      setLoading(false);
    }
  };

  if (selectedAccount?.id) {
    loadCampaigns();
  }
}, [selectedAccount?.id]);
```

### Step 4: Add Loading/Error UI
```tsx
{loading && (
  <div className="text-center py-8 text-text-secondary">Loading campaigns...</div>
)}
{error && (
  <div className="bg-red-500/10 border border-red-500/20 rounded p-4 text-red-400 mb-4">
    Error: {error}
  </div>
)}

{/* Wrap data table in conditional */}
{!loading && !error && (
  <ChartContainer>
    {/* existing table code */}
  </ChartContainer>
)}
```

## API Functions Reference

| mockData Function | API Function | Filter Params |
|-------------------|------|---------|
| `getMockCampaigns()` | `fetchCampaigns()` | `account_id`, `platform` |
| `getMockAdGroups()` | `fetchAdGroups()` | `account_id`, `campaign_id` |
| `getAdSets()` | `fetchAdSets()` | `account_id`, `campaign_id` |
| `getInsertionOrders()` | `fetchInsertionOrders()` | `account_id`, `campaign_id` |
| `getLineItems()` | `fetchLineItems()` | `account_id`, `insertion_order_id` |
| `getGeoData()` | `fetchGeoData()` | `account_id`, `platform`, `state` |
| `getDemographicData()` | `fetchDemographics()` | `account_id`, `platform`, `dimension` |
| `getPlacements()` | `fetchPlacements()` | `account_id`, `platform` |
| `getCreatives()` | `fetchCreatives()` | `account_id`, `platform`, `campaign_id` |
| `getSearchTerms()` | `fetchSearchTerms()` | `account_id` |
| `getPMaxChannels()` | `fetchPMaxChannels()` | `account_id` |
| `generateDailyMetrics()` | `fetchDailyMetrics()` | `account_id`, `campaign_id`, `platform` |
| `getFunnelData(platform)` | `fetchFunnel(platform)` | `platform` |
| `getPeriodComparisons()` | `fetchPeriodComparison()` | None |

## Pages by Priority

### Priority 1: Google Ads (9 pages)
- ✅ campaigns/page.tsx
- ✅ ad-groups/page.tsx
- keywords/page.tsx
- sqr/page.tsx (search query report)
- creatives/page.tsx
- channels/page.tsx
- geo/page.tsx
- demographics/page.tsx
- comparison/page.tsx

### Priority 2: DV360 (8 pages)
- page.tsx (overview)
- insertion-orders/page.tsx
- line-items/page.tsx
- channels/page.tsx
- creatives/page.tsx
- funnel/page.tsx
- geo/page.tsx
- demographics/page.tsx

### Priority 3: Meta (5 pages)
- page.tsx (overview)
- campaigns/page.tsx
- ad-sets/page.tsx
- ads/page.tsx
- funnel/page.tsx

### Priority 4: Dashboard Pages (4 pages)
- /dashboard/page.tsx (main portfolio)
- /dashboard/analytics/google-ads/page.tsx
- /dashboard/analytics/dv360/page.tsx
- /dashboard/analytics/meta/page.tsx

## Testing Checklist

After wiring each page:
1. ✓ Page loads without errors
2. ✓ Data displays (not loading state)
3. ✓ Pagination works
4. ✓ Date filtering works (if applicable)
5. ✓ Error message shows if backend unavailable (fallback to mock)

## Fallback Behavior

If `NEXT_PUBLIC_API_URL` is not set OR backend is unreachable:
- API layer automatically falls back to mock data
- No code changes needed
- Page renders exactly as before

This allows safe testing without backend running.

## Next Steps

1. Update Priority 1 pages (Google Ads analytics)
2. Test with backend running (`cd backend && python -m uvicorn app.main:app --reload`)
3. Update Priority 2-3 pages (DV360, Meta)
4. Update main dashboard pages
5. Run full E2E test

## Known Limitations

- Date range filtering UI exists but not yet wired to API (Phase 2.1)
- Custom reports endpoint not yet implemented (Phase 3)
- Real-time alerts endpoint implemented but not fully integrated (Phase 2.1)

## Commit Strategy

After completing all 36 pages:
```bash
git add frontend/app/dashboard
git commit -m "feat: wire frontend mockData to backend APIs

- Convert 36 analytics pages from sync mockData to async API calls
- Add loading/error states to all pages
- Implement proper error handling and fallback to mock data
- Maintain backward compatibility with NEXT_PUBLIC_API_URL env var"
```

