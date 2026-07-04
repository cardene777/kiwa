---
title: "kiwa v1.21 released — Auth 深化 (WebAuthn + Passkey + OAuth 2.1 + OIDC の 4 protocol 統一 mock)"
emoji: "🔐"
type: "tech"
topics: ["oss", "typescript", "webauthn", "oauth", "kiwa"]
published: true
---

# kiwa v1.21 released

v1.21 は kiwa の 11 milestone 目です。 v1.20 (Streaming 深化、 Kafka (kafkajs-shaped producer / consumer / admin) + Redpanda (Kafka API 互換 broker + colocated schema registry) + NATS (core pub/sub + JetStream + KV / Object store) を 1 統一 mock として同時 land) の後、 v1.21 は 2026 の SaaS + 認証基盤 team が実運用で必要な **web-auth 主戦場 4 protocol (WebAuthn L3 (Chrome Virtual Authenticator + credential creation + assertion) + Passkey (platform + roaming + sync fabric) + OAuth 2.1 (RFC 9700 + PKCE mandatory + DPoP sender-constrained token) + OIDC (id_token 検証 + Discovery + Dynamic Client Registration + Federation)) を 1 統一 mock として同時 land** しました。 v1.8 で land した `@kiwa-test/auth` v0.1 (NextAuth v5 + Lucia v3 + Better Auth) → v1.9 (+ Clerk + Auth0) → v1.10 (+ Supabase Auth core + advanced (RLS + MFA + SSO SAML + Web3 SIWE)) の 6 provider adapter に、 v1.21 で 4 protocol 深化 layer を追加、 browser + Docker + 実 Keycloak / Auth0 tenant 不要で 4 protocol の testing 固有難所を SSOT 化。 producer / consumer / auth-protocol の共通思想は「実際に動く mock で本物と同じ shape を返す」 で、 provider 拡張 (横軸) に加えて protocol 深化 (縦軸) を land、 6 provider × 4 protocol の 24 交差点を統一 API surface でカバー可能。

v1.11 以降の連続完遂 10 milestone (release gate → 非決定性 → 時間軸 → 横軸拡張 → AI-LLM 深化 → component 縦軸 → Observability v2 → Blockchain 深化 → Framework 深化 → Streaming 深化) を受けて、 v1.21 は web-auth 縦軸 milestone、 kiwa runtime fixture 34 packages はそのまま維持 (auth 既存 package の minor 拡張)。

## 主な追加

### `@kiwa-test/auth` v0.4.0 (4 protocol adapter 追加)

4 protocol (WebAuthn L3 + Passkey + OAuth 2.1 + OIDC) を統一 mock 化した auth-protocol testing adapter。 browser + Docker + 実 Keycloak / Auth0 tenant 不要 + 4 testing 固有難所 (virtual authenticator / PKCE + DPoP / id_token 検証 / discovery + federation) 完全対応 + 6 provider adapter との combinable API surface の 3 特徴。

