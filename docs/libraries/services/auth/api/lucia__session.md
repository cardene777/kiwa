---
title: "@kiwa-lab/auth lucia__session の API 契約"
---

<!-- kiwa-generated-api-page -->

# <code v-pre>@kiwa-lab/auth</code> <code v-pre>lucia&#95;&#95;session</code> の API 契約

[ソース](https://github.com/cardene777/kiwa/blob/main/packages/auth/src/lucia/session.ts) から同期しています。各項目は公開名、TypeScript の宣言、宣言元のソース位置を示します。実装に JSDoc がある場合は、その説明も表示します。

[リファレンスの目次へ戻る](./)

### 値

#### <code v-pre>createSessionFor</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/auth/src/lucia/session.ts#L22) <code v-pre>packages/auth/src/lucia/session.ts</code>

```ts
export declare function createSessionFor(database: LuciaDatabaseAdapter, user: LuciaUser, expirationSeconds: number): Promise<LuciaSession>;
```

#### <code v-pre>generateSessionId</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/auth/src/lucia/session.ts#L12) <code v-pre>packages/auth/src/lucia/session.ts</code>

```ts
export declare function generateSessionId(): string;
```

#### <code v-pre>invalidateSessionsForUser</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/auth/src/lucia/session.ts#L73) <code v-pre>packages/auth/src/lucia/session.ts</code>

```ts
export declare function invalidateSessionsForUser(database: LuciaDatabaseAdapter, userId: string): Promise<void>;
```

#### <code v-pre>validateSessionId</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/auth/src/lucia/session.ts#L43) <code v-pre>packages/auth/src/lucia/session.ts</code>

Validate a session id. Mirrors Lucia's rolling-expiration behaviour: - expired session → delete and return null - session in the refresh window (less than half the lifetime remaining) → extend `expiresAt` and mark the returned session `fresh: true` - session comfortably valid → return as-is with `fresh: false`

```ts
export declare function validateSessionId(database: LuciaDatabaseAdapter, sessionId: string, expirationSeconds: number): Promise<{
    user: LuciaUser;
    session: LuciaSession;
} | null>;
```


