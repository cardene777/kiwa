---
title: "@kiwa-lab/websocket server の API 契約"
---

<!-- kiwa-generated-api-page -->

# <code v-pre>@kiwa-lab/websocket</code> <code v-pre>server</code> の API 契約

[ソース](https://github.com/cardene777/kiwa/blob/main/packages/websocket/src/server.ts) から同期しています。各項目は公開名、TypeScript の宣言、宣言元のソース位置を示します。実装に JSDoc がある場合は、その説明も表示します。

[リファレンスの目次へ戻る](../reference.md)

### 値

#### <code v-pre>createWSServer</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/websocket/src/server.ts#L44) <code v-pre>packages/websocket/src/server.ts</code>

provider 別 mock server。 provider 差は id prefix と挙動 default のみ、 API は共通 interface。

```ts
export declare function createWSServer(options?: WSServerOptions): WSServer;
```

### 型

#### <code v-pre>WSProvider</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/websocket/src/server.ts#L4) <code v-pre>packages/websocket/src/server.ts</code>

```ts
export type WSProvider = 'ws' | 'uwebsockets' | 'socketio' | 'colyseus';
```

#### <code v-pre>WSSentRecord</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/websocket/src/server.ts#L12) <code v-pre>packages/websocket/src/server.ts</code>

```ts
export interface WSSentRecord {
    id: string;
    provider: WSProvider;
    target: 'client' | 'broadcast';
    clientId?: string;
    payload: WSPayload;
    sentAt: number;
}
```

#### <code v-pre>WSServer</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/websocket/src/server.ts#L27) <code v-pre>packages/websocket/src/server.ts</code>

```ts
export interface WSServer {
    provider: WSProvider;
    clients: () => WSClient[];
    accept: (client: WSClient) => void;
    disconnect: (clientId: string) => void;
    broadcast: (payload: WSPayload) => void;
    listSent: () => WSSentRecord[];
    clear: () => void;
    on: <K extends keyof WSServerEvents>(event: K, handler: NonNullable<WSServerEvents[K]>) => void;
    nextId: () => string;
    recordSent: (record: WSSentRecord) => void;
    emit: (client: WSClient, payload: WSPayload) => void;
}
```

#### <code v-pre>WSServerEvents</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/websocket/src/server.ts#L21) <code v-pre>packages/websocket/src/server.ts</code>

```ts
export interface WSServerEvents {
    onConnect?: (client: WSClient) => void;
    onDisconnect?: (client: WSClient) => void;
    onMessage?: (client: WSClient, payload: WSPayload) => void;
}
```

#### <code v-pre>WSServerOptions</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/websocket/src/server.ts#L6) <code v-pre>packages/websocket/src/server.ts</code>

```ts
export interface WSServerOptions {
    provider?: WSProvider;
    now?: () => number;
    idSeed?: number;
}
```
