/**
 * Mutation testing config for @kiwa-lab/dapp.
 * Threshold: SaaS tier (high 65 / low 55 / break 50) — viem + anvil + wallet
 * fixture, where chain protocol and wallet inject drift are expected.
 * SSOT: docs/quality/mutation-thresholds.md § SaaS tier.
 *
 * The thresholds below read 65 / 55 / 50 as of #1980. They said 80 / 60 / 50
 * before, which is the Core tier's bar on a package the gate scores as SaaS —
 * the exact disagreement § Overrides describes ("when they disagree,
 * check-mutation-gates.mjs is right"). The header carried no tier line either,
 * so nothing pointed at the map that decides.
 *
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
  thresholds: { high: 65, low: 55, break: 50 },
  ignorePatterns: ['dist/**', 'coverage/**', 'node_modules/**'],
  reporters: ['progress-append-only', 'html', 'clear-text', 'json'],
  htmlReporter: { fileName: 'mutation-report/index.html' },
  jsonReporter: { fileName: 'mutation-report/mutation.json' },
  warnings: { unknownOptions: false },
  concurrency: 2,
  timeoutMS: 60000,
};
