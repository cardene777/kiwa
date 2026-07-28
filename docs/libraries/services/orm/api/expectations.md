---
title: "@kiwa-lab/orm expectations の API 契約"
---

# <code v-pre>@kiwa-lab/orm</code> <code v-pre>expectations</code> の API 契約

[ソース](https://github.com/cardene777/kiwa/blob/main/packages/orm/src/expectations.ts) から同期しています。各項目は公開名、TypeScript の宣言、宣言元のソース位置を示します。実装に JSDoc がある場合は、その説明も表示します。

[リファレンスの目次へ戻る](./)

### 値

#### <code v-pre>expectQuery</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/orm/src/expectations.ts#L25) <code v-pre>packages/orm/src/expectations.ts</code>

Run a raw SQL query against the underlying driver and assert that the returned rows deeply equal `expected`. SQLite mock uses better-sqlite3's synchronous `prepare(...).all()`; Postgres live uses postgres.js's tagged template via `sql.unsafe(...)`.

```ts
export declare function expectQuery<TRow = unknown>(env: OrmTestEnv, sql: string, expected: ReadonlyArray<TRow>, expect: MinimalExpect): Promise<void>;
```

#### <code v-pre>expectRowCount</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/orm/src/expectations.ts#L76) <code v-pre>packages/orm/src/expectations.ts</code>

Assert that the row count of `table` equals `expected`.

```ts
export declare function expectRowCount(env: OrmTestEnv, table: string, expected: number, expect: MinimalExpect): Promise<void>;
```

### 型

#### <code v-pre>MinimalExpect</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/orm/src/expectations.ts#L12) <code v-pre>packages/orm/src/expectations.ts</code>

```ts
export interface MinimalExpect {
    (actual: unknown): {
        toEqual(expected: unknown): void;
        toBe(expected: unknown): void;
    };
}
```
