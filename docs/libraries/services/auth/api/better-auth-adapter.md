---
title: "@kiwa-lab/auth better-auth-adapter の API 契約"
---

# <code v-pre>@kiwa-lab/auth</code> <code v-pre>better-auth-adapter</code> の API 契約

[ソース](https://github.com/cardene777/kiwa/blob/main/packages/auth/src/better-auth/adapter.ts) から同期しています。各項目は公開名、TypeScript の宣言、宣言元のソース位置を示します。実装に JSDoc がある場合は、その説明も表示します。

[リファレンスの目次へ戻る](./)

### 値

#### <code v-pre>createInMemoryBetterAuthAdapter</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/auth/src/better-auth/adapter.ts#L32) <code v-pre>packages/auth/src/better-auth/adapter.ts</code>

In-memory adapter that mirrors Better Auth's Prisma / Drizzle / Kysely adapter surface. All three official adapters expose the same operation set at the Better Auth layer (create / find / update / delete + a small verification + account surface), so this single implementation stands in for any of them — the `kind` tag is the only observable difference.

```ts
export declare function createInMemoryBetterAuthAdapter(kind?: BetterAuthDatabaseKind): BetterAuthDatabaseAdapter;
```


