const { test, expect } = require('@playwright/test');
const { setFlagState, resetDatabase, API_URL } = require('../helpers/flagApi');

test.describe('Scenario 3: Flag Dependencies & Prerequisites', () => {
  test.beforeEach(async () => {
    resetDatabase();
  });

  test.afterAll(async () => {
    resetDatabase();
  });

  test('deactivating parent flag cascades to deactivate dependent flag with PREREQUISITE_FAILED', async ({ page }) => {
    // 1. Navigate to Demo WebApp
    await page.goto('/');

    // 2. Sophia Chen starts with both parent (Gemini UI) and dependent (Insights) enabled
    const genUiBadge = page.getByText(/^GenUI:\s*(ON|OFF)$/);
    const insightsBadge = page.getByText(/^Insights:\s*(ON|OFF)$/);

    await expect(genUiBadge).toHaveText('GenUI: ON');
    await expect(insightsBadge).toHaveText('Insights: ON');

    // 3. Deactivate the parent flag
    await setFlagState('retail.copilot.gemini-ui', 'DISABLED');

    // 4. Verify that both GenUI and dependent Insights badges become OFF in the UI
    await expect(genUiBadge).toHaveText('GenUI: OFF', { timeout: 10000 });
    await expect(insightsBadge).toHaveText('Insights: OFF', { timeout: 10000 });

    // 5. Query OFREP endpoint directly to verify resolution reason is PREREQUISITE_FAILED
    const ofrepRes = await fetch(`${API_URL}/ofrep/v1/evaluate/flags/wealth.advisory.predictive-insights`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        context: {
          targetingKey: 'user-sg-vip',
          country: 'SG',
          userTier: 'PREMIUM'
        }
      })
    });

    expect(ofrepRes.status).toBe(200);
    const ofrepData = await ofrepRes.json();
    expect(ofrepData.reason).toBe('PREREQUISITE_FAILED');
    expect(ofrepData.value).toBe(false);

    // 6. Re-enable parent flag
    await setFlagState('retail.copilot.gemini-ui', 'ENABLED');

    // 7. Verify both recover to ON
    await expect(genUiBadge).toHaveText('GenUI: ON', { timeout: 10000 });
    await expect(insightsBadge).toHaveText('Insights: ON', { timeout: 10000 });
  });
});
