---
title: "@kiwa-lab/websocket message の API 契約"
---

# <code v-pre>@kiwa-lab/websocket</code> <code v-pre>message</code> の API 契約

[ソース](https://github.com/cardene777/kiwa/blob/main/packages/websocket/src/message.ts) から同期しています。各項目は公開名、TypeScript の宣言、宣言元のソース位置を示します。実装に JSDoc がある場合は、その説明も表示します。

[リファレンスの目次へ戻る](./)

### 値

#### <code v-pre>broadcastMessage</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/websocket/src/message.ts#L37) <code v-pre>packages/websocket/src/message.ts</code>

server-side broadcast。 filter で選別可能 (room / tag 等の subset broadcast simulate)。

```ts
export declare function broadcastMessage(server: WSServer, payload: WSPayload, filter?: WSBroadcastFilter): void;
```

#### <code v-pre>sendMessage</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/websocket/src/message.ts#L11) <code v-pre>packages/websocket/src/message.ts</code>

target = server なら該当 client に direct send、 client なら server 経由で emit。

```ts
export declare function sendMessage(from: WSServer | WSClient, target: WSClient | string | null, payload: WSPayload): void;
```

### 型

#### <code v-pre>WSBroadcastFilter</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/websocket/src/message.ts#L6) <code v-pre>packages/websocket/src/message.ts</code>

```ts
export type WSBroadcastFilter = (client: WSClient) => boolean;
```

#### <code v-pre>WSPayload</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/websocket/src/message.ts#L4) <code v-pre>packages/websocket/src/message.ts</code>

```ts
export type WSPayload = string | Uint8Array | {
    type: string;
    data: unknown;
};
```
