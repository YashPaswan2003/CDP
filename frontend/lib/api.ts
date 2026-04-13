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
    // Get JWT token from localStorage
    const token = typeof window !== "undefined" ? localStorage.getItem("token") : null;

    const headersObj: Record<string, string> = {
      'Content-Type': 'application/json',
    };

    if (options?.headers) {
      const existingHeaders = options.headers as Record<string, string>;
      Object.assign(headersObj, existingHeaders);
    }

    if (token) {
      headersObj['Authorization'] = `Bearer ${token}`;
    }

    const response = await fetch(`${API_URL}${endpoint}`, {
      ...options,
      headers: headersObj,
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
      return { campaigns };
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
      return { ad_groups: adGroups };
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
      return { ad_sets: adSets };
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
      return { insertion_orders: ios };
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
      return { line_items: lineItems };
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
      return { geo };
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
      return { demographics: demos };
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
      return { placements };
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
      return { creatives };
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
    () => ({ search_terms: mockData.getSearchTerms() }),
  ).then((res: any) => res.search_terms || []);
}

// ========== PMAX CHANNELS ==========
export async function fetchPMaxChannels(account_id?: string): Promise<any[]> {
  const params = new URLSearchParams();
  if (account_id) params.append('account_id', account_id);

  const query = params.toString() ? `?${params.toString()}` : '';

  return fetchWithFallback(
    `/api/analytics/pmax-channels${query}`,
    () => ({ pmax_channels: mockData.getPMaxChannels() }),
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
      return { daily_metrics: metrics };
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
    () => ({ funnel: mockData.getFunnelData(platform, clientType) }),
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

// ========== ALERTS ==========
export async function fetchAlerts(filters?: {
  account_id?: string;
  date_from?: string;
  date_to?: string;
}): Promise<any[]> {
  const params = new URLSearchParams();
  if (filters?.account_id) params.append('account_id', filters.account_id);
  if (filters?.date_from) params.append('date_from', filters.date_from);
  if (filters?.date_to) params.append('date_to', filters.date_to);

  const query = params.toString() ? `?${params.toString()}` : '';

  return fetchWithFallback(
    `/api/alerts${query}`,
    () => {
      // Mock alerts for demo
      return {
        alerts: [
          {
            id: 'alert_roas_demo',
            severity: 'error',
            message: 'ROAS dropped 40% vs last week on Google (Summer Sale)',
            campaign: 'Summer Sale',
            platform: 'google',
            targetPage: '/dashboard/analytics/google-ads?campaign=Summer+Sale',
          },
          {
            id: 'alert_freq_demo',
            severity: 'warning',
            message: 'Meta frequency >5x — audience fatigue risk',
            campaign: 'Retargeting 2026',
            platform: 'meta',
            targetPage: '/dashboard/analytics/meta?campaign=Retargeting+2026',
          },
          {
            id: 'alert_budget_demo',
            severity: 'success',
            message: 'DV360 on track — 98% budget utilization',
            campaign: 'DV360 Q2',
            platform: 'dv360',
            targetPage: '/dashboard/analytics/dv360?campaign=DV360+Q2',
          },
        ],
      };
    },
  ).then((res: any) => res.alerts || []);
}

// ========== FLAGS (MONITOR/DIAGNOSE/ACT) ==========
export async function getFlags(accountId: string): Promise<any> {
  const params = new URLSearchParams();
  params.append('account_id', accountId);

  return fetchWithFallback(
    `/api/flags?${params.toString()}`,
    () => ({
      flags: [
        {
          metric: "roas",
          current: 2.5,
          previous: 3.2,
          entities: ["camp_001"],
          entity_count: 1,
          severity: "high",
          explanation: "ROAS dropped 21.9% (2.50 vs 3.20). May indicate audience saturation or quality issues.",
          actions: [
            { type: "pause", label: "Pause campaign", severity: "high" },
            { type: "review_quality", label: "Review quality score", severity: "medium" },
            { type: "details", label: "View details", severity: "low" },
          ],
        },
        {
          metric: "conversions",
          entities: ["kw_123", "kw_456"],
          entity_count: 2,
          severity: "high",
          explanation: "2 keywords have spend but zero conversions. Check tracking setup or landing page experience.",
          actions: [
            { type: "pause", label: "Pause keywords", severity: "high" },
            { type: "review_quality", label: "Check tracking", severity: "medium" },
            { type: "details", label: "View details", severity: "low" },
          ],
        },
        {
          metric: "frequency",
          current: 5.8,
          entities: ["camp_002"],
          entity_count: 1,
          severity: "medium",
          explanation: "Meta frequency at 5.80x (threshold: 5.00). Risk of audience fatigue and ad blindness.",
          actions: [
            { type: "adjust_bid", label: "Increase budget for expansion", severity: "medium" },
            { type: "details", label: "View audience overlap", severity: "low" },
          ],
        },
      ],
      severity_distribution: { high: 2, medium: 1, low: 0 },
    }),
  );
}

// ========== CONFIG (CLIENT SETUP) ==========
export async function getConfig(accountId: string): Promise<any> {
  const params = new URLSearchParams();
  params.append('account_id', accountId);

  return fetchWithFallback(
    `/api/config?${params.toString()}`,
    () => ({
      id: "cfg_demo",
      account_id: accountId,
      roas_threshold: 3.0,
      cpa_threshold: 50,
      spend_pace_pct: 100.0,
      ctr_threshold: 0.02,
      cvr_threshold: 0.02,
      quality_score_threshold: 7,
      frequency_threshold: 5.0,
      currency: "INR",
      is_configured: false,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    }),
  );
}

export async function setConfig(accountId: string, config: any): Promise<any> {
  const params = new URLSearchParams();
  params.append('account_id', accountId);

  return fetchWithFallback(
    `/api/config?${params.toString()}`,
    () => ({
      ...config,
      id: "cfg_demo",
      account_id: accountId,
      is_configured: true,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    }),
    {
      method: "POST",
      body: JSON.stringify(config),
    },
  );
}

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
  sendMessage: async (clientId: string, messages: any[]) => {
    return fetchWithFallback(
      `/api/chat`,
      () => ({
        data: { message: "Mock response from Claude about your campaigns" },
      }),
      {
        method: "POST",
        body: JSON.stringify({
          client_id: clientId,
          messages: messages,
        }),
      },
    );
  },
  sendMessageWithContext: async (
    message: string,
    context: {
      account_id: string;
      page: string;
      date_from?: string;
      date_to?: string;
    },
  ) => {
    return fetchWithFallback(
      `/api/chat`,
      () => ({
        response: "Mock response from Claude about your campaigns",
      }),
      {
        method: "POST",
        body: JSON.stringify({
          message: message,
          context: context,
        }),
      },
    );
  },
};

export const uploadAPI = {
  upload: async (_file: File) => ({
    data: {},
  }),
  uploadCSV: async (file: File, _clientId: string, _platform: string) => ({
    data: { filename: file.name, rows_imported: 0, status: "success" },
  }),
};

// ========== ACTIONS (EXECUTION) ==========
export async function executeAction(
  accountId: string,
  actionType: string,
  entityType: string,
  entityId: string,
  parameters?: Record<string, any>,
): Promise<any> {
  return fetchWithFallback(
    `/api/actions/${actionType}`,
    () => ({
      success: true,
      message: `Action ${actionType} executed successfully`,
      action_type: actionType,
      updated_entity: {
        entity_id: entityId,
        entity_type: entityType,
        field: actionType === 'pause' || actionType === 'resume' ? 'status' : 'budget',
        previous_value: 'unknown',
        new_value: 'updated',
      },
      timestamp: new Date().toISOString(),
    }),
    {
      method: "POST",
      body: JSON.stringify({
        entity_type: entityType,
        entity_id: entityId,
        account_id: accountId,
        parameters: parameters,
      }),
    },
  );
}
