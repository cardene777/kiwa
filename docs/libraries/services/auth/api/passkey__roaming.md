---
title: "@kiwa-lab/auth passkey__roaming の API 契約"
---

<!-- kiwa-generated-api-page -->

# <code v-pre>@kiwa-lab/auth</code> <code v-pre>passkey&#95;&#95;roaming</code> の API 契約

[ソース](https://github.com/cardene777/kiwa/blob/main/packages/auth/src/passkey/roaming.ts) から同期しています。各項目は公開名、TypeScript の宣言、宣言元のソース位置を示します。実装に JSDoc がある場合は、その説明も表示します。

[リファレンスの目次へ戻る](./)

### 値

#### <code v-pre>createRoamingAuthenticator</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/auth/src/passkey/roaming.ts#L34) <code v-pre>packages/auth/src/passkey/roaming.ts</code>

Build a roaming authenticator (security key / phone via caBLE). Roaming authenticators are portable — the factory pins `attachment: cross-platform` and picks the wire transport from `kind`. Unlike platform authenticators, roaming authenticators can be non-discoverable (a bare U2F-style token) — the caller decides via `hasResidentKey`.

```ts
export declare function createRoamingAuthenticator(options: RoamingAuthenticatorOptions): {
    handle: RoamingAuthenticator;
    credentials: Map<string, WebAuthnCredential>;
};
```


