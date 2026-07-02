# dogfood-supabase-saas-app

Dogfood app 1 (v1.11-2) — a SaaS-shaped Next.js-style app that exercises Supabase Auth core + advanced across five features (email/password + magic link + OAuth PKCE + MFA TOTP + SSO SAML + Web3 SIWE + RLS-protected doc list) so we can measure how faithfully `@kiwa-test/auth` mocks track the real Supabase behaviour.

## Modes

- `KIWA_MODE=mock` (default) — driven by `makeMockAdapter()` (`@kiwa-test/auth` core + advanced envs)
- `KIWA_MODE=real` — driven by `makeRealAdapter()` that talks to a running Supabase instance via `SUPABASE_URL` + `SUPABASE_ANON_KEY` + `SUPABASE_SERVICE_ROLE_KEY`. When the env vars are missing, the adapter reports each method as `SUPABASE_ENV_MISSING` so the fidelity harness records the gap without failing the test suite.

## Layout

```
src/
  adapters/
    interface.ts   -- provider-neutral auth API contract
    mock.ts        -- kiwa mock adapter (bridges core + advanced envs)
    real.ts        -- Supabase HTTP adapter with graceful skip when env missing
  flows/
    user-flows.ts  -- orchestrates onboarding + docs + MFA + SSO + SIWE flows
    fidelity.ts   -- trace-diffing harness that feeds @kiwa-test/quality-metrics
tests/
  e2e-mock-mode.test.ts        -- 8 mock-mode e2e tests
  fidelity-report.test.ts      -- 3 harness tests
  emit-fidelity-report.test.ts -- writes the actual JSON + markdown snapshot
```

## Emit a fidelity report

```bash
pnpm test
cat quality-report/fidelity-latest.md
cat quality-report/fidelity-latest.json
```

The `quality-report/` directory is git-ignored — promote snapshots to `docs/quality-reports/` when they become the canonical ones for a release.

## Related

- v1.10-1 Supabase Auth core adapter (`packages/auth/src/supabase/`)
- v1.10-2 Supabase Auth advanced adapter (`packages/auth/src/supabase-advanced/`)
- v1.11-1 quality-metrics harness (`packages/quality-metrics/`)
- v1.11 milestone parent [#680](https://github.com/cardene777/kiwa/issues/680), this sub [#682](https://github.com/cardene777/kiwa/issues/682)
