// Playwright config for nuxt-server-routes-full PoC.
// Launches real `nuxt dev` server on port 3030 and runs e2e specs against it.

import { defineConfig } from '@playwright/test';

const PORT = 3030;

export default defineConfig({
  testDir: './tests/e2e',
  timeout: 60_000,
  expect: { timeout: 5_000 },
  fullyParallel: false,
  retries: 0,
  workers: 1,
  reporter: [['list']],
  use: {
    baseURL: `http://localhost:${PORT}`,
    extraHTTPHeaders: {
      accept: 'application/json',
    },
  },
  webServer: {
    command: `pnpm dev --port ${PORT}`,
    url: `http://localhost:${PORT}/`,
    reuseExistingServer: false,
    timeout: 120_000,
    stdout: 'pipe',
    stderr: 'pipe',
  },
});
