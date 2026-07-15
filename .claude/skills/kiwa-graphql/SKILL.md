---
name: kiwa-graphql
description: |
  @kiwa-lab/graphql (Apollo Server / GraphQL Yoga / urql / Relay 統一 mock harness) を使った GraphQL server + client + subscription の test 生成 skill。
  `createGraphQLServer` + `executeQuery` で server 側の query / mutation dispatch、 `createGraphQLClient` で client 経路、 `subscribeSubscription` で WebSocket subscription を in-process で叩ける。
user_invocable: true
context: conversation
agent: general-purpose
allowed-tools: Bash, Read, Glob, Grep, Write, Edit
---

# /kiwa-graphql — GraphQL server / client / subscription test 生成

`@kiwa-lab/graphql` の 4 provider (Apollo / Yoga / urql / Relay) 統一 mock を使った GraphQL test を Vitest 形式で生成する。 real HTTP / WebSocket 不要で query / mutation / subscription の test を書く。

## 目的

GraphQL API を持つ app で「schema + resolver → executeQuery → response 検証」 の server test と、 「client 経由の query / mutation / subscription」 の client test を書く。 subscription は async iterator で emit を捕捉、 subscription event 数と payload を assert 可能。

## 前提

- `pnpm add -D @kiwa-lab/graphql` install 済
- Vitest 環境
- 対象 module に GraphQL 経路 (Apollo endpoint / Yoga fetch / urql hook / Relay fragment 等) が存在

## オプション

- `--module {name}` — test 対象 module (user-query / post-mutation / notification-sub 等)
- `--target {server|client|subscription}` — 対象 layer (省略時 = 3 layer 全対応)
- `--output {path}` — 生成 test の path

## 実行フロー

### Step 1: server executeQuery test 生成

`createGraphQLServer(schema, resolvers)` で server 立て、 `executeQuery(server, 'query { user(id: 1) { name } }')` の return `data` / `errors` を assert。 variables + context (auth token 等) 経由の resolver 挙動も cover。

### Step 2: client query / mutation test 生成

`createGraphQLClient({ server })` で client、 `client.query(...)` + `client.mutate(...)` で call、 `client.listCalls()` で送信履歴を verify。 error propagation (server errors → client) も追加。

### Step 3: subscription test 生成

`subscribeSubscription(server, 'subscription { messageAdded { text } }')` で async iterator を取得、 `for await` で 3 event を捕捉、 payload shape を assert。 unsubscribe path も cover。

## 使用例

```bash
/kiwa-graphql --module user-query --target server
/kiwa-graphql --module notification-sub --target subscription
```
