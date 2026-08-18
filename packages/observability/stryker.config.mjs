/**
 * Mutation testing config for @kiwa-lab/observability.
 * Threshold: Core tier (high 80 / low 60 / break 50) — flaky detection and
 * coverage gap analysis, pure logic with deterministic tests.
 * SSOT: docs/quality/mutation-thresholds.md § Core tier.
 *
 * This file had no header at all until #1980; the other 21 packages carry one.
 * The header is where a reader learns which tier the package is scored at
 * without opening `PACKAGE_TIER`, so its absence is a gap in the same place
 * `dapp`'s wrong numbers were.
 *
 * Every implementation file (#1980). It mutated five files before — 574 lines
 * of 5,544 — and measures 84.97 % over 3,581 mutants widened. The semantics
 * layer that sat outside is the same shape `search` (#1969) and `edge` (#1971)
 * widened without writing a test.
 */
export default {
  packageManager: 'pnpm',
  testRunner: 'vitest',
  testRunnerNodeArgs: ['--max-old-space-size=4096'],
  plugins: ['@stryker-mutator/vitest-runner'],
  vitest: { configFile: 'vitest.stryker.config.mjs' },
  mutate: [
    '.vitest-dist/src/alert.js',
    '.vitest-dist/src/collect.js',
    '.vitest-dist/src/coverage.js',
    '.vitest-dist/src/dashboard-mock.js',
    '.vitest-dist/src/dashboard.js',
    '.vitest-dist/src/fixtures.js',
    '.vitest-dist/src/flaky.js',
    '.vitest-dist/src/log-correlation.js',
    '.vitest-dist/src/real-driver.js',
    '.vitest-dist/src/semantics/aiops.js',
    '.vitest-dist/src/semantics/alert-routing-advanced.js',
    '.vitest-dist/src/semantics/cardinality.js',
    '.vitest-dist/src/semantics/chaos.js',
    '.vitest-dist/src/semantics/data-pipeline.js',
    '.vitest-dist/src/semantics/ebpf-iii.js',
    '.vitest-dist/src/semantics/exemplar.js',
    '.vitest-dist/src/semantics/fidelity.js',
    '.vitest-dist/src/semantics/finops.js',
    '.vitest-dist/src/semantics/iac.js',
    '.vitest-dist/src/semantics/incident-orchestrator.js',
    '.vitest-dist/src/semantics/llm-observability.js',
    '.vitest-dist/src/semantics/log-correlation-advanced.js',
    '.vitest-dist/src/semantics/otel-advanced.js',
    '.vitest-dist/src/semantics/profiling.js',
    '.vitest-dist/src/semantics/red-use.js',
    '.vitest-dist/src/semantics/service-mesh.js',
    '.vitest-dist/src/semantics/slo.js',
    '.vitest-dist/src/semantics/types.js',
    '.vitest-dist/src/spec-coverage.js',
    '.vitest-dist/src/telemetry.js',
    '.vitest-dist/src/trace-flame.js',
  ],
  thresholds: { high: 80, low: 60, break: 50 },
  ignorePatterns: ['dist/**', 'coverage/**', 'node_modules/**'],
  reporters: ['progress-append-only', 'html', 'clear-text', 'json'],
  jsonReporter: { fileName: 'mutation-report/mutation.json' },
  htmlReporter: { fileName: 'mutation-report/index.html' },
  warnings: { unknownOptions: false },
  concurrency: 4,
};
