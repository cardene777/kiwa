# @kiwa-lab/websocket API reference

## Overview

`@kiwa-lab/websocket` は ws / uWebSockets / Socket.IO / Colyseus 4 provider を統一 interface で mock する raw WebSocket server + client test infra。 real network / socket 不要で text / binary frame + broadcast 経路を in-process 叩ける (既存 `@kiwa-lab/realtime` は managed service 中心、 本 lib は raw WS プロトコル層に focus)。

## Supported providers

| provider | scope | binary support | broadcast |
|---|---|---|---|
| ws | server + client | ArrayBuffer | manual |
| uWebSockets | server (edge) | ArrayBuffer | publish/subscribe |
| socket.io | server + client (over WS) | binary event | rooms |
| colyseus | multiplayer state sync | schema-based | rooms |

## Main API

### `createWSServer(options: WSServerOptions): WSServer`

provider 別 mock server、 `{ port?, path?, provider }` + `on('connection'|'message'|'close')` handler。

### `connectClient(server, options?): WSClient`

client を server に接続、 `.send(data)` / `.close()` / `.on('message'|'close')` を提供。 in-process pair。

### `sendMessage(target: WSClient | WSServer, payload: WSPayload): void`

text / binary の message 送信、 payload = string | ArrayBuffer | Uint8Array。

### `broadcastMessage(server, payload, filter?: WSBroadcastFilter): number`

connected client 全員 or filter 条件に match する client にのみ送信、 送信数を返す。

### `captureBinaryFrame(rawFrame): WSBinaryFrame` / `encodeBinaryFrame(opcode, payload): Uint8Array`

WebSocket protocol binary frame の decode / encode、 `{ opcode, fin, masked, payload }`。

## Types

- `WSProvider = 'ws' | 'uwebsockets' | 'socket.io' | 'colyseus'`
- `WSServerEvents` = `{ connection, message, close, error }`
- `WSMessageHandler` = `(client, payload) => void`
- `WSPayload = string | ArrayBuffer | Uint8Array`
- `WSOpcode = 'text' | 'binary' | 'ping' | 'pong' | 'close'`

## Usage examples

### Server + client message pair

```typescript
import { createWSServer, connectClient, sendMessage } from '@kiwa-lab/websocket';
import { describe, expect, it } from 'vitest';

describe('echo server', () => {
  it('client -> server -> client の echo が届く', async () => {
    const server = createWSServer({ provider: 'ws' });
    server.on('message', (client, payload) => sendMessage(client, `echo: ${payload}`));
    const client = connectClient(server);
    const received: string[] = [];
    client.on('message', (payload) => received.push(String(payload)));
    sendMessage(client, 'hello');
    await new Promise((r) => setTimeout(r, 10));
    expect(received).toEqual(['echo: hello']);
  });
});
```

### Broadcast

```typescript
import { createWSServer, connectClient, broadcastMessage } from '@kiwa-lab/websocket';

const server = createWSServer({ provider: 'socket.io' });
const c1 = connectClient(server, { roomId: 'lobby' });
const c2 = connectClient(server, { roomId: 'lobby' });
const c3 = connectClient(server, { roomId: 'game' });
const sent = broadcastMessage(server, '{"type":"new-player"}', {
  filter: (c) => c.roomId === 'lobby',
});
expect(sent).toBe(2);
```

## Related skills

- [`/kiwa-websocket`](../skills/kiwa-websocket) — raw WebSocket test 生成 skill
- [`/kiwa-realtime`](../skills/kiwa-realtime) — managed realtime (Supabase / Ably / Pusher) test (related)
