/**
 * A11y (axe-core) config for @kiwa-test/hono.
 * Tier: Framework tier (critical 0 / serious 0-3 / moderate 0-10) — Hono edge + node adapter drift.
 * SSOT: docs/quality/a11y-thresholds.md § Framework tier.
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
    serious: { max: 3 },
    moderate: { max: 10 },
  },
  baselinePath: '.a11y-baseline/hono.json',
};
