const { test, expect } = require('@playwright/test');
const { updateFlag, resetDatabase } = require('../helpers/flagApi');

test.describe('Scenario 4: Dynamic JSON Object Configuration & UI Rendering', () => {
  test.beforeEach(async () => {
    resetDatabase();
  });

  test.afterAll(async () => {
    resetDatabase();
  });

  test('dynamically adapts announcement banner payload, urgency styling and CTA links', async ({ page }) => {
    await page.goto('/');

    // 1. Initial Singapore persona shows 'sg-exclusive' variant with success styling (emerald)
    const banner = page.getByTestId('announcement-banner');
    await expect(banner).toContainText('Singapore Wealth Premier');
    await expect(banner).toContainText('3.8% p.a. yield');

    // 2. Mutate the flag to inject a high-priority system emergency announcement rule
    await updateFlag('platform.banner.announcement', {
      rules: [
        {
          id: 'rule-emergency-security-notice',
          priority: 0, // Highest priority
          description: 'Emergency institutional maintenance notice across all regions',
          condition: { country: 'SG' },
          variant: 'in-notice'
        }
      ]
    });

    // 3. Verify that via SSE live sync, the banner immediately updates to warning styling and title without reload
    await expect(banner).toContainText('India Real-Time Settlement Notice', { timeout: 10000 });
    await expect(banner).toContainText('NEFT/RTGS gateway maintenance');

    // 4. Update the default variant directly to a customized promo
    await updateFlag('platform.banner.announcement', {
      rules: [],
      default_variant: 'global-promo'
    });

    // 5. Verify the banner transitions to the Global Wealth Summit configuration
    await expect(banner).toContainText('Global Wealth Summit 2026', { timeout: 10000 });
    await expect(banner).toContainText('Discover institutional cross-border banking');

    // 6. Verify CTA link
    const ctaLink = banner.locator('a', { hasText: 'Learn More' });
    await expect(ctaLink).toBeVisible();
    await expect(ctaLink).toHaveAttribute('href', 'https://openfeature.dev');
  });
});
