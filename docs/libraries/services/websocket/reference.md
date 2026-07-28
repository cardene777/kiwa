# @kiwa-lab/websocket リファレンス

in-process WebSocket server、client、message、binary frame、reconnect、roomの公開APIです。

## server と client

`createWSServer({ provider, now, idSeed })` は server を作ります。providerの既定値は `ws` で、id prefixだけがproviderごとに変わります。`now` はsent recordの`sentAt`を固定するtestで使います。

`connectClient(server, { id, now })` はclientを直ちにserverへacceptします。id未指定ならserverがprovider prefix付きのidを生成します。

| API | 内容 |
| --- | --- |
| `server.clients()` | 現在のclients listのcopy |
| `server.disconnect(id)` | listから外し、clientをclosedにする |
| `server.broadcast(payload)` | clients listの全clientへ配送しsent recordを残す |
| `server.listSent()` | sent recordのcopy |
| `server.clear()` | sent recordとclients listを空にする。client自身はclosedにしない |
| `server.on(event, handler)` | 同じeventのhandlerを上書きする |
| `client.send(payload)` | serverのonMessageへ通知し、client送信recordを残す |
| `client.close(code, reason)` | clientをclosedにしclose handlerを呼ぶ。serverからは外さない |

`onConnect`、`onDisconnect`、`onMessage`は一eventにつき一handlerです。複数のhandlerを登録するevent emitterではありません。

## message

`WSPayload` は string、Uint8Array、または `{ type, data }` objectです。

`sendMessage` はserverからtarget clientへ配送するか、clientからserverのonMessageへ送ります。server targetにnullを渡すとserver.broadcastを呼びます。`broadcastMessage(server, payload, filter)` はfilterなしならserver.broadcast、filterありなら一致clientにだけ配送します。

## binary frame

`encodeBinaryFrame(opcode, payload)` はFINを立てたunmasked frameを作ります。`reserved` opcodeはbinaryとしてencodeします。

`captureBinaryFrame(frame)` はFIN、opcode、mask、payload length、payloadを返します。frameが2byte未満ならthrowします。extended length 127は最大32bit相当だけを読む簡易実装です。

## reconnect と heartbeat

`computeReconnectDelay(attempt, policy, rng)` は指数backoffを返します。jitter有効時はbaseの50%から100%に乱数を掛けます。

`createHeartbeatState(now)` はmutableなstateと`ping`、`pong`、`check`を返します。outstanding pingの経過がthresholdを超えたcheckだけがmissed countを増やし、countがmaxMissed以上ならhealthyをfalseにします。

## room

`createRoomRegistry(now)` はroomごとのmember mapを管理します。`join`は同じclient idのentryを置き換え、`leave`で最後のmemberが抜けるとroomを削除します。presence metadataは現在join APIから指定できないため、`presenceOf`で返るmetadataはundefinedです。

<!-- kiwa-public-api:start -->
## エラー診断

次の一覧は、公開 entry point から到達する実装が明示的に送出する Error と TypeError です。template literal の値は実行時の入力で置き換わります。

