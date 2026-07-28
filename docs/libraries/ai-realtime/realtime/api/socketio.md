---
title: "@kiwa-lab/realtime socketio の API 契約"
---

<!-- kiwa-generated-api-page -->

# <code v-pre>@kiwa-lab/realtime</code> <code v-pre>socketio</code> の API 契約

[ソース](https://github.com/cardene777/kiwa/blob/main/packages/realtime/src/socketio.ts) から同期しています。各項目は公開名、TypeScript の宣言、宣言元のソース位置を示します。実装に JSDoc がある場合は、その説明も表示します。

[リファレンスの目次へ戻る](./)

### 値

#### <code v-pre>createSocketioMock</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/realtime/src/socketio.ts#L54) <code v-pre>packages/realtime/src/socketio.ts</code>

```ts
export declare function createSocketioMock(config?: RealtimeMockConfig): SocketIoMock;
```

### 型

#### <code v-pre>SocketIoMock</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/realtime/src/socketio.ts#L46) <code v-pre>packages/realtime/src/socketio.ts</code>

```ts
export interface SocketIoMock extends RealtimeMock {
    readonly provider: 'socketio';
    /** client socket (default namespace '/')。 */
    io(namespace?: string): SocketIoSocket;
    /** server side namespace (test で `.to(room).emit()` する用)。 */
    of(namespace: string): SocketIoNamespace;
}
```

#### <code v-pre>SocketIoNamespace</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/realtime/src/socketio.ts#L39) <code v-pre>packages/realtime/src/socketio.ts</code>

```ts
export interface SocketIoNamespace {
    readonly name: string;
    to(room: string): SocketIoNamespace;
    emit(event: string, ...args: unknown[]): void;
    sockets: Map<string, SocketIoSocket>;
}
```

#### <code v-pre>SocketIoSocket</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/realtime/src/socketio.ts#L24) <code v-pre>packages/realtime/src/socketio.ts</code>

Socket.io mock。 SDK 呼出形式 (real `socket.io-client`) は以下 ... ```ts const socket = io('http://localhost:3000/chat'); // namespace = '/chat' socket.on('connect', () =&gt; {...}); socket.emit('message', payload); socket.on('message', (data) =&gt; {...}); // server side: io.of('/chat').to('room-1').emit('message', ...) ``` 本 mock は namespace + room の 2 階層 pub/sub を engine channel に normalize、 `join(room)` / `leave(room)` / `emit(event, data)` / `on(event, handler)` を 提供する。 reconnect + pending event replay + backpressure sim も内蔵。 mock channel 名 = `&lt;namespace&gt;|&lt;room&gt;` (namespace 未指定は `/`)。

```ts
export interface SocketIoSocket {
    readonly id: string;
    readonly namespace: string;
    connected: boolean;
    on(event: string, handler: (...args: unknown[]) => void): SocketIoSocket;
    off(event: string, handler?: (...args: unknown[]) => void): SocketIoSocket;
    emit(event: string, ...args: unknown[]): SocketIoSocket;
    join(room: string): Promise<void>;
    leave(room: string): Promise<void>;
    disconnect(): SocketIoSocket;
    connect(): SocketIoSocket;
    /** 現在 join 中の room 集合。 */
    rooms(): Set<string>;
}
```
