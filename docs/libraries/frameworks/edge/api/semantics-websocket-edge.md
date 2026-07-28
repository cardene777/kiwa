---
title: "@kiwa-lab/edge semantics-websocket-edge の API 契約"
---

# <code v-pre>@kiwa-lab/edge</code> <code v-pre>semantics-websocket-edge</code> の API 契約

[ソース](https://github.com/cardene777/kiwa/blob/main/packages/edge/src/semantics/websocket-edge.ts) から同期しています。各項目は公開名、TypeScript の宣言、宣言元のソース位置を示します。実装に JSDoc がある場合は、その説明も表示します。

[リファレンスの目次へ戻る](./)

### 値

#### <code v-pre>acceptWebSocket</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/edge/src/semantics/websocket-edge.ts#L62) <code v-pre>packages/edge/src/semantics/websocket-edge.ts</code>

Accept the pending upgrade, moving the socket 'open'. Rejects if the socket is not awaiting acceptance. Emits `websocket.accepted`.

```ts
export declare function acceptWebSocket(session: WebSocketSession): AxisStep<WsState>;
```

#### <code v-pre>closeWebSocket</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/edge/src/semantics/websocket-edge.ts#L101) <code v-pre>packages/edge/src/semantics/websocket-edge.ts</code>

Close the socket with a status code. Rejects if already closed. Emits `websocket.closed`.

```ts
export declare function closeWebSocket(session: WebSocketSession, input: {
    code: number;
}): AxisStep<WsState>;
```

#### <code v-pre>requestWebSocketUpgrade</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/edge/src/semantics/websocket-edge.ts#L37) <code v-pre>packages/edge/src/semantics/websocket-edge.ts</code>

Begin the upgrade handshake. State starts 'pending' until the server accepts. Emits `websocket.upgrade-requested`.

```ts
export declare function requestWebSocketUpgrade(input: {
    id: string;
    platform: EdgePlatform;
}): WebSocketSession;
```

#### <code v-pre>sendMessage</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/edge/src/semantics/websocket-edge.ts#L80) <code v-pre>packages/edge/src/semantics/websocket-edge.ts</code>

Send a frame over the open socket. Rejects unless the socket is 'open'. Emits `websocket.message`.

```ts
export declare function sendMessage(session: WebSocketSession, input: {
    data: string;
}): AxisStep<WsState>;
```

### 型

#### <code v-pre>WebSocketSession</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/edge/src/semantics/websocket-edge.ts#L19) <code v-pre>packages/edge/src/semantics/websocket-edge.ts</code>

```ts
export interface WebSocketSession {
    id: string;
    platform: EdgePlatform;
    state: WsState;
    messages: string[];
    history: AxisStep<WsState>[];
}
```

#### <code v-pre>WsState</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/edge/src/semantics/websocket-edge.ts#L17) <code v-pre>packages/edge/src/semantics/websocket-edge.ts</code>

WebSocket at the edge — the HTTP-upgrade handshake plus the message / close lifecycle. All three runtimes accept a `101 Switching Protocols` upgrade (Cloudflare `WebSocketPair`, Vercel edge websockets, Deno `Deno.upgradeWebSocket`) but expose different telemetry strings. The mock drives the neutral lifecycle so a test can assert the handshake ordering without a live socket. State transitions: requestWebSocketUpgrade → 'pending' acceptWebSocket → 'open' (only from 'pending') sendMessage → 'open' (only while 'open') closeWebSocket → 'closed'

```ts
export type WsState = 'pending' | 'open' | 'closing' | 'closed';
```
