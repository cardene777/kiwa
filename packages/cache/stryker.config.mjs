/**
 * Mutation testing config for @kiwa-test/cache.
 * Threshold: SaaS tier (high 65 / low 55 / break 50) — cache adapter targets
 * in-memory + testcontainers backends (KeyDB / Memcached) with provider-
 * specific mock + real API differences.
 * SSOT: docs/quality/mutation-thresholds.md § SaaS tier.
 */
export default {
  packageManager: 'pnpm',
  testRunner: 'vitest',
  testRunnerNodeArgs: ['--max-old-space-size=4096'],
  plugins: ['@stryker-mutator/vitest-runner'],
  vitest: { configFile: 'vitest.stryker.config.mjs' },
  mutate: [
    '.vitest-dist/src/in-memory-cache.js',
    '.vitest-dist/src/testcontainers-cache.js',
  ],
  thresholds: { high: 65, low: 55, break: 50 },
  ignorePatterns: ['dist/**', 'coverage/**', 'node_modules/**'],
  reporters: ['progress-append-only', 'html', 'clear-text', 'json'],
  jsonReporter: { fileName: 'mutation-report/mutation.json' },
  htmlReporter: { fileName: 'mutation-report/index.html' },
  warnings: { unknownOptions: false },
  concurrency: 4,
};
