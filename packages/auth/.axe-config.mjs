/**
 * A11y (axe-core) config for @kiwa-test/auth.
 * Tier: Framework tier (critical 0 / serious 0-3 / moderate 0-10) — NextAuth v5 / Lucia v3 / Better Auth / Clerk / Auth0 / Supabase Auth.
 * SSOT: docs/quality/a11y-thresholds.md § Framework tier.
 *
 * `providers` list persists the SaaS provenance the baseline covers — 6 provider adapters
 * (auth0 / better-auth / clerk / lucia / supabase / supabase-advanced) plus 4 protocol
 * adapters (oauth21 / oidc / passkey / webauthn) mirroring the v1.30-3 Issue #994 AC.
 * The list travels through `scripts/run-axe-baseline.mjs` into `.a11y-baseline/auth.json`
 * so downstream gates can prove the sweep considered every provider even when the
 * baseline is layers-absent (no-DOM adapter).
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
  providers: [
    { name: 'auth0' },
    { name: 'better-auth' },
    { name: 'clerk' },
    { name: 'lucia' },
    { name: 'supabase' },
    { name: 'supabase-advanced' },
    { name: 'oauth21', protocol: 'oauth21' },
    { name: 'oidc', protocol: 'oidc' },
    { name: 'passkey', protocol: 'passkey' },
    { name: 'webauthn', protocol: 'webauthn' },
  ],
};
