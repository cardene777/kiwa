---
name: kiwa-grpc
description: |
  @kiwa-lab/grpc を使って unary、server stream、client stream、bidi RPC の application-level test を作る skill。
  request、metadata、response、status、interceptor を process 内で確認する。
user_invocable: true
context: conversation
agent: general-purpose
allowed-tools: Bash, Read, Glob, Grep, Write, Edit
---

# /kiwa-grpc gRPC test を作る

`@kiwa-lab/grpc` は HTTP2 server や protobuf codec を起動しない。application の RPC handler を service definition に登録し、入力、response、status の契約を Vitest で確認するための harness である。実 transport の互換性は別の integration test に残す。

## 入力と出力

`--module` は対象名、`--rpc-type` は `unary`、`server-stream`、`client-stream`、`bidi` のいずれか、`--provider` は `grpc-js`、`nice-grpc`、`twirp`、`connect` のいずれかを指定する。`--output` を省略したときは `tests/{module}.grpc.test.ts` を使う。provider は記録する contract の種類であり、provider SDK の server を起動する指定ではない。

## 生成する test

unary では `createGrpcServer`、`defineService`、`invokeUnary` を使い、status、response、metadata を確認する。metadata は `createMetadata` で作ると key が小文字になる。未登録 method と type の不一致は throw ではなく `UNIMPLEMENTED` status を返すため、失敗結果を assertion に含める。

server stream は有限の `AsyncIterable` を handler から返し、`invokeServerStream` の `responses` が順序どおりであることを確認する。client stream と bidi は request array を `invokeClientStream` または `invokeBidi` に渡す。infinite stream と socket backpressure はこの harness の対象外である。

認証や deadline は `composeInterceptors` と `createDeadlineContext` で application の guard を test する。deadline が実行を中止するわけではないため、進行中の処理を止める必要がある場合は `createCancelToken` を handler 側へ明示して渡す。

## 実行と確認

生成された output を読み、service 名、method 名、method type、metadata key が application の定義と一致することを確認する。作成した file だけを実行する。

```bash
pnpm exec vitest run {output}
```

## 実行例

```text
/kiwa:kiwa-grpc --module user-service --rpc-type unary --output tests/user-service.grpc.test.ts
/kiwa:kiwa-grpc --module activity-feed --rpc-type server-stream --provider connect --output tests/activity-feed.grpc.test.ts
```
