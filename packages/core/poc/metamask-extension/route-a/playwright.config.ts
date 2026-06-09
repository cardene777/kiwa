import '../_headless-guard.js'

import { defineConfig } from '@playwright/test'

export default defineConfig({
  testDir: '.',
  testMatch: ['poc-test-storage-bypass.spec.ts'],
  timeout: 90_000,
  fullyParallel: false,
  workers: 1,
  retries: 0,
  reporter: [['list']],
  use: {
    actionTimeout: 15_000,
    navigationTimeout: 30_000,
  },
})
