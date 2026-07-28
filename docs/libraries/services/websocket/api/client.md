---
title: "@kiwa-lab/websocket client の API 契約"
---

# <code v-pre>@kiwa-lab/websocket</code> <code v-pre>client</code> の API 契約

[ソース](https://github.com/cardene777/kiwa/blob/main/packages/websocket/src/client.ts) から同期しています。各項目は公開名、TypeScript の宣言、宣言元のソース位置を示します。実装に JSDoc がある場合は、その説明も表示します。

[リファレンスの目次へ戻る](./)

### 値

#### <code v-pre>connectClient</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/websocket/src/client.ts#L29) <code v-pre>packages/websocket/src/client.ts</code>

client mock。 server を受け取ってすぐ accept する経路 (auto handshake、 real WS の open event 相当)。

```ts
export declare function connectClient(server: WSServer, options?: WSClientOptions): WSClient;
```

### 型

#### <code v-pre>WSClient</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/websocket/src/client.ts#L12) <code v-pre>packages/websocket/src/client.ts</code>

```ts
export interface WSClient {
    id: string;
    server?: WSServer;
    isOpen: boolean;
    send: (payload: WSPayload) => void;
    onMessage: (handler: WSMessageHandler) => void;
    onClose: (handler: WSCloseHandler) => void;
    close: (code?: number, reason?: string) => void;
    received: () => WSPayload[];
    _attachServer: (server: WSServer) => void;
    _receive: (payload: WSPayload) => void;
    _markClosed: () => void;
}
```

#### <code v-pre>WSClientOptions</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/websocket/src/client.ts#L7) <code v-pre>packages/websocket/src/client.ts</code>

```ts
export interface WSClientOptions {
    id?: string;
    now?: () => number;
}
```

#### <code v-pre>WSCloseHandler</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/websocket/src/client.ts#L5) <code v-pre>packages/websocket/src/client.ts</code>

```ts
export type WSCloseHandler = (code: number, reason: string) => void;
```

#### <code v-pre>WSMessageHandler</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/websocket/src/client.ts#L4) <code v-pre>packages/websocket/src/client.ts</code>

```ts
export type WSMessageHandler = (payload: WSPayload) => void;
```
