# Auth protocol testing — virtual authenticator / PKCE+DPoP / id_token / discovery+federation (SSOT)

kiwa's v1.10-2 auth work (Supabase Auth core + advanced) covered the **session-shaped** mock case — email OTP, JWT session, RLS check, SAML assertion, SIWE nonce, MFA factor — for user identity backed by a database. v1.21 adds **four axes on top of that base** — the ones production teams hit once their session suite is green but the interactive auth surface (WebAuthn L3 + Passkey / OAuth 2.1 / OIDC + Federation) introduces semantics the session mocks do not capture. This concept doc is the SSOT for those four axes; the tutorials and dogfood apps are the concrete implementations.

## Axis 1 — Virtual authenticator + Passkey semantics (attachment × transport × sync fabric)

WebAuthn L3 and Passkey diverge from bearer-token flows because there is no bearer token to steal — the credential is a hardware-bound (or platform-bound) keypair, and the RP-facing surface is a ceremony (create + assert) not a request (POST + Authorization header). Every non-trivial WebAuthn test hits a taxonomy along `attachment` (`platform` vs `cross-platform`) × `transport` (`internal` / `usb` / `nfc` / `ble` / `hybrid`) × `hasResidentKey` × `hasUserVerification`.

That divergence matters for tests because virtual authenticator bugs look like:

- "The credential was created with `residentKey=preferred` but the roaming authenticator did not store it" — the resident-key storage was missing, or the authenticator downgraded silently
- "The signCount did not bump between assertions" — the authenticator's `isUserPresent` was cleared, or the counter overflowed
- "The Passkey backup was accepted but the restore failed" — the backup-eligibility check ran on the wrong credential kind, or the sync fabric was misconfigured

kiwa surfaces the pattern in three places.

- `setupWebAuthnEnv({ authenticators: [{ attachment, transport, hasResidentKey, hasUserVerification }] })` — mounts the virtual authenticator taxonomy. Invalid pairs (`platform` + `usb`, `cross-platform` + `internal`) throw at setup time. `env.credentialCreation({ rp, user, challenge, attestation? })` walks the credential-creation ceremony; `env.credentialAssertion({ rpId, challenge, userVerification? })` walks the assertion ceremony and bumps `signCount`.
- `setupPasskeyEnv({ devices: [{ deviceId, platform?, roaming? }] })` — mounts a device-scoped Passkey environment. `env.createPasskey(deviceId, userId, options)` forces `residentKey=required` (Passkeys are discoverable). `env.authenticate(deviceId, options)` walks the assertion. `env.backupCredential(credentialId, vendor)` + `env.restoreCredential(deviceId, userId, credentialId, vendor)` walk the sync fabric.
- `env.syncCredentials(sourceDeviceId, targetDeviceId, userId, vendor)` — bulk sync every backup-eligible Passkey between devices for one user through one fabric. The mock refuses backups of non-backup-eligible credentials (bare security-key) and refuses restores when the requester does not own the credential.

The **contract** each helper enforces is symmetric — every credential-creation records `{ credentialId, attachment, transports, attestationObject, clientDataJSON }`, every assertion records `{ credentialId, signCount, authenticatorData, signature }`, and every backup records `{ syncEpoch, syncedFabrics }`.

### Why virtual authenticator ceremonies need dedicated assertions

The classic pattern "boot a headed Chrome + Chrome DevTools Protocol Virtual Authenticator + Playwright + a physical security key" costs 200 MB of browser + 2 s of cold start per test. The virtual authenticator mock cuts all three costs — 0 browsers, 0 network, ~1 ms per test.

`expect(env.getCredential(id)?.discoverable).toBe(true)` catches "the credential was not stored as discoverable"; `expect(assertion.signCount).toBeGreaterThan(previous.signCount)` catches "the signCount did not bump"; `expect(() => env.backupCredential(bareKeyId, 'icloud-keychain')).toThrow(/not backup-eligible/)` catches "the sync fabric accepted a non-eligible credential". All three patterns are pure — no timing dependence, no waiting for a real Chrome instance.

