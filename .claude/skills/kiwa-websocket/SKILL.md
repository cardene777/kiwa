---
name: kiwa-websocket
description: |
  @kiwa-lab/websocket (ws / uWebSockets / Socket.IO / Colyseus 統一 mock harness) を使った raw WebSocket server + client test 生成 skill。
  `createWSServer` で provider mock server を立て、 `connectClient` で client handle 取得、 `sendMessage` (text/binary) / `broadcastMessage` / `captureBinaryFrame` で protocol 経路を in-process で叩ける。 real network / socket 不要。
user_invocable: true
context: conversation
agent: general-purpose
allowed-tools: Bash, Read, Glob, Grep, Write, Edit
---

# /kiwa-websocket — WebSocket server + client test 生成

`@kiwa-lab/websocket` の 4 provider (ws / uWebSockets / Socket.IO / Colyseus) 統一 mock を使った WS test を Vitest 形式で生成する。 realtime lib と別で raw WS focus。

## 目的

WebSocket 通信を real socket なしで contract test する。 provider 別 API (ws Node.js / uWebSockets C++ binding / Socket.IO namespace-room / Colyseus room state) を吸収した抽象で test 化する。

## 前提

- `pnpm add -D @kiwa-lab/websocket` install 済
- Vitest 環境
- 対象 module に WebSocket server / client 経路が存在

## オプション

- `--module {name}` — test 対象 module
- `--provider {ws|uws|socketio|colyseus}` — 主要 provider
- `--output {path}` — 生成 test path

## 実行フロー

### Step 1: server + client connect workflow test 生成

`createWSServer({ provider })` で server を立て、 `connectClient(server, { id: 'c1' })` で client handle 取得、 `sendMessage(client, 'hello')` で text frame 送信 → server 側 onMessage 発火 verify。

### Step 2: broadcast + room test 生成

`broadcastMessage(server, { event: 'update' })` で 全 client 配信、 room 別 filter (`{ room: 'lobby' }`) で room-scoped delivery の verify。 4 provider を it.each で回す。

### Step 3: binary frame + close test 生成

`captureBinaryFrame(frame)` で binary opcode / mask / payload 抽出 verify、 close event (client / server initiated) + reconnect の state transition 検証。

## 使用例

```bash
/kiwa-websocket --module chat --output tests/integration/chat.ws.test.ts
/kiwa-websocket --module game --provider colyseus
```
