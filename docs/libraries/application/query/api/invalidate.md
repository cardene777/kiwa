---
title: "@kiwa-lab/query invalidate の API 契約"
---

# <code v-pre>@kiwa-lab/query</code> <code v-pre>invalidate</code> の API 契約

[ソース](https://github.com/cardene777/kiwa/blob/main/packages/query/src/invalidate.ts) から同期しています。各項目は公開名、TypeScript の宣言、宣言元のソース位置を示します。実装に JSDoc がある場合は、その説明も表示します。

[リファレンスの目次へ戻る](./)

### 値

#### <code v-pre>invalidateQuery</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/query/src/invalidate.ts#L12) <code v-pre>packages/query/src/invalidate.ts</code>

cache から key を削除、 listener に invalidation を通知。 TanStack Query の queryClient.invalidateQueries 相当。

```ts
export declare function invalidateQuery(client: QueryClient, key: QueryKey): InvalidateResult;
```

### 型

#### <code v-pre>InvalidateResult</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/query/src/invalidate.ts#L3) <code v-pre>packages/query/src/invalidate.ts</code>

```ts
export interface InvalidateResult {
    key: string;
    existed: boolean;
}
```
