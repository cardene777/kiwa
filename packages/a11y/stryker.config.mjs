/**
 * Mutation testing config for @kiwa-lab/a11y.
 * Runs against the compiled `.vitest-dist/src/` artefacts (pure ESM JS) so we
 * don't need to wire Stryker into our tsup/tsc build chain.
 *
 * Threshold: high 90 / low 80 / break 80 locally. The gate is separate and
 * sits at the Test type default of 60 — #1963 widened this package to every
 * implementation file and the raised override it used to run at (90) went back
 * to the tier default, exactly as `docs/quality/mutation-thresholds.md`
 * § Overrides prescribes. The local bars stay where they are because the
 * measurement clears them (82.42 against a break of 80); they are a stricter
 * signal while working on this package, not the release bar.
 * SSOT for the release bar: `scripts/check-mutation-gates.mjs` (`PACKAGE_TIER`).
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
  thresholds: { high: 90, low: 80, break: 80 },
  ignorePatterns: ['dist/**', 'coverage/**', 'node_modules/**'],
  reporters: ['progress-append-only', 'html', 'clear-text', 'json'],
  jsonReporter: { fileName: 'mutation-report/mutation.json' },
  htmlReporter: { fileName: 'mutation-report/index.html' },
  warnings: { unknownOptions: false },
  concurrency: 4,
};
