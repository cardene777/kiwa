# @kiwa-lab/graphql

GraphQL server / client mock harness for kiwa — Apollo Server / GraphQL Yoga / urql / Relay を統一 interface で invoke する in-process mock。

## API

- `createGraphQLServer(schema, resolvers, options?)` = server mock (executeQuery / listCalls)
- `executeQuery(server, query, variables?, context?)` = server 経由の GraphQL query / mutation 実行
- `createGraphQLClient(options)` = client mock (query / mutate / subscribe / listCalls)
- `subscribeSubscription(server, query, variables?)` = subscription mock (async iterator + WebSocket 相当の event emit)
- `parseGraphQLOperation(query)` = minimal parser (operation type + name + selection set + arguments)
