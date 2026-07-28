---
title: "@kiwa-lab/auth supabase-setup-supabase-auth-env の API 契約"
---

# <code v-pre>@kiwa-lab/auth</code> <code v-pre>supabase-setup-supabase-auth-env</code> の API 契約

[ソース](https://github.com/cardene777/kiwa/blob/main/packages/auth/src/supabase/setup-supabase-auth-env.ts) から同期しています。各項目は公開名、TypeScript の宣言、宣言元のソース位置を示します。実装に JSDoc がある場合は、その説明も表示します。

[リファレンスの目次へ戻る](./)

### 値

#### <code v-pre>setupSupabaseAuthEnv</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/auth/src/supabase/setup-supabase-auth-env.ts#L36) <code v-pre>packages/auth/src/supabase/setup-supabase-auth-env.ts</code>

Build a Supabase Auth test env. The returned handle exposes an `auth` (client) + `admin` (service-role) surface that mirrors `@supabase/supabase-js`'s `client.auth.*` + `client.auth.admin.*` API, plus a `verifyToken` helper that validates access tokens issued by the same env. v0.3 scope covers Supabase Auth core semantics — email/password + OAuth (Google/GitHub/Apple) + magic link + JWT session mock. RLS policy mock / MFA / SSO SAML / Web3 wallet auth are covered by the advanced adapter (v1.10-2).

```ts
export declare function setupSupabaseAuthEnv(opts?: SetupSupabaseAuthEnvOptions): Promise<SupabaseAuthTestEnv>;
```


