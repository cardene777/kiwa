/**
 * A11y (axe-core) config for @kiwa-test/auth.
 * Tier: Framework tier (critical 0 / serious 0-3 / moderate 0-10) — NextAuth v5 / Lucia v3 / Better Auth / Clerk / Auth0 / Supabase Auth.
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
  baselinePath: '.a11y-baseline/auth.json',
};
