/**
 * Mutation testing config for @kiwa-lab/search.
 * Threshold: SaaS tier (high 65 / low 55 / break 50) — search adapter covers
 * Algolia / Meilisearch / Typesense with provider-specific index + query
 * fidelity.
 * SSOT: docs/quality/mutation-thresholds.md § SaaS tier.
 */
export default {
  packageManager: 'pnpm',
  testRunner: 'vitest',
  testRunnerNodeArgs: ['--max-old-space-size=4096'],
  plugins: ['@stryker-mutator/vitest-runner'],
  vitest: { configFile: 'vitest.stryker.config.mjs' },
  mutate: [
    '.vitest-dist/src/engine.js',
    '.vitest-dist/src/algolia.js',
    '.vitest-dist/src/meilisearch.js',
    '.vitest-dist/src/typesense.js',
  ],
  thresholds: { high: 65, low: 55, break: 50 },
  ignorePatterns: ['dist/**', 'coverage/**', 'node_modules/**'],
  reporters: ['progress-append-only', 'html', 'clear-text', 'json'],
  jsonReporter: { fileName: 'mutation-report/mutation.json' },
  htmlReporter: { fileName: 'mutation-report/index.html' },
  warnings: { unknownOptions: false },
  concurrency: 4,
};
