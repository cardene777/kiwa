/**
 * Playwright config for dogfood-nuxt-webtransport-stream-app (v1.28-3).
 *
 * The Nuxt runtime is not booted here — the e2e specs spawn a small Node
 * HTTP server that mounts the stream + reset handlers directly, which gives
 * two BrowserContext tabs a real page to hit while sidestepping the Nuxt
 * dev-server startup cost. A follow-up milestone can fold this into the full
 * `nuxt dev` server if the stream UI needs richer browser-side behaviour
 * than the current adapter contract exposes.
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
