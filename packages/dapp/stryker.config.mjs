/**
 * Mutation testing config for @kiwa/dapp.
 * Excludes test files that require forge artefacts / nextjs-bridge fixtures
 * (anvil-deploy-contract path) which Stryker's dry-run can't construct on its own.
 */
export default {
  packageManager: 'pnpm',
  testRunner: 'vitest',
  testRunnerNodeArgs: ['--max-old-space-size=4096'],
  plugins: ['@stryker-mutator/vitest-runner'],
  vitest: { configFile: 'vitest.stryker.config.mjs' },
  mutate: [
    '.vitest-dist/src/anvil-pool.js',
    '.vitest-dist/src/eip1271.js',
    '.vitest-dist/src/wait-for-wallet-connected.js',
  ],
  thresholds: { high: 80, low: 60, break: 50 },
  ignorePatterns: ['dist/**', 'coverage/**', 'node_modules/**'],
  reporters: ['progress-append-only', 'html', 'clear-text', 'json'],
  htmlReporter: { fileName: 'mutation-report/index.html' },
  jsonReporter: { fileName: 'mutation-report/mutation.json' },
  warnings: { unknownOptions: false },
  concurrency: 2,
  timeoutMS: 60000,
};
