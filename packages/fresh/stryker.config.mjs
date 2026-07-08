/**
 * Mutation testing config for @kiwa/fresh.
 * Threshold: Framework tier (high 70 / low 60 / break 50) — Deno Fresh islands + SSR drift.
 * SSOT: docs/quality/mutation-thresholds.md § Framework tier.
 */
export default {
  packageManager: 'pnpm',
  testRunner: 'vitest',
  testRunnerNodeArgs: ['--max-old-space-size=4096'],
  plugins: ['@stryker-mutator/vitest-runner'],
  vitest: { configFile: 'vitest.stryker.config.mjs' },
  mutate: [
    '.vitest-dist/src/route.js',
    '.vitest-dist/src/islands.js',
    '.vitest-dist/src/head.js',
  ],
  thresholds: { high: 70, low: 60, break: 50 },
  ignorePatterns: ['dist/**', 'coverage/**', 'node_modules/**'],
  reporters: ['progress-append-only', 'html', 'clear-text', 'json'],
  jsonReporter: { fileName: 'mutation-report/mutation.json' },
  htmlReporter: { fileName: 'mutation-report/index.html' },
  warnings: { unknownOptions: false },
  concurrency: 4,
};
