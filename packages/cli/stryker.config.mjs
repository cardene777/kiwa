export default {
  packageManager: 'pnpm',
  testRunner: 'vitest',
  testRunnerNodeArgs: ['--max-old-space-size=4096'],
  plugins: ['@stryker-mutator/vitest-runner'],
  vitest: { configFile: 'vitest.stryker.config.mjs' },
  /**
   * mutate target = run-watch のみ (CAR-410 #410 v1)。
   * init.js / spec-to-test.js は file system + template 展開 / generated string compare が多く
   * mutation kill が難しい (各 mutator が survived 多数)、 別 Issue で段階対応する。
   */
  mutate: [
    '.vitest-dist/src/commands/run-watch.js',
  ],
  thresholds: { high: 80, low: 60, break: 50 },
  ignorePatterns: ['dist/**', 'coverage/**', 'node_modules/**'],
  reporters: ['progress-append-only', 'html', 'clear-text', 'json'],
  jsonReporter: { fileName: 'mutation-report/mutation.json' },
  htmlReporter: { fileName: 'mutation-report/index.html' },
  warnings: { unknownOptions: false },
  concurrency: 4,
};
