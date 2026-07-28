---
title: "@kiwa-lab/auth clerk__setup-clerk-env の API 契約"
---

<!-- kiwa-generated-api-page -->

# <code v-pre>@kiwa-lab/auth</code> <code v-pre>clerk&#95;&#95;setup-clerk-env</code> の API 契約

[ソース](https://github.com/cardene777/kiwa/blob/main/packages/auth/src/clerk/setup-clerk-env.ts) から同期しています。各項目は公開名、TypeScript の宣言、宣言元のソース位置を示します。実装に JSDoc がある場合は、その説明も表示します。

[リファレンスの目次へ戻る](../reference.md)

### 値

#### <code v-pre>setupClerkEnv</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/auth/src/clerk/setup-clerk-env.ts#L30) <code v-pre>packages/auth/src/clerk/setup-clerk-env.ts</code>

Build a Clerk test env. The returned handle exposes a `users` / `sessions` / `organizations` surface that mirrors `@clerk/backend`'s SDK, plus a `verifyToken` helper that validates JWTs issued by the same env. Consumers wire the env into their code by either (a) swapping the real `@clerk/backend` client for `env` in the test setup, or (b) driving the handlers directly with `env.signIn` + `env.verifyToken`.

```ts
export declare function setupClerkEnv(opts?: SetupClerkEnvOptions): Promise<ClerkTestEnv>;
```


