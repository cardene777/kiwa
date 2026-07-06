/**
 * Playwright config for dogfood-kafka-event-pipeline (v1.31-2).
 *
 * The Kafka pipeline has no UI — the e2e specs spawn a small Node HTTP server
 * that mounts the mock adapter's 9-op surface behind JSON endpoints, then
 * Playwright drives 2 BrowserContext tabs against it. This lets the specs
 * assert on producer / consumer / txn / idempotent flows end-to-end from a
 * real browser without pulling in the full confluent-kafka client — the same
 * pattern used by the WebRTC + WebTransport dogfood apps.
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
  reporter: [['list']],
  use: {
    ignoreHTTPSErrors: true,
  },
});
