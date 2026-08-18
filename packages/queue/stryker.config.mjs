/**
 * Mutation testing config for @kiwa-lab/queue.
 * Threshold: SaaS tier (high 65 / low 55 / break 50) — provider transport and
 * semantics drift across RabbitMQ / SQS / Cloudflare Queues / Inngest.
 *
 * Every implementation file (#1980). It mutated `sandbox-queue.js` alone
 * before, 298 lines of 5,276, and measures 78.37 % over 2,839 mutants widened.
 *
 * **The testcontainers exclusion was wrong.** It said those files score
 * "0 % / 0 covered mutants" without a live container, citing a v1.27-3 sweep.
 * Measured: `testcontainers-queue.js` has 234 covered mutants against 17
 * no-coverage, and `rabbitmq/testcontainers-rabbitmq.js` 40 against 14.
 *
 * Eight files across three packages carried an exclusion of this shape and
 * every one turned out to have covered mutants: `cache` (#1967, three files),
 * this package (#1980, two) and `realtime` (#1980, three).
 *
 * `rabbitmq/testcontainers-rabbitmq.js` scores 30.00 over its 40 covered
 * mutants, far under the 78.37 aggregate, so excluding it was holding this
 * package's number up. That is the argument for listing it, not against: a
 * file needing a live server for *some* of its assertions still runs plenty
 * without one, and what it runs is the part worth measuring.
 * SSOT: docs/quality/mutation-thresholds.md § SaaS tier.
 */
export default {
  packageManager: 'pnpm',
  testRunner: 'vitest',
  testRunnerNodeArgs: ['--max-old-space-size=4096'],
  plugins: ['@stryker-mutator/vitest-runner'],
  vitest: { configFile: 'vitest.stryker.config.mjs' },
  mutate: [
    '.vitest-dist/src/cloudflare-queues/miniflare-cloudflare-queues.js',
    '.vitest-dist/src/cloudflare-queues/setup-cloudflare-queues-env.js',
    '.vitest-dist/src/cloudflare-queues/types.js',
    '.vitest-dist/src/cloudflare-queues/wrangler-cloudflare-queues.js',
    '.vitest-dist/src/inngest/dev-server-inngest.js',
    '.vitest-dist/src/inngest/setup-inngest-env.js',
    '.vitest-dist/src/inngest/stub-inngest.js',
    '.vitest-dist/src/inngest/types.js',
    '.vitest-dist/src/rabbitmq-advanced/setup-rabbitmq-advanced-env.js',
    '.vitest-dist/src/rabbitmq-advanced/types.js',
    '.vitest-dist/src/rabbitmq/setup-rabbitmq-env.js',
    '.vitest-dist/src/rabbitmq/stub-rabbitmq.js',
    '.vitest-dist/src/rabbitmq/testcontainers-rabbitmq.js',
    '.vitest-dist/src/rabbitmq/types.js',
    '.vitest-dist/src/sandbox-queue.js',
    '.vitest-dist/src/semantics/job-lifecycle-orchestrator.js',
    '.vitest-dist/src/setup-bullmq-env.js',
    '.vitest-dist/src/sqs/localstack-sqs.js',
    '.vitest-dist/src/sqs/setup-sqs-env.js',
    '.vitest-dist/src/sqs/stub-sqs.js',
    '.vitest-dist/src/sqs/types.js',
    '.vitest-dist/src/testcontainers-queue.js',
    '.vitest-dist/src/types.js',
  ],
  thresholds: { high: 65, low: 55, break: 50 },
  ignorePatterns: ['dist/**', 'coverage/**', 'node_modules/**'],
  reporters: ['progress-append-only', 'html', 'clear-text', 'json'],
  jsonReporter: { fileName: 'mutation-report/mutation.json' },
  htmlReporter: { fileName: 'mutation-report/index.html' },
  warnings: { unknownOptions: false },
  concurrency: 4,
};
