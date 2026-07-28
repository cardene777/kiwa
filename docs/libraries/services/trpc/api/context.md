---
title: "@kiwa-lab/trpc context の API 契約"
---

# <code v-pre>@kiwa-lab/trpc</code> <code v-pre>context</code> の API 契約

[ソース](https://github.com/cardene777/kiwa/blob/main/packages/trpc/src/context.ts) から同期しています。各項目は公開名、TypeScript の宣言、宣言元のソース位置を示します。実装に JSDoc がある場合は、その説明も表示します。

[リファレンスの目次へ戻る](./)

### 値

#### <code v-pre>createContext</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/trpc/src/context.ts#L13) <code v-pre>packages/trpc/src/context.ts</code>

tRPC 実 server の createContext 相当。 request 単位で context を組み立てる。 実運用では cookie / auth header を読んで userId / session を注入する pattern を mock で再現。

```ts
export declare function createContext(options?: CreateContextOptions): ProcedureContext;
```

### 型

#### <code v-pre>CreateContextOptions</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/trpc/src/context.ts#L3) <code v-pre>packages/trpc/src/context.ts</code>

```ts
export interface CreateContextOptions {
    headers?: Record<string, string>;
    userId?: string;
    session?: Record<string, unknown>;
}
```

#### <code v-pre>ProcedureContext</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/trpc/src/context.ts#L1) <code v-pre>packages/trpc/src/context.ts</code>

```ts
export type ProcedureContext = Record<string, unknown>;
```
