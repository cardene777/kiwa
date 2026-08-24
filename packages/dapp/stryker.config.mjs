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
 * Every implementation file (#1982). The barrel (`index.js`) stays out, as it does
 * everywhere else — Stryker generates no mutants from a re-export.
 *
 * This header used to say the run excluded test files needing forge artefacts,
 * "which Stryker's dry-run can't construct on its own". Measured, neither half
 * held. The artefacts are committed (`examples/nextjs-bridge/forge-out/`), so
 * nothing needs constructing, and `vitest.stryker.config.mjs` was not excluding
 * a few files — it named three of the package's thirty-seven test files in an
 * `include` allowlist. #1980 widened `mutate` to 25 files against those same
 * three tests, which is where the 85 % no-coverage came from: not code that the
 * unit suite cannot reach, but a suite that was 92 % switched off.
 *
 * One test did fail the dry run once the allowlist came off, and its cause was
 * also not artefact construction. `deploy-contract.test.ts` resolved the example
 * root from `process.cwd()`, which is the package dir under `pnpm test` and the
 * sandbox dir under Stryker. It now resolves from the repo root, as does
 * `injector.test.ts`, which carried the same form without having surfaced yet.
 *
 * `concurrency` is 4 and `timeoutMS` is 60,000, both measured rather than
 * inherited (#2171). The pair arrived from the Playwright era with no recorded
 * reason, so three full runs were compared.
 *
 *   baseline  c2 / t60000   56m05s   MSI 80.43   killed 1874   survived 460   timeout 17
 *   run A     c2 / default  49m      MSI 80.73   killed 1843   survived 453   timeout 55
 *   run B     c4 / t60000   32m      MSI 80.90   killed 1875   survived 449   timeout 27
 *
 * `timeoutMS` stays at 60,000 because the suite does spawn a slow external
 * process — not a browser, but `anvil` (`src/anvil.ts` calls `spawn('anvil')`,
 * and eight test files start one). Dropping to the default moved **32 mutants
 * from Killed to Timeout**: kills the tests had actually made, relabelled as
 * hangs. The timeout is doing real work, not carrying a dead assumption.
 *
 * `concurrency` goes to 4 because doing so lost nothing. Not one mutant moved
 * from Killed to Timeout; the 10 extra timeouts all came out of Survived, so
 * they are mutants that used to escape and now do not. Wall time drops 43 %.
 *
 * The raw timeout count therefore reads the same for two opposite outcomes.
 * Compare the transitions, not the totals: Killed→Timeout means detection was
 * lost, Survived→Timeout means detection was gained.
 */
export default {
  packageManager: 'pnpm',
  testRunner: 'vitest',
  testRunnerNodeArgs: ['--max-old-space-size=4096'],
  plugins: ['@stryker-mutator/vitest-runner'],
  vitest: { configFile: 'vitest.stryker.config.mjs' },
  mutate: [
    '.vitest-dist/src/anvil-cluster.js',
    '.vitest-dist/src/anvil-default-keys.js',
    '.vitest-dist/src/anvil-fork.js',
    '.vitest-dist/src/anvil-pool.js',
    '.vitest-dist/src/anvil.js',
    '.vitest-dist/src/balance-change.js',
    '.vitest-dist/src/deploy-contract.js',
    '.vitest-dist/src/e2e-prepare-env.js',
    '.vitest-dist/src/eip1271.js',
    '.vitest-dist/src/event-emitter.js',
    '.vitest-dist/src/expect-custom-error.js',
    '.vitest-dist/src/expect-event.js',
    '.vitest-dist/src/fixture.js',
    '.vitest-dist/src/impersonate.js',
    '.vitest-dist/src/inject-multiple-wallets.js',
    '.vitest-dist/src/injector-script.js',
    '.vitest-dist/src/rpc-handlers.js',
    '.vitest-dist/src/set-storage-slot.js',
    '.vitest-dist/src/snapshot.js',
    '.vitest-dist/src/time.js',
    '.vitest-dist/src/tx.js',
    '.vitest-dist/src/types.js',
    '.vitest-dist/src/vitest.js',
    '.vitest-dist/src/wait-for-chain-state.js',
    '.vitest-dist/src/wait-for-wallet-connected.js',
  ],
  thresholds: { high: 65, low: 55, break: 50 },
  ignorePatterns: ['dist/**', 'coverage/**', 'node_modules/**'],
  reporters: ['progress-append-only', 'html', 'clear-text', 'json'],
  htmlReporter: { fileName: 'mutation-report/index.html' },
  jsonReporter: { fileName: 'mutation-report/mutation.json' },
  warnings: { unknownOptions: false },
  concurrency: 4,
  timeoutMS: 60000,
};
