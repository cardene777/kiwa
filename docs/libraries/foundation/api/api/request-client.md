---
title: "@kiwa-lab/api request-client の API 契約"
---

# <code v-pre>@kiwa-lab/api</code> <code v-pre>request-client</code> の API 契約

[ソース](https://github.com/cardene777/kiwa/blob/main/packages/api/src/request-client.ts) から同期しています。各項目は公開名、TypeScript の宣言、宣言元のソース位置を示します。実装に JSDoc がある場合は、その説明も表示します。

[リファレンスの目次へ戻る](./)

### 値

#### <code v-pre>createRequestClient</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/api/src/request-client.ts#L30) <code v-pre>packages/api/src/request-client.ts</code>

```ts
export declare function createRequestClient(opts: RequestClientOptions): ApiRequestClient;
```

### 型

#### <code v-pre>RequestClientOptions</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/api/src/request-client.ts#L24) <code v-pre>packages/api/src/request-client.ts</code>

```ts
export interface RequestClientOptions {
    baseUrl: string;
    defaultHeaders?: Record<string, string>;
    fetcher?: typeof fetch;
}
```
