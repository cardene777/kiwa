/**
 * Mutation testing config for @kiwa-lab/security.
 * Threshold: SaaS tier (high 65 / low 55 / break 50) — security harness
 * covers CSP / rate-limit / authorization / WAF / threat-model /
 * secrets-scanning / SBOM / security-headers-advanced across 4 providers;
 * provider policy engine drift is expected.
 * SSOT: docs/quality/mutation-thresholds.md § SaaS tier.
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
  thresholds: { high: 65, low: 55, break: 50 },
  ignorePatterns: ['dist/**', 'coverage/**', 'node_modules/**'],
  reporters: ['progress-append-only', 'html', 'clear-text', 'json'],
  jsonReporter: { fileName: 'mutation-report/mutation.json' },
  htmlReporter: { fileName: 'mutation-report/index.html' },
  warnings: { unknownOptions: false },
  concurrency: 4,
};
