/**
 * Mutation testing config for @kiwa-lab/ui.
 * Runs against the compiled `.vitest-dist/src/` artefacts (pure ESM JS) so we
 * don't need to wire Stryker into our tsup/tsc build chain.
 *
 * Threshold: Test type tier (high 60 / low 50 / break 40). It was 90 / 80 / 80
 * over a scope of 5 files; #1963 added the remaining 4 and the run came in at
 * 65.26 by Stryker's own score, which counted the no-coverage mutants the
 * browser adapter contributed. Keeping the old break would have failed every
 * local run while the gate (covered score) passed.
 *
 * That gap closed in #1986, and the reason it existed was not the browser
 * adapter. `vitest.stryker.config.mjs` named six of the package's fourteen test
 * files in an `include` allowlist, so `browser.js` and `svelte.js` had no test
 * in the run at all — 54 of 190 mutants reported as no-coverage, `svelte.js`
 * entirely. The #1986 run with the glob measures **0 no-coverage**, and
 * Stryker's own score matches the covered one at 93.16.
 *
 * `browser.js` is mutated and reached. Its real-Chromium test stays out of the
 * mutation run (it needs `environment: 'node'`), but `browser-mock.test.js`
 * drives the same adapter under jsdom, so none of its 34 mutants go unreached.
 * The per-mutant slowness this header once anticipated never materialised: the
 * full run takes 39 seconds.
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
  // by construction. In the #1963 run, that held for `svelte` only — 17
  // mutants, all no-coverage, which cost nothing in the score the gate reads.
  // `qwik` killed 15 of 15 and `angular` 16 of 17, so the expectation was wrong
  // for both and excluding them hid 146 lines that the tests do exercise.
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
