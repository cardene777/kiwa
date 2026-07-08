/**
 * Mutation testing config for @kiwa/nuxt.
 * Threshold: Framework tier (high 70 / low 60 / break 50) — SSR + hydration + Nitro adapter drift.
 * SSOT: docs/quality/mutation-thresholds.md § Framework tier.
 */
export default {
  packageManager: 'pnpm',
  testRunner: 'vitest',
  testRunnerNodeArgs: ['--max-old-space-size=4096'],
  plugins: ['@stryker-mutator/vitest-runner'],
  vitest: { configFile: 'vitest.stryker.config.mjs' },
  mutate: [
    '.vitest-dist/src/invoke-event-handler.js',
    '.vitest-dist/src/invoke-route-middleware.js',
    '.vitest-dist/src/invoke-nitro-plugin.js',
  ],
  thresholds: { high: 70, low: 60, break: 50 },
  ignorePatterns: ['dist/**', 'coverage/**', 'node_modules/**'],
  reporters: ['progress-append-only', 'html', 'clear-text', 'json'],
  jsonReporter: { fileName: 'mutation-report/mutation.json' },
  htmlReporter: { fileName: 'mutation-report/index.html' },
  warnings: { unknownOptions: false },
  concurrency: 4,
};
