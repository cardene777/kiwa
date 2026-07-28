---
title: "@kiwa-lab/auth auth0__setup-auth0-env の API 契約"
---

<!-- kiwa-generated-api-page -->

# <code v-pre>@kiwa-lab/auth</code> <code v-pre>auth0&#95;&#95;setup-auth0-env</code> の API 契約

[ソース](https://github.com/cardene777/kiwa/blob/main/packages/auth/src/auth0/setup-auth0-env.ts) から同期しています。各項目は公開名、TypeScript の宣言、宣言元のソース位置を示します。実装に JSDoc がある場合は、その説明も表示します。

[リファレンスの目次へ戻る](./)

### 値

#### <code v-pre>setupAuth0Env</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/auth/src/auth0/setup-auth0-env.ts#L48) <code v-pre>packages/auth/src/auth0/setup-auth0-env.ts</code>

Build an Auth0 test env. The returned handle exposes `users` (Management API surface), `authenticate` (Authentication API surface), `rules` (legacy rules registry), and `actions` (post-login / pre-user-registration / post-user-registration / post-change-password triggers) plus `verifyIdToken` / `verifyAccessToken` helpers that validate JWTs issued by the same env. Consumers wire the env into their code by either (a) swapping the real `ManagementClient` / `AuthenticationClient` for `env.users` / `env.authenticate` in test setup, or (b) driving the token flow directly with `env.authenticate.signIn` + `env.verifyIdToken`.

```ts
export declare function setupAuth0Env(opts?: SetupAuth0EnvOptions): Promise<Auth0TestEnv>;
```


