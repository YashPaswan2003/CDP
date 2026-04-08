/**
 * Optional API layer for Ethinos Marketing Platform.
 * Falls back to mock data when NEXT_PUBLIC_API_URL is not set or backend is unavailable.
 *
 * Usage:
 * const campaigns = await fetchCampaigns({ account_id: "acc-001", platform: "google" });
 */

import * as mockData from './mockData';

// Get API URL from environment - optional fallback to mock mode
const API_URL = process.env.NEXT_PUBLIC_API_URL;
const USE_MOCK = !API_URL;

// ========== HELPER ==========
async function fetchWithFallback<T>(
  endpoint: string,
  fallbackFn: () => T,
  options?: RequestInit,
): Promise<T> {
  if (USE_MOCK) {
    return fallbackFn();
  }

  try {
    const response = await fetch(`${API_URL}${endpoint}`, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...options?.headers,
      },
    });

    if (!response.ok) {
      throw new Error(`API error: ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    console.warn(`API call failed, falling back to mock data:`, error);
    return fallbackFn();
  }
}

// ========== CAMPAIGNS ==========
export async function fetchCampaigns(filters?: {
  account_id?: string;
  platform?: string;
}): Promise<any[]> {
  const params = new URLSearchParams();
  if (filters?.account_id) params.append('account_id', filters.account_id);
  if (filters?.platform) params.append('platform', filters.platform);

  const query = params.toString() ? `?${params.toString()}` : '';

  return fetchWithFallback(
    `/api/analytics/campaigns${query}`,
    () => {
      let campaigns = mockData.getMockCampaigns();
      if (filters?.platform) {
        campaigns = campaigns.filter((c) => c.platform === filters.platform);
      }
      return campaigns;
    },
  ).then((res: any) => res.campaigns || []);
}

// ========== AD GROUPS ==========
export async function fetchAdGroups(filters?: {
  account_id?: string;
  campaign_id?: string;
}): Promise<any[]> {
  const params = new URLSearchParams();
  if (filters?.account_id) params.append('account_id', filters.account_id);
  if (filters?.campaign_id) params.append('campaign_id', filters.campaign_id);

  const query = params.toString() ? `?${params.toString()}` : '';

  return fetchWithFallback(
    `/api/analytics/ad-groups${query}`,
    () => {
      let adGroups = mockData.getMockAdGroups();
      if (filters?.campaign_id) {
        adGroups = adGroups.filter((ag) => ag.campaignId === filters.campaign_id);
      }
      return adGroups;
    },
  ).then((res: any) => res.ad_groups || []);
}

// ========== AD SETS ==========
export async function fetchAdSets(filters?: {
  account_id?: string;
  campaign_id?: string;
}): Promise<any[]> {
  const params = new URLSearchParams();
  if (filters?.account_id) params.append('account_id', filters.account_id);
  if (filters?.campaign_id) params.append('campaign_id', filters.campaign_id);

  const query = params.toString() ? `?${params.toString()}` : '';

  return fetchWithFallback(
    `/api/analytics/ad-sets${query}`,
    () => {
      let adSets = mockData.getAdSets();
      if (filters?.campaign_id) {
        adSets = adSets.filter((as) => as.campaignId === filters.campaign_id);
      }
      return adSets;
    },
  ).then((res: any) => res.ad_sets || []);
}

// ========== INSERTION ORDERS ==========
export async function fetchInsertionOrders(filters?: {
  account_id?: string;
  campaign_id?: string;
}): Promise<any[]> {
  const params = new URLSearchParams();
  if (filters?.account_id) params.append('account_id', filters.account_id);
  if (filters?.campaign_id) params.append('campaign_id', filters.campaign_id);

  const query = params.toString() ? `?${params.toString()}` : '';

  return fetchWithFallback(
    `/api/analytics/insertion-orders${query}`,
    () => {
      let ios = mockData.getInsertionOrders();
      return ios;
    },
  ).then((res: any) => res.insertion_orders || []);
}

// ========== LINE ITEMS ==========
export async function fetchLineItems(filters?: {
  account_id?: string;
  insertion_order_id?: string;
}): Promise<any[]> {
  const params = new URLSearchParams();
  if (filters?.account_id) params.append('account_id', filters.account_id);
  if (filters?.insertion_order_id)
    params.append('insertion_order_id', filters.insertion_order_id);

  const query = params.toString() ? `?${params.toString()}` : '';

  return fetchWithFallback(
    `/api/analytics/line-items${query}`,
    () => {
      let lineItems = mockData.getLineItems();
      if (filters?.insertion_order_id) {
        lineItems = lineItems.filter(
          (li) => li.insertionOrderId === filters.insertion_order_id,
        );
      }
      return lineItems;
    },
  ).then((res: any) => res.line_items || []);
}

// ========== GEO DATA ==========
export async function fetchGeoData(filters?: {
  account_id?: string;
  platform?: string;
  state?: string;
}): Promise<any[]> {
  const params = new URLSearchParams();
  if (filters?.account_id) params.append('account_id', filters.account_id);
  if (filters?.platform) params.append('platform', filters.platform);
  if (filters?.state) params.append('state', filters.state);

  const query = params.toString() ? `?${params.toString()}` : '';

  return fetchWithFallback(
    `/api/analytics/geo${query}`,
    () => {
      let geo = mockData.getGeoData();
      if (filters?.platform) {
        geo = geo.filter((g) => g.platform === filters.platform);
      }
      if (filters?.state) {
        geo = geo.filter((g) => g.state === filters.state);
      }
      return geo;
    },
  ).then((res: any) => res.geo || []);
}

// ========== DEMOGRAPHICS ==========
export async function fetchDemographics(filters?: {
  account_id?: string;
  platform?: string;
  dimension?: string;
}): Promise<any[]> {
  const params = new URLSearchParams();
  if (filters?.account_id) params.append('account_id', filters.account_id);
  if (filters?.platform) params.append('platform', filters.platform);
  if (filters?.dimension) params.append('dimension', filters.dimension);

  const query = params.toString() ? `?${params.toString()}` : '';

  return fetchWithFallback(
    `/api/analytics/demographics${query}`,
    () => {
      let demos = mockData.getDemographicData();
      if (filters?.platform) {
        demos = demos.filter((d) => d.platform === filters.platform);
      }
      if (filters?.dimension) {
        demos = demos.filter((d) => d.dimension === filters.dimension);
      }
      return demos;
    },
  ).then((res: any) => res.demographics || []);
}

// ========== PLACEMENTS ==========
export async function fetchPlacements(filters?: {
  account_id?: string;
  platform?: string;
}): Promise<any[]> {
  const params = new URLSearchParams();
  if (filters?.account_id) params.append('account_id', filters.account_id);
  if (filters?.platform) params.append('platform', filters.platform);

  const query = params.toString() ? `?${params.toString()}` : '';

  return fetchWithFallback(
    `/api/analytics/placements${query}`,
    () => {
      let placements = mockData.getPlacements();
      if (filters?.platform) {
        placements = placements.filter((p) => p.placementType === filters.platform);
      }
      return placements;
    },
  ).then((res: any) => res.placements || []);
}

// ========== CREATIVES ==========
export async function fetchCreatives(filters?: {
  account_id?: string;
  platform?: string;
  campaign_id?: string;
}): Promise<any[]> {
  const params = new URLSearchParams();
  if (filters?.account_id) params.append('account_id', filters.account_id);
  if (filters?.platform) params.append('platform', filters.platform);
  if (filters?.campaign_id) params.append('campaign_id', filters.campaign_id);

  const query = params.toString() ? `?${params.toString()}` : '';

  return fetchWithFallback(
    `/api/analytics/creatives${query}`,
    () => {
      let creatives = mockData.getCreatives();
      if (filters?.platform) {
        creatives = creatives.filter((c) => c.platform === filters.platform);
      }
      return creatives;
    },
  ).then((res: any) => res.creatives || []);
}

// ========== SEARCH TERMS ==========
export async function fetchSearchTerms(
  account_id?: string,
): Promise<any[]> {
  const params = new URLSearchParams();
  if (account_id) params.append('account_id', account_id);

  const query = params.toString() ? `?${params.toString()}` : '';

  return fetchWithFallback(
    `/api/analytics/search-terms${query}`,
    () => mockData.getSearchTerms(),
  ).then((res: any) => res.search_terms || []);
}

// ========== PMAX CHANNELS ==========
export async function fetchPMaxChannels(account_id?: string): Promise<any[]> {
  const params = new URLSearchParams();
  if (account_id) params.append('account_id', account_id);

  const query = params.toString() ? `?${params.toString()}` : '';

  return fetchWithFallback(
    `/api/analytics/pmax-channels${query}`,
    () => mockData.getPMaxChannels(),
  ).then((res: any) => res.pmax_channels || []);
}

// ========== DAILY METRICS ==========
export async function fetchDailyMetrics(filters?: {
  account_id?: string;
  campaign_id?: string;
  platform?: string;
}): Promise<any[]> {
  const params = new URLSearchParams();
  if (filters?.account_id) params.append('account_id', filters.account_id);
  if (filters?.campaign_id) params.append('campaign_id', filters.campaign_id);
  if (filters?.platform) params.append('platform', filters.platform);

  const query = params.toString() ? `?${params.toString()}` : '';

  return fetchWithFallback(
    `/api/analytics/daily-metrics${query}`,
    () => {
      let metrics = mockData.generateDailyMetrics();
      if (filters?.platform) {
        metrics = metrics.filter((m) => m.platform === filters.platform);
      }
      return metrics;
    },
  ).then((res: any) => res.daily_metrics || []);
}

// ========== FUNNEL ==========
export async function fetchFunnel(
  platform: 'google' | 'dv360' | 'meta',
  clientType: 'app' | 'web' = 'web',
): Promise<any[]> {
  const params = new URLSearchParams();
  params.append('platform', platform);
  params.append('client_type', clientType);

  return fetchWithFallback(
    `/api/analytics/funnel?${params.toString()}`,
    () => mockData.getFunnelData(platform, clientType),
  ).then((res: any) => res.funnel || []);
}

// ========== PERIOD COMPARISON ==========
export async function fetchPeriodComparison(): Promise<any> {
  return fetchWithFallback(
    `/api/analytics/period-comparison`,
    () => mockData.getPeriodComparisons(),
  );
}

// ========== DASHBOARD API ==========
export const dashboardAPI = {
  getMetrics: async (accountId: string) => {
    try {
      const campaigns = await fetchCampaigns({ account_id: accountId });

      // Aggregate metrics from campaigns with reach/frequency/views per platform
      const byPlatform: Record<string, any> = {
        google: { impressions: 0, reach: 0, frequency: 0, views: 0, spend: 0, revenue: 0, clicks: 0, conversions: 0 },
        dv360: { impressions: 0, reach: 0, frequency: 0, views: 0, spend: 0, revenue: 0, clicks: 0, conversions: 0 },
        meta: { impressions: 0, reach: 0, frequency: 0, views: 0, spend: 0, revenue: 0, clicks: 0, conversions: 0 },
      };

      const aggregated = campaigns.reduce(
        (acc, campaign) => {
          const platform = campaign.platform;
          byPlatform[platform].impressions += campaign.impressions || 0;
          byPlatform[platform].reach += campaign.reach || 0;
          byPlatform[platform].frequency = campaign.frequency || byPlatform[platform].frequency;
          byPlatform[platform].views += campaign.views || 0;
          byPlatform[platform].spend += campaign.spent || 0;
          byPlatform[platform].revenue += campaign.revenue || 0;
          byPlatform[platform].clicks += campaign.clicks || 0;
          byPlatform[platform].conversions += campaign.conversions || 0;

          return {
            total_spend: acc.total_spend + (campaign.spent || 0),
            total_revenue: acc.total_revenue + (campaign.revenue || 0),
            total_impressions: acc.total_impressions + (campaign.impressions || 0),
            total_clicks: acc.total_clicks + (campaign.clicks || 0),
            total_conversions: acc.total_conversions + (campaign.conversions || 0),
            total_views: acc.total_views + (campaign.views || 0),
          };
        },
        {
          total_spend: 0,
          total_revenue: 0,
          total_impressions: 0,
          total_clicks: 0,
          total_conversions: 0,
          total_views: 0,
        }
      );

      return {
        data: {
          client_name: 'Client',
          campaigns: campaigns.map((c) => ({
            campaign_name: c.name,
            platform: c.platform,
            total_spend: c.spent,
            total_revenue: c.revenue,
            total_impressions: c.impressions,
            total_clicks: c.clicks,
            total_conversions: c.conversions,
            roas: (c.revenue / c.spent) || 0,
            cpm: (c.spent / (c.impressions / 1000)) || 0,
            cpc: (c.spent / c.clicks) || 0,
          })),
          ...aggregated,
          byPlatform,
        },
      };
    } catch (error) {
      console.error('Dashboard API error:', error);
      throw error;
    }
  },
};

// ========== STUB APIS FOR PHASE 0 ==========
// These are stubs to satisfy imports in auth, chat, upload pages during Phase 0.
// Phase 1 will replace these with real backend calls.
export const authAPI = {
  login: async (_email: string, _password: string) => ({
    data: { access_token: "mock-token" },
  }),
  register: async (_email: string, _password: string, _name: string) => ({
    data: { access_token: "mock-token" },
  }),
};

export const chatAPI = {
  sendMessage: async (_clientId: string, _messages: any[]) => ({
    data: { message: "Mock response from Claude" },
  }),
};

export const uploadAPI = {
  upload: async (_file: File) => ({
    data: {},
  }),
  uploadCSV: async (file: File, _clientId: string, _platform: string) => ({
    data: { filename: file.name, rows_imported: 0, status: "success" },
  }),
};