| 送出する message | 発生箇所 |
| --- | --- |
| 'frame too short' | [packages/websocket/src/binary.ts](https://github.com/cardene777/kiwa/blob/main/packages/websocket/src/binary.ts#L25) |
| &#96;client $&#123;id&#125; is closed&#96; | [packages/websocket/src/client.ts](https://github.com/cardene777/kiwa/blob/main/packages/websocket/src/client.ts#L39) |
| &#96;client $&#123;id&#125; not attached to server&#96; | [packages/websocket/src/client.ts](https://github.com/cardene777/kiwa/blob/main/packages/websocket/src/client.ts#L40) |
| &#96;client not found: $&#123;clientId&#125;&#96; | [packages/websocket/src/message.ts](https://github.com/cardene777/kiwa/blob/main/packages/websocket/src/message.ts#L25) |

## API 契約

この section は [公開 entry point](https://github.com/cardene777/kiwa/blob/main/packages/websocket/src/index.ts) から同期しています。各項目は公開名、TypeScript の宣言、宣言元のソース位置を示します。実装に JSDoc がある場合は、その説明も表示します。

### 値

#### `broadcastMessage`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/websocket/src/message.ts#L37) `packages/websocket/src/message.ts`

server-side broadcast。 filter で選別可能 (room / tag 等の subset broadcast simulate)。

```ts
export declare function broadcastMessage(server: WSServer, payload: WSPayload, filter?: WSBroadcastFilter): void;
```

#### `captureBinaryFrame`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/websocket/src/binary.ts#L24) `packages/websocket/src/binary.ts`

RFC 6455 binary frame parse mock。 real ws.parser の subset (fin + opcode + mask + payload)。 mask key + extended payload length は簡易対応。

```ts
export declare function captureBinaryFrame(frame: Uint8Array): WSBinaryFrame;
```

#### `computeReconnectDelay`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/websocket/src/reconnect.ts#L18) `packages/websocket/src/reconnect.ts`

exponential backoff で reconnect delay を計算。 real WS client の reconnect strategy (Socket.IO / uWebSockets client) を mock。 jitter で thundering herd 回避。

```ts
export declare function computeReconnectDelay(attempt: number, policy: ReconnectPolicy, rng?: () => number): ReconnectAttempt;
```

#### `connectClient`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/websocket/src/client.ts#L29) `packages/websocket/src/client.ts`

client mock。 server を受け取ってすぐ accept する経路 (auto handshake、 real WS の open event 相当)。

```ts
export declare function connectClient(server: WSServer, options?: WSClientOptions): WSClient;
```

#### `createHeartbeatState`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/websocket/src/reconnect.ts#L36) `packages/websocket/src/reconnect.ts`

ping/pong heartbeat 状態を追跡、 pong 未受信で missedPongs を increment、 閾値超えで healthy=false。 real WS keepalive パターンの mock。

```ts
export declare function createHeartbeatState(now?: () => number): {
    state: HeartbeatState;
    ping: () => void;
    pong: () => void;
    check: (thresholdMs: number, maxMissed: number) => HeartbeatState;
};
```

#### `createRoomRegistry`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/websocket/src/room.ts#L23) `packages/websocket/src/room.ts`

room/channel 抽象。 client を roomName で group 化し、 broadcastToRoom で 該当 member にのみ配信。 real Socket.IO room / Colyseus room 相当を mock。

```ts
export declare function createRoomRegistry(now?: () => number): RoomRegistry;
```

#### `createWSServer`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/websocket/src/server.ts#L44) `packages/websocket/src/server.ts`

provider 別 mock server。 provider 差は id prefix と挙動 default のみ、 API は共通 interface。

```ts
export declare function createWSServer(options?: WSServerOptions): WSServer;
```

#### `encodeBinaryFrame`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/websocket/src/binary.ts#L63) `packages/websocket/src/binary.ts`

text / binary payload を simple frame にエンコード (unmasked、 server → client 経路想定)。

```ts
export declare function encodeBinaryFrame(opcode: WSOpcode, payload: Uint8Array): Uint8Array;
```

#### `sendMessage`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/websocket/src/message.ts#L11) `packages/websocket/src/message.ts`

target = server なら該当 client に direct send、 client なら server 経由で emit。

```ts
export declare function sendMessage(from: WSServer | WSClient, target: WSClient | string | null, payload: WSPayload): void;
```

### 型

#### `HeartbeatState`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/websocket/src/reconnect.ts#L25) `packages/websocket/src/reconnect.ts`

```ts
export interface HeartbeatState {
    lastPingAt: number;
    lastPongAt: number;
    missedPongs: number;
    healthy: boolean;
}
```

#### `PresenceInfo`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/websocket/src/room.ts#L13) `packages/websocket/src/room.ts`

```ts
export interface PresenceInfo {
    clientId: string;
    joinedAt: number;
    metadata?: Record<string, unknown>;
}
```

#### `ReconnectAttempt`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/websocket/src/reconnect.ts#L8) `packages/websocket/src/reconnect.ts`

```ts
export interface ReconnectAttempt {
    attempt: number;
    delayMs: number;
    giveUp: boolean;
}
```

#### `ReconnectPolicy`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/websocket/src/reconnect.ts#L1) `packages/websocket/src/reconnect.ts`

```ts
export interface ReconnectPolicy {
    maxAttempts: number;
    initialDelayMs: number;
    maxDelayMs: number;
    jitter?: boolean;
}
```

#### `RoomRegistry`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/websocket/src/room.ts#L4) `packages/websocket/src/room.ts`

```ts
export interface RoomRegistry {
    join: (roomName: string, client: WSClient) => void;
    leave: (roomName: string, clientId: string) => void;
    listMembers: (roomName: string) => WSClient[];
    broadcastToRoom: (roomName: string, payload: WSPayload) => number;
    listRooms: () => string[];
    presenceOf: (roomName: string) => PresenceInfo[];
}
```

#### `WSBinaryFrame`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/websocket/src/binary.ts#L3) `packages/websocket/src/binary.ts`

```ts
export interface WSBinaryFrame {
    opcode: WSOpcode;
    fin: boolean;
    masked: boolean;
    payloadLength: number;
    payload: Uint8Array;
}
```

#### `WSBroadcastFilter`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/websocket/src/message.ts#L6) `packages/websocket/src/message.ts`

```ts
export type WSBroadcastFilter = (client: WSClient) => boolean;
```

#### `WSClient`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/websocket/src/client.ts#L12) `packages/websocket/src/client.ts`

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

#### `WSClientOptions`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/websocket/src/client.ts#L7) `packages/websocket/src/client.ts`

```ts
export interface WSClientOptions {
    id?: string;
    now?: () => number;
}
```

#### `WSCloseHandler`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/websocket/src/client.ts#L5) `packages/websocket/src/client.ts`

```ts
export type WSCloseHandler = (code: number, reason: string) => void;
```

#### `WSMessageHandler`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/websocket/src/client.ts#L4) `packages/websocket/src/client.ts`

```ts
export type WSMessageHandler = (payload: WSPayload) => void;
```

#### `WSOpcode`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/websocket/src/binary.ts#L1) `packages/websocket/src/binary.ts`

```ts
export type WSOpcode = 'continuation' | 'text' | 'binary' | 'close' | 'ping' | 'pong' | 'reserved';
```

#### `WSPayload`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/websocket/src/message.ts#L4) `packages/websocket/src/message.ts`

```ts
export type WSPayload = string | Uint8Array | {
    type: string;
    data: unknown;
};
```

#### `WSProvider`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/websocket/src/server.ts#L4) `packages/websocket/src/server.ts`

```ts
export type WSProvider = 'ws' | 'uwebsockets' | 'socketio' | 'colyseus';
```

#### `WSSentRecord`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/websocket/src/server.ts#L12) `packages/websocket/src/server.ts`

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

#### `WSServer`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/websocket/src/server.ts#L27) `packages/websocket/src/server.ts`

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

#### `WSServerEvents`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/websocket/src/server.ts#L21) `packages/websocket/src/server.ts`

```ts
export interface WSServerEvents {
    onConnect?: (client: WSClient) => void;
    onDisconnect?: (client: WSClient) => void;
    onMessage?: (client: WSClient, payload: WSPayload) => void;
}
```

#### `WSServerOptions`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/websocket/src/server.ts#L6) `packages/websocket/src/server.ts`

```ts
export interface WSServerOptions {
    provider?: WSProvider;
    now?: () => number;
    idSeed?: number;
}
```
<!-- kiwa-public-api:end -->
