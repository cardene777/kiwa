# WebAuthn Passkey Dogfood — userVerification 4 pattern quality report

Sub-Issue #858 (v1.21-2c) fidelity report for the userVerification axis of the
dogfood app (`examples/dogfood-webauthn-passkey-app`). Covers the four
patterns the RP accepts on both `/register` and `/signin` and asserts the UV
bit (WebAuthn L3 §6.1 authenticatorData flags) matches caller intent
across mock and real drivers.

## userVerification vocabulary

Three spec values from WebAuthn L3 §5.4.6 plus one kiwa-only sentinel used by
the dogfood app to probe the "RP asked for a spec-invalid value" path.

| value | source | behaviour |
|---|---|---|
| `required` | WebAuthn L3 §5.4.6 | Authenticator MUST perform user verification (biometric / PIN). Fails when authenticator cannot satisfy UV. |
| `preferred` | WebAuthn L3 §5.4.6 (default) | Authenticator SHOULD perform UV; RP accepts fallback when the authenticator lacks UV. |
| `discouraged` | WebAuthn L3 §5.4.6 | Authenticator MUST NOT perform UV even when capable — UV bit stays 0. |
| `impossible` | kiwa dogfood sentinel | Not a WebAuthn value; RP rejects with `invalid_user_verification` (400) before dispatching. Real SimpleWebAuthn deployments reject the same value at the schema layer. |

## Fidelity axes (userVerification)

| axis | mock (`@kiwa/auth`) | real (SimpleWebAuthn + Chrome Virtual Authenticator) | assertion |
|---|---|---|---|
| 1. `required` on UV-capable authenticator | Succeeds; assertion UV bit = 1 | Succeeds; assertion UV bit = 1 | Both drivers set UV=1 in `authenticatorData` byte 32 (`FLAG_USER_VERIFIED = 0x04`). |
| 2. `required` on non-UV authenticator | Throws `userVerification=required but authenticator does not support user verification`; trace `errorKind = user_verification_unsupported` | SimpleWebAuthn `verifyAuthenticationResponse` throws `UserVerificationRequirement not satisfied`; 400 | Both surface the failure as a client-visible 400 with a stable error kind. |
| 3. `preferred` on UV-capable authenticator | UV bit = 1 | UV bit = 1 | Baseline "everything worked" path. |
| 4. `preferred` on non-UV authenticator | Succeeds; UV bit = 0 | Succeeds; UV bit = 0 | Fallback path — assertion still verifies but RP knows UV was not performed. |
| 5. `discouraged` on any authenticator | UV bit = 0 (mock respects §5.4.6 even on a UV-capable authenticator, per `webauthn/assertion.ts` v1.21-2c) | UV bit = 0 | The mock previously always set UV bit off `hasUserVerification`; #858 flipped this so `discouraged` clears the bit. |
| 6. `impossible` request | RP throws `userVerification=impossible is not a WebAuthn L3 §5.4.6 value`; trace `errorKind = user_verification_impossible`; route returns 400 | RP schema layer rejects with 400 before dispatch | Both drivers refuse before invoking the authenticator. |

## Test coverage

- `tests/user-verification.spec.ts` — 18 tests across 4 describe blocks:
  - `userVerification 4 pattern — register ceremony` — 5 tests covering each
    of the four patterns (`required` × 2 authenticator shapes, `preferred`,
    `discouraged`, `impossible`) on the register side
  - `userVerification 4 pattern — signin ceremony` — 6 tests covering the
    same four patterns on the signin side plus the UV bit table
  - `userVerification — POST /register + POST /signin route validation` — 6
    tests exercising `?uv=` query param wins over body, `impossible` returns
    400 `register_failed` / `signin_failed`, garbage values return 400
    `invalid_user_verification`, `parseUserVerification` narrows the
    vocabulary
  - `fidelity axis — UV bit matches caller intent (AC #3)` — 1 parameterised
    test that asserts the required / preferred / discouraged patterns produce
    the expected UV bit table on a UV-capable authenticator

## Route-handler surface (Sub-Issue #858)

Both `/register` and `/signin` accept userVerification through two channels:

- Body — `authenticatorSelection.userVerification` (register) /
  `userVerification` (signin)
- Query — `?uv=required|preferred|discouraged|impossible`

Query wins when both are set. Any value outside the four dogfood patterns
returns 400 `invalid_user_verification` with a message listing the accepted
values. This lets a browser-side toggle flip UV without re-encoding the whole
POST body while still gate-keeping the RP against typos.

## HTTP status mapping

| userVerification outcome | HTTP status | error field |
|---|---|---|
| Ceremony succeeds | 200 | (n/a) |
| `required` on non-UV authenticator | 400 | `register_failed` / `signin_failed` |
| `impossible` requested | 400 | `register_failed` / `signin_failed` |
| Value outside the four patterns | 400 | `invalid_user_verification` |
| RP env missing (real driver) | 500 | `register_failed` / `signin_failed` |

## Known follow-ups

- Sub-Issue #859 — residentKey + `/manage` layers on top of this axis; the
  release gate consumes both this report and the register-attestation report
  to produce the final v1.21-2 fidelity number.
- Real driver — `KIWA_WEBAUTHN_REAL_READY=1` gate is still unwired; Chrome
  Virtual Authenticator will be exercised through the real driver once the
  Playwright wiring in Sub-Issue #859 lands. Until then the `real` column
  above is a spec-based assertion, not an executed diff.
