/**
 * Playwright config for dogfood-nextjs-server-action-app (v1.34-3).
 *
 * Following the dogfood-nextjs-rsc-streaming-app v1.34-2 pattern — the
 * specs spawn a small Node HTTP server that mounts the subscribe / like /
 * login handlers directly and Chromium drives them, which gives a real
 * browser origin for Server Action + form action lifecycle scenarios
 * without paying the Next.js dev-server startup cost. A follow-up milestone
 * can fold this into the full `next dev` runtime once the adapter contract
 * covers the pieces that require the App Router to mount unchanged.
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
