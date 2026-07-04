# Real driver testing — 3 execution modes SSOT (mock only / real-optional / real-required)

kiwa's v1.21 auth milestone landed 4 protocol adapters (WebAuthn L3 + Passkey + OAuth 2.1 + OIDC) as **pure mocks** — 0 network, 0 container, ~1 ms per test. That is the first-line contract. v1.22 layers **real drivers** on top — Keycloak testcontainers (OIDC), oauth2-mock-server testcontainers (OAuth 2.1), Chrome caBLE hybrid transport (Passkey). Those are the second-line fidelity check. This concept doc is the SSOT for **how the two layers coexist** — the 3 execution modes each test suite exposes, when to pick each, and where the release-gate fidelity axis sits.

## The 3 modes

Every v1.22 test surface (`@kiwa-test/auth` v0.5, dogfood apps, tutorials 37-38) exposes three execution modes gated on the `KIWA_MODE` environment variable.

| Mode | Trigger | Behaviour | Latency budget | When to use |
|---|---|---|---|---|
| `mock only` | `KIWA_MODE` unset (default) | Pure `@kiwa-test/auth` mock; every spec-critical branch runs deterministically | < 5 ms per test | Every PR, every push, every local run |
| `real-optional` | `KIWA_MODE=real-optional` | Try the real driver; if the container URL / driver flag is missing, fall back to mock and print `warn: driver unavailable, running mock` | < 5 ms mock / < 60 s real (best-effort) | Local exploratory runs where Docker may or may not be up; laptop CI where testcontainers is optional |
| `real-required` | `KIWA_MODE=real` + protocol-specific env (`KEYCLOAK_URL` / `OAUTH21_BOOTSTRAP=1` / Chrome caBLE flag) | Fail hard if the driver is missing; run tests only against the live container / browser | < 90 s per test | Nightly CI where drift detection between mock and real matters more than latency; pre-release smoke |

The **default** is `mock only`. That is the SSOT contract kiwa preserves — every PR runs in < 5 s regardless of whether Docker is up, whether the internet is reachable, whether Chrome is installed. Any regression to that latency budget is a release-gate failure.

## Why 3 modes (not 2)

A binary "mock vs real" split forces every contributor to install Docker + Chrome + Keycloak just to run tests. That kills PR velocity — the mock's whole point is to keep the fast-path fast. But a pure-mock world lets the mock drift from the real thing silently.

The `real-optional` middle mode threads the needle. A contributor with Docker up gets the fidelity check for free (their local run detects drift before pushing). A contributor without Docker sees a warning but still passes the mock branch (their PR keeps flowing). CI runs `mock only` on every PR and `real-required` on nightly — the fast path stays fast, the drift catcher stays honest.

## The fidelity harness

Every v1.22 dogfood app ships a **fidelity report** — a matrix of protocol behaviours checked against both the mock and the real driver. When both agree on N axes, the release-gate fidelity axis records `N/N`. When they disagree on M axes, the gate records `(N-M)/N` and flags the drift.

Concrete v1.22 axes.

### OIDC federation (dogfood-oidc-federation, v1.22-1)

| Axis | Mock behaviour | Real Keycloak behaviour | Load-bearing? |
|---|---|---|---|
| 1 — Discovery metadata field parity | Every field in `.well-known/openid-configuration` (issuer / authorization_endpoint / token_endpoint / userinfo_endpoint / jwks_uri / scopes_supported / response_types_supported / …) | Same field set from Keycloak realm import | Yes — RP wire-shape depends on it |
| 2 — DCR software_statement JWS verify | 4 auth methods (`none` / `client_secret_basic` / `client_secret_post` / `private_key_jwt`) | Keycloak DCR endpoint accepts the same 4 | Yes — RP registration must succeed on both |
| 3 — JWKS rotation with `kid` rollover | Old key survives grace window; new key verifies immediately | Keycloak `POST /admin/realms/{realm}/keys/rotate` produces the same behaviour | Yes — RP token verify must survive rotation |
| 4 — id_token full-claim verify | `iss` / `aud` / `exp` / `iat` / `nonce` / `at_hash` / `c_hash` all guarded with per-reason strings | Keycloak-issued id_token verifies against the same guard set | Yes — replay attack surface |
| 4a-4d — Federation trust chain resolution axes (inside window / past retention / multi-rotation / fresh key after rotation) | trust anchor + intermediate + statement chain verify + intermediate substitution attack detection | Keycloak Federation SPI + trust anchor rotation | Yes — real-network cache invalidation matters |

### OAuth 2.1 (dogfood-oauth21-provider, v1.22-2)

