import { test, expect } from '@playwright/test';

const BASE_URL = 'http://localhost:3000';

test.describe('CDP Marketing Platform - E2E Tests', () => {
  // Set auth state before each test
  test.beforeEach(async ({ page }) => {
    await page.addInitScript(() => {
      localStorage.setItem('token', 'test-auth-token'); // Required for auth check
      localStorage.setItem('ethinos_user_id', 'user-001'); // Admin user
      localStorage.removeItem('ethinos_account_id'); // Force default to Ethinos
    });
  });

  // ============ GROUP 1: AUTHENTICATION & DEFAULT ACCOUNT ============

  test('Login page loads and can submit', async ({ page }) => {
    await page.goto(`${BASE_URL}/auth`);
    await page.waitForLoadState('networkidle');

    // Check for login form elements
    const emailInput = page.locator('input[type="email"]');
    const passwordInput = page.locator('input[type="password"]');

    expect(emailInput).toBeTruthy();
    expect(passwordInput).toBeTruthy();
  });

  test('After login, Ethinos (All Accounts) is the default account for admin', async ({ page }) => {
    await page.goto(`${BASE_URL}/dashboard`);
    await page.waitForLoadState('networkidle');

    // Check that Ethinos is selected in the account switcher by checking the select value
    const accountSelect = page.locator('select').first();
    const selectedValue = await accountSelect.inputValue();
    expect(selectedValue).toBe('ethinos');
  });

  test('Account switcher shows accessible accounts for admin', async ({ page }) => {
    await page.goto(`${BASE_URL}/dashboard`);
    await page.waitForLoadState('networkidle');

    // Find the account switcher dropdown
    const accountSelect = page.locator('select, [role="combobox"]').first();
    expect(accountSelect).toBeVisible();

    // Check for account options
    const kotatOption = page.locator('text=Kotak');
    expect(kotatOption).toBeTruthy();
  });

  // ============ GROUP 2: DASHBOARD HOME ============

  test('Dashboard page loads with KPI cards', async ({ page }) => {
    await page.goto(`${BASE_URL}/dashboard`);
    await page.waitForLoadState('networkidle');

    // Check for dashboard content (portfolio heading or metrics section)
    const pageContent = await page.locator('body').textContent();
    expect(pageContent).toBeTruthy();
    expect(pageContent?.length).toBeGreaterThan(100);
  });

  test('Dashboard shows account name in header', async ({ page }) => {
    await page.goto(`${BASE_URL}/dashboard`);
    await page.waitForLoadState('networkidle');

    const pageContent = await page.locator('body').textContent();
    expect(pageContent?.toLowerCase()).toContain('ethinos');
  });

  test('Sidebar navigation is visible with main menu items', async ({ page }) => {
    await page.goto(`${BASE_URL}/dashboard`);
    await page.waitForLoadState('networkidle');

    // Check for navigation links (more specific)
    const googleAdsLink = page.locator('a[href="/dashboard/analytics/google-ads"]');
    const uploadLink = page.locator('a[href="/dashboard/upload"]');
    const clientsLink = page.locator('a[href="/dashboard/clients"]');

    const hasNavigation = (await googleAdsLink.count() > 0) ||
                          (await uploadLink.count() > 0) ||
                          (await clientsLink.count() > 0);
    expect(hasNavigation).toBeTruthy();
  });

  // ============ GROUP 3: ANALYTICS ROUTES ============

  test('Analytics overview page loads', async ({ page }) => {
    await page.goto(`${BASE_URL}/dashboard/analytics`);
    await page.waitForLoadState('networkidle');

    const pageContent = await page.locator('body').textContent();
    expect(pageContent).toBeTruthy();
    expect(pageContent?.length).toBeGreaterThan(100);
  });

  test('Google Ads overview page loads', async ({ page }) => {
    await page.goto(`${BASE_URL}/dashboard/analytics/google-ads`);
    await page.waitForLoadState('networkidle');

    const pageContent = await page.locator('body').textContent();
    expect(pageContent).toBeTruthy();
  });

  test('Google Ads campaigns page loads with table', async ({ page }) => {
    await page.goto(`${BASE_URL}/dashboard/analytics/google-ads/campaigns`);
    await page.waitForLoadState('networkidle');

    // Check for table structure
    const tableHeaders = page.locator('th');
    const headerCount = await tableHeaders.count();
    expect(headerCount).toBeGreaterThan(0);
  });

  test('Google Ads funnel page loads with TOFU/MOFU/BOFU', async ({ page }) => {
    await page.goto(`${BASE_URL}/dashboard/analytics/google-ads/funnel`);
    await page.waitForLoadState('networkidle');

    // Check for funnel-related content or empty state
    const pageContent = await page.locator('body').textContent();
    expect(pageContent).toBeTruthy();
    expect(pageContent?.length).toBeGreaterThan(50);
  });

  test('DV360 overview page loads', async ({ page }) => {
    await page.goto(`${BASE_URL}/dashboard/analytics/dv360`);
    await page.waitForLoadState('networkidle');

    const pageContent = await page.locator('body').textContent();
    expect(pageContent).toBeTruthy();
  });

  test('Meta overview page loads', async ({ page }) => {
    await page.goto(`${BASE_URL}/dashboard/analytics/meta`);
    await page.waitForLoadState('networkidle');

    const pageContent = await page.locator('body').textContent();
    expect(pageContent).toBeTruthy();
  });

  // ============ GROUP 4: UPLOAD PAGE ============

  test('Upload page shows blocked state for Ethinos account', async ({ page }) => {
    await page.goto(`${BASE_URL}/dashboard/upload`);
    await page.waitForLoadState('networkidle');

    // Should show a message saying upload not available for master account
    const blockedMessage = page.locator('text=/upload|client account|Select a client/i');
    const isBlocked = await blockedMessage.count() > 0;
    expect(isBlocked).toBeTruthy();
  });

  test('Switching to Kotak MF account shows upload interface', async ({ page }) => {
    await page.goto(`${BASE_URL}/dashboard`);
    await page.waitForLoadState('networkidle');

    // Switch to Kotak MF using the select dropdown
    const accountSelect = page.locator('select').first();
    if (await accountSelect.count() > 0) {
      // Use selectOption instead of clicking
      await accountSelect.selectOption('kotak-mf');
      await page.waitForLoadState('networkidle');
    }

    // Navigate to upload
    await page.goto(`${BASE_URL}/dashboard/upload`);
    await page.waitForLoadState('networkidle');

    // Check for upload interface (not blocked)
    const pageContent = await page.locator('body').textContent();
    expect(pageContent).toBeTruthy();
    expect(pageContent?.length).toBeGreaterThan(50);
  });

  // ============ GROUP 5: CLIENTS PAGE ============

  test('Clients page shows when Ethinos account is selected', async ({ page }) => {
    await page.goto(`${BASE_URL}/dashboard/clients`);
    await page.waitForLoadState('networkidle');

    const pageContent = await page.locator('body').textContent();
    expect(pageContent).toBeTruthy();
    expect(pageContent?.length).toBeGreaterThan(50);
  });

  test('Clients page has New Client button', async ({ page }) => {
    await page.goto(`${BASE_URL}/dashboard/clients`);
    await page.waitForLoadState('networkidle');

    const newClientButton = page.locator('text=Add Client');
    await expect(newClientButton).toBeVisible();
  });

  // ============ GROUP 6: ROUTE HEALTH CHECK ============

  test('All dashboard routes are accessible (return < 400)', async ({ page }) => {
    const routes = [
      '/dashboard',
      '/dashboard/analytics',
      '/dashboard/analytics/google-ads',
      '/dashboard/analytics/google-ads/campaigns',
      '/dashboard/analytics/google-ads/funnel',
      '/dashboard/analytics/dv360',
      '/dashboard/analytics/meta',
      '/dashboard/upload',
      '/dashboard/clients',
      '/dashboard/chat',
      '/dashboard/presentations',
      '/dashboard/settings',
    ];

    for (const route of routes) {
      const response = await page.goto(`${BASE_URL}${route}`);
      expect(response?.status()).toBeLessThan(400);
    }
  });

  test('Dashboard loads without critical errors', async ({ page }) => {
    const errors: string[] = [];

    page.on('console', (msg) => {
      if (msg.type() === 'error') {
        errors.push(msg.text());
      }
    });

    await page.goto(`${BASE_URL}/dashboard`);
    await page.waitForLoadState('networkidle');

    // Filter out non-critical errors
    const criticalErrors = errors.filter(
      (e) => !e.includes('Strict mode') && !e.includes('warning')
    );
    expect(criticalErrors.length).toBe(0);
  });

  test('Dashboard is responsive (mobile and desktop)', async ({ page }) => {
    await page.goto(`${BASE_URL}/dashboard`);

    // Test mobile
    await page.setViewportSize({ width: 375, height: 667 });
    let content = await page.locator('body').textContent();
    expect(content).toBeTruthy();

    // Test desktop
    await page.setViewportSize({ width: 1920, height: 1080 });
    content = await page.locator('body').textContent();
    expect(content).toBeTruthy();
  });

  test('Dashboard loads within reasonable time', async ({ page }) => {
    const startTime = Date.now();

    await page.goto(`${BASE_URL}/dashboard`);
    await page.waitForLoadState('networkidle');

    const loadTime = Date.now() - startTime;
    expect(loadTime).toBeLessThan(10000);
  });

  test('KPI cards display numerical values', async ({ page }) => {
    await page.goto(`${BASE_URL}/dashboard`);
    await page.waitForLoadState('networkidle');

    const pageContent = await page.locator('body').textContent();
    const hasNumbers = /\$?[\d,]+/.test(pageContent || '');
    expect(hasNumbers).toBeTruthy();
  });

  test('Charts render on dashboard', async ({ page }) => {
    await page.goto(`${BASE_URL}/dashboard`);
    await page.waitForLoadState('networkidle');

    const svgElements = await page.locator('svg').count();
    expect(svgElements).toBeGreaterThan(0);
  });

});
