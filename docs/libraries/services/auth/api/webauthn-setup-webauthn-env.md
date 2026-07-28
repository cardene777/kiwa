---
title: "@kiwa-lab/auth webauthn-setup-webauthn-env の API 契約"
---

# <code v-pre>@kiwa-lab/auth</code> <code v-pre>webauthn-setup-webauthn-env</code> の API 契約

[ソース](https://github.com/cardene777/kiwa/blob/main/packages/auth/src/webauthn/setup-webauthn-env.ts) から同期しています。各項目は公開名、TypeScript の宣言、宣言元のソース位置を示します。実装に JSDoc がある場合は、その説明も表示します。

[リファレンスの目次へ戻る](./)

### 値

#### <code v-pre>&#95;&#95;resetWebAuthnCounters</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/auth/src/webauthn/setup-webauthn-env.ts#L25) <code v-pre>packages/auth/src/webauthn/setup-webauthn-env.ts</code>

Full test-env reset — restarts credential IDs and authenticator IDs from 1 so consecutive `setupWebAuthnEnv` calls produce stable, deterministic IDs. Exposed for tests that want to reset counters without tearing down the env object itself.

```ts
export declare function __resetWebAuthnCounters(): void;
```

#### <code v-pre>setupWebAuthnEnv</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/auth/src/webauthn/setup-webauthn-env.ts#L41) <code v-pre>packages/auth/src/webauthn/setup-webauthn-env.ts</code>

Set up the WebAuthn test environment. Creates zero or more virtual authenticators (as configured), a shared credential registry, and returns a `WebAuthnTestEnv` handle. Follow-on calls (`credentialCreation` / `credentialAssertion`) go through the returned env. When no authenticator is passed the env is empty — the caller adds authenticators lazily with `addAuthenticator`. Most tests preseed one platform authenticator to mirror the Chrome DevTools "add virtual authenticator" workflow.

```ts
export declare function setupWebAuthnEnv(opts?: SetupWebAuthnEnvOptions): Promise<WebAuthnTestEnv>;
```


