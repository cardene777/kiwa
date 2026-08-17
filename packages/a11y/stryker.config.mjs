/**
 * Mutation testing config for @kiwa-lab/a11y.
 * Runs against the compiled `.vitest-dist/src/` artefacts (pure ESM JS) so we
 * don't need to wire Stryker into our tsup/tsc build chain.
 *
 * Threshold: high 90 / low 80 / break 80. Keeps the axe-core bridging logic
 * (jsdom + Playwright page bridging, severity filtering, allowlist matching)
 * honest by killing every mutant the assertion suite can observe.
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
    '.vitest-dist/src/audit.js',
    '.vitest-dist/src/layer-harness.js',
  ],
  thresholds: { high: 60, low: 50, break: 40 },
  ignorePatterns: ['dist/**', 'coverage/**', 'node_modules/**'],
  reporters: ['progress-append-only', 'html', 'clear-text', 'json'],
  jsonReporter: { fileName: 'mutation-report/mutation.json' },
  htmlReporter: { fileName: 'mutation-report/index.html' },
  warnings: { unknownOptions: false },
  concurrency: 4,
};