| Axis | Mock behaviour | Real oauth2-mock-server behaviour |
|---|---|---|
| 1 — Discovery `/.well-known/oauth-authorization-server` field parity | Full field set | oauth2-mock-server exposes matching fields |
| 2 — /authorize post-adapter error redirect (RFC 6749 §4.1.2.1) | Redirects with `error=access_denied` + `state` preserved | oauth2-mock-server matches (v1.21-3a review found a mock drift; v1.22-2 fixed it) |
| 3 — PKCE S256 verify + `plain` refuse | Mandatory S256; `plain` throws | oauth2-mock-server refuses `plain` too |
| 4 — DPoP proof htu/htm/jti/iat guard | 60s clock skew, replay-detect via jti | oauth2-mock-server matches |
| 5 — Refresh rotation with reuse detection | Old refresh dies; reuse revokes chain | oauth2-mock-server matches |

### Passkey caBLE (dogfood-webauthn-passkey-app, v1.22-4)

| Axis | Mock helper | Real Chrome caBLE behaviour |
|---|---|---|
| 1 — QR generation encodes publicKey + tunnelServerHint + nonce + sessionId | `generateCaBLEQRCode({ initiatorDeviceId, responderDeviceId, credential, tunnelServerHint, nonce })` returns `CaBLEQRCodePayload` | Chrome caBLE renders matching FIDO:/ QR content |
| 2 — BLE advertisement handshake derives matching sharedSecret | `performBLEHandshake(qr)` returns `CaBLEBLEHandshake` with `verified: true` | Chrome caBLE BLE handshake matches |
| 3 — WebSocket tunnel establishment | `establishWebSocketTunnel(qr, handshake)` returns `CaBLEWebSocketTunnel` with `established: true` | Chrome caBLE tunnel opens; DevTools reports |
| 4 — Credential migration payload carries credentialId + encryptedPayload | `migrateCredential(tunnel, credential)` returns `CaBLECredentialMigration` | Chrome caBLE migration payload carries the credential |
| 5 — Signature roundtrip preserves RP challenge + verifies | `performSignatureRoundtrip(tunnel, credential, challenge)` returns `CaBLESignatureRoundtrip` with `verified: true` | Chrome caBLE assertion echoes challenge + verifies |
| composite | `runCaBLESession(options, challenge)` chains all 5 steps in one call | Chrome caBLE runs the full ceremony end-to-end |

## Where the release gate hooks in

`@kiwa-test/quality-metrics` v0.2 exposes the fidelity axis as one of the 7 general-purpose axes (`coverage / test count / fidelity / perf p95 / mutation / a11y / dogfood-run`). The dogfood app calls `evaluateReleaseGate(report)` with the fidelity ratio. A verdict of `PASS` requires **every axis of the fidelity report to record `N/N` in `KIWA_MODE=real`** — drift = release-gate failure.

Every v1.22 dogfood app publishes a fidelity report artefact on merge:

- `examples/dogfood-oidc-federation/reports/fidelity-{iso-timestamp}.json`
- `examples/dogfood-oauth21-provider/reports/fidelity-{iso-timestamp}.json`
- `examples/dogfood-webauthn-passkey-app/reports/fidelity-{iso-timestamp}.json`

## The 4 anti-patterns

Real-driver testing has 4 common anti-patterns kiwa consciously refuses.

1. **Assume the container is up.** Every setup file guards on `resolveMode()` first. A test that reaches for `KEYCLOAK_URL` unconditionally breaks the mock-only fast path.
2. **Fold both modes into one code path.** The fidelity harness runs mock + real in **parallel** and compares — not a single function that switches on env. Parallel exposes drift; conditional hides it.
3. **Skip axes silently.** Every axis names its mock behaviour AND its real driver behaviour in the fidelity report. An axis that only records the mock side (because the real driver was not booted) is treated as `SKIP`, not `PASS`. `SKIP` shows up in the release gate as a warning; `PASS` requires both sides.
4. **Let real-driver timeouts leak into CI.** The `real-required` mode has a **90 s hard cap per test**. Anything slower means the container never started, or the network is flaky. Fail fast, don't hang the release.

## When to prefer which mode

- **PR review** — `mock only`. Every reviewer runs `pnpm test` and gets a green in < 5 s. Zero surprise.
- **Local exploratory** — `real-optional`. Contributor with Docker up gets fidelity. Contributor without still passes mock.
- **Nightly CI** — `real-required`. Nightly job boots all 3 containers + Chrome, runs every fidelity axis, publishes the report. Drift fires an alert; the fix goes into the next PR.
- **Pre-release smoke** — `real-required`. Ship gate — no drift means the release is safe.

## Where to look next

- Tutorial 37 (`docs/tutorials/37-real-driver-testing.md`) — Keycloak + oauth2-mock-server testcontainers wiring end-to-end
- Tutorial 38 (`docs/tutorials/38-passkey-cable-flow.md`) — caBLE hybrid transport 5-axis harness
- v1.21 SSOT concept doc (`docs/concepts/auth-protocol-testing.md`) — 4 pure-mock axes that this doc builds on
