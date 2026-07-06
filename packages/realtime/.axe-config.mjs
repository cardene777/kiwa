/**
 * A11y (axe-core) config for @kiwa-test/realtime.
 * Tier: SaaS tier (critical 0 / serious 0 / moderate 0) — Supabase Realtime / Ably / Pusher / Socket.io. No DOM.
 * SSOT: docs/quality/a11y-thresholds.md § SaaS tier.
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
  baselinePath: '.a11y-baseline/realtime.json',
};
