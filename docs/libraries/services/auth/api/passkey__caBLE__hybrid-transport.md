---
title: "@kiwa-lab/auth passkey__caBLE__hybrid-transport の API 契約"
---

<!-- kiwa-generated-api-page -->

# <code v-pre>@kiwa-lab/auth</code> <code v-pre>passkey&#95;&#95;caBLE&#95;&#95;hybrid-transport</code> の API 契約

[ソース](https://github.com/cardene777/kiwa/blob/main/packages/auth/src/passkey/caBLE/hybrid-transport.ts) から同期しています。各項目は公開名、TypeScript の宣言、宣言元のソース位置を示します。実装に JSDoc がある場合は、その説明も表示します。

[リファレンスの目次へ戻る](./)

### 値

#### <code v-pre>migrateCredential</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/auth/src/passkey/caBLE/hybrid-transport.ts#L30) <code v-pre>packages/auth/src/passkey/caBLE/hybrid-transport.ts</code>

Ship the passkey credential from responder (phone) to initiator (laptop) over the established WebSocket tunnel. Real caBLE encrypts the payload with the BLE handshake shared secret; the mock keeps the raw {@link PasskeyCredential} plus a deterministic "encrypted" tag so tests can assert the migration went through the tunnel without leaking the credential material outside.

```ts
export declare function migrateCredential(tunnel: CaBLEWebSocketTunnel, credential: PasskeyCredential): CaBLECredentialMigration;
```

#### <code v-pre>performSignatureRoundtrip</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/auth/src/passkey/caBLE/hybrid-transport.ts#L66) <code v-pre>packages/auth/src/passkey/caBLE/hybrid-transport.ts</code>

Sign the challenge with the migrated credential + verify the signature on the initiator side. Real caBLE terminates the hybrid transport ceremony in a WebAuthn L3 §7.2 assertion signature check; the mock builds a deterministic signature string from the credential id + challenge + session id so tests can assert the roundtrip without running through a real signature verifier. Throws when the tunnel is not established / has been closed / the challenge is empty — real caBLE cannot produce a WebAuthn L3 §7.2 assertion over any of those conditions.

```ts
export declare function performSignatureRoundtrip(tunnel: CaBLEWebSocketTunnel, credential: PasskeyCredential, challenge: string): CaBLESignatureRoundtrip;
```

#### <code v-pre>runCaBLESession</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/auth/src/passkey/caBLE/hybrid-transport.ts#L112) <code v-pre>packages/auth/src/passkey/caBLE/hybrid-transport.ts</code>

Run the full caBLE hybrid transport ceremony end-to-end. Chains the 3 FIDO caBLE steps (QR code → BLE handshake → WebSocket tunnel) followed by credential migration + signature roundtrip so a single call produces the {@link CaBLESession} artifact the fidelity harness inspects. The `challenge` picks the value the responder (phone) signs at the assertion step. Real caBLE surfaces this from the RP; the mock lets the caller supply it directly so tests can assert per-ceremony signature stability.

```ts
export declare function runCaBLESession(options: CaBLESessionOptions, challenge: string): CaBLESession;
```


