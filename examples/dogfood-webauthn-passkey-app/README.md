# dogfood-webauthn-passkey-app

Dogfood app for `@kiwa/auth` v1.21-1a (WebAuthn L3 adapter). A Next.js 15 App Router RP (Relying Party) that exercises the four spec-critical WebAuthn ceremonies — credential creation + attestation, credential assertion + userVerification, and residentKey-based discoverable credentials — under two drivers:

- `KIWA_MODE=real` — Chrome Virtual Authenticator API + SimpleWebAuthn-shaped RP server (`webauthn-server.ts`). Skipped when the environment cannot reach a headed Chrome (`DISPLAY` unset / CI-less local without Playwright browsers installed).
- `KIWA_MODE=mock` — `@kiwa/auth` `setupWebAuthnEnv` + `credentialCreation` / `credentialAssertion` deterministic mock. Always runs.

Behavioural fidelity between the two drivers feeds the release gate (`quality-reports/auth/webauthn-passkey-app-register.md` + siblings).

## Sub-Issue split (v1.21-2 = #843)

| Sub-Issue | scope | routes touched |
|---|---|---|
| #856 (a) | Next.js 15 skeleton + `/register` (credential creation + attestation) | `src/app/register/` |
| #857 (b) | `/signin` (credential assertion) + Playwright + Chrome Virtual Authenticator | `src/app/signin/` |
| #858 (c) | userVerification 4 pattern (`required` / `preferred` / `discouraged` / `impossible`) | `?uv=` query on register + signin |
| #859 (d) | residentKey + `/manage` (list + delete) + release gate 7 axes | `src/app/manage/` |

Sub-Issue **a** landed the shared surface (RP server, adapter interface, `KIWA_MODE` split, register-attestation fidelity harness). Sub-Issue **b** layered `/signin` on top — assertion ceremony + Playwright + Chrome Virtual Authenticator e2e. Sub-Issue **c** landed the userVerification 4 pattern (`?uv=` query + fidelity axis on the UV bit). Sub-Issue **d** (this state) closes v1.21-2 by adding `residentKey=required` discoverable credentials, the `/manage` route (list + delete), the full-flow Playwright e2e (register → list → signin → delete → signin) and the release gate 7-axis integrated report.

## Layout

```
src/
  adapters/
    interface.ts        # WebAuthnRPAdapter contract (register / signin / listCredentials / deleteCredential)
    mock.ts             # makeMockAdapter — @kiwa/auth setupWebAuthnEnv + credentialCreation + credentialAssertion
    real.ts             # makeRealAdapter — SimpleWebAuthn-shaped RP + Chrome Virtual Authenticator (skipped when DISPLAY absent or KIWA_WEBAUTHN_REAL_READY unset)
  lib/
    webauthn-server.ts  # Framework-agnostic RP server logic (challenge store + attestation verification)
  app/
    register/
      route.ts          # Next.js 15 App Router POST handler wrapping WebAuthnRPAdapter.register()
    signin/
      route.ts          # Next.js 15 App Router POST handler wrapping WebAuthnRPAdapter.signin()
    manage/
      route.ts          # Next.js 15 App Router GET (list) + DELETE (revoke) handlers wrapping WebAuthnRPAdapter.listCredentials/deleteCredential
tests/
  register-attestation.spec.ts   # 4 fidelity axes: attestationObject / clientDataJSON / signature format / signCount=0
  signin-assertion.spec.ts       # 3 fidelity axes: assertion signature / signCount monotonic bump / credentialId consistency
  user-verification.spec.ts      # userVerification 4 pattern (required / preferred / discouraged / impossible) × register + signin + route validation + UV bit fidelity
  resident-key.spec.ts           # residentKey 4 value × creation / discovery / delete + /manage GET/DELETE + full lifecycle
  e2e/
    passkey-signin.spec.ts       # Playwright + Chrome Virtual Authenticator — real browser drives /register + /signin through the RP mock
    passkey-full-flow.spec.ts    # Playwright full flow — register → list → signin (discovery) → delete → signin (empty) + clear-all
```

`src/app/{register,signin,manage}/route.ts` follows the Next.js 15 App Router route handler convention (`export async function POST(req: Request)` / `GET` / `DELETE`), but each handler is a thin wrapper around the adapter — the RP logic itself is Next.js-independent and the Playwright e2e mounts the handlers into a bare Node HTTP server to avoid booting Next.js.

## Running

```sh
pnpm test          # vitest (mock always, real skipped when KIWA_WEBAUTHN_REAL_READY unset)
pnpm test:e2e      # Playwright + Chrome Virtual Authenticator (skips when browsers not cached)
pnpm typecheck     # tsc --noEmit
```

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

### userVerification 4 pattern (Sub-Issue #858)

The userVerification harness diffs mock vs real on the four patterns the RP accepts. See `docs/quality-reports/auth/webauthn-passkey-app-user-verification.md` for the full UV bit fidelity table.

1. `required` — succeeds on UV-capable authenticator (UV bit = 1), rejects on non-UV authenticator (`user_verification_unsupported`)
2. `preferred` — succeeds on both; UV bit tracks authenticator capability (fallback semantics per §5.4.6)
3. `discouraged` — UV bit = 0 even on UV-capable authenticator (spec-mandated)
4. `impossible` — kiwa-only sentinel; RP rejects with 400 `invalid_user_verification` before dispatch

Query param support — both routes accept `?uv=required|preferred|discouraged|impossible`, which overrides the body value when both are present.

### residentKey + `/manage` (Sub-Issue #859)

The residentKey + `/manage` harness (`docs/quality-reports/auth/webauthn-passkey-app-resident-key.md`) covers six fidelity axes:

1. Creation with `residentKey=required` on a resident-key-capable authenticator — credential is discoverable (WebAuthn L3 §5.4.6)
2. Creation with `residentKey=required` on a non-resident-key authenticator — rejected with `resident_key_unsupported`
3. Creation with `residentKey=preferred` on a capable authenticator — discoverable (same as `required`)
4. Creation with `residentKey=discouraged` — credential is legacy (`discoverable=false`) even on a capable authenticator
5. Discovery-mode signin — signin with omitted / empty `allowCredentialIds` succeeds via resident-key lookup
6. Delete — `/manage?credentialId=...` removes the credential from both the RP store and the authenticator-side registry so a subsequent signin fails with `no_credentials_registered`

`/manage` route handlers — `GET /manage` returns the credential summary list (drops `publicKey`), `GET /manage?discoverable=true|false` narrows the filter, `DELETE /manage?credentialId=...` removes a single credential, `DELETE /manage?confirm=true` clears every credential (opt-in behind the query flag so a stray browser request cannot wipe the store).

### v1.21-2 release gate (Sub-Issue #859)

The integrated release gate SSOT (`docs/quality-reports/auth/webauthn-passkey-app.md`) rolls up the four patterns onto seven axes: `lint` / `typecheck` / `build` / `test` / `test:cov` / `test:e2e` / `fidelity`. Every axis must be green before parent Issue #843 closes. Divergence on any axis fails the release gate.
