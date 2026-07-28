---
title: "@kiwa-lab/query mutation の API 契約"
---

<!-- kiwa-generated-api-page -->

# <code v-pre>@kiwa-lab/query</code> <code v-pre>mutation</code> の API 契約

[ソース](https://github.com/cardene777/kiwa/blob/main/packages/query/src/mutation.ts) から同期しています。各項目は公開名、TypeScript の宣言、宣言元のソース位置を示します。実装に JSDoc がある場合は、その説明も表示します。

[リファレンスの目次へ戻る](./)

### 値

#### <code v-pre>mutate</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/query/src/mutation.ts#L21) <code v-pre>packages/query/src/mutation.ts</code>

mutationFn 実行 + 成功時に invalidateKeys を全 invalidate、 失敗時は onError 発火。 TanStack Query の useMutation.mutateAsync 相当。

```ts
export declare function mutate<TArgs, TResult>(client: QueryClient, mutationFn: MutationFn<TArgs, TResult>, args: TArgs, options?: MutateOptions<TResult>): Promise<MutateResult<TResult>>;
```

### 型

#### <code v-pre>MutateOptions</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/query/src/mutation.ts#L6) <code v-pre>packages/query/src/mutation.ts</code>

```ts
export interface MutateOptions<TResult> {
    invalidateKeys?: QueryKey[];
    onSuccess?: (result: TResult) => void;
    onError?: (err: Error) => void;
}
```

#### <code v-pre>MutateResult</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/query/src/mutation.ts#L12) <code v-pre>packages/query/src/mutation.ts</code>

```ts
export interface MutateResult<TResult> {
    result: TResult;
    invalidated: string[];
}
```

#### <code v-pre>MutationFn</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/query/src/mutation.ts#L4) <code v-pre>packages/query/src/mutation.ts</code>

```ts
export type MutationFn<TArgs, TResult> = (args: TArgs) => Promise<TResult>;
```
