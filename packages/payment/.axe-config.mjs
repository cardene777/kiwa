/**
 * A11y (axe-core) config for @kiwa/payment.
 * Tier: SaaS tier (critical 0 / serious 0 / moderate 0) — Stripe / Paddle / Lemon Squeezy. No DOM.
 * SSOT: docs/quality/a11y-thresholds.md § SaaS tier.
 *
 * `providers` list persists the SaaS provenance the baseline covers — 3 provider adapters
 * (stripe / paddle / lemonsqueezy) crossed with 9 semantics axis (invoice / retry /
 * subscription-lifecycle / chargeback / dunning / tax / three-ds / sca / psd2) mirroring
 * the v1.30-3 Issue #994 AC "payment = 3 provider × 9 axis". Each axis-per-provider is a
 * separate provenance row so downstream gates can name the exact provider × axis pair.
 */
const AXES = [
  'invoice',
  'retry',
  'subscription-lifecycle',
  'chargeback',
  'dunning',
  'tax',
  'three-ds',
  'sca',
  'psd2',
];

const BRANDS = ['stripe', 'paddle', 'lemonsqueezy'];

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
  baselinePath: '.a11y-baseline/payment.json',
  providers: BRANDS.flatMap((brand) =>
    AXES.map((axis) => ({ name: brand, axis })),
  ),
};
