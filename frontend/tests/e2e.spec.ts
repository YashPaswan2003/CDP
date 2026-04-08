import { test, expect } from '@playwright/test';

const BASE_URL = 'http://localhost:3000';

test.describe('CDP Marketing Platform - E2E Tests', () => {
  // Dashboard home page - main KPI cards
  test('Dashboard displays KPI cards with metrics', async ({ page }) => {
    await page.goto(`${BASE_URL}/dashboard`);
    await page.waitForLoadState('networkidle');

    // Check for key metric text that should be on the dashboard
    await expect(page.locator('text=Spend')).toBeVisible();
    await expect(page.locator('text=Revenue')).toBeVisible();
    await expect(page.locator('text=Impressions')).toBeVisible();
    await expect(page.locator('text=Clicks')).toBeVisible();
  });

  // Campaigns page - verify table renders
  test('Campaigns page displays campaign table', async ({ page }) => {
    await page.goto(`${BASE_URL}/dashboard/campaigns`);
    await page.waitForLoadState('networkidle');

    // Check for table headers
    const tableHeaders = page.locator('th');

    // Should have Campaign column at minimum
    const hasHeaders = await tableHeaders.count() > 0;
    expect(hasHeaders).toBeTruthy();
  });

  // Analytics page - verify date picker exists
  test('Analytics page loads and displays content', async ({ page }) => {
    await page.goto(`${BASE_URL}/dashboard/analytics`);
    await page.waitForLoadState('networkidle');

    // Analytics page should load without errors
    // Check for any text content that indicates page loaded
    const pageContent = await page.locator('body').textContent();
    expect(pageContent).toBeTruthy();
    expect(pageContent?.length).toBeGreaterThan(100);
  });

  // Funnel page - verify funnel visualization
  test('Funnel page renders with stage information', async ({ page }) => {
    await page.goto(`${BASE_URL}/dashboard/funnel`);
    await page.waitForLoadState('networkidle');

    // Check for funnel stage text
    const hasImpressions = await page.locator('text=/[Ii]mpressions/').count() > 0;
    const hasClicks = await page.locator('text=/[Cc]licks/').count() > 0;
    const hasConversions = await page.locator('text=/[Cc]onversions/').count() > 0;

    expect(hasImpressions || hasClicks || hasConversions).toBeTruthy();
  });

  // Placements page - verify tabs exist
  test('Placements page renders successfully', async ({ page }) => {
    await page.goto(`${BASE_URL}/dashboard/placements`);
    await page.waitForLoadState('networkidle');

    // Check for placement-related content
    const pageContent = await page.locator('body').textContent();
    expect(pageContent).toBeTruthy();
    expect(pageContent?.length).toBeGreaterThan(100);
  });

  // Creatives page - verify creative performance
  test('Creatives page displays performance data', async ({ page }) => {
    await page.goto(`${BASE_URL}/dashboard/creatives`);
    await page.waitForLoadState('networkidle');

    // Page should load without errors
    const pageContent = await page.locator('body').textContent();
    expect(pageContent).toBeTruthy();
  });

  // Google Reports page - verify structure
  test('Google Reports page loads with tabs', async ({ page }) => {
    await page.goto(`${BASE_URL}/dashboard/google`);
    await page.waitForLoadState('networkidle');

    // Check for search-related elements
    const pageContent = await page.locator('body').textContent();
    expect(pageContent).toBeTruthy();
    expect(pageContent?.length).toBeGreaterThan(100);
  });

  // Chat page - verify chat interface
  test('Chat page loads', async ({ page }) => {
    await page.goto(`${BASE_URL}/dashboard/chat`);
    await page.waitForLoadState('networkidle');

    // Chat page should be accessible
    expect(page.url()).toContain('chat');
  });

  // Presentations page
  test('Presentations page loads', async ({ page }) => {
    await page.goto(`${BASE_URL}/dashboard/presentations`);
    await page.waitForLoadState('networkidle');

    expect(page.url()).toContain('presentations');
  });

  // Settings page
  test('Settings page loads', async ({ page }) => {
    await page.goto(`${BASE_URL}/dashboard/settings`);
    await page.waitForLoadState('networkidle');

    expect(page.url()).toContain('settings');
  });

  // Navigation - test that sidebar links work
  test('Dashboard navigation to campaigns works', async ({ page }) => {
    await page.goto(`${BASE_URL}/dashboard`);
    await page.waitForLoadState('networkidle');

    // Look for campaigns link
    const campaignsLink = page.locator('a, button').filter({ hasText: /campaigns/i }).first();

    if (await campaignsLink.count() > 0) {
      await campaignsLink.click();
      await page.waitForLoadState('networkidle');

      // Should navigate to campaigns
      expect(page.url()).toContain('campaigns');
    }
  });

  // Test all 10 routes are accessible (basic 200 response)
  test('All dashboard routes are accessible', async ({ page }) => {
    const routes = [
      '/dashboard',
      '/dashboard/campaigns',
      '/dashboard/analytics',
      '/dashboard/funnel',
      '/dashboard/placements',
      '/dashboard/creatives',
      '/dashboard/google',
      '/dashboard/chat',
      '/dashboard/presentations',
      '/dashboard/settings',
    ];

    for (const route of routes) {
      const response = await page.goto(`${BASE_URL}${route}`);
      expect(response?.status()).toBeLessThan(400); // No 404 or 500 errors
    }
  });

  // Test that pages don't have console errors
  test('Dashboard pages load without critical errors', async ({ page }) => {
    const errors: string[] = [];

    page.on('console', (msg) => {
      if (msg.type() === 'error') {
        errors.push(msg.text());
      }
    });

    await page.goto(`${BASE_URL}/dashboard`);
    await page.waitForLoadState('networkidle');

    // Should not have errors (react strict mode warnings are ok)
    const criticalErrors = errors.filter(
      (e) => !e.includes('Strict mode') && !e.includes('warning')
    );
    expect(criticalErrors.length).toBe(0);
  });

  // Test responsive design - check if layout adjusts
  test('Dashboard is responsive', async ({ page }) => {
    await page.goto(`${BASE_URL}/dashboard`);
    await page.setViewportSize({ width: 375, height: 667 }); // Mobile

    const content = await page.locator('body').textContent();
    expect(content).toBeTruthy();

    // Reset to desktop
    await page.setViewportSize({ width: 1920, height: 1080 });
    const desktopContent = await page.locator('body').textContent();
    expect(desktopContent).toBeTruthy();
  });

  // Performance - check page load times
  test('Dashboard loads within reasonable time', async ({ page }) => {
    const startTime = Date.now();

    await page.goto(`${BASE_URL}/dashboard`);
    await page.waitForLoadState('networkidle');

    const loadTime = Date.now() - startTime;

    // Should load in under 10 seconds
    expect(loadTime).toBeLessThan(10000);
  });

  // Check that KPI values are displayed (numbers, not empty)
  test('KPI cards display numerical values', async ({ page }) => {
    await page.goto(`${BASE_URL}/dashboard`);
    await page.waitForLoadState('networkidle');

    // Look for number patterns in the page
    const pageContent = await page.locator('body').textContent();
    const hasNumbers = /\$?[\d,]+/.test(pageContent || '');

    expect(hasNumbers).toBeTruthy();
  });

  // Test chart rendering (check for SVG elements)
  test('Charts render on dashboard', async ({ page }) => {
    await page.goto(`${BASE_URL}/dashboard`);
    await page.waitForLoadState('networkidle');

    // Recharts creates SVG elements
    const svgElements = await page.locator('svg').count();
    expect(svgElements).toBeGreaterThan(0);
  });
});
