# @kiwa-lab/websocket

Raw WebSocket server + client mock harness for kiwa — ws / uWebSockets / Socket.IO / Colyseus を統一 interface で in-process から叩ける test infra。

## Installation

```bash
pnpm add -D @kiwa-lab/websocket
# or
npm install -D @kiwa-lab/websocket
# or
yarn add -D @kiwa-lab/websocket
```

## Supported providers

| Provider | Status | Protocol focus |
|---|---|---|
| ws | ✅ Ready | RFC6455 baseline |
| uWebSockets | ✅ Ready | high-throughput |
| Socket.IO | ✅ Ready | rooms + ack |
| Colyseus | ✅ Ready | room state sync |

## Quick start

```ts
import { describe, expect, it } from 'vitest';
import {
  createWSServer,
  connectClient,
  sendMessage,
  broadcastMessage,
} from '@kiwa-lab/websocket';

describe('chat room', () => {
  it('broadcast で全 client が受信', async () => {
    const server = createWSServer({ provider: 'ws' });
    const alice = connectClient(server, {});
    const bob = connectClient(server, {});
    broadcastMessage(server, { text: 'hi all' });
    expect(alice.received.length).toBe(1);
    expect(bob.received.length).toBe(1);
    sendMessage(server, bob.id, { text: 'private' });
    expect(bob.received.length).toBe(2);
  });
});
```

## API reference

- `createWSServer({ provider: WSProvider }): WSServer` — provider 別 mock server
- `connectClient(server, options: WSClientOptions): WSClient` — client handle + message log
- `sendMessage(server, clientId: string, payload: WSPayload): void` — 個別送信
- `broadcastMessage(server, payload, filter?: WSBroadcastFilter): void` — 全 client 送信
- `captureBinaryFrame(client, opcode: WSOpcode): WSBinaryFrame` — binary frame 抽出
- `encodeBinaryFrame(payload: Uint8Array, opcode: WSOpcode): WSBinaryFrame` — frame encode

## Test integration

vitest + `/kiwa-websocket` skill で real network / socket 起動なしで pub/sub + reconnection を verify。

<!-- kiwa-docs:start -->
## Documentation

公開ドキュメントを正本として管理しています。

- [概要](https://cardene777.github.io/kiwa/libraries/services/websocket/)
- [はじめる](https://cardene777.github.io/kiwa/libraries/services/websocket/quickstart)
- [使い方](https://cardene777.github.io/kiwa/libraries/services/websocket/how-to)
- [リファレンス](https://cardene777.github.io/kiwa/libraries/services/websocket/reference)

編集元は [docs/libraries/services/websocket](../../docs/libraries/services/websocket/) です。
<!-- kiwa-docs:end -->

## License

UNLICENSED — see [github.com/cardene777/kiwa](https://github.com/cardene777/kiwa).
