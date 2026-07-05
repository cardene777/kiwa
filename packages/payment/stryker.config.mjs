/**
 * Mutation testing config for @kiwa-test/payment.
 * Threshold: SaaS tier (high 65 / low 55 / break 50) — payment adapter wraps
 * Stripe / Paddle / LemonSqueezy with provider-specific mocks and permitted
 * live API drift for compatibility signatures.
 * SSOT: docs/quality/mutation-thresholds.md § SaaS tier.
 */
export default {
  packageManager: 'pnpm',
  testRunner: 'vitest',
  testRunnerNodeArgs: ['--max-old-space-size=4096'],
  plugins: ['@stryker-mutator/vitest-runner'],
  vitest: { configFile: 'vitest.stryker.config.mjs' },
  mutate: [
    '.vitest-dist/src/engine.js',
    '.vitest-dist/src/fixture.js',
    '.vitest-dist/src/stripe.js',
    '.vitest-dist/src/paddle.js',
    '.vitest-dist/src/lemonsqueezy.js',
  ],
  thresholds: { high: 65, low: 55, break: 50 },
  ignorePatterns: ['dist/**', 'coverage/**', 'node_modules/**'],
  reporters: ['progress-append-only', 'html', 'clear-text', 'json'],
  jsonReporter: { fileName: 'mutation-report/mutation.json' },
  htmlReporter: { fileName: 'mutation-report/index.html' },
  warnings: { unknownOptions: false },
  concurrency: 4,
};
