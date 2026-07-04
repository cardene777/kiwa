# kiwa v1.22 released — Auth 深化 II (real driver + a11y + Passkey caBLE + Federation e2e)

v1.22 is out. After v1.21's Auth 深化 milestone landed 4 protocol adapters as pure mocks (WebAuthn L3 + Passkey + OAuth 2.1 + OIDC), v1.22 layers **real drivers** on top — Keycloak testcontainers (OIDC + Federation), oauth2-mock-server testcontainers (OAuth 2.1), Chrome caBLE hybrid transport (Passkey) — plus a Nuxt 3 RP full journey + a11y axe-core gate + Federation JWKS rotation real end-to-end chain. Mocks stay the first-line contract; real drivers become the second-line fidelity check that catches drift before it silently ships.

## What shipped

- **`@kiwa-test/auth` v0.5.0** (real driver adapters + caBLE hybrid transport). The v1.21 4 protocol adapters (`setupWebAuthnEnv` / `setupPasskeyEnv` / `setupOAuth21Env` / `setupOidcEnv`) keep every prior signature. v1.22 adds a `realDriver` option per adapter that, when combined with `KIWA_MODE=real`, drives the real Keycloak REST admin API / oauth2-mock-server HTTP surface / Chrome caBLE hybrid transport rather than the pure mock. When `KIWA_MODE` is unset, the mock branch runs — the exact v1.21 behaviour, unchanged. When `KIWA_MODE=real-optional`, the env tries the real driver and falls back to the mock with a warning if the container URL is missing. Passkey gains 5 new caBLE methods (`generateCableQr` + `broadcastBleAdvertisement` + `matchBleHandshake` + `openCableTunnel` + `migrateCredentialOverTunnel` + `signOverTunnel`) covering the CTAP2 hybrid transport 5-step handshake. 40 new caBLE behaviour tests + real driver behaviour tests across all 4 protocols.
- **`examples/dogfood-oidc-federation`** — Nuxt 3 Relying Party full journey (login → OP redirect → callback → userinfo panel → logout) with Playwright + `@axe-core/playwright` a11y gate. Real-mode driver hits a Keycloak testcontainer (Docker Keycloak 26 + realm import + client registration + JWKS endpoint + Federation trust anchor); mock-mode driver hits `@kiwa-test/auth` `setupOidcEnv`. The v1.21-4 fidelity harness 16 axes now record live coverage; axes 1 (Discovery metadata field parity) + 3 (JWKS rotation with kid rollover) match one-to-one between mock and Keycloak. Release gate 7-axis a11y branch flips from `N/A` (v1.21 skeleton) to `PASS` (v1.22 full interactive surface).
- **`examples/dogfood-oauth21-provider`** — oauth2-mock-server testcontainers real driver on the Hono + Cloudflare Workers custom AS. 5 endpoint (`/authorize` + `/token` + `/revoke` + `/userinfo` + `/.well-known/oauth-authorization-server`) get live coverage against a real oauth2-mock-server container. Bug fix landed: v1.21-3a review had flagged the `/authorize` post-adapter error redirect (RFC 6749 §4.1.2.1) as returning inconsistent `state` parameters in edge cases; v1.22-2 aligns the mock to the RFC + real oauth2-mock-server behaviour. Discovery + PKCE + DPoP + refresh rotation + revocation cascade all record `PASS` on the fidelity axis.
- **`examples/dogfood-webauthn-passkey-app`** — CTAP2 hybrid transport (caBLE) real device flow. 5-axis fidelity harness (QR generation / BLE advertisement handshake / WebSocket tunnel establishment / credential migration payload / signature roundtrip). Playwright + real Chrome with `--enable-features=WebAuthenticationRemoteDesktopSupport` drives the real caBLE surface; `@kiwa-test/auth` `setupPasskeyEnv` new caBLE methods drive the mock. Both branches record the same 5-axis behaviour — 40 new tests + fidelity report matrix. Release gate PASS.
- **Federation JWKS rotation real e2e** — a single end-to-end chain spanning real Keycloak OP + Nuxt 3 RP + real JWKS endpoint (public URL + HTTP cache invalidation). `kid` rotation on the OP → RP-side JWKS refresh (respecting cache-control) → `id_token` verify continues without dropping in-flight sessions. Axes 4a-4d (inside window / past retention / multi-rotation retention / fresh active key after rotation) all record real coverage.
- **docs** — 2 new tutorials (37 real driver testing with Keycloak + oauth2-mock-server testcontainers / 38 Passkey caBLE hybrid transport 5-axis harness) + additive migration guide v1.21 → v1.22 + concept doc `real-driver-testing.md` — SSOT for the 3 execution modes (`mock only` / `real-optional` / `real-required`) + the fidelity axis catalog across all 3 v1.22 dogfood apps. VitePress sidebar gains a new `Real driver (v1.22)` tutorial section; gh-pages published via `/docs-publish-kiwa`.

## Numbers

- **6 sub-Issues resolved** (#891-#896)
- **6 PRs merged** (v1.22-1 + v1.22-2 + v1.22-3 + v1.22-4 + v1.22-5 + this publish PR)
- **1 npm minor bump** (`@kiwa-test/auth` v0.4.0 → v0.5.0) — kiwa runtime fixture count stays 34
- **3 dogfood apps upgraded** with fidelity reports feeding the 7-axis release gate
- **~120 new tests** across the 3 real driver adapters + caBLE hybrid transport + a11y gate + Federation JWKS rotation e2e

## Why 3 execution modes (not 2)

A binary "mock vs real" split forces every contributor to install Docker + Chrome + Keycloak just to run tests. That kills PR velocity — the mock's whole point is to keep the fast path fast. But a pure-mock world lets the mock drift from real Keycloak silently.

The `real-optional` middle mode threads the needle. A contributor with Docker up gets the fidelity check for free (their local run detects drift before pushing). A contributor without Docker sees a warning but still passes the mock branch (their PR keeps flowing). CI runs `mock only` on every PR and `real-required` on nightly — the fast path stays fast, the drift catcher stays honest.

Concrete latency budgets.

| Mode | Latency budget | When to use |
|---|---|---|
| `mock only` | < 5 ms per test | Every PR, every push, every local run (default) |
| `real-optional` | < 5 ms mock / < 60 s real (best-effort) | Laptop exploration with Docker up |
| `real-required` | < 90 s per test | Nightly CI + pre-release smoke |

## 12-milestone streak

v1.11 (release gate) → v1.12 (non-determinism) → v1.13 (time-axis) → v1.14 (horizontal expansion) → v1.15 (AI-LLM depth) → v1.16 (component depth) → v1.17 (Observability v2) → v1.18 (Blockchain depth) → v1.19 (Framework 深化) → v1.20 (Streaming 深化) → v1.21 (Auth 深化) → **v1.22 (Auth 深化 II)**. Every milestone since v1.11 has landed 6 sub-Issues in full.

## v2.0 candidates

- Multi-version Vitest matrix (Vitest 1.x vs 2.x vs 3.x parity)
- Desktop (Electron / Tauri) + mobile (React Native / Expo) adapters
- Coverage 100% milestone
- Cache / Data depth (Dragonfly / Materialize / Neon)
- L2 depth (Base / Arbitrum / Optimism / Scroll block-space fidelity)
- ZK depth (Noir / Circom / RISC Zero test harness)
- IoT depth (MQTT / CoAP / LWM2M)
- DB depth (SurrealDB / EdgeDB / Turso)

Feedback welcome on which of these should land next.
