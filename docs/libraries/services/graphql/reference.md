# @kiwa-lab/graphql リファレンス

## server

`createGraphQLServer(schema, resolvers, options)` は provider、schema、resolver、call log を持つ server を返します。provider の既定値は `apollo`、時刻の既定値はゼロです。

`executeQuery(query, variables, context)` は query または mutation を実行します。各 selection の resolver は `args` と `context` を受け取ります。結果には data、必要なら errors、extensions を含められます。未登録の resolver と resolver の例外は errors になり、実行できた field の data は残ります。

subscription document を `executeQuery` へ渡すと error を返します。subscription は `subscribeSubscription` を使います。

## client と subscription

`createGraphQLClient({ server, defaultContext })` は `query` と `mutate` を提供し、client call を別に記録します。`query` と `mutate` は server の `executeQuery` を呼びます。

`subscribeSubscription(server, query, variables, context)` は `SubscriptionHandle` を返します。events は AsyncIterable、`close` は以降の event を停止します。非 subscription operation、Subscription resolver の欠落、field の欠落は throw します。

## parser

`parseGraphQLOperation` は operation type、任意の operation name、variable definition 名、selection、scalar arguments を取り出します。対応しない GraphQL syntax は本番 parser の代わりに使わないでください。

## 補助 API

retry、batch、idempotency、observability、circuit breaker の API は server の execution を包む helper です。cache と hook registry はテストごとに作成して状態を共有しないでください。

<!-- kiwa-public-api:start -->
## エラー診断

次の一覧は、公開 entry point から到達する実装が明示的に送出する Error と TypeError です。template literal の値は実行時の入力で置き換わります。

| 送出する message | 発生箇所 |
| --- | --- |
| <code v-pre>expected &#123;</code> | [packages/graphql/src/parser.ts](https://github.com/cardene777/kiwa/blob/main/packages/graphql/src/parser.ts#L41) |
| <code v-pre>unterminated selection set</code> | [packages/graphql/src/parser.ts](https://github.com/cardene777/kiwa/blob/main/packages/graphql/src/parser.ts#L50) |
| <code v-pre>unexpected token at position 0 near "$&#123;source.slice(0, 20)&#125;"</code> | [packages/graphql/src/parser.ts](https://github.com/cardene777/kiwa/blob/main/packages/graphql/src/parser.ts#L56) |
| <code v-pre>unterminated arguments</code> | [packages/graphql/src/parser.ts](https://github.com/cardene777/kiwa/blob/main/packages/graphql/src/parser.ts#L66) |
| <code v-pre>subscribeSubscription requires a subscription operation, got $&#123;parsed.type&#125;</code> | [packages/graphql/src/subscription.ts](https://github.com/cardene777/kiwa/blob/main/packages/graphql/src/subscription.ts#L26) |
| <code v-pre>no Subscription resolvers registered</code> | [packages/graphql/src/subscription.ts](https://github.com/cardene777/kiwa/blob/main/packages/graphql/src/subscription.ts#L30) |
| <code v-pre>subscription requires at least 1 selection</code> | [packages/graphql/src/subscription.ts](https://github.com/cardene777/kiwa/blob/main/packages/graphql/src/subscription.ts#L33) |
| <code v-pre>no subscription resolver for $&#123;rootSel.name&#125;</code> | [packages/graphql/src/subscription.ts](https://github.com/cardene777/kiwa/blob/main/packages/graphql/src/subscription.ts#L35) |

## API 契約

[公開 entry point](https://github.com/cardene777/kiwa/blob/main/packages/graphql/src/index.ts) から同期しています。宣言元ごとにページを分けています。

| 宣言元 | 値 | 型 |
| --- | --- | --- |
| [client.ts](./api/client) | 1 | 3 |
| [enhancements.ts](./api/enhancements) | 7 | 10 |
| [parser.ts](./api/parser) | 1 | 3 |
| [server.ts](./api/server) | 2 | 9 |
| [subscription.ts](./api/subscription) | 1 | 2 |

<!-- kiwa-public-api:end -->
