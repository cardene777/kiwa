/**
 * Playwright config for dogfood-paddle-subscription-app (Sub-Issue #1038).
 *
 * The e2e layer can mount the route handlers on a tiny Node HTTP server
 * without booting the full Next.js dev server, which keeps Paddle Billing
 * v2 subscription dogfood cycles cheap while still exercising real fetch()
 * requests.
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
