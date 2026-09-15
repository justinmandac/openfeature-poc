const { test, expect } = require('@playwright/test');
const { setFlagState, resetDatabase } = require('../helpers/flagApi');

test.describe('Scenario 1: Real-Time Live Sync via Server-Sent Events (SSE)', () => {
  test.beforeEach(async () => {
    resetDatabase();
  });

  test.afterAll(async () => {
    resetDatabase();
  });

  test('toggling feature.chatbot-gemini-ui dynamically activates and deactivates Generative UI without page reload', async ({ page }) => {
    // 1. Navigate to Demo WebApp
    await page.goto('/');

    // 2. Verify initial state for Sophia Chen (SG VIP): Generative UI is ON
    const genUiBadge = page.locator('text=/GenUI:\\s*(ON|OFF)/');
    await expect(genUiBadge).toHaveText('GenUI: ON');

    // 3. Ask the chatbot for asset allocation using Quick Prompt
    const assetPromptButton = page.locator('button', { hasText: '📊 Asset Allocation' });
    await assetPromptButton.click();

    // 4. Verify that the chatbot renders rich Generative UI cards
    const genUiWidgetBadge = page.locator('text=Generative UI Widget');
    await expect(genUiWidgetBadge.first()).toBeVisible();
    await expect(page.locator('text=Asset Allocation').first()).toBeVisible();

    // 5. Deactivate the flag via Core API (simulating Admin toggle)
    await setFlagState('retail.copilot.gemini-ui', 'DISABLED');

    // 6. Verify that the UI badge instantly reflects the change via SSE without a page reload
    await expect(genUiBadge).toHaveText('GenUI: OFF', { timeout: 10000 });

    // 7. Ask the chatbot again
    await assetPromptButton.click();

    // 8. Confirm that the new bot response does NOT render a new Generative UI card, falling back to plain text
    // The previous count of GenUI cards should not increase
    const currentCount = await genUiWidgetBadge.count();
    expect(currentCount).toBe(1);

    // 9. Re-activate the flag to ENABLED
    await setFlagState('retail.copilot.gemini-ui', 'ENABLED');

    // 10. Verify that the UI badge dynamically flips back to ON
    await expect(genUiBadge).toHaveText('GenUI: ON', { timeout: 10000 });

    // 11. Ask the chatbot again; verify rich card is rendered again
    await assetPromptButton.click();
    await expect(genUiWidgetBadge).toHaveCount(2, { timeout: 10000 });
  });
});
