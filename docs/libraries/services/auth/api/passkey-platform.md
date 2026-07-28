---
title: "@kiwa-lab/auth passkey-platform の API 契約"
---

# <code v-pre>@kiwa-lab/auth</code> <code v-pre>passkey-platform</code> の API 契約

[ソース](https://github.com/cardene777/kiwa/blob/main/packages/auth/src/passkey/platform.ts) から同期しています。各項目は公開名、TypeScript の宣言、宣言元のソース位置を示します。実装に JSDoc がある場合は、その説明も表示します。

[リファレンスの目次へ戻る](./)

### 値

#### <code v-pre>createPlatformAuthenticator</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/auth/src/passkey/platform.ts#L17) <code v-pre>packages/auth/src/passkey/platform.ts</code>

Build a platform authenticator (Touch ID / Face ID / Windows Hello / Android biometric). A platform authenticator is bound to the device — the factory pins `attachment: platform` and `transport: internal`, matching the WebAuthn L3 §5.4.5 pairing constraint. Passkeys minted here are always discoverable credentials (`hasResidentKey: true`) — the factory rejects any attempt to disable resident-key storage because a non-discoverable platform credential is not a passkey.

```ts
export declare function createPlatformAuthenticator(options: PlatformAuthenticatorOptions): {
    handle: PlatformAuthenticator;
    credentials: Map<string, WebAuthnCredential>;
};
```


