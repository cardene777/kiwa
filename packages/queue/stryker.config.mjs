/**
 * Mutation testing config for @kiwa-lab/queue.
 * Threshold: SaaS tier (high 65 / low 55 / break 50) — queue adapter targets
 * the sandbox backend. testcontainers-queue.js is excluded because its
 * assertions only fire when a live RabbitMQ / Cloudflare Queues / Inngest
 * container is running, which the mutation run does not spin up (the file
 * scored 0 % / 0 covered mutants in the v1.27-3 baseline sweep). Live-provider
 * coverage lives in the dogfood adapter tests, not the mutation baseline.
 * SSOT: docs/quality/mutation-thresholds.md § SaaS tier.
 */
export default {
  packageManager: 'pnpm',
  testRunner: 'vitest',
  testRunnerNodeArgs: ['--max-old-space-size=4096'],
  plugins: ['@stryker-mutator/vitest-runner'],
  vitest: { configFile: 'vitest.stryker.config.mjs' },
  mutate: [
    '.vitest-dist/src/sandbox-queue.js',
  ],
  thresholds: { high: 65, low: 55, break: 50 },
  ignorePatterns: ['dist/**', 'coverage/**', 'node_modules/**'],
  reporters: ['progress-append-only', 'html', 'clear-text', 'json'],
  jsonReporter: { fileName: 'mutation-report/mutation.json' },
  htmlReporter: { fileName: 'mutation-report/index.html' },
  warnings: { unknownOptions: false },
  concurrency: 4,
};
