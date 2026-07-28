---
title: "@kiwa-lab/auth semantics__types の API 契約"
---

<!-- kiwa-generated-api-page -->

# <code v-pre>@kiwa-lab/auth</code> <code v-pre>semantics&#95;&#95;types</code> の API 契約

[ソース](https://github.com/cardene777/kiwa/blob/main/packages/auth/src/semantics/types.ts) から同期しています。各項目は公開名、TypeScript の宣言、宣言元のソース位置を示します。実装に JSDoc がある場合は、その説明も表示します。

[リファレンスの目次へ戻る](./)



### 型

#### <code v-pre>AuthAxis</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/auth/src/semantics/types.ts#L24) <code v-pre>packages/auth/src/semantics/types.ts</code>

```ts
export type AuthAxis = 'device-bound-passkey' | 'conditional-ui' | 'step-up-mfa' | 'risk-based-auth' | 'auth-continuity' | 'cross-device-flow' | 'session-hijack-detect' | 'auth-telemetry';
```

#### <code v-pre>AuthPlatform</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/auth/src/semantics/types.ts#L22) <code v-pre>packages/auth/src/semantics/types.ts</code>

Advanced auth semantics — platform-neutral axis SSOT (v0.6 Passwordless UX III). v0.4 auth (v1.21) landed 4 protocol adapter (WebAuthn L3 / Passkey / OAuth 2.1 / OIDC). v0.5 (v1.22) added real driver env-gate + Federation JWKS rotation e2e + a11y gate. v0.6 (v1.44) adds 8 advanced Passwordless UX axes on top of the existing 4 protocol adapter — device-bound-passkey (device bind + credProps.rk + sync fabric verification), conditional-ui (autofill hint + mediation="conditional" + fallback ladder), step-up-mfa (AAL escalation ladder + biometric prompt + trust duration cache), risk-based-auth (risk score + adaptive challenge + policy chain), auth-continuity (seamless re-auth + refresh + session extension + revocation window), cross-device-flow (QR handshake + BLE proximity + hybrid transport + tunnel state machine), session-hijack-detect (fingerprint drift + geo anomaly + concurrent session + logout cascade), and auth-telemetry (attempt log + success rate histogram + latency histogram + abuse detection). Each axis is expressed as a small pure state-machine helper that returns a neutral envelope, so downstream tests can drive the axis without knowing the browser vendor's payload dialect (chromium / webkit / firefox each ship different WebAuthn conditional UI + sync fabric ergonomics).

```ts
export type AuthPlatform = 'chromium' | 'webkit' | 'firefox';
```