```ts
import {
  createWebAuthnEnv,
  createPasskeyEnv,
  createOAuth21Env,
  createOIDCEnv,
} from '@kiwa-test/auth';

// 1. WebAuthn L3 — Virtual Authenticator + credential creation
const webauthn = createWebAuthnEnv();
const credential = await webauthn.credentials.create({
  publicKey: {
    challenge: new Uint8Array([1, 2, 3]),
    rp: { id: 'example.com', name: 'Example' },
    user: {
      id: new TextEncoder().encode('user-1'),
      name: 'alice@example.com',
      displayName: 'Alice',
    },
    pubKeyCredParams: [{ type: 'public-key', alg: -7 }], // ES256
    authenticatorSelection: {
      userVerification: 'required',
      residentKey: 'required',
      authenticatorAttachment: 'platform',
    },
    attestation: 'none',
  },
});
expect(credential.id).toBeDefined();
expect(credential.response.attestationObject).toBeDefined();

// 2. Passkey — sync fabric transition
const passkey = createPasskeyEnv({ syncFabric: 'icloud' });
await passkey.registerCredential({ userId: 'user-1', platform: 'ios' });
await passkey.simulateSync({ toDevice: 'macbook' });
const credentials = await passkey.listSyncedCredentials({ device: 'macbook' });
expect(credentials).toHaveLength(1);
expect(credentials[0].userId).toBe('user-1');

// 3. OAuth 2.1 — PKCE S256 + DPoP + refresh rotation
const oauth = createOAuth21Env({
  authorizationEndpoint: 'https://as.example.com/authorize',
  tokenEndpoint: 'https://as.example.com/token',
  requireDPoP: true,
});
const { code_verifier, code_challenge } = await oauth.pkce.generate();
const { code } = await oauth.authorize({
  client_id: 'client-1',
  code_challenge,
  code_challenge_method: 'S256',
  scope: 'openid profile',
});
const dpopProof = await oauth.dpop.sign({
  htu: 'https://as.example.com/token',
  htm: 'POST',
  jti: crypto.randomUUID(),
});
const tokens = await oauth.token({
  grant_type: 'authorization_code',
  code,
  code_verifier,
  dpopProof,
});
expect(tokens.access_token).toBeDefined();
expect(tokens.token_type).toBe('DPoP');

// 4. OIDC — Discovery + id_token verify + Federation
const oidc = createOIDCEnv({
  issuer: 'https://op.example.com',
  jwksAlgorithms: ['RS256', 'ES256'],
});
const config = await oidc.discovery.getConfiguration();
expect(config.jwks_uri).toBe('https://op.example.com/.well-known/jwks.json');
expect(config.token_endpoint_auth_methods_supported).toContain('private_key_jwt');

const idToken = await oidc.idToken.issue({
  sub: 'user-1',
  aud: 'client-1',
  nonce: 'test-nonce',
  at_hash: 'derived',
});
const claims = await oidc.idToken.verify(idToken, {
  audience: 'client-1',
  nonce: 'test-nonce',
});
expect(claims.iss).toBe('https://op.example.com');
expect(claims.sub).toBe('user-1');
```

`createWebAuthnEnv()` は Chrome Virtual Authenticator 型 credential store + `navigator.credentials` mock を返し、 `credentials.create()` は attestation 3 種 (`none` / `packed` / `fido-u2f`) × authenticator selection criteria 3 軸 (`userVerification`: `required` / `preferred` / `discouraged`、 `residentKey`: `required` / `preferred` / `discouraged`、 `authenticatorAttachment`: `platform` / `cross-platform`) をカバー、 `credentials.get()` は assertion 応答 + sign counter monotonicity (前回 counter より小さい値は reject) + user-verified flag を返す。 credential 内部は `{ id, publicKey, signCount, rpId, userHandle }` の shape で保持、 sign counter は `get()` 呼出ごとに +1 increment (実 authenticator と同一 semantics)。

`createPasskeyEnv()` は WebAuthn L3 上の platform authenticator vs roaming authenticator の boundary を明示、 `credProps.rk` (`residentKey` の boolean 反映) + sync fabric mock (iCloud Keychain / Google Password Manager) の credential ID 共有 + sync state transition を扱う。 `registerCredential({ userId, platform })` で platform (`ios` / `android` / `macos` / `windows`) に紐づく credential 生成、 `simulateSync({ toDevice })` で 同 sync fabric 上の別デバイスに credential を伝播、 `listSyncedCredentials({ device })` で reachable credential を列挙。 platform 越えの sync fabric mismatch (iOS iCloud → Android Google) は同期しないという Passkey semantics を pure JS で再現。

