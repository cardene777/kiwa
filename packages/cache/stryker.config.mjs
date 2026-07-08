/**
 * Mutation testing config for @kiwa/cache.
 * Threshold: SaaS tier (high 65 / low 55 / break 50) — cache adapter targets
 * the in-memory backend. testcontainers-cache.js is excluded because its
 * assertions only fire when a live KeyDB / Memcached container is running,
 * which the mutation run does not spin up (the file scored 0 % / 0 covered
 * mutants in the v1.27-3 baseline sweep). Testcontainers coverage is handled
 * by the container fixture suite in @kiwa/dapp-integration, not here.
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
  ],
  thresholds: { high: 65, low: 55, break: 50 },
  ignorePatterns: ['dist/**', 'coverage/**', 'node_modules/**'],
  reporters: ['progress-append-only', 'html', 'clear-text', 'json'],
  jsonReporter: { fileName: 'mutation-report/mutation.json' },
  htmlReporter: { fileName: 'mutation-report/index.html' },
  warnings: { unknownOptions: false },
  concurrency: 4,
};
