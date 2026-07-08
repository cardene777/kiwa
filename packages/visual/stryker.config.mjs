/**
 * Mutation testing config for @kiwa/visual.
 * Runs against the compiled `.vitest-dist/src/` artefacts (pure ESM JS) so we
 * don't need to wire Stryker into our tsup/tsc build chain.
 *
 * Threshold: high 90 / low 80 / break 80. Keeps the pixelmatch + PNG diff
 * logic honest by killing every mutant the assertion suite can observe.
 */
export default {
  packageManager: 'pnpm',
  testRunner: 'vitest',
  testRunnerNodeArgs: ['--max-old-space-size=4096'],
  plugins: ['@stryker-mutator/vitest-runner'],
  vitest: {
    configFile: 'vitest.stryker.config.mjs',
  },
  mutate: [
    '.vitest-dist/src/compare.js',
    '.vitest-dist/src/index.js',
  ],
  thresholds: { high: 90, low: 80, break: 80 },
  ignorePatterns: ['dist/**', 'coverage/**', 'node_modules/**'],
  reporters: ['progress-append-only', 'html', 'clear-text', 'json'],
  jsonReporter: { fileName: 'mutation-report/mutation.json' },
  htmlReporter: { fileName: 'mutation-report/index.html' },
  warnings: { unknownOptions: false },
  concurrency: 4,
};