## Axis 2 — OAuth 2.1 PKCE + DPoP + refresh rotation (per-request proof, thumbprint binding, reuse detection)

OAuth 2.1 (draft RFC 6749bis + RFC 9700 BCP) diverges from OAuth 2.0 because bearer tokens are no longer sufficient — the AS binds every access token to a DPoP JWK thumbprint (RFC 9449), rotates the refresh token on every use (RFC 9700 §2.2.4), and refuses the historical `implicit` / `password` / `client_credentials` grants for interactive user flows. Every non-trivial AS test hits PKCE mandatory-everywhere, DPoP proof mechanics, rotation with reuse detection, and revocation cascade.

That divergence matters for tests because OAuth 2.1 bugs look like:

- "The AS accepted `code_challenge_method=plain` because the OAuth 2.1 flag was off" — a downgrade attack path stayed open
- "The DPoP-bound refresh accepted a different JWK" — the thumbprint check compared strings instead of computing the JWK canonical form
- "The reused refresh token minted a new pair" — the rotation ledger was not persisted, or the reuse detection was disabled

kiwa surfaces the pattern in three places.

- `setupOAuth21Env({ issuer, clients, users, now? })` — creates a mock AS with the 5 spec-critical endpoints. `env.server.authorize(request, subject)` mints an authorization code with PKCE + state guard. `env.server.token(request)` exchanges the code for `{ accessToken, refreshToken, tokenType, scope, expiresIn }`. `env.refreshToken(rt, clientId, dpop?)` rotates the refresh token. `env.server.revoke(token, clientId)` + `env.server.introspect(token)` walk the revocation + introspection surfaces.
- `env.createPkceChallenge()` + `deriveCodeChallenge(verifier, 'S256')` + `verifyCodeChallenge(verifier, challenge, method)` — PKCE helpers. `deriveCodeChallenge(verifier, 'plain')` throws — plain is refused per RFC 9700 §2.1.1.
- `env.createDpopProof({ htm, htu, jwk?, jti? })` + `createMockDpopJwk()` + `computeDpopJkt(jwk)` + `verifyDpopProof(proof, options)` — DPoP helpers. The proof carries `{ header: { typ, alg, jwk }, payload: { htm, htu, iat, jti }, signature }`. `verifyDpopProof` refuses htm/htu mismatch, iat outside skew, and replayed jti.

The **contract** each helper enforces is symmetric — every authorize returns `{ code, state }`, every token returns `{ accessToken, refreshToken, tokenType, scope, expiresIn }`, every rotate invalidates the old refresh, every revoke flips `introspect().active` to false, and every DPoP verify refuses a mismatched thumbprint on refresh.

### Why PKCE + DPoP need dedicated assertions

The classic pattern "trust the bearer token in the Authorization header" costs a stolen-token replay attack path. RFC 9449 moves the proof to the request — every resource server call carries a DPoP JWT signed by the private key of the JWK bound to the access token. The AS verifies the thumbprint on refresh.

`expect(res.tokenType).toBe('DPoP')` catches "the token was not bound"; `expect(() => env.refreshToken(rt, clientId, wrongKeyDpop)).toThrow(/thumbprint mismatch/)` catches "the thumbprint check was string equality"; `expect(() => verifyDpopProof(proof, { seenJtis: replaySet })).toThrow(/replay/)` catches "the replay registry was reset". All three patterns are pure — no timing dependence, no waiting for a real AS boot.

Three properties are load-bearing.

- **PKCE mandatory + plain refused.** `env.server.authorize({ codeChallengeMethod: 'plain' })` throws `/code_challenge_method "plain" refused/`. The test refuses the downgrade at compile time.
- **DPoP jti replay-defence.** `verifyDpopProof(proof, { seenJtis })` records the jti on the first use and throws `/replay detected/` on the second. The test drives both branches.
- **Refresh reuse invalidates the family.** `env.refreshToken(rt, clientId)` returns a new pair; the old `rt` is dead. A retry with the old `rt` throws `/has been rotated — reuse refused/`, matching the RFC 9700 §2.2.4 stolen-refresh-token signal.

