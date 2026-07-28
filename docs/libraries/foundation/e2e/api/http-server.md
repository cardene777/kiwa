---
title: "@kiwa-lab/e2e http-server の API 契約"
---

<!-- kiwa-generated-api-page -->

# <code v-pre>@kiwa-lab/e2e</code> <code v-pre>http-server</code> の API 契約

[ソース](https://github.com/cardene777/kiwa/blob/main/packages/e2e/src/http-server.ts) から同期しています。各項目は公開名、TypeScript の宣言、宣言元のソース位置を示します。実装に JSDoc がある場合は、その説明も表示します。

[リファレンスの目次へ戻る](./)

### 値

#### <code v-pre>startServer</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/e2e/src/http-server.ts#L55) <code v-pre>packages/e2e/src/http-server.ts</code>

```ts
export declare function startServer(source: ApiHandlerSource | NodeRequestHandler): Promise<ServerHandle>;
```

### 型

#### <code v-pre>ApiHandlerSource</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/e2e/src/http-server.ts#L3) <code v-pre>packages/e2e/src/http-server.ts</code>

```ts
export type ApiHandlerSource = {
    kind: 'fetch';
    handler: (req: Request) => Promise<Response> | Response;
} | {
    kind: 'node';
    handler: NodeRequestHandler;
};
```

#### <code v-pre>NodeRequestHandler</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/e2e/src/http-server.ts#L7) <code v-pre>packages/e2e/src/http-server.ts</code>

```ts
export type NodeRequestHandler = (req: import('node:http').IncomingMessage, res: import('node:http').ServerResponse) => void | Promise<void>;
```

#### <code v-pre>ServerHandle</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/e2e/src/http-server.ts#L49) <code v-pre>packages/e2e/src/http-server.ts</code>

```ts
export interface ServerHandle {
    baseUrl: string;
    port: number;
    close: () => Promise<void>;
}
```
