# dogfood-webauthn-passkey-app

Dogfood app for `@kiwa-test/auth` v1.21-1a (WebAuthn L3 adapter). A Next.js 15 App Router RP (Relying Party) that exercises the four spec-critical WebAuthn ceremonies — credential creation + attestation, credential assertion + userVerification, and residentKey-based discoverable credentials — under two drivers:

- `KIWA_MODE=real` — Chrome Virtual Authenticator API + SimpleWebAuthn-shaped RP server (`webauthn-server.ts`). Skipped when the environment cannot reach a headed Chrome (`DISPLAY` unset / CI-less local without Playwright browsers installed).
- `KIWA_MODE=mock` — `@kiwa-test/auth` `setupWebAuthnEnv` + `credentialCreation` / `credentialAssertion` deterministic mock. Always runs.

Behavioural fidelity between the two drivers feeds the release gate (`quality-reports/auth/webauthn-passkey-app-register.md` + siblings).

## Sub-Issue split (v1.21-2 = #843)

| Sub-Issue | scope | routes touched |
|---|---|---|
| #856 (a) | Next.js 15 skeleton + `/register` (credential creation + attestation) | `src/app/register/` |
| #857 (b) | `/signin` (credential assertion) + Playwright + Chrome Virtual Authenticator | `src/app/signin/` |
| #858 (c) | userVerification 4 pattern (`required` / `preferred` / `discouraged` / `impossible`) | `?uv=` query on register + signin |
| #859 (d) | residentKey + `/manage` (list + delete) + release gate 7 axes | `src/app/manage/` |

Sub-Issue **a** (this repo state) lands the shared surface — RP server, adapter interface, `KIWA_MODE` split, first fidelity harness — so subsequent Sub-Issues only add route handlers + tests.

## Layout

```
src/
  adapters/
    interface.ts        # WebAuthnRPAdapter contract (register / signin / listCredentials / deleteCredential)
    mock.ts             # makeMockAdapter — @kiwa-test/auth setupWebAuthnEnv
    real.ts             # makeRealAdapter — SimpleWebAuthn-shaped RP + Chrome Virtual Authenticator (skipped when DISPLAY absent)
  lib/
    webauthn-server.ts  # Framework-agnostic RP server logic (challenge store + attestation verification)
  app/
    register/
      route.ts          # Next.js 15 App Router POST handler wrapping WebAuthnRPAdapter.register()
tests/
  register-attestation.spec.ts   # 4 fidelity axes: attestationObject / clientDataJSON / signature format / signCount=0
```

`src/app/register/route.ts` follows the Next.js 15 App Router route handler convention (`export async function POST(req: Request)`), but the handler is a thin wrapper around `WebAuthnRPAdapter.register()` — the RP logic itself is Next.js-independent and can be lifted into any HTTP runtime.

## Running

```sh
pnpm test          # vitest (mock always, real skipped when DISPLAY unset)
pnpm typecheck     # tsc --noEmit
```

Playwright + Chrome Virtual Authenticator e2e is added in Sub-Issue **b** (#857).

## Fidelity axes (register-attestation)

The register-attestation harness diffs mock vs real on four axes documented in `docs/quality-reports/auth/webauthn-passkey-app-register.md`.

1. `attestationObject` shape (base64url-encoded CBOR-ish string tagged with attestation mode)
2. `clientDataJSON` shape (`webauthn.create` type + rp origin + normalised challenge)
3. Signature format (mock returns a deterministic tagged string; real returns SimpleWebAuthn base64url signature)
4. `signCount` initial value = 0 for both drivers (WebAuthn L3 §6.1.1)

Divergence on any axis fails the release gate.
