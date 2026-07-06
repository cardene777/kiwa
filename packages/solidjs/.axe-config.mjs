/**
 * A11y (axe-core) config for @kiwa-test/solidjs.
 * Tier: Framework tier (critical 0 / serious 0-3 / moderate 0-10) — Solid signal + resource + SSR drift.
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
  baselinePath: '.a11y-baseline/solidjs.json',
};
