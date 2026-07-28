---
title: "@kiwa-lab/auth session の API 契約"
---

<!-- kiwa-generated-api-page -->

# <code v-pre>@kiwa-lab/auth</code> <code v-pre>session</code> の API 契約

[ソース](https://github.com/cardene777/kiwa/blob/main/packages/auth/src/session.ts) から同期しています。各項目は公開名、TypeScript の宣言、宣言元のソース位置を示します。実装に JSDoc がある場合は、その説明も表示します。

[リファレンスの目次へ戻る](../reference.md)

### 値

#### <code v-pre>issueSession</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/auth/src/session.ts#L61) <code v-pre>packages/auth/src/session.ts</code>

Issue a session token for a signed-in user. The JWT strategy short-circuits database writes; the database strategy persists the session row.

```ts
export declare function issueSession(database: AuthDatabaseAdapter, user: AuthUser, strategy: SessionStrategy, maxAgeSeconds: number): Promise<{
    sessionToken: string;
    expires: Date;
}>;
```

#### <code v-pre>upsertUserFromProfile</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/auth/src/session.ts#L29) <code v-pre>packages/auth/src/session.ts</code>

Materialise a profile into a persisted user / account pair, mirroring the flow that NextAuth's `signIn` callback runs when a real provider returns.

```ts
export declare function upsertUserFromProfile(database: AuthDatabaseAdapter, profile: AuthProfile): Promise<AuthUser>;
```


