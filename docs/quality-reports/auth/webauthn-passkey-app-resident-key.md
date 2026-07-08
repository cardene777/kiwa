# WebAuthn Passkey Dogfood — residentKey + `/manage` quality report

Sub-Issue #859 (v1.21-2d) fidelity report for the residentKey + credential
management axes of the dogfood app (`examples/dogfood-webauthn-passkey-app`).
Covers the four `residentKey` values (`required` / `preferred` / `discouraged`
/ unset), the `discoverable` flag flow through the RP store, the
`/manage` GET + DELETE surface, and the full lifecycle
(register → list → signin → delete → signin) across mock and real drivers.

## residentKey vocabulary

Three spec values from WebAuthn L3 §5.4.6. `residentKey` is the RP hint that
tells the authenticator whether the credential should be *discoverable* —
stored on the authenticator itself, usable without the RP supplying
`allowCredentials` at signin.

| value | source | behaviour |
|---|---|---|
| `required` | WebAuthn L3 §5.4.6 | Authenticator MUST store the credential (resident-key). Fails when authenticator lacks resident-key storage. |
| `preferred` | WebAuthn L3 §5.4.6 (default when Passkey is requested) | Authenticator SHOULD store the credential; RP accepts fallback to a legacy credential when resident-key storage is unavailable. |
| `discouraged` | WebAuthn L3 §5.4.6 | Authenticator MUST NOT consume its resident-key slot even when capable — credential is minted as a legacy (server-side) credential. |
| unset | fallback → `requireResidentKey` boolean (§5.4.4 legacy) | The kiwa mock treats an unset `residentKey` as `discouraged` unless `requireResidentKey=true`. |

## Fidelity axes (residentKey + `/manage`)

| axis | mock (`@kiwa/auth`) | real (SimpleWebAuthn + Chrome Virtual Authenticator) | assertion |
|---|---|---|---|
| 1. Creation — `required` on resident-key-capable authenticator | Succeeds; `credential.discoverable === true` | Succeeds; `credential.discoverable === true` | Both drivers persist the credential and mark it discoverable. |
| 2. Creation — `required` on non-resident-key authenticator | Throws `residentKey=required but authenticator does not have resident key storage`; trace `errorKind = resident_key_unsupported` | SimpleWebAuthn `verifyRegistrationResponse` throws `residentKey requirement not satisfied`; 400 | Both surface the failure as a client-visible 400 with a stable error kind. |
| 3. Creation — `preferred` on resident-key-capable authenticator | `credential.discoverable === true` (matches `required`) | `credential.discoverable === true` | Preferred on a capable authenticator produces a discoverable credential per §5.4.6. |
| 4. Creation — `discouraged` on any authenticator | `credential.discoverable === false` even on a capable authenticator | `credential.discoverable === false` | Discouraged clears the flag even when resident-key storage is available. |
| 5. Discovery — signin with empty `allowCredentialIds` | Discovers the discoverable credential; assertion succeeds | Discovers the discoverable credential via Chrome resident-key lookup | WebAuthn L3 §5.5 step 3 — signin without an RP-provided allowCredentials must fall back to the authenticator's discoverable set. |
| 6. Delete — `/manage?credentialId=...` | Removes from both RP store and kiwa env; subsequent signin fails with `no_credentials_registered` | Removes from the SimpleWebAuthn-shaped RP store; subsequent signin fails with the same error kind | Both drivers ensure the credential is gone from every store the authenticator can consult. |

## Test coverage

- `tests/resident-key.spec.ts` — 22 tests across 7 describe blocks:
  - `residentKey axis 1 — creation` — 4 tests covering the four
    `residentKey` values on both capable and incapable authenticators
  - `residentKey axis 2 — discovery` — 3 tests covering
    empty/omitted/missing `allowCredentialIds` behaviour
  - `residentKey axis 3 — delete` — 3 tests covering
    delete success, unknown-credential rejection, and post-delete signin
    failure
  - `/manage route — GET (credential list)` — 3 tests covering the base
    list, the `?discoverable=true|false` filter, and the empty-store path
  - `/manage route — DELETE (credential revoke)` — 5 tests covering
    single-credential delete, 404 on unknown id, 400 on missing param,
    `?confirm=true` clear-all, and empty-store clear-all
  - `/manage route — full lifecycle` — 1 parameterised test that walks
    register → list → signin (discovery) → delete → signin (empty) in one go
  - `toCredentialSummary — projection helper` — 1 test proving the
    summary drops `publicKey` while preserving the management-visible fields
  - `real adapter — env-missing coverage for /manage` — 2 tests
    proving the real adapter's list/delete still work in the env-missing
    state (they touch the in-memory store, not Chrome)
- `tests/e2e/passkey-full-flow.spec.ts` — 2 Playwright + Chrome Virtual
  Authenticator tests covering the register → list → signin (discovery) →
  delete → signin (empty) lifecycle plus the clear-all path

## Route-handler surface (Sub-Issue #859)

Both `/manage` methods accept query params for filtering + confirmation:

- `GET /manage` — returns every persisted credential summary
- `GET /manage?discoverable=true` — returns only discoverable credentials
- `GET /manage?discoverable=false` — returns only legacy credentials
- `DELETE /manage?credentialId=...` — removes the credential; 404 when the id
  does not exist
- `DELETE /manage?confirm=true` — clears every credential (used by
  management-UI "Revoke all"); returns `deleted: false` when the store was
  already empty
- `DELETE /manage` (no query) — returns 400 `missing_credential_id`

## HTTP status mapping

| operation | HTTP status | error field |
|---|---|---|
| `GET /manage` — succeeds | 200 | (n/a) |
| `DELETE /manage?credentialId=<known>` — succeeds | 200 | (n/a) |
| `DELETE /manage?credentialId=<unknown>` | 404 | `credential_not_found` |
| `DELETE /manage` (no query) | 400 | `missing_credential_id` |
| `DELETE /manage?confirm=true` — succeeds | 200 | (n/a) |
| `POST /register` with `residentKey=required` on non-resident-key auth | 400 | `register_failed` (message `residentKey=required`) |

## Scope boundaries

- `/manage` does not require caller authentication because the dogfood app is
  single-user. A production RP would gate `/manage` behind a session cookie
  and a fresh `webauthn.get` assertion (step-up authentication) — this is
  called out in the route source comment for readers reusing the shape.
- The clear-all path (`?confirm=true`) is intentionally opt-in behind a
  query flag so a stray browser request cannot wipe the store.
- `deleteCredential` deletes from both the RP-side `WebAuthnServer` store and
  the kiwa env's authenticator-side registry so the fidelity harness cannot
  be tricked into a "gone from RP but resident on authenticator" split state.

## Known follow-ups

- Real driver — `KIWA_WEBAUTHN_REAL_READY=1` gate stays unwired here (same
  status as Sub-Issues #857 + #858); Chrome Virtual Authenticator is
  exercised through Playwright, not through the `makeRealAdapter` code path.
  A future PR wires the two together so the real-driver column above becomes
  an executed diff rather than a spec-based assertion.
- Cross-user credential leakage — the dogfood store is a flat
  `Map<credentialId, credential>`, not scoped by `userHandle`. A production
  RP would key by user and filter on that; the SCOPE BOUNDARY note in
  `src/app/manage/route.ts` covers this.
