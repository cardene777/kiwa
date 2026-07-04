---
title: "kiwa v1.22 released — Auth 深化 II (real driver + a11y + Passkey caBLE + Federation e2e)"
emoji: "🔐"
type: "tech"
topics: ["oss", "typescript", "keycloak", "testcontainers", "kiwa"]
published: true
---

# kiwa v1.22 released

v1.22 は kiwa の 12 milestone 目です。 v1.21 (Auth 深化、 WebAuthn L3 + Passkey + OAuth 2.1 + OIDC の 4 protocol adapter を pure mock として同時 land) の後、 v1.22 は 4 protocol の pure mock 上に **real driver 層** を追加、 Keycloak testcontainers (OIDC + Federation) / oauth2-mock-server testcontainers (OAuth 2.1) / Chrome caBLE hybrid transport (Passkey) の 3 driver で mock 側の fidelity を実 driver 経由に検証可能にしました。 mock は first-line contract のまま、 real driver は second-line fidelity check として並走、 mock 経路の `< 5 ms per test` latency budget は完全維持したまま (default `KIWA_MODE` 未 set 時は v1.21 と同じ挙動)、 opt-in で real 走査を発火する `KIWA_MODE=real-optional` / `KIWA_MODE=real` の 2 mode を追加。 v1.11 以降の連続完遂 11 milestone (release gate → 非決定性 → 時間軸 → 横軸拡張 → AI-LLM 深化 → component 縦軸 → Observability v2 → Blockchain 深化 → Framework 深化 → Streaming 深化 → Auth 深化) を受けて、 v1.22 は Auth 深化 II milestone、 kiwa runtime fixture 34 packages はそのまま維持 (auth 既存 package の minor 拡張)。

## 主な追加

### `@kiwa-test/auth` v0.5.0 (real driver adapter + caBLE + Nuxt 3 RP full flow + Federation JWKS rotation real e2e)

v1.21 で land した 4 protocol adapter (`setupWebAuthnEnv` / `setupPasskeyEnv` / `setupOAuth21Env` / `setupOidcEnv`) の signature を完全維持したまま、 v1.22 は 3 経路で real driver 対応を追加。

#### 1. `realDriver` option 追加

4 adapter 全てに `realDriver` option を追加、 `KIWA_MODE=real` 併用時に real driver (Keycloak REST admin API / oauth2-mock-server HTTP surface / Chrome caBLE) を driver とし、 未 set 時は既存の pure mock を driver とする。

```ts
import { GenericContainer } from 'testcontainers';
import { setupOidcEnv } from '@kiwa-test/auth';

const container = await new GenericContainer('quay.io/keycloak/keycloak:26.0')
  .withCommand(['start-dev', '--http-port=8080'])
  .withExposedPorts(8080)
  .start();

const url = `http://${container.getHost()}:${container.getMappedPort(8080)}`;

const env = await setupOidcEnv({
  issuer: `${url}/realms/kiwa-test`,
  clients: [
    { clientId: 'rp-A', redirectUris: ['https://rp.example.test/cb'], scopes: ['openid'] },
  ],
  users: [{ subject: 'user-1', scopes: ['openid'] }],
  // v1.22 new — 存在時 real driver、 未指定時は既存 mock
  realDriver: { keycloakUrl: url, realm: 'kiwa-test' },
});
```

#### 2. Passkey caBLE hybrid transport 5 method 追加

`setupPasskeyEnv` に CTAP2 hybrid transport (caBLE) の 5 method (`generateCableQr` + `broadcastBleAdvertisement` + `matchBleHandshake` + `openCableTunnel` + `migrateCredentialOverTunnel` + `signOverTunnel`) を追加。 phone → laptop 越しの credential 移送 5 step (QR gen → BLE handshake → WebSocket tunnel → credential migration → signature roundtrip) を pure function として走査可能。

```ts
const env = await setupPasskeyEnv({
  devices: [
    { deviceId: 'phone-A', platform: { biometric: 'touch-id' } },
    { deviceId: 'laptop-A', roaming: { transport: 'hybrid' } },
  ],
});

const qr = env.generateCableQr('laptop-A', { tunnelUrl: 'wss://tunnel.test/xyz' });
const advert = env.broadcastBleAdvertisement('phone-A', qr);
const matched = env.matchBleHandshake('laptop-A', advert);
expect(matched.matched).toBe(true);

