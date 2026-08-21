/**
 * Playwright config for dogfood-security-csp-headers-app (v1.37-2).
 *
 * Following the dogfood-nextjs-server-action-app v1.34-3 pattern — the
 * specs spawn a small Node HTTP server that mounts the csp / violation /
 * headers handlers directly and Chromium drives them, which gives a real
 * browser origin for CSP header + trusted-types + violation reporting +
 * security headers advanced lifecycle scenarios without paying the
 * Next.js dev-server startup cost.
 */

import { defineConfig } from '@playwright/test';

export default defineConfig({
  testDir: './tests/e2e',
  timeout: 60_000,
  expect: { timeout: 5_000 },
  fullyParallel: false,
  retries: 0,
  workers: 1,
  reporter: [['list'], ['json', { outputFile: 'tests/reports/playwright-results.json' }]],
  use: {
    // Each spec spins up its own ad-hoc HTTP server on a random port; the
    // baseURL is set inside the test after the server is bound.
    ignoreHTTPSErrors: true,
  },
});
