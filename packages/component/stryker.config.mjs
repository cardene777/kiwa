/**
 * Mutation testing config for @kiwa-lab/component.
 * Threshold: test type tier (high 60 / low 50 / break 40) — component adapter
 * bridges Storybook / Playwright CT / Chromatic harness with visual + a11y
 * measurement noise inherent to DOM environments.
 * SSOT: docs/quality/mutation-thresholds.md § test type tier.
 */
export default {
  packageManager: 'pnpm',
  testRunner: 'vitest',
  testRunnerNodeArgs: ['--max-old-space-size=4096'],
  plugins: ['@stryker-mutator/vitest-runner'],
  vitest: { configFile: 'vitest.stryker.config.mjs' },
  mutate: [
    '.vitest-dist/src/dom.js',
    '.vitest-dist/src/fixture.js',
    '.vitest-dist/src/storybook.js',
    '.vitest-dist/src/playwright-ct.js',
    '.vitest-dist/src/chromatic.js',
  ],
  thresholds: { high: 60, low: 50, break: 40 },
  ignorePatterns: ['dist/**', 'coverage/**', 'node_modules/**'],
  reporters: ['progress-append-only', 'html', 'clear-text', 'json'],
  jsonReporter: { fileName: 'mutation-report/mutation.json' },
  htmlReporter: { fileName: 'mutation-report/index.html' },
  warnings: { unknownOptions: false },
  concurrency: 4,
};