## Axis 3 — OIDC id_token claim + hash + nonce guards (per-token verification chain)

OIDC Core §2 defines the `id_token` claim set (`iss` / `sub` / `aud` / `exp` / `iat` / `nonce` / `at_hash` / `c_hash`). §3.1.3.7 mandates `iss` / `aud` / `exp` guards; §3.1.3.6 mandates `at_hash` binds the id_token to the access token; §3.3.2.11 mandates `c_hash` binds the id_token to the authorization code. Every non-trivial OP test hits all four guards + the nonce replay defence + the JWS signature check.

That divergence matters for tests because id_token bugs look like:

- "The id_token verified because the `at_hash` check was skipped when `accessToken` was not passed" — the hash guard was opt-in instead of opt-out
- "The id_token verified after a tampered payload" — the JWS signature was not recomputed, or the kid resolved to the wrong key
- "The nonce guard passed a replayed token" — the nonce tracking was per-connection instead of per-authentication

kiwa surfaces the pattern in one place.

- `setupOidcEnv({ issuer, clients, users, softwareStatementIssuer?, jwksRetentionSec?, idTokenLifetimeSec?, now? })` — creates a mock OP layered on the OAuth 2.1 AS. `env.signIdToken({ sub, aud, nonce?, accessToken?, code? })` returns `{ jwt, claims }`. `env.verifyIdToken(jwt, expected)` returns `{ valid, reason?, claims? }` where `reason` surfaces one of `/iss mismatch/`, `/aud mismatch/`, `/nonce mismatch/`, `/at_hash mismatch/`, `/c_hash mismatch/`, `/exp expired/`, `/signature verification failed/`, `/kid not in JWKS/`.

The **contract** the id_token surface enforces is symmetric — every sign records the guarded claims, every verify recomputes the JWS signature + rederives `at_hash` / `c_hash` if the expected access token / code is passed, and every mismatch surfaces a specific `reason` string.

### Why id_token guards need per-mismatch reasons

The classic pattern "call `jsonwebtoken.verify(token, secret)` and hope every claim is right" costs a single boolean answer. When the RP-side login flow fails, the log shows `invalid token` — the operator has no clue which of the 8 guards refused.

`expect(result.valid).toBe(false)` + `expect(result.reason).toMatch(/at_hash mismatch/)` catches the specific guard that refused. That means production alerting can route on the reason string — a `/nonce mismatch/` alert routes to the RP team (replay attack signal), while an `/at_hash mismatch/` alert routes to the OP team (access-token substitution signal). Both routes bypass a generic `invalid token` bucket.

Three properties are load-bearing.

- **`at_hash` is computed from the access token.** `computeTokenHash(accessToken)` returns the left-half SHA-256 base64url. `signIdToken({ accessToken })` embeds the hash; `verifyIdToken({ expectedAccessToken })` re-derives and compares. Mismatch throws at verify time.
- **JWKS retention keeps retired kid verifiable inside window.** `env.jwks.rotate()` retires the current kid but keeps it in the JWKS document for `jwksRetentionSec`. A token signed before the rotate verifies via the retired kid; after the window elapses, verify throws `/kid not in JWKS/`.
- **`kid` header + JWKS lookup binds the signature.** `verifyIdToken(jwt)` reads the `kid` from the JWT header, looks up the key in the JWKS, and verifies the JWS signature. A tampered payload throws `/signature verification failed/`.

## Axis 4 — Discovery + DCR + Federation trust chain (self-descriptive metadata, self-registration, N-step trust walk)

OIDC Discovery 1.0 + RFC 7591 DCR + OpenID Federation 1.0 §7 diverge from bare OAuth 2.1 because the RP no longer needs out-of-band knowledge of the OP — it fetches `.well-known/openid-configuration` for endpoints, self-registers through `/register`, and (for Federation) walks a trust chain from itself to a trust anchor. Every non-trivial OP test hits Discovery metadata, DCR + `software_statement` JWS verification, and Federation walker termination cases.

That divergence matters for tests because discovery + federation bugs look like:

