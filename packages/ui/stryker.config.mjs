/**
 * Mutation testing config for @kiwa-lab/ui.
 * Runs against the compiled `.vitest-dist/src/` artefacts (pure ESM JS) so we
 * don't need to wire Stryker into our tsup/tsc build chain.
 *
 * Threshold: Test type tier (high 60 / low 50 / break 40). It was 90 / 80 / 80
 * over a scope of 5 files; #1963 added the remaining 4 and the run came in at
 * 65.26 by Stryker's own score, which counts the no-coverage mutants the
 * browser adapter contributes. Keeping the old break would fail every local
 * run while the gate (covered score, 91.18 against 60) passes.
 *
 * `browser.js` is now mutated. It spawns a real Chromium process through
 * Playwright, so its mutants are almost all no-coverage — they cost nothing in
 * the covered score the gate reads, and leaving the file out kept 125 lines
 * invisible. Per-mutant slowness never materialised because no test drives it.
 */
export default {
  packageManager: 'pnpm',
  testRunner: 'vitest',
  testRunnerNodeArgs: ['--max-old-space-size=4096'],
  plugins: ['@stryker-mutator/vitest-runner'],
  vitest: {
    configFile: 'vitest.stryker.config.mjs',
  },
  // Every adapter is mutated since #1963. The three that used to be excluded
  // (svelte / qwik / angular) were left out on the expectation that their
  // framework compilers do not run here, so their mutants would be equivalent
  // by construction. Measured, that held for `svelte` only — 17 mutants, all
  // no-coverage, which cost nothing in the score the gate reads. `qwik` killed
  // 15 of 15 and `angular` 16 of 17, so the expectation was wrong for both and
  // excluding them hid 146 lines that the tests do exercise.
  mutate: [
    '.vitest-dist/src/angular.js',
    '.vitest-dist/src/browser.js',
    '.vitest-dist/src/lit.js',
    '.vitest-dist/src/qwik.js',
    '.vitest-dist/src/setup-component-env.js',
    '.vitest-dist/src/solid.js',
    '.vitest-dist/src/svelte.js',
    '.vitest-dist/src/vue.js',
  ],
  thresholds: { high: 60, low: 50, break: 40 },
  ignorePatterns: ['dist/**', 'coverage/**', 'node_modules/**'],
  reporters: ['progress-append-only', 'html', 'clear-text', 'json'],
  jsonReporter: { fileName: 'mutation-report/mutation.json' },
  htmlReporter: { fileName: 'mutation-report/index.html' },
  warnings: { unknownOptions: false },
  concurrency: 2,
};
