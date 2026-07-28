---
title: "@kiwa-lab/query client の API 契約"
---

# <code v-pre>@kiwa-lab/query</code> <code v-pre>client</code> の API 契約

[ソース](https://github.com/cardene777/kiwa/blob/main/packages/query/src/client.ts) から同期しています。各項目は公開名、TypeScript の宣言、宣言元のソース位置を示します。実装に JSDoc がある場合は、その説明も表示します。

[リファレンスの目次へ戻る](./)

### 値

#### <code v-pre>createQueryClient</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/query/src/client.ts#L36) <code v-pre>packages/query/src/client.ts</code>

provider 差 (tanstack = infinite scroll / swr = revalidateOnFocus / urql = exchange chain / apollo = normalized cache) は abstract、 4 provider 共通の cache + fetchCount 挙動を mock する。

```ts
export declare function createQueryClient(options?: CreateQueryClientOptions): QueryClient;
```

### 型

#### <code v-pre>CreateQueryClientOptions</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/query/src/client.ts#L16) <code v-pre>packages/query/src/client.ts</code>

```ts
export interface CreateQueryClientOptions {
    provider?: QueryProvider;
    defaultStaleMs?: number;
    now?: () => number;
}
```

#### <code v-pre>QueryClient</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/query/src/client.ts#L22) <code v-pre>packages/query/src/client.ts</code>

```ts
export interface QueryClient {
    provider: QueryProvider;
    cache: Map<string, QueryState>;
    defaultStaleMs: number;
    now: () => number;
    listeners: Map<string, Set<(state: QueryState) => void>>;
    clear: () => void;
    snapshot: () => QueryState[];
}
```

#### <code v-pre>QueryKey</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/query/src/client.ts#L3) <code v-pre>packages/query/src/client.ts</code>

```ts
export type QueryKey = string | readonly (string | number)[];
```

#### <code v-pre>QueryProvider</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/query/src/client.ts#L1) <code v-pre>packages/query/src/client.ts</code>

```ts
export type QueryProvider = 'tanstack' | 'swr' | 'urql' | 'apollo';
```

#### <code v-pre>QueryState</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/query/src/client.ts#L7) <code v-pre>packages/query/src/client.ts</code>

```ts
export interface QueryState<T = unknown> {
    key: string;
    status: QueryStatus;
    data?: T;
    error?: Error;
    updatedAt: number;
    fetchCount: number;
}
```

#### <code v-pre>QueryStatus</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/query/src/client.ts#L5) <code v-pre>packages/query/src/client.ts</code>

```ts
export type QueryStatus = 'idle' | 'loading' | 'success' | 'error';
```