`createOAuth21Env({ authorizationEndpoint, tokenEndpoint, requireDPoP })` は mock Authorization Server + Resource Server 対を提供。 PKCE (RFC 7636、 RFC 9700 で mandatory) は `pkce.generate()` で `code_verifier` + `code_challenge` + `code_challenge_method: 'S256'` を返し、 `authorize({ code_challenge, code_challenge_method })` で code 発行、 `token({ code_verifier })` で verifier 検証 (SHA-256 digest + base64url no-padding = challenge 一致 check)。 DPoP (RFC 9449) は `dpop.sign({ htu, htm, jti, iat })` で proof JWT 生成、 `token({ dpopProof })` で `htu` normalizer + `htm` case-insensitive + `jti` replay-detection window + `iat` clock-skew tolerance (60s 窓) を検証、 発行 access_token に thumbprint bind (`token_type: 'DPoP'`)。 refresh token rotation は `refresh({ refresh_token })` で新 access + 新 refresh を返し、 同 refresh_token を再度使うと reuse detection で refresh chain 全体を revoke (leaked-token detection cascade)。 revocation endpoint (RFC 7009) は `revoke({ token })` で access + 派生 refresh を cascade revoke。 `plain` code_challenge_method + `implicit` grant + `password` grant は `unsupported_response_type` で reject (RFC 9700 hard gate)。

`createOIDCEnv({ issuer, jwksAlgorithms })` は Discovery (`.well-known/openid-configuration`) + JWKS endpoint + JWKS rotation + DCR + id_token verify + Federation の 6 primitive を統合。 `discovery.getConfiguration()` は metadata (`issuer` / `authorization_endpoint` / `token_endpoint` / `jwks_uri` / `response_types_supported` / `subject_types_supported` / `id_token_signing_alg_values_supported` / `token_endpoint_auth_methods_supported`) を返す。 `jwks.rotate()` は `kid` header 付きで新 key を追加 + 旧 key を grace period 中 verify 可能に保つ (rotation window semantics)。 `dcr.register({ software_statement, token_endpoint_auth_method })` は RFC 7591 Dynamic Client Registration、 4 auth method (`none` / `client_secret_basic` / `client_secret_post` / `private_key_jwt`) + software_statement JWS 検証。 `idToken.issue({ sub, aud, nonce, at_hash })` で id_token 発行、 `idToken.verify(token, { audience, nonce })` で iss / aud / exp / iat / nonce / at_hash / c_hash + RS256 / ES256 signature の full-claim verify。 `federation.verifyStatementChain(chain, { trustAnchor })` は OIDC Federation 1.0 trust chain — trust anchor + intermediate + statement chain の統合 verify + intermediate substitution attack detection。

## 3 dogfood app

- **`examples/dogfood-webauthn-passkey-app`** — Next.js 15 App Router + WebAuthn L3 + Passkey e2e。 `/register` (credential creation with attestation) + `/signin` (credential assertion) + `/manage` (credential list + delete + `residentKey=required`) の 3 route、 real driver は Playwright + Chrome Virtual Authenticator (`page.context().addVirtualAuthenticator`) 経由、 mock driver は `@kiwa-test/auth` の `createWebAuthnEnv` + `createPasskeyEnv` 経由。 `WebAuthnFidelityReport` は 4 pattern の mock vs real 差分を出力 (userVerification: required / preferred / discouraged / impossible-simulate + residentKey: discouraged / preferred / required + authenticatorAttachment: platform / cross-platform + sync fabric transition on the same credential ID)。 7 軸 release gate PASS。
- **`examples/dogfood-oauth21-provider`** — Hono + Cloudflare Workers 自作 Authorization Server。 5 endpoint (`/authorize` + `/token` + `/revoke` + `/userinfo` + `/.well-known/oauth-authorization-server`) 実装、 PKCE S256 + DPoP proof binding + refresh token rotation with reuse detection + RFC 7009 revocation cascade をカバー。 real driver は `oauth2-mock-server`、 mock driver は `@kiwa-test/auth` の `createOAuth21Env`。 `OAuth21FidelityReport` は 4 pattern (PKCE S256 code_verifier verify — reject `plain` / mismatched verifier + DPoP proof `htu` + `htm` + `jti` uniqueness + `iat` skew — reject clock-skew > 60s + refresh token rotation reuse-detection + refresh chain revoke + revocation endpoint cascade to derived access + refresh tokens) を比較。 7 軸 release gate PASS。
- **`examples/dogfood-oidc-federation`** — Nuxt 3 Relying Party + Deno 自作 OpenID Provider。 `.well-known/openid-configuration` Discovery + RFC 7591 Dynamic Client Registration (`none` / `client_secret_basic` / `client_secret_post` / `private_key_jwt` auth method + software_statement JWS) + JWKS endpoint with rotation + id_token 検証 (iss / aud / exp / iat / nonce / at_hash / c_hash / RS256 + ES256) + Federation trust chain (trust anchor + intermediate + statement chain verify) を実装。 real driver は mock Keycloak-shaped OP、 mock driver は `@kiwa-test/auth` の `createOIDCEnv`。 `OIDCFidelityReport` は 4 pattern (Discovery metadata field parity + DCR software_statement JWS verify + 3 auth-method issuance + JWKS rotation with `kid` rollover — old token still verifies during grace, new token verifies against new key + id_token full-claim verify — reject bad iss / aud / exp / nonce mismatch / at_hash / c_hash + Federation trust chain — 3-hop statement chain verify with intermediate substitution attack) を比較。 7 軸 release gate PASS。

