---
name: kiwa-graphql
description: |
  @kiwa-lab/graphql を使って resolver、query、mutation、subscription の application-level test を作る skill。
  data、partial error、variables、context、有限 event sequence を process 内で確認する。
user_invocable: true
context: conversation
agent: general-purpose
allowed-tools: Bash, Read, Glob, Grep, Write, Edit
---

# /kiwa-graphql GraphQL test を作る

`@kiwa-lab/graphql` は HTTP server、WebSocket、schema validation を起動しない。resolver の arguments と context、結果の data と errors、client call、subscription payload を契約として test する harness である。

## 入力と出力

`--module` は対象名、`--target` は `server`、`client`、`subscription` のいずれか、`--output` は生成する test file の path を指定する。出力先を省略したときは `tests/{module}.graphql.test.ts` を使う。対象 resolver と採用中の schema を読み、実 application の field 名と arguments を使う。

## 生成する test

server test は `createGraphQLServer` を作り、`server.executeQuery` で query または mutation を呼ぶ。resolver は arguments と context の二引数を受ける。variables、operation name、partial data、errors の message と path を assertion する。`typeDefs` は parser と型検査を行わないため、field と resolver の対応は source code と照合する。

client test は `createGraphQLClient({ server })` を使い、`query` と `mutate` の結果と `listCalls()` を確認する。subscription test は `subscribeSubscription` を使い、有限の `events` を読み切る。`close()` は producer や network connection を cancel しない。

## 実行と確認

生成後は output file を読み、成功 data だけでなく error result と context の扱いが application の authorization 方針と一致することを確認する。次に output だけを実行する。

```bash
pnpm exec vitest run {output}
```

WebSocket transport、schema validation、fragment、directive、union、Apollo plugin、実認可 middleware は GraphQL server を起動する integration test で確認する。

## 実行例

```text
/kiwa:kiwa-graphql --module user-query --target server --output tests/user-query.graphql.test.ts
/kiwa:kiwa-graphql --module notifications --target subscription --output tests/notifications.graphql.test.ts
```
