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

Sub-Issue **a** landed the shared surface (RP server, adapter interface, `KIWA_MODE` split, register-attestation fidelity harness). Sub-Issue **b** (this state) layers `/signin` on top — assertion ceremony + Playwright + Chrome Virtual Authenticator e2e that round-trips real browser signatures through the RP mock verifier.

## Layout

```
src/
  adapters/
    interface.ts        # WebAuthnRPAdapter contract (register / signin / listCredentials / deleteCredential)
    mock.ts             # makeMockAdapter — @kiwa-test/auth setupWebAuthnEnv + credentialCreation + credentialAssertion
    real.ts             # makeRealAdapter — SimpleWebAuthn-shaped RP + Chrome Virtual Authenticator (skipped when DISPLAY absent or KIWA_WEBAUTHN_REAL_READY unset)
  lib/
    webauthn-server.ts  # Framework-agnostic RP server logic (challenge store + attestation verification)
  app/
    register/
      route.ts          # Next.js 15 App Router POST handler wrapping WebAuthnRPAdapter.register()
    signin/
      route.ts          # Next.js 15 App Router POST handler wrapping WebAuthnRPAdapter.signin()
tests/
  register-attestation.spec.ts   # 4 fidelity axes: attestationObject / clientDataJSON / signature format / signCount=0
  signin-assertion.spec.ts       # 3 fidelity axes: assertion signature / signCount monotonic bump / credentialId consistency
  e2e/
    passkey-signin.spec.ts       # Playwright + Chrome Virtual Authenticator — real browser drives /register + /signin through the RP mock
```

`src/app/{register,signin}/route.ts` follows the Next.js 15 App Router route handler convention (`export async function POST(req: Request)`), but each handler is a thin wrapper around the adapter — the RP logic itself is Next.js-independent and the Playwright e2e mounts the handlers into a bare Node HTTP server to avoid booting Next.js.

## Running

```sh
pnpm test          # vitest (mock always, real skipped when KIWA_WEBAUTHN_REAL_READY unset)
pnpm test:e2e      # Playwright + Chrome Virtual Authenticator (skips when browsers not cached)
pnpm typecheck     # tsc --noEmit
```

Sub-Issue **c** (#858) layers the userVerification 4 pattern (`required` / `preferred` / `discouraged` / `impossible`) on top of `/register` and `/signin`.

## Fidelity axes

### Register-attestation (Sub-Issue #856)

The register-attestation harness diffs mock vs real on four axes documented in `docs/quality-reports/auth/webauthn-passkey-app-register.md`.

1. `attestationObject` shape (base64url-encoded CBOR-ish string tagged with attestation mode)
2. `clientDataJSON` shape (`webauthn.create` type + rp origin + normalised challenge)
3. Signature format (mock returns a deterministic tagged string; real returns SimpleWebAuthn base64url signature)
4. `signCount` initial value = 0 for both drivers (WebAuthn L3 §6.1.1)

### Signin-assertion (Sub-Issue #857)

The signin-assertion harness diffs mock vs real on three axes:

1. Assertion signature format — mock + real both emit base64url-clean `signature` / `clientDataJSON` / `authenticatorData` so the RP can decode without re-encoding
2. `signCount` monotonic increment — every successful assertion bumps the RP-side counter by exactly +1, satisfies WebAuthn L3 §7.2 step 21 clone-detection
3. `credentialId` consistency — the assertion `credentialId` matches the persisted RP credential (round-trip through `WebAuthnServer.getCredential`)

Divergence on any axis fails the release gate.