## docs

- tutorial 3 本 (34 WebAuthn + Passkey with Virtual Authenticator + userVerification + residentKey / 35 OAuth 2.1 Authorization Server with PKCE + DPoP + refresh rotation + revocation / 36 OIDC + Federation with Discovery + DCR + JWKS rotation + id_token verify + trust chain)
- additive migration v1.20 → v1.21 (v1.20 の Streaming module に触れず、 auth 既存 package の minor 拡張のみ)
- concept doc `auth-protocol-testing.md` (WebAuthn / Passkey / OAuth 2.1 / OIDC の 4 protocol × 4 testing 固有難所 (virtual authenticator / PKCE + DPoP / id_token 検証 / discovery + federation) SSOT、 v1.10 まで land した 6 provider adapter との棲み分け表付き)

VitePress sidebar には `Auth 深化 (v1.21)` セクションを追加、 gh-pages 反映済 (https://cardene777.github.io/kiwa/)。

## 数値サマリ

- **6 sub-Issues resolved** (#842-#847)
- **6 PRs merged** (v1.21-1 + v1.21-2/3/4/5 + 本 publish PR)
- **1 new npm minor bump** (`@kiwa-test/auth` v0.3.0 → v0.4.0)
- **3 new dogfood app** (webauthn-passkey-app + oauth21-provider + oidc-federation、 全 7 軸 release gate PASS)
- **4 protocol** (WebAuthn L3 + Passkey + OAuth 2.1 + OIDC) 統一 mock、 4 testing 固有難所 (virtual authenticator / PKCE + DPoP / id_token 検証 / discovery + federation) SSOT
- **kiwa runtime fixture 34 packages** (auth 既存 package の minor 拡張、 fixture count 変わらず)
- **134 new test** (WebAuthn 21 + Passkey 33 + OAuth 2.1 45 + OIDC 35)、 auth package 全 403 test PASS

## 11 milestone streak

v1.11 (release gate) → v1.12 (非決定性) → v1.13 (時間軸) → v1.14 (横軸拡張) → v1.15 (AI-LLM 深化) → v1.16 (component 縦軸) → v1.17 (Observability v2) → v1.18 (Blockchain 深化) → v1.19 (Framework 深化) → v1.20 (Streaming 深化) → **v1.21 (Auth 深化)**。 v1.11 以降の 11 milestone は全て 6 sub-Issue land 完遂。

## v2.0 candidates

- multi-version Vitest matrix (Vitest 1.x vs 2.x vs 3.x parity)
- desktop (Electron / Tauri) + mobile (React Native / Expo) adapter
- coverage 100% milestone
- cache / data depth (Dragonfly / Materialize / Neon)
- L2 depth (Base / Arbitrum / Optimism / Scroll block-space fidelity)
- ZK depth (Noir / Circom / RISC Zero test harness)
- IoT depth (MQTT / CoAP / LWM2M)
- DB depth (SurrealDB / EdgeDB / Turso)

feedback 歓迎です。 どれを次に land すべきか issue で議論しましょう。
