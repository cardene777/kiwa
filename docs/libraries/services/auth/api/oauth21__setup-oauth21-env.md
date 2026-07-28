---
title: "@kiwa-lab/auth oauth21__setup-oauth21-env の API 契約"
---

<!-- kiwa-generated-api-page -->

# <code v-pre>@kiwa-lab/auth</code> <code v-pre>oauth21&#95;&#95;setup-oauth21-env</code> の API 契約

[ソース](https://github.com/cardene777/kiwa/blob/main/packages/auth/src/oauth21/setup-oauth21-env.ts) から同期しています。各項目は公開名、TypeScript の宣言、宣言元のソース位置を示します。実装に JSDoc がある場合は、その説明も表示します。

[リファレンスの目次へ戻る](./)

### 値

#### <code v-pre>&#95;&#95;resetOAuth21Counters</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/auth/src/oauth21/setup-oauth21-env.ts#L24) <code v-pre>packages/auth/src/oauth21/setup-oauth21-env.ts</code>

Reset every module-scope counter used by the OAuth 2.1 adapter so consecutive `setupOAuth21Env` calls produce stable, deterministic ids.

```ts
export declare function __resetOAuth21Counters(): void;
```

#### <code v-pre>setupOAuth21Env</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/auth/src/oauth21/setup-oauth21-env.ts#L40) <code v-pre>packages/auth/src/oauth21/setup-oauth21-env.ts</code>

Set up the OAuth 2.1 test environment. Composes a mock Authorization Server with PKCE + DPoP helpers so a test can drive the full RFC 9700 flow through a single handle. The env is hermetic — every mutation goes through the returned surface, and a single `stop()` disposes the AS state. Consecutive `setupOAuth21Env` calls in the same process should be preceded by `__resetOAuth21Counters()` when reproducibility of ids matters.

```ts
export declare function setupOAuth21Env(options?: SetupOAuth21EnvOptions): Promise<OAuth21TestEnv>;
```


