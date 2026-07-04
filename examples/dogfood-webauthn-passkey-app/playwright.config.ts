/**
 * Playwright config for dogfood-webauthn-passkey-app (Sub-Issue #857).
 *
 * The Next.js runtime is not booted here — the e2e spec spawns a tiny Node
 * HTTP server that mounts `/register` + `/signin` handlers directly, which
 * gives the Chrome Virtual Authenticator a real page to hit while sidestepping
 * the Next.js dev-server startup cost. Sub-Issue #859 will fold this into the
 * full `next dev` server once `/manage` needs a browser-side UI.
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