- "The RP fetched Discovery once and cached it, then the OP rotated JWKS silently" — the JWKS cache did not expire, or the retention window was too short
- "The DCR accepted a `software_statement` from a wrong trust anchor" — the signature check ran against the wrong key, or the anchor was not configured
- "The Federation walker accepted an expired intermediate" — the exp check compared strings instead of timestamps

kiwa surfaces the pattern in two places.

- `env.discovery.fetch()` + `env.discovery.url` — Discovery endpoint. Returns a fresh document on every fetch so mutation on the caller's copy cannot leak. Metadata overrides that mismatch `issuer` throw at construction time (Discovery §4.3).
- `env.registerClient(request)` + `mintSoftwareStatement(claims, issuer)` — DCR endpoint. `registerClient` returns `{ client_id, client_secret?, token_endpoint_auth_method, redirect_uris, grant_types, response_types, scope }`. Dropped grants throw. A malformed `software_statement` throws `/expected 3 dot-separated segments/`; a mis-signed one throws `/signature verification failed/`; a missing trust anchor throws `/no trust anchor configured/`.
- `createOidcTrustAnchor({ entity_id })` + `createOidcEntityStatement({ iss, sub, exp?, now? })` + `resolveOidcTrustChain({ leaf, intermediates, anchor, now? })` — Federation walker. Returns `{ valid, chain?, anchor?, reason?, reason_code? }` where `reason` is a human-readable diagnostic string (`/no intermediate describes/`, `/expired/`, `/exhausted intermediates/`, `/cycle detected/`) and `reason_code` is a structured `TrustChainReasonCode` tag (`broken_link` / `cycle` / `expired_intermediate` / `expired_leaf`) that downstream wrappers pin without substring matching.

The **contract** each helper enforces is symmetric — every discovery fetch returns a fresh copy, every DCR write registers the client on the underlying OAuth 2.1 AS (so the newly-registered client is immediately usable at `/authorize` + `/token`), and every Federation walk records the traversal path in `chain[]` for auditability.

### Why Federation walker needs cycle detection

The classic pattern "walk the chain, follow each intermediate, stop when the anchor matches" costs an infinite loop when two intermediates describe each other (`A.iss=B` + `B.iss=A`). Cycle detection is not a nice-to-have — it is the termination guarantee.

`expect(result.valid).toBe(false)` + `expect(result.reason).toMatch(/cycle detected|exhausted intermediates/)` catches the cycle. The reason surfaces two acceptable terminations because the walker order determines which fires first — both signal an invalid chain.

Three properties are load-bearing.

- **Fresh Discovery on every fetch.** `env.discovery.fetch()` returns a fresh object, so mutation on the caller's copy cannot leak into internal state. The test mutates the returned copy and asserts the next fetch is unaffected.
- **`software_statement` signature binds to trust anchor.** `mintSoftwareStatement(claims, 'anchor-name')` produces a JWS; `env.registerClient({ software_statement })` throws `/signature verification failed/` when the trust anchor does not match. The mock's `softwareStatementIssuer` config is the trust anchor's identity.
- **Federation walker refuses expired intermediates.** `createOidcEntityStatement({ exp: 100, now: () => 1_700_000_000_000 })` mints an expired statement; `resolveOidcTrustChain({ intermediates: [expired] })` throws `/expired/` when the walker reaches the expired node. The exp check compares timestamps, not strings.

## Assertion patterns

The 4 axes produce four assertion patterns.

