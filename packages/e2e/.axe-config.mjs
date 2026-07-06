/**
 * A11y (axe-core) config for @kiwa-test/e2e.
 * Tier: Test type tier (critical 0 / serious 0-3 / moderate 0-10) — Playwright fixture + test env. Browser fixture noise.
 * SSOT: docs/quality/a11y-thresholds.md § Test type tier.
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
  baselinePath: '.a11y-baseline/e2e.json',
};
