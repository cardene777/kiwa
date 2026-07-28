---
title: "@kiwa-lab/auth lucia__password の API 契約"
---

<!-- kiwa-generated-api-page -->

# <code v-pre>@kiwa-lab/auth</code> <code v-pre>lucia&#95;&#95;password</code> の API 契約

[ソース](https://github.com/cardene777/kiwa/blob/main/packages/auth/src/lucia/password.ts) から同期しています。各項目は公開名、TypeScript の宣言、宣言元のソース位置を示します。実装に JSDoc がある場合は、その説明も表示します。

[リファレンスの目次へ戻る](./)

### 値

#### <code v-pre>hashPassword</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/auth/src/lucia/password.ts#L38) <code v-pre>packages/auth/src/lucia/password.ts</code>

Hash a password. The returned string is opaque to callers and safe to store in the mock user record. Empty passwords are rejected — same policy the real argon2 adapters recommend, and the earliest place we can flag a bug.

```ts
export declare function hashPassword(password: string): Promise<string>;
```

#### <code v-pre>verifyPassword</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/auth/src/lucia/password.ts#L56) <code v-pre>packages/auth/src/lucia/password.ts</code>

Verify a password against a previously issued hash. Returns false for any malformed hash rather than throwing — matches the real argon2 verifier and lets sign-in flows treat the outcome as a boolean at the call site.

```ts
export declare function verifyPassword(hash: string, password: string): Promise<boolean>;
```