- **Virtual authenticator ceremony assertions** — every credential-creation records `{ credentialId, attachment, transports, attestationObject }`, every assertion records `{ credentialId, signCount, authenticatorData }`. The assertion `expect(assertion.signCount).toBeGreaterThan(previous.signCount)` catches "the signCount did not bump"; `expect(env.getCredential(id)?.discoverable).toBe(true)` catches "the credential was not stored as discoverable". This catches "the ceremony passed but the state did not update".
- **PKCE + DPoP proof assertions** — every DPoP-bound token records `{ tokenType: 'DPoP' }`, every refresh with a different JWK throws `/thumbprint mismatch/`, every reused refresh throws `/has been rotated — reuse refused/`. The assertion `expect(res.tokenType).toBe('DPoP')` catches "the token was not bound"; `expect(() => env.refreshToken(rt, id, wrongKey)).toThrow(/thumbprint mismatch/)` catches "the thumbprint check was string equality". This catches "the AS silently downgraded the binding".
- **id_token guard assertions** — every verify returns `{ valid, reason }` where `reason` surfaces the specific guard. The assertion `expect(result.reason).toMatch(/at_hash mismatch/)` catches the specific downgrade path. This catches "the log said `invalid token` and the operator had no clue".
- **Federation walker assertions** — every walk returns `{ valid, chain?, reason? }` where `reason` surfaces the specific termination. The assertion `expect(result.reason).toMatch(/expired|no intermediate describes|cycle detected/)` catches the termination path. This catches "the walker accepted an invalid chain because the exp check was string equality".

All four patterns are pure — they add no runtime overhead beyond the mock call. The test grows one function call per assertion and gains a machine-verifiable contract.

## Fidelity vs cost trade-off (release gate axis)

The 3 dogfood apps (`dogfood-webauthn-passkey-app` + `dogfood-oauth21-provider` + `dogfood-oidc-federation`) each produce a **fidelity report** that measures the mock behaviour against the real runtime. The report walks the same 4-op or 7-op or 16-op trace shape through both surfaces and computes a fidelity ratio in `[0, 1]`.

Three properties are load-bearing.

- **Fidelity ≥ 0.7 is the release-gate floor.** Below that the mock is lying to the caller — a test that passes against the mock but fails against a real Keycloak or a real Chrome Virtual Authenticator tells the reviewer the mock needs work.
- **Fidelity 1.0 is a warning sign, not a goal.** A mock that reproduces Keycloak byte-for-byte is either a real AS in disguise (slow) or a mock that tracks every irrelevant deployment detail (brittle). The target is 0.85–0.95 with intentional divergence documented per axis.
- **The fidelity harness runs Layer 3, not Layer 1.** Layer 1 (unit tests) drives the mock. Layer 3 (fidelity harness) drives both mock and real, diffs traces, and emits the fidelity ratio. Layer 2 (integration) rides on the mock — the fidelity harness is what tells the reviewer the mock is worth riding on.

The `evaluateReleaseGate` 11-axis contract reads the fidelity ratio through the common 7-axis branch, alongside coverage / test count / perf p95 / mutation kill rate. The AI-LLM 4 axes (cost / latency / token / accuracy) do not apply to auth surfaces — there is no token pricing to measure.

## Test count baseline

The v1.21 auth harness ships the following behaviour test counts per axis.

- Axis 1 (WebAuthn L3 + Passkey) — `packages/auth/tests/setup-webauthn-env.test.ts` × 21 + `packages/auth/tests/setup-passkey-env.test.ts` × 33 = **54 tests**
- Axis 2 (OAuth 2.1) — `packages/auth/tests/setup-oauth21-env.test.ts` × 45 = **45 tests**
- Axis 3 (OIDC id_token + JWKS) — `packages/auth/tests/setup-oidc-env.test.ts` id_token + JWKS section × ~20 = **20+ tests**
- Axis 4 (Discovery + DCR + Federation) — `packages/auth/tests/setup-oidc-env.test.ts` discovery + DCR + federation section × ~15 = **15+ tests**

Every count sits above the 10-test release-gate floor so the 11-axis check passes without special-casing the auth surfaces.

## References

- [Tutorial 34 — WebAuthn L3 + Passkey (virtual authenticator + attestation + sync fabric)](../tutorials/34-webauthn-passkey)
- [Tutorial 35 — OAuth 2.1 provider (PKCE + DPoP + refresh rotation + revocation)](../tutorials/35-oauth21-provider)
- [Tutorial 36 — OIDC provider + Federation (Discovery + DCR + id_token + trust chain)](../tutorials/36-oidc-federation)
- [Migration v1.20 → v1.21](../migrations/v1.20-to-v1.21)
- v1.10-2 baseline — Supabase Auth advanced (MFA / RLS / SAML / SIWE) session-shaped surface
