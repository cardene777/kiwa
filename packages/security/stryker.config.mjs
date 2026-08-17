/**
 * Mutation testing config for @kiwa-lab/security.
 * Threshold: Core tier (high 80 / low 60 / break 50) — the mutated files are
 * the policy engines (CSP / rate-limit / authorization / WAF / threat-model /
 * secrets-scanning / SBOM / security-headers / fidelity), which are pure logic
 * with deterministic tests. The 4-provider drift sits in `real-driver.ts` and
 * the testcontainers path, and neither is mutated.
 * Measured at 84.90 % covered MSI over 1,203 mutants (#1951).
 * SSOT: docs/quality/mutation-thresholds.md § Core tier.
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
  ],
  thresholds: { high: 80, low: 60, break: 50 },
  ignorePatterns: ['dist/**', 'coverage/**', 'node_modules/**'],
  reporters: ['progress-append-only', 'html', 'clear-text', 'json'],
  jsonReporter: { fileName: 'mutation-report/mutation.json' },
  htmlReporter: { fileName: 'mutation-report/index.html' },
  warnings: { unknownOptions: false },
  concurrency: 4,
};
