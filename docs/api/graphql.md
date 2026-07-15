# @kiwa-lab/graphql API reference

## Overview

`@kiwa-lab/graphql` は Apollo Server / GraphQL Yoga / urql / Relay 4 provider を統一 interface で mock する GraphQL server + client + subscription test infra。 schema + resolvers + subscription を real HTTP/2 不要で in-process 叩ける。

## Supported providers

| provider | role | schema form | subscription transport |
|---|---|---|---|
| apollo | server | SDL / typeDefs | graphql-ws |
| yoga | server | SDL / typeDefs | SSE / graphql-ws |
| urql | client | typed query | ws / SSE |
| relay | client | compiled artifact | ws |

## Main API

### `createGraphQLServer(options): GraphQLServer`

`{ typeDefs, resolvers, provider }` を受け取り mock server を返す。 `.executeQuery(query, variables?)` で invoke。

### `executeQuery(server, query, variables?, context?): GraphQLExecutionResult`

query / mutation を execute、 `{ data?, errors?, extensions? }` を返す。 resolver 内で throw した Error は errors[] に normalized。

### `createGraphQLClient(server, options?): GraphQLClient`

server に紐付いた typed client、 `.query(op, variables)` / `.mutate(op, variables)` を提供。 network 経由せず in-process dispatch。

### `parseGraphQLOperation(source: string): ParsedOperation`

query string を AST parse、 `{ type, operationName?, fields }` を返す。 test で「query が特定 field を要求してるか」 を verify する。

### `subscribeSubscription(server, query, variables?): SubscriptionHandle`

subscription を open、 `.next(): Promise<SubscriptionEvent>` で event を pull、 `.close()` で断。 in-process event emit。

## Types

- `GraphQLProvider = 'apollo' | 'yoga' | 'urql' | 'relay'`
- `GraphQLResolvers` = `Record<string, Record<string, Resolver>>`
- `GraphQLExecutionResult` = `{ data?, errors?, extensions? }`
- `OperationType = 'query' | 'mutation' | 'subscription'`
- `SubscriptionEvent` = `{ done: boolean, value?: any, error?: Error }`

## Usage examples

### Query + mutation execute

```typescript
import { createGraphQLServer, executeQuery } from '@kiwa-lab/graphql';
import { describe, expect, it } from 'vitest';

describe('user resolver', () => {
  it('me query が current user を返す', async () => {
    const server = createGraphQLServer({
      provider: 'apollo',
      typeDefs: `type Query { me: User } type User { id: ID! name: String! }`,
      resolvers: { Query: { me: () => ({ id: '1', name: 'kiwa' }) } },
    });
    const result = await executeQuery(server, `query { me { id name } }`);
    expect(result.data.me).toEqual({ id: '1', name: 'kiwa' });
  });
});
```

### Subscription

```typescript
import { createGraphQLServer, subscribeSubscription } from '@kiwa-lab/graphql';

const server = createGraphQLServer({
  provider: 'yoga',
  typeDefs: `type Subscription { messageAdded: Message! } type Message { id: ID! body: String! }`,
  resolvers: {
    Subscription: {
      messageAdded: { subscribe: () => asyncIterableFrom([{ id: '1', body: 'hi' }]) },
    },
  },
});
const handle = subscribeSubscription(server, `subscription { messageAdded { id body } }`);
const first = await handle.next();
expect(first.value.data.messageAdded.body).toBe('hi');
```

## Related skills

- [`/kiwa-graphql`](../skills/kiwa-graphql) — GraphQL test 生成 skill
