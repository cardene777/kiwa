/**
 * Playwright config for dogfood-observability-chaos-aiops-app (v1.42-4).
 *
 * The e2e spec spawns a small Node HTTP server that mounts the chaos /
 * remediation / rca handlers directly and Chromium drives them, which
 * gives a real browser origin for fault injection + auto-rollback +
 * AIOps anomaly detection + auto-remediation + root cause analysis +
 * alert correlation scenarios without paying the Next.js dev-server
 * startup cost.
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
    // Each spec spins up its own ad-hoc HTTP server on a random port; the
    // baseURL is set inside the test after the server is bound.
    ignoreHTTPSErrors: true,
  },
});
