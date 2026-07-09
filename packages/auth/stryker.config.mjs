/**
 * Mutation testing config for @kiwa-lab/auth.
 * Threshold: framework tier (high 70 / low 60 / break 50) — auth adapter wraps
 * NextAuth v5 / Lucia v3 / Better Auth / Clerk / Auth0 / Supabase, includes
 * SSR / RSC / hydration paths + provider mocks with partial fidelity.
 * SSOT: docs/quality/mutation-thresholds.md § framework tier.
 */
export default {
  packageManager: 'pnpm',
  testRunner: 'vitest',
  testRunnerNodeArgs: ['--max-old-space-size=4096'],
  plugins: ['@stryker-mutator/vitest-runner'],
  vitest: { configFile: 'vitest.stryker.config.mjs' },
  mutate: [
    '.vitest-dist/src/adapter.js',
    '.vitest-dist/src/providers.js',
    '.vitest-dist/src/session.js',
  ],
  thresholds: { high: 70, low: 60, break: 50 },
  ignorePatterns: ['dist/**', 'coverage/**', 'node_modules/**'],
  reporters: ['progress-append-only', 'html', 'clear-text', 'json'],
  jsonReporter: { fileName: 'mutation-report/mutation.json' },
  htmlReporter: { fileName: 'mutation-report/index.html' },
  warnings: { unknownOptions: false },
  concurrency: 4,
};
