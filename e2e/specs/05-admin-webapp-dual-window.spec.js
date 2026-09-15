const { test, expect } = require('@playwright/test');
const { resetDatabase } = require('../helpers/flagApi');

test.describe('Scenario 5: Multi-Window Synchronization (Admin Console -> WebApp)', () => {
  test.beforeEach(async () => {
    resetDatabase();
  });

  test.afterAll(async () => {
    resetDatabase();
  });

  test('toggling a feature flag switch in the Admin Console instantly updates the WebApp via SSE', async ({ context }) => {
    // 1. Open Window 1: Demo WebApp (:3000)
    const webPage = await context.newPage();
    await webPage.goto('http://localhost:3000');

    const webGenUiBadge = webPage.getByText(/^GenUI:\s*(ON|OFF)$/);
    await expect(webGenUiBadge).toHaveText('GenUI: ON');

    // 2. Open Window 2: Admin Control Center (:4001)
    const adminPage = await context.newPage();
    // Auto-accept institutional security confirmation dialogs in Admin
    adminPage.on('dialog', async (dialog) => {
      await dialog.accept();
    });
    await adminPage.goto('http://localhost:4001');

    // 3. Locate the copilot.gemini-ui row in Admin Flag Inventory table
    const flagRow = adminPage.locator('tr', { hasText: 'copilot.gemini-ui' }).first();
    await expect(flagRow).toBeVisible({ timeout: 10000 });

    const toggleButton = flagRow.locator('button', { hasText: /ENABLED|DISABLED/ });
    await expect(toggleButton).toHaveText('ENABLED');

    // 4. Click the toggle switch in Admin Control Center to turn it DISABLED
    await toggleButton.click();
    await expect(toggleButton).toHaveText('DISABLED', { timeout: 10000 });

    // 5. Check Window 1 (WebApp): verify that GenUI flips to OFF without refreshing
    await expect(webGenUiBadge).toHaveText('GenUI: OFF', { timeout: 10000 });

    // 6. Click the toggle switch in Admin Control Center again to turn it back ENABLED
    await toggleButton.click();
    await expect(toggleButton).toHaveText('ENABLED', { timeout: 10000 });

    // 7. Check Window 1 (WebApp): verify that GenUI flips back to ON in real time
    await expect(webGenUiBadge).toHaveText('GenUI: ON', { timeout: 10000 });
  });
});
