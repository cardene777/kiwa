---
name: kiwa-grpc
description: |
  @kiwa-lab/grpc (@grpc/grpc-js / nice-grpc / twirp / ConnectRPC 統一 mock harness) を使った gRPC service test 生成 skill。
  `createGrpcServer` で provider mock を立て、 `defineService` で unary / server-stream / client-stream / bidi を定義、 `invokeUnary` / `invokeServerStream` / `invokeBidi` で RPC call を in-process で叩ける。 real HTTP/2 socket 不要。
user_invocable: true
context: conversation
agent: general-purpose
allowed-tools: Bash, Read, Glob, Grep, Write, Edit
---

# /kiwa-grpc — gRPC service test 生成

`@kiwa-lab/grpc` の 4 provider (@grpc/grpc-js / nice-grpc / twirp / ConnectRPC) 統一 mock を使った gRPC test を Vitest 形式で生成する。

## 目的

gRPC service を real HTTP/2 socket なしで contract test する。 provider 別 API (grpc-js callback / nice-grpc async / twirp JSON / ConnectRPC unary+stream) を吸収した抽象で test 化する。

## 前提

- `pnpm add -D @kiwa-lab/grpc` install 済
- Vitest 環境
- 対象 module に gRPC service 定義 (unary / streaming) が存在

## オプション

- `--module {name}` — test 対象 module
- `--provider {grpc-js|nice-grpc|twirp|connect}` — 主要 provider
- `--rpc-type {unary|server-stream|client-stream|bidi}` — 主要 RPC 型
- `--output {path}` — 生成 test path

## 実行フロー

### Step 1: defineService + invokeUnary workflow test 生成

`createGrpcServer({ provider })` で server、 `defineService('UserService', { GetUser: { type: 'unary', handler } })` で unary 定義、 `invokeUnary(server, 'UserService/GetUser', { id: 1 })` で 返却 assert。 4 provider を it.each で回す。

### Step 2: server-stream + client-stream test 生成

`invokeServerStream(server, 'ListUsers', { limit: 10 })` で server push chunks を iterator で受信、 client-stream (bulk upload) の各 msg dispatch + final response verify。

### Step 3: bidi + metadata + error test 生成

`invokeBidi(server, 'Chat', requests, { authorization: 'Bearer x' })` で bidi streaming + metadata 伝搬、 UNAUTHENTICATED / DEADLINE_EXCEEDED / CANCELLED の gRPC status code 別 failure path 網羅。

## 使用例

```bash
/kiwa-grpc --module user-service --rpc-type unary --output tests/integration/user.grpc.test.ts
/kiwa-grpc --module chat --rpc-type bidi --provider connect
```
