export default {
  packageManager: 'pnpm',
  testRunner: 'vitest',
  testRunnerNodeArgs: ['--max-old-space-size=4096'],
  plugins: ['@stryker-mutator/vitest-runner'],
  vitest: { configFile: 'vitest.stryker.config.mjs' },
  // Every implementation file (#1961). `bin.ts` is the one exception: it calls
  // `runCli` and then `process.exit`, so a test that exercises it ends the test
  // process. `docs/quality/mutation-thresholds.md § Telling the shapes apart`
  // asks for that call to be made by hand, and this is the hand making it.
  mutate: [
    '.vitest-dist/src/runCli.js',
    '.vitest-dist/src/commands/init.js',
    '.vitest-dist/src/commands/run-watch.js',
    '.vitest-dist/src/commands/spec-to-test.js',
    '.vitest-dist/src/commands/anvil-seed.js',
    '.vitest-dist/src/detect/detect.js',
    '.vitest-dist/src/detect/index.js',
    '.vitest-dist/src/detect/layers.js',
    '.vitest-dist/src/detect/manifests.js',
    '.vitest-dist/src/detect/scan.js',
  ],
  thresholds: { high: 80, low: 60, break: 50 },
  ignorePatterns: ['dist/**', 'coverage/**', 'node_modules/**'],
  reporters: ['progress-append-only', 'html', 'clear-text', 'json'],
  jsonReporter: { fileName: 'mutation-report/mutation.json' },
  htmlReporter: { fileName: 'mutation-report/index.html' },
  warnings: { unknownOptions: false },
  concurrency: 4,
};
