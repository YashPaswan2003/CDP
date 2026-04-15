/**
 * Analytics Helper Functions
 * Utilities for navigating to platform-specific analytics pages
 */

/**
 * Get the base path for a platform's analytics section
 * @param platform - 'google' | 'dv360' | 'meta'
 * @returns Full path to analytics overview page
 */
export function getAnalyticsPath(platform: 'google' | 'dv360' | 'meta'): string {
  const paths: Record<'google' | 'dv360' | 'meta', string> = {
    google: '/dashboard/analytics/google-ads',
    dv360: '/dashboard/analytics/dv360',
    meta: '/dashboard/analytics/meta',
  };
  return paths[platform];
}

interface DeepLinkOptions {
  accountId?: string;
  dateFrom?: string;
  dateTo?: string;
  view?: 'campaign' | 'analytics';
}

/**
 * Build deep-link URL with campaign filter and optional context
 * @param platform - 'google' | 'dv360' | 'meta'
 * @param campaignName - Campaign name to filter by
 * @param options - Optional { accountId, dateFrom, dateTo }
 * @returns Full URL with campaign and context query parameters
 *
 * Example: `/dashboard/analytics/google-ads?campaign=YouTube&account_id=ethinos&date_from=2026-04-01&date_to=2026-04-10`
 */
export function buildCampaignDeepLink(
  platform: 'google' | 'dv360' | 'meta',
  campaignName: string,
  options?: DeepLinkOptions,
): string {
  // When view === 'campaign', route to the dedicated campaign detail page
  if (options?.view === 'campaign') {
    const encodedName = encodeURIComponent(campaignName);
    const params = new URLSearchParams();
    if (options?.accountId) {
      params.set('account_id', options.accountId);
    }
    params.set('platform', platform);
    if (options?.dateFrom) {
      params.set('date_from', options.dateFrom);
    }
    if (options?.dateTo) {
      params.set('date_to', options.dateTo);
    }
    return `/dashboard/campaigns/${encodedName}?${params.toString()}`;
  }

  // Default: route to platform analytics page with campaign filter
  const basePath = getAnalyticsPath(platform);
  const params = new URLSearchParams();

  // Required parameter
  params.set('campaign', campaignName);

  // Optional context parameters
  if (options?.accountId) {
    params.set('account_id', options.accountId);
  }
  if (options?.dateFrom) {
    params.set('date_from', options.dateFrom);
  }
  if (options?.dateTo) {
    params.set('date_to', options.dateTo);
  }

  return `${basePath}?${params.toString()}`;
}
