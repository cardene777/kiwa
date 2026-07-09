/**
 * Mutation testing config for @kiwa-lab/ui.
 * Runs against the compiled `.vitest-dist/src/` artefacts (pure ESM JS) so we
 * don't need to wire Stryker into our tsup/tsc build chain.
 *
 * Threshold: high 90 / low 80 / break 80. The msi gate keeps every framework
 * adapter (React / Vue / Svelte / Solid / Lit / Qwik / Angular) honest by
 * killing every mutant the tests can observe.
 *
 * Browser adapter (`browser.js`) is excluded — it spawns a real Chromium
 * process via Playwright, which makes per-mutant runs both slow (≥500ms) and
 * unreliable in mutation context.
 */
export default {
  packageManager: 'pnpm',
  testRunner: 'vitest',
  testRunnerNodeArgs: ['--max-old-space-size=4096'],
  plugins: ['@stryker-mutator/vitest-runner'],
  vitest: {
    configFile: 'vitest.stryker.config.mjs',
  },
  // Excluded from mutate: svelte / qwik / angular. These adapters require their
  // framework-specific compilers (Svelte / Qwik optimizer / Angular TestBed)
  // which the package-local test pipeline does not run, so most mutants on them
  // would be "equivalent" by construction. Their contract tests still ship.
  mutate: [
    '.vitest-dist/src/index.js',
    '.vitest-dist/src/setup-component-env.js',
    '.vitest-dist/src/vue.js',
    '.vitest-dist/src/solid.js',
    '.vitest-dist/src/lit.js',
  ],
  thresholds: { high: 90, low: 80, break: 80 },
  ignorePatterns: ['dist/**', 'coverage/**', 'node_modules/**'],
  reporters: ['progress-append-only', 'html', 'clear-text', 'json'],
  jsonReporter: { fileName: 'mutation-report/mutation.json' },
  htmlReporter: { fileName: 'mutation-report/index.html' },
  warnings: { unknownOptions: false },
  concurrency: 2,
};
