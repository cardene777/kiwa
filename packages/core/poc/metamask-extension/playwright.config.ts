import { defineConfig } from '@playwright/test'

export default defineConfig({
  testDir: '.',
  testMatch: ['poc-test.spec.ts', 'debug-onboarding.spec.ts'],
  timeout: 180_000,
  fullyParallel: false,
  workers: 1,
  retries: 0,
  reporter: [['list']],
  use: {
    headless: false,
    actionTimeout: 15_000,
    navigationTimeout: 30_000,
  },
})
