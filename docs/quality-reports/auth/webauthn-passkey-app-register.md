# WebAuthn Passkey Dogfood — register-attestation quality report

Skeleton report for `examples/dogfood-webauthn-passkey-app` Sub-Issue #856 (v1.21-2a).

Full mock vs real fidelity numbers are filled in as `/manage` + `/signin` land in Sub-Issues #857 - #859. This report tracks the register-attestation ceremony only.

## Fidelity axes (register-attestation)

| axis | mock (`@kiwa-lab/auth`) | real (SimpleWebAuthn + Chrome Virtual Authenticator) | assertion |
|---|---|---|---|
| 1. `attestationObject` shape | base64url(`attestation::<mode>::<credentialId>::<rpId>`) — deterministic | base64url(CBOR) — attestation statement + authenticator data + fmt | Both encode as base64url; mock string decodes to a canonical mode-tagged marker so structural drift is caught. Real is validated via SimpleWebAuthn `verifyRegistrationResponse` (Sub-Issue #857). |
| 2. `clientDataJSON` shape | base64url(JSON) with `type=webauthn.create`, normalized base64url challenge, origin = `https://<rp.id>`, `crossOrigin=false` | same JSON layout, real Uint8Array challenge round-tripped through browser | JSON shape is identical between mock + real; `normalizeChallenge` in `@kiwa-lab/auth` mirrors what a browser encodes. |
| 3. Signature format | deterministic fnv-1a base64url (`mockSignature`) | ES256 / RS256 / EdDSA base64url (real authenticator) | Both satisfy the base64url alphabet. Sub-Issue #857 diffs on decoding + verification success rather than byte-equality (mock cannot forge real signatures). |
| 4. `signCount` initial value | `0` (per `credentialCreation` in `packages/auth/src/webauthn/creation.ts`) | `0` (per WebAuthn L3 §6.1.1) | Both drivers must return exactly `0` for a freshly minted credential. |

## Test coverage

- `tests/register-attestation.spec.ts` — 12 tests, split into three describe blocks:
  - `mock adapter — register ceremony` — 7 tests covering axes 1-4 + persistence + `attestation=none` + UV=required rejection
  - `real adapter — env-missing skeleton` — 2 tests validating the `KIWA_WEBAUTHN_ENV_MISSING` guard + trace recording when Chrome is not reachable
  - `register route handler — POST /register` — 4 tests covering happy path + 400 (missing fields) + 400 (invalid JSON) + 500 (adapter refuses)

## Environment gating

- `KIWA_MODE=mock` — forces the mock adapter; every test always runs.
- `DISPLAY` unset on Linux — `detectRealEnvMissing()` returns `'DISPLAY unset'`, real adapter refuses.
- macOS / Windows without Playwright browsers installed — `detectRealEnvMissing()` returns `KIWA_WEBAUTHN_ENV_MISSING` until Sub-Issue #857 wires up `chromium.executablePath()`.

## Known follow-ups

- Sub-Issue #857 — real Chrome Virtual Authenticator wiring + `/signin` credential assertion + Playwright e2e that exercises the register + signin round-trip end to end.
- Sub-Issue #858 — userVerification 4 pattern (`required` / `preferred` / `discouraged` / `impossible`) + fidelity assertion on UV bit. **Landed** — see `webauthn-passkey-app-user-verification.md` for the UV bit fidelity table.
- Sub-Issue #859 — `residentKey=required` discoverable credential + `/manage` route + release gate 7 axes.
