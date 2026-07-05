/**
 * Mutation testing config for @kiwa-test/qwikcity.
 * Threshold: Framework tier (high 70 / low 60 / break 50) — Resumability + SSR + route loader drift.
 * SSOT: docs/quality/mutation-thresholds.md § Framework tier.
 */
export default {
  packageManager: 'pnpm',
  testRunner: 'vitest',
  testRunnerNodeArgs: ['--max-old-space-size=4096'],
  plugins: ['@stryker-mutator/vitest-runner'],
  vitest: { configFile: 'vitest.stryker.config.mjs' },
  mutate: [
    '.vitest-dist/src/invoke-route-action.js',
    '.vitest-dist/src/invoke-route-loader.js',
    '.vitest-dist/src/invoke-endpoint.js',
  ],
  thresholds: { high: 70, low: 60, break: 50 },
  ignorePatterns: ['dist/**', 'coverage/**', 'node_modules/**'],
  reporters: ['progress-append-only', 'html', 'clear-text', 'json'],
  jsonReporter: { fileName: 'mutation-report/mutation.json' },
  htmlReporter: { fileName: 'mutation-report/index.html' },
  warnings: { unknownOptions: false },
  concurrency: 4,
};
