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

/**
 * Build deep-link URL with campaign filter
 * @param platform - 'google' | 'dv360' | 'meta'
 * @param campaignName - Campaign name to filter by
 * @returns Full URL with campaign query parameter
 */
export function buildCampaignDeepLink(
  platform: 'google' | 'dv360' | 'meta',
  campaignName: string,
): string {
  const basePath = getAnalyticsPath(platform);
  return `${basePath}?campaign=${encodeURIComponent(campaignName)}`;
}
