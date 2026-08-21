/**
 * Playwright config for dogfood-sqlite-wal-fts-app (v1.32-4).
 *
 * The SQLite dogfood exposes no UI — the e2e specs spawn a small Node HTTP
 * server that mounts the mock adapter's op surface behind JSON endpoints,
 * then Playwright drives BrowserContext tabs against it. This lets the specs
 * assert on wal-checkpoint / fts5-query / edge-latency / testcontainers-probe
 * flows end-to-end from a real browser without pulling in a full libsql /
 * Bun runtime — the same pattern the sibling v1.32-2 postgres + v1.32-3 mysql
 * dogfoods use.
 *
 * When Playwright browsers are not installed the tests skip with a clear
 * reason so `pnpm test:e2e` still passes on hosts without the browser cache.
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
    ignoreHTTPSErrors: true,
  },
});
