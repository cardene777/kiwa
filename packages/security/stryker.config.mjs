/**
 * Mutation testing config for @kiwa-lab/security.
 * Threshold: Core tier (high 80 / low 60 / break 50) — pure policy logic with
 * deterministic tests, so the tier default applies unchanged.
 * SSOT: docs/quality/mutation-thresholds.md § Core tier.
 *
 * Every implementation file (#1965). Until then only the v0.1 policy engines
 * were mutated and the whole v0.2 advanced-II semantics layer sat outside, at
 * 100 % line coverage that nothing had tried to break.
 *
 * Nothing is left out. `scripts/mutation-scope-report.mjs` classifies this
 * package as 3,954 implementation lines, 342 barrel lines (`index.ts` and
 * `semantics/index.ts`), and no type-only file — so the barrels are the whole
 * of what stays off this list, and § What goes in `mutate` says not to name
 * them.
 *
 * The two `real-driver.js` files are mutated like any other. Their `KIWA_MODE`
 * gate selects a driver rather than skipping the module, and the unit suite
 * exercises the mock side, so their mutants are covered and scored (74 and 86
 * mutants at 91.89 and 79.07). The package's 13 no-coverage mutants sit
 * elsewhere — `authorization.js` holds 9 of them.
 */
export default {
  packageManager: 'pnpm',
  testRunner: 'vitest',
  testRunnerNodeArgs: ['--max-old-space-size=4096'],
  plugins: ['@stryker-mutator/vitest-runner'],
  vitest: { configFile: 'vitest.stryker.config.mjs' },
  mutate: [
    '.vitest-dist/src/csp.js',
    '.vitest-dist/src/rate-limit.js',
    '.vitest-dist/src/authorization.js',
    '.vitest-dist/src/waf.js',
    '.vitest-dist/src/threat-model.js',
    '.vitest-dist/src/secrets-scan.js',
    '.vitest-dist/src/sbom.js',
    '.vitest-dist/src/security-headers.js',
    '.vitest-dist/src/fidelity.js',
    '.vitest-dist/src/real-driver.js',
    '.vitest-dist/src/types.js',
    '.vitest-dist/src/semantics/container-k8s.js',
    '.vitest-dist/src/semantics/crypto-advanced.js',
    '.vitest-dist/src/semantics/fidelity.js',
    '.vitest-dist/src/semantics/incident-response.js',
    '.vitest-dist/src/semantics/mtls.js',
    '.vitest-dist/src/semantics/real-driver.js',
    '.vitest-dist/src/semantics/siem-audit.js',
    '.vitest-dist/src/semantics/supply-chain.js',
    '.vitest-dist/src/semantics/types.js',
    '.vitest-dist/src/semantics/web-vitals-security.js',
    '.vitest-dist/src/semantics/zero-trust.js',
  ],
  thresholds: { high: 80, low: 60, break: 50 },
  ignorePatterns: ['dist/**', 'coverage/**', 'node_modules/**'],
  reporters: ['progress-append-only', 'html', 'clear-text', 'json'],
  jsonReporter: { fileName: 'mutation-report/mutation.json' },
  htmlReporter: { fileName: 'mutation-report/index.html' },
  warnings: { unknownOptions: false },
  concurrency: 4,
};
