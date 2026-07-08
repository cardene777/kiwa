/**
 * A11y (axe-core) config for @kiwa/streaming.
 * Tier: SaaS tier (critical 0 / serious 0 / moderate 0) — Kafka / NATS / Redpanda. No DOM.
 * SSOT: docs/quality/a11y-thresholds.md § SaaS tier.
 *
 * `providers` list persists the SaaS provenance the baseline covers — 3 provider adapters
 * (kafka / nats / redpanda) crossed with 5 semantics (dlq / exactly-once / schema-registry /
 * partition / retention) mirroring the v1.30-3 Issue #994 AC "streaming = 3 provider × 5 semantics".
 * Each provider × semantics row is a separate provenance entry so downstream gates can name
 * the exact provider × semantics pair the sweep considered.
 */
const SEMANTICS = ['dlq', 'exactly-once', 'schema-registry', 'partition', 'retention'];

const BRANDS = ['kafka', 'nats', 'redpanda'];

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
  baselinePath: '.a11y-baseline/streaming.json',
  providers: BRANDS.flatMap((brand) =>
    SEMANTICS.map((semantics) => ({ name: brand, semantics })),
  ),
};
