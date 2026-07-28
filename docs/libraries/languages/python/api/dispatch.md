---
title: "@kiwa-lab/python dispatch の API 契約"
---

<!-- kiwa-generated-api-page -->

# <code v-pre>@kiwa-lab/python</code> <code v-pre>dispatch</code> の API 契約

[ソース](https://github.com/cardene777/kiwa/blob/main/packages/python/src/dispatch.ts) から同期しています。各項目は公開名、TypeScript の宣言、宣言元のソース位置を示します。実装に JSDoc がある場合は、その説明も表示します。

[リファレンスの目次へ戻る](./)

### 値

#### <code v-pre>dispatchRequest</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/python/src/dispatch.ts#L23) <code v-pre>packages/python/src/dispatch.ts</code>

WSGI/ASGI request-response cycle を in-process で dispatch。 middleware chain を 順次実行 → route handler にたどり着き response を返す。 route 未登録は 404。

```ts
export declare function dispatchRequest(env: PythonAppEnv, request: PythonRequest): Promise<PythonResponse>;
```

### 型

#### <code v-pre>PythonHeaders</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/python/src/dispatch.ts#L3) <code v-pre>packages/python/src/dispatch.ts</code>

```ts
export type PythonHeaders = Record<string, string>;
```

#### <code v-pre>PythonRequest</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/python/src/dispatch.ts#L5) <code v-pre>packages/python/src/dispatch.ts</code>

```ts
export interface PythonRequest {
    method: string;
    path: string;
    headers?: PythonHeaders;
    body?: string;
    query?: Record<string, string>;
}
```

#### <code v-pre>PythonResponse</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/python/src/dispatch.ts#L13) <code v-pre>packages/python/src/dispatch.ts</code>

```ts
export interface PythonResponse {
    status: number;
    headers: PythonHeaders;
    body: string;
}
```
