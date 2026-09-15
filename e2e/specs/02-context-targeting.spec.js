const { test, expect } = require('@playwright/test');
const { resetDatabase } = require('../helpers/flagApi');

test.describe('Scenario 2: Context-Aware Targeting & Rule Hierarchy', () => {
  test.beforeEach(async () => {
    resetDatabase();
  });

  test.afterAll(async () => {
    resetDatabase();
  });

  test('evaluates multi-dimensional context rules dynamically across banking personas', async ({ page }) => {
    await page.goto('/');

    // 1. Expand the OpenFeature DevToolbar Dock
    const devDock = page.locator('aside[aria-label="OpenFeature Evaluation Dock"]');
    await devDock.getByText('OpenFeature Dev Bar', { exact: true }).click();

    const personaSelect = devDock.locator('select').first();

    // 2. Persona 1: Sophia Chen (Singapore Premier VIP)
    await personaSelect.selectOption('user-sg-vip');

    const genUiBadge = page.getByText(/^GenUI:\s*(ON|OFF)$/);
    const insightsBadge = page.getByText(/^Insights:\s*(ON|OFF)$/);

    // Verify flags for SG Premier
    await expect(genUiBadge).toHaveText('GenUI: ON');
    await expect(insightsBadge).toHaveText('Insights: ON');

    // Verify Dynamic Announcement Banner for SG Wealth
    const banner = page.getByTestId('announcement-banner');
    await expect(banner).toContainText('Singapore Wealth Premier');

    // 3. Persona 2: Priya Sharma (India Standard Retail)
    await personaSelect.selectOption('user-in-standard');

    // Verify India regulatory review disables Gemini UI
    await expect(genUiBadge).toHaveText('GenUI: OFF', { timeout: 5000 });

    // Verify Announcement Banner switches to India Real-Time Settlement Notice
    await expect(banner).toContainText('India Real-Time Settlement Notice');

    // 4. Persona 3: Marcus Leung (Hong Kong Private Wealth)
    await personaSelect.selectOption('user-hk-vip');

    // Verify Announcement Banner switches to Hong Kong IPO promos
    await expect(banner).toContainText('Hong Kong Private Wealth');
    await expect(genUiBadge).toHaveText('GenUI: ON');

    // 5. Persona 4: Rashid Al-Maktoum (UAE Commercial Client)
    await personaSelect.selectOption('user-ae-standard');

    // Verify Announcement Banner switches to UAE Sukuk accounts
    await expect(banner).toContainText('UAE Islamic & Private Banking');
  });
});
