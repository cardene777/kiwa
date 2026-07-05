/**
 * Mutation testing config for @kiwa-test/streaming.
 * Threshold: SaaS tier (high 65 / low 55 / break 50) — streaming adapter
 * covers Kafka / NATS / Redpanda with dead-letter queue + exactly-once
 * semantics; provider mocks have partial fidelity.
 * SSOT: docs/quality/mutation-thresholds.md § SaaS tier.
 */
export default {
  packageManager: 'pnpm',
  testRunner: 'vitest',
  testRunnerNodeArgs: ['--max-old-space-size=4096'],
  plugins: ['@stryker-mutator/vitest-runner'],
  vitest: { configFile: 'vitest.stryker.config.mjs' },
  mutate: [
    '.vitest-dist/src/dlq.js',
    '.vitest-dist/src/exactly-once.js',
    '.vitest-dist/src/kafka.js',
    '.vitest-dist/src/nats.js',
    '.vitest-dist/src/redpanda.js',
    '.vitest-dist/src/schema-registry.js',
  ],
  thresholds: { high: 65, low: 55, break: 50 },
  ignorePatterns: ['dist/**', 'coverage/**', 'node_modules/**'],
  reporters: ['progress-append-only', 'html', 'clear-text', 'json'],
  jsonReporter: { fileName: 'mutation-report/mutation.json' },
  htmlReporter: { fileName: 'mutation-report/index.html' },
  warnings: { unknownOptions: false },
  concurrency: 4,
};
