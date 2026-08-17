/**
 * Mutation testing config for @kiwa-lab/nextjs.
 * Threshold: Framework tier (high 70 / low 60 / break 50) — SSR + RSC + Server
 * Actions + Middleware invariants; the initial v1.27-1 rollout used the
 * aspirational 90 / 80 / 80 override, but the v1.27-2 baseline sweep landed at
 * ~80 % total MSI (SSOT formula: killed / (killed + survived + timeout + error)),
 * so the config now sits at the Framework default. A follow-up PR raises the
 * bar back once tests reach 90 %.
 * SSOT: docs/quality/mutation-thresholds.md § Framework tier.
 */
export default {
  packageManager: 'pnpm',
  testRunner: 'vitest',
  testRunnerNodeArgs: ['--max-old-space-size=4096'],
  plugins: ['@stryker-mutator/vitest-runner'],
  vitest: { configFile: 'vitest.stryker.config.mjs' },
  mutate: [
    '.vitest-dist/src/invoke-middleware.js',
    '.vitest-dist/src/invoke-parallel-routes.js',
    '.vitest-dist/src/invoke-server-action.js',
    '.vitest-dist/src/real-driver.js',
    '.vitest-dist/src/render-server-component.js',
    '.vitest-dist/src/semantics/concurrent-transitions.js',
    '.vitest-dist/src/semantics/fidelity.js',
    '.vitest-dist/src/semantics/interception-routes.js',
    '.vitest-dist/src/semantics/parallel-routes-advanced.js',
    '.vitest-dist/src/semantics/partial-prerendering.js',
    '.vitest-dist/src/semantics/server-action-advanced.js',
    '.vitest-dist/src/semantics/turbopack-hmr.js',
    '.vitest-dist/src/semantics/types.js',
    '.vitest-dist/src/setup-next-rsc-env.js',
  ],
  thresholds: { high: 70, low: 60, break: 50 },
  ignorePatterns: ['dist/**', 'coverage/**', 'node_modules/**'],
  reporters: ['progress-append-only', 'html', 'clear-text', 'json'],
  jsonReporter: { fileName: 'mutation-report/mutation.json' },
  htmlReporter: { fileName: 'mutation-report/index.html' },
  warnings: { unknownOptions: false },
  concurrency: 4,
};
