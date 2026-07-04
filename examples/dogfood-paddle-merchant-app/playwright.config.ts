/**
 * Playwright config for dogfood-paddle-merchant-app (Sub-Issue #902).
 *
 * The Nuxt 3 runtime is not booted here — the e2e spec spawns a tiny Node
 * HTTP server that mounts `/checkout` + `/webhook` + `/subscription` +
 * `/tax` handlers directly, which gives Playwright a real page to hit while
 * sidestepping the Nuxt build cost. Same pattern as
 * dogfood-stripe-billing-app (Sub-Issue #901).
 */

import { defineConfig } from '@playwright/test';

export default defineConfig({
  testDir: './tests/e2e',
  timeout: 60_000,
  expect: { timeout: 5_000 },
  fullyParallel: false,
  retries: 0,
  workers: 1,
  reporter: [['list']],
  use: {
    ignoreHTTPSErrors: true,
  },
});
