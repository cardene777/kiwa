# @kiwa-lab/graphql

GraphQL server + client + subscription mock harness for kiwa — Apollo Server / GraphQL Yoga / urql / Relay の 4 pattern を in-process で叩く test infra。

## Installation

```bash
pnpm add -D @kiwa-lab/graphql
# or
npm install -D @kiwa-lab/graphql
# or
yarn add -D @kiwa-lab/graphql
```

## Supported providers

| Provider | Status | Ops | Subscription |
|---|---|---|---|
| Apollo Server | ✅ | query / mutation | ✅ |
| GraphQL Yoga | ✅ | query / mutation | ✅ |
| urql client | ✅ | query / mutation | ✅ |
| Relay client | ✅ | query / mutation | ✅ |

## Quick start

```ts
import { createGraphQLServer, executeQuery, createGraphQLClient } from '@kiwa-lab/graphql';

const server = createGraphQLServer(
  { typeDefs: 'type Query { hello: String }' },
  { Query: { hello: () => 'world' } },
  { provider: 'apollo' },
);

const result = await server.executeQuery('{ hello }');
// result = { data: { hello: 'world' } }

const client = createGraphQLClient(server);
const r2 = await client.request('{ hello }');
```

## API reference

- `createGraphQLServer(schema, resolvers, options?): GraphQLServer` — schema + resolvers で mock server 生成
- `GraphQLServer.executeQuery(query, variables?, context?): Promise<GraphQLExecutionResult>` — query / mutation dispatch
- `GraphQLServer.listCalls(): GraphQLServerCall[]` — 全 call log 取得
- `executeQuery(server, query, variables?, context?)` — helper 経由 execution
- `createGraphQLClient(server, options?): GraphQLClient` — typed client proxy 生成
- `subscribeSubscription(server, query, variables?): SubscriptionHandle` — WebSocket subscription mock
- `parseGraphQLOperation(query): ParsedOperation` — minimal GraphQL parser

## Test integration

```ts
import { describe, expect, it } from 'vitest';
import { createGraphQLServer } from '@kiwa-lab/graphql';

describe('user query', () => {
  it('name field を resolve', async () => {
    const s = createGraphQLServer(
      { typeDefs: 'type Query { name: String }' },
      { Query: { name: () => 'kiwa' } },
    );
    const r = await s.executeQuery('{ name }');
    expect(r.data).toEqual({ name: 'kiwa' });
  });
});
```

`/kiwa-graphql` skill を起動すると query / mutation / subscription 3 経路の test を生成できる。

<!-- kiwa-docs:start -->
## Documentation

公開ドキュメントを正本として管理しています。

- [概要](https://cardene777.github.io/kiwa/libraries/services/graphql/)
- [はじめる](https://cardene777.github.io/kiwa/libraries/services/graphql/quickstart)
- [使い方](https://cardene777.github.io/kiwa/libraries/services/graphql/how-to)
- [リファレンス](https://cardene777.github.io/kiwa/libraries/services/graphql/reference)

編集元は [docs/libraries/services/graphql](../../docs/libraries/services/graphql/) です。
<!-- kiwa-docs:end -->

## License

UNLICENSED — see [cardene777/kiwa](https://github.com/cardene777/kiwa) for repo terms.
