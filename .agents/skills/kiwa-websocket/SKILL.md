---
name: kiwa-websocket
description: |
  @kiwa-lab/websocket を使って WebSocket message routing、room、connection state の test を作る skill。
  private message、broadcast、client send、disconnect、binary frame を process 内で確認する。
user_invocable: true
context: conversation
agent: general-purpose
allowed-tools: Bash, Read, Glob, Grep, Write, Edit
---

# /kiwa-websocket WebSocket test を作る

`@kiwa-lab/websocket` は network socket、provider protocol、browser を起動しない。application が接続 client、message routing、room membership、disconnect をどう扱うかを test する harness である。

## 入力と出力

`--module` は対象名、`--provider` は `ws`、`uwebsockets`、`socketio`、`colyseus` のいずれか、`--output` は test file の path を指定する。出力先を省略したときは `tests/{module}.websocket.test.ts` を使う。対象となる message type、room 名、disconnect 後の cleanup 方針を application source から確認する。

## 生成する test

server へは `createWSServer`、client は `connectClient` で作る。server からの個別配送は `sendMessage`、全体配送は `broadcastMessage` または `server.broadcast` を使う。client の `send` は server の `onMessage` handler を呼ぶが、他 client へ自動配送しない。

room は `createRoomRegistry` で作り、`join`、`leave`、`broadcastToRoom`、`presenceOf` を確認する。room membership は server の client list と独立している。client を server から外すときは `server.disconnect(id)` を使う。`client.close()` は list から除去しない。

## 実行と確認

生成した output を読み、sender、recipient、room membership、closed client の扱いが application の routing 方針と一致することを確認する。次に output だけを実行する。

```bash
pnpm exec vitest run {output}
```

handshake、TLS、fragmentation、backpressure、browser reconnect、Socket.IO acknowledgement は実 runtime と browser を使う integration test で確認する。

## 実行例

```text
/kiwa:kiwa-websocket --module chat --provider socketio --output tests/chat.websocket.test.ts
/kiwa:kiwa-websocket --module game-room --provider colyseus --output tests/game-room.websocket.test.ts
```
