export default {
  packageManager: 'pnpm',
  testRunner: 'vitest',
  testRunnerNodeArgs: ['--max-old-space-size=4096'],
  plugins: ['@stryker-mutator/vitest-runner'],
  vitest: { configFile: 'vitest.stryker.config.mjs' },
  /**
   * mutate = run-watch + spec-to-test (CAR-410 follow-up #413 で spec-to-test 復活)。
   * init.js は internal helper (template / FS / regex) が private export 不在で direct test 不可、
   * 単独 Issue で helper export 計画 + boundary 詳細設計を別 follow-up に切り出す。
   */
  mutate: [
    '.vitest-dist/src/commands/run-watch.js',
    '.vitest-dist/src/commands/spec-to-test.js',
  ],
  thresholds: { high: 80, low: 60, break: 50 },
  ignorePatterns: ['dist/**', 'coverage/**', 'node_modules/**'],
  reporters: ['progress-append-only', 'html', 'clear-text', 'json'],
  jsonReporter: { fileName: 'mutation-report/mutation.json' },
  htmlReporter: { fileName: 'mutation-report/index.html' },
  warnings: { unknownOptions: false },
  concurrency: 4,
};
