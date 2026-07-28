---
title: "@kiwa-lab/auth webauthn__authenticator の API 契約"
---

<!-- kiwa-generated-api-page -->

# <code v-pre>@kiwa-lab/auth</code> <code v-pre>webauthn&#95;&#95;authenticator</code> の API 契約

[ソース](https://github.com/cardene777/kiwa/blob/main/packages/auth/src/webauthn/authenticator.ts) から同期しています。各項目は公開名、TypeScript の宣言、宣言元のソース位置を示します。実装に JSDoc がある場合は、その説明も表示します。

[リファレンスの目次へ戻る](./)

### 値

#### <code v-pre>createVirtualAuthenticator</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/auth/src/webauthn/authenticator.ts#L27) <code v-pre>packages/auth/src/webauthn/authenticator.ts</code>

Build a Chrome Virtual Authenticator API compatible mock. Mirrors the shape of `WebAuthn.addVirtualAuthenticator` in the Chrome DevTools protocol which Playwright and Puppeteer surface as `page.context().addInitScript(...)` / `CDPSession.send('WebAuthn.addVirtualAuthenticator', ...)`. The mock keeps credentials in a `Map&lt;credentialId, WebAuthnCredential&gt;` and hands out an internal view — the RP-facing surface goes through `WebAuthnTestEnv` instead.

```ts
export declare function createVirtualAuthenticator(options: VirtualAuthenticatorOptions): {
    handle: VirtualAuthenticator;
    credentials: Map<string, WebAuthnCredential>;
};
```


