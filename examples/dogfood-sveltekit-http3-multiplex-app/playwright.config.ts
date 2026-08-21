/**
 * Playwright config for dogfood-sveltekit-http3-multiplex-app (v1.28-4).
 *
 * The SvelteKit runtime is not booted here — the e2e specs spawn a small Node
 * HTTP server that mounts the multi-stream + 0-RTT + HPACK handlers directly,
 * which gives two BrowserContext tabs a real page to hit while sidestepping
 * the SvelteKit dev-server startup cost. A follow-up milestone can fold this
 * into the full `vite dev` server if the multiplex UI needs richer
 * browser-side behaviour than the current adapter contract exposes.
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
