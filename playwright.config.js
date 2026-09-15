const { defineConfig, devices } = require('@playwright/test');

module.exports = defineConfig({
  testDir: './e2e',
  timeout: 45000,
  expect: { timeout: 10000 },
  fullyParallel: false, // Sequential to prevent database race conditions on flag mutations
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: 1,
  reporter: [['list'], ['html', { open: 'never' }]],
  use: {
    baseURL: 'http://localhost:3000',
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],
  webServer: [
    {
      command: 'npm run dev:api',
      port: 4000,
      reuseExistingServer: true,
      timeout: 30000,
    },
    {
      command: 'npm run dev:admin',
      port: 4001,
      reuseExistingServer: true,
      timeout: 30000,
    },
    {
      command: 'npm run dev:bff',
      port: 4002,
      reuseExistingServer: true,
      timeout: 30000,
    },
    {
      command: 'npm run dev:gateway',
      port: 4003,
      reuseExistingServer: true,
      timeout: 30000,
    },
    {
      command: 'npm run dev:webapp',
      port: 3000,
      reuseExistingServer: true,
      timeout: 30000,
    },
  ],
});
