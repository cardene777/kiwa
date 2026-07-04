/**
 * Playwright config for dogfood-stripe-billing-app (Sub-Issue #901).
 *
 * The Next.js runtime is not booted here — the e2e spec spawns a tiny Node
 * HTTP server that mounts `/checkout` + `/webhook` + `/subscription` +
 * `/invoice` handlers directly, which gives Playwright a real page to hit
 * while sidestepping the Next.js dev-server startup cost. Same pattern as
 * dogfood-webauthn-passkey-app (Sub-Issue #857).
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
    // The spec spins up its own ad-hoc HTTP server on a random port; the
    // baseURL is set by each test after the server is bound.
    ignoreHTTPSErrors: true,
  },
});