const cred = await env.createPasskey('phone-A', 'user-1', { rp, user, challenge });
const tunnel = await env.openCableTunnel('phone-A', qr, { credentialId: cred.credentialId });
const migration = env.migrateCredentialOverTunnel(tunnel, cred.credentialId);
const assertion = await env.signOverTunnel(tunnel, {
  credentialId: cred.credentialId,
  rpId: 'example.test',
  challenge: 'rp-assert-1',
});
```

#### 3. Federation JWKS rotation real e2e

v1.21-4d で mock として land した Federation JWKS rotation e2e を、 real 経路 (real Keycloak OP + Nuxt 3 RP + real JWKS endpoint) で走査可能に。 `kid` rotation → RP-side JWKS refresh → id_token verify continue の連鎖を real network で end-to-end 計測、 axes 4a-4d (inside window / past retention / multi-rotation retention / fresh active key after rotation) を real coverage 化。

### 3 execution mode SSOT (`docs/concepts/real-driver-testing.md`)

- **`mock only`** (default、 `KIWA_MODE` 未 set) = pure `@kiwa-test/auth` mock、 network 0、 ~1 ms per test。 全 PR が本 mode で走行。
- **`real-optional`** (`KIWA_MODE=real-optional`) = real driver 試行、 container URL 欠時は mock fallback + warning 出力。 laptop 開発 friendly。
- **`real-required`** (`KIWA_MODE=real` + `KEYCLOAK_URL` / `OAUTH21_BOOTSTRAP=1` / Chrome caBLE flag) = driver 欠時 fail hard、 nightly CI + release smoke 用。

### dogfood app 3 種の升級

#### `dogfood-oidc-federation` — Nuxt 3 RP full flow + a11y axe-core gate + Keycloak real driver + Federation JWKS rotation real e2e

- Nuxt 3 RP full journey ... login button → OP redirect → callback → userinfo panel → logout
- Playwright + `@axe-core/playwright` で WCAG 2.1 AA + WAI-ARIA authoring practice 準拠検査
- Docker Keycloak 26 testcontainer + realm import + client registration + JWKS endpoint + Federation trust anchor
- v1.21-4 fidelity harness 16 軸のうち axes 1 (Discovery metadata) + 3 (JWKS rotation with kid rollover) を real coverage 化
- release gate 7 軸 a11y branch を N/A (v1.21 skeleton) → PASS (v1.22 full interactive surface) に切替

#### `dogfood-oauth21-provider` — oauth2-mock-server testcontainers real driver + /authorize §4.1.2.1 redirect Bug 1 fix

- 5 endpoint (/authorize + /token + /revoke + /userinfo + /.well-known/oauth-authorization-server) を real oauth2-mock-server container で走査
- v1.21-3a review で発見の /authorize post-adapter error redirect (RFC 6749 §4.1.2.1) の state parameter 不整合を発見、 v1.22-2 で mock を RFC + real oauth2-mock-server 挙動に合わせて修正
- Discovery + PKCE S256 + DPoP + refresh rotation + revocation cascade 全て real 走査で PASS

#### `dogfood-webauthn-passkey-app` — caBLE hybrid transport 5 軸 fidelity harness

- CTAP2 hybrid transport (Cloud-Assisted BLE) real device flow を Playwright + Chrome `--enable-features=WebAuthenticationRemoteDesktopSupport` で走査
- 40 new test で `@kiwa-test/auth` 新 caBLE mock vs real Chrome + Android phone pair の 5 軸 fidelity 検証
- phone → laptop 越しの credential 移送が mock と real で同じ挙動、 fidelity gate PASS

### tutorial 2 本 + concept doc + migration guide

#### tutorial 37 — real driver testing with Keycloak + oauth2-mock-server testcontainers

15 分完了、 Keycloak testcontainer 起動 + `KIWA_MODE=real` で real fidelity 走査。

#### tutorial 38 — Passkey caBLE hybrid transport 5 軸 harness

15 分完了、 5 step (QR / BLE / WebSocket / migration / signature) を pure function で走査。

#### concept doc `real-driver-testing.md`

3 execution mode (`mock only` / `real-optional` / `real-required`) と fidelity axis catalog (OIDC 4 軸 + OAuth 2.1 5 軸 + Passkey caBLE 5 軸) を SSOT 化。

## Numbers

- **6 sub-Issue 解決** (#891-#896)
- **6 PR merge** (v1.22-1 + v1.22-2 + v1.22-3 + v1.22-4 + v1.22-5 + 本 publish PR)
- **1 npm minor bump** (`@kiwa-test/auth` v0.4.0 → v0.5.0) — kiwa runtime fixture 34 packages 維持
- **3 dogfood app 升級** with fidelity report → 7 軸 release gate 供給
- **~120 new test** 3 real driver adapter + caBLE + a11y + Federation JWKS rotation e2e

## なぜ 3 execution mode (binary ではなく)

「mock vs real」 の binary split では、 全 contributor に Docker + Chrome + Keycloak install を強制することになり、 PR velocity を殺します。 mock 経路の速さの本質が失われる。 一方で pure mock 経路のみだと、 real Keycloak から mock が silent drift する経路を許容してしまう。

`real-optional` 中間 mode で両方の要件を満たす。 Docker up の contributor は fidelity check を free で得られ (push 前に drift 検知)、 Docker 未 up の contributor は warning 表示のまま mock branch pass できる (PR は流れ続ける)。 CI は default `mock only` で全 PR 走行、 nightly は `real-required` で drift 検知、 fast path は fast のまま、 drift catcher は honest のまま。

## 12 milestone 連続完遂

v1.11 (release gate) → v1.12 (非決定性) → v1.13 (時間軸) → v1.14 (横軸拡張) → v1.15 (AI-LLM 深化) → v1.16 (component 縦軸) → v1.17 (Observability v2) → v1.18 (Blockchain 深化) → v1.19 (Framework 深化) → v1.20 (Streaming 深化) → v1.21 (Auth 深化) → **v1.22 (Auth 深化 II)**。 v1.11 以降の全 milestone で 6 sub-Issue を完遂。

## v2.0 candidates

- Multi-version Vitest matrix (Vitest 1.x vs 2.x vs 3.x parity)
- Desktop (Electron / Tauri) + mobile (React Native / Expo) adapters
- Coverage 100% milestone
- Cache / Data 深化 (Dragonfly / Materialize / Neon)
- L2 深化 (Base / Arbitrum / Optimism / Scroll block-space fidelity)
- ZK 深化 (Noir / Circom / RISC Zero test harness)
- IoT 深化 (MQTT / CoAP / LWM2M)
- DB 深化 (SurrealDB / EdgeDB / Turso)

Feedback welcome on which of these should land next. どれから land するかの投票は GitHub Discussions で募集中。
