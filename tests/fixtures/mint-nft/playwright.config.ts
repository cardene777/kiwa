import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './e2e-test',
  timeout: 30_000,
  fullyParallel: false,
  reporter: 'list',
  use: {
    headless: true,
  },
  projects: [{ name: 'chromium', use: { ...devices['Desktop Chrome'] } }],
});
