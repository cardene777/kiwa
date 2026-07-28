---
title: "@kiwa-lab/auth supabase-advanced__setup-supabase-advanced-env の API 契約"
---

<!-- kiwa-generated-api-page -->

# <code v-pre>@kiwa-lab/auth</code> <code v-pre>supabase-advanced&#95;&#95;setup-supabase-advanced-env</code> の API 契約

[ソース](https://github.com/cardene777/kiwa/blob/main/packages/auth/src/supabase-advanced/setup-supabase-advanced-env.ts) から同期しています。各項目は公開名、TypeScript の宣言、宣言元のソース位置を示します。実装に JSDoc がある場合は、その説明も表示します。

[リファレンスの目次へ戻る](./)

### 値

#### <code v-pre>setupSupabaseAdvancedEnv</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/auth/src/supabase-advanced/setup-supabase-advanced-env.ts#L76) <code v-pre>packages/auth/src/supabase-advanced/setup-supabase-advanced-env.ts</code>

Build a Supabase Auth advanced test env. Layers RLS / MFA / SSO SAML / SIWE on top of the same JWT + session shape the core adapter uses. The advanced env owns its own user + session store — consumers who need core-adapter flows too should keep both envs side by side, or wire the core env's `verifyToken` to a subset of the advanced env's users.

```ts
export declare function setupSupabaseAdvancedEnv(opts?: SetupSupabaseAdvancedEnvOptions): Promise<SupabaseAdvancedTestEnv>;
```


