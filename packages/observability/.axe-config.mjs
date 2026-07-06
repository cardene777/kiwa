/**
 * A11y (axe-core) config for @kiwa-test/observability.
 * Tier: Core tier (critical 0 / serious 0 / moderate 0-3) — Flaky detection + coverage gap analysis. No DOM.
 * SSOT: docs/quality/a11y-thresholds.md § Core tier.
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
    moderate: { max: 3 },
  },
  baselinePath: '.a11y-baseline/observability.json',
};
