/**
 * Mutation testing config for @kiwa-test/core.
 * Runs against the compiled `.vitest-dist/src/` artefacts (pure ESM JS) so we don't
 * need to wire Stryker into our tsup/tsc build chain.
 *
 * Threshold: high 80 / low 60 / break 50. The aim is to ensure the assertions catch
 * mutations on the parser + pool primitives that every adapter depends on.
 */
export default {
  packageManager: 'pnpm',
  testRunner: 'vitest',
  testRunnerNodeArgs: ['--max-old-space-size=4096'],
  plugins: ['@stryker-mutator/vitest-runner'],
  vitest: {
    configFile: 'vitest.stryker.config.mjs',
  },
  mutate: ['.vitest-dist/src/parser.js', '.vitest-dist/src/pool.js'],
  thresholds: { high: 80, low: 60, break: 50 },
  ignorePatterns: ['dist/**', 'coverage/**', 'node_modules/**'],
  reporters: ['progress-append-only', 'html', 'clear-text', 'json'],
  jsonReporter: { fileName: 'mutation-report/mutation.json' },
  htmlReporter: { fileName: 'mutation-report/index.html' },
  warnings: { unknownOptions: false },
  concurrency: 4,
};
