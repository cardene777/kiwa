/**
 * Playwright config for dogfood-postgres-cdc-outbox-app (v1.32-2).
 *
 * The Postgres dogfood has no UI — the e2e specs spawn a small Node HTTP
 * server that mounts the mock adapter's 9-op surface behind JSON endpoints,
 * then Playwright drives BrowserContext tabs against it. This lets the specs
 * assert on outbox / cdc / replication / at-least-once / logical-replication
 * / slot-advance / pgvector / testcontainers-probe flows end-to-end from a
 * real browser without pulling in a full pg + pgvector client — the same
 * pattern used by the sibling v1.31-2 kafka-event-pipeline + v1.31-3
 * redpanda-schema-registry + v1.31-4 nats-jetstream dogfoods.
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
