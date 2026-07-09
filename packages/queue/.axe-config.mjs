/**
 * A11y (axe-core) config for @kiwa-lab/queue.
 * Tier: SaaS tier (critical 0 / serious 0 / moderate 0) — BullMQ / Inngest / Cloudflare Queues / SQS / RabbitMQ. No DOM.
 * SSOT: docs/quality/a11y-thresholds.md § SaaS tier.
 *
 * `providers` list persists the SaaS provenance the baseline covers — 5 provider adapters
 * (bullmq / inngest / cloudflare-queues / sqs / rabbitmq) mirroring the v1.30-3 Issue #994 AC.
 * `rabbitmq-advanced` is an axis of the rabbitmq provider (advanced exchange semantics),
 * not a separate provider entry, matching the AC's "queue = 5 provider" count.
 */
export default {
  runOptions: {
    runOnly: {
      type: 'tag',
      values: ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'],
    },
  },
  thresholds: {
    critical: 0,
    serious: 0,
    moderate: 0,
  },
  baselinePath: '.a11y-baseline/queue.json',
  providers: [
    { name: 'bullmq' },
    { name: 'inngest' },
    { name: 'cloudflare-queues' },
    { name: 'sqs' },
    { name: 'rabbitmq' },
  ],
};
