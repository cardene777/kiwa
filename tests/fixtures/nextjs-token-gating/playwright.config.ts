import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './e2e-test',
  timeout: 120_000,
  fullyParallel: false,
  workers: 1,
  reporter: 'list',
  globalSetup: './e2e-test/global-setup.ts',
  globalTeardown: './e2e-test/global-teardown.ts',
  use: {
    baseURL: 'http://127.0.0.1:3044',
    headless: true,
  },
  webServer: {
    command:
      'tsx e2e-test/prepare-env.ts && cp .env.local ../../../examples/nextjs-token-gating/.env.local && pnpm --dir ../../../examples/nextjs-token-gating build && pnpm --dir ../../../examples/nextjs-token-gating start',
    url: 'http://127.0.0.1:3044',
    timeout: 240_000,
    reuseExistingServer: false,
  },
  projects: [{ name: 'chromium', use: { ...devices['Desktop Chrome'] } }],
});
