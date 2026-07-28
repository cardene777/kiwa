---
title: "@kiwa-lab/query fetch の API 契約"
---

<!-- kiwa-generated-api-page -->

# <code v-pre>@kiwa-lab/query</code> <code v-pre>fetch</code> の API 契約

[ソース](https://github.com/cardene777/kiwa/blob/main/packages/query/src/fetch.ts) から同期しています。各項目は公開名、TypeScript の宣言、宣言元のソース位置を示します。実装に JSDoc がある場合は、その説明も表示します。

[リファレンスの目次へ戻る](./)

### 値

#### <code v-pre>fetchQuery</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/query/src/fetch.ts#L21) <code v-pre>packages/query/src/fetch.ts</code>

cache-first fetch。 staleMs 内なら cache hit で queryFn を呼ばず、 force=true or stale なら queryFn 実行 + cache 更新。

```ts
export declare function fetchQuery<T>(client: QueryClient, key: QueryKey, queryFn: QueryFn<T>, options?: FetchQueryOptions): Promise<FetchQueryResult<T>>;
```

### 型

#### <code v-pre>FetchQueryOptions</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/query/src/fetch.ts#L5) <code v-pre>packages/query/src/fetch.ts</code>

```ts
export interface FetchQueryOptions {
    staleMs?: number;
    force?: boolean;
}
```

#### <code v-pre>FetchQueryResult</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/query/src/fetch.ts#L10) <code v-pre>packages/query/src/fetch.ts</code>

```ts
export interface FetchQueryResult<T> {
    data: T;
    fromCache: boolean;
    fetchCount: number;
    staleAgeMs: number;
}
```

#### <code v-pre>QueryFn</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/query/src/fetch.ts#L3) <code v-pre>packages/query/src/fetch.ts</code>

```ts
export type QueryFn<T> = () => Promise<T>;
```
