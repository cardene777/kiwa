# @kiwa-lab/graphql

`@kiwa-lab/graphql` は、schema metadata と resolver の組み合わせをプロセス内で実行し、query、mutation、subscription の結果を test する harness です。Apollo Server、GraphQL Yoga、urql、Relay の provider 名を扱いますが、HTTP server や WebSocket transport を起動する library ではありません。`typeDefs` は server に保持されますが、この package は schema validation や型検査を行いません。

![スキーマとresolverからqueryを実行してデータまたはエラーを返す流れ](/images/kiwa-docs/services/graphql-overview.png)

## resolver の契約を data と errors で確認する

server は operation、variables、context を resolver へ渡し、返された data と resolver error を別々に返します。resolver は `args` と `context` の二引数を受け取ります。field の一部が失敗しても partial data が残るため、成功値だけでなく errors の message と path を assertion に含めます。call log を見ると、operation 名、variables、成功か失敗かも確認できます。

subscription は resolver が返す `AsyncIterable` を順に読みます。実際の WebSocket 接続、schema validation、fragment、directive、union、Apollo plugin、認可 middleware は対象外です。これらは採用した GraphQL server を起動する integration test で確認してください。

## 使う場面

resolver が受け取る引数と context、mutation 後の戻り値、partial error、subscription event をネットワークなしで固定したい場合に使います。RPC 形式の API には [gRPC](../grpc/) または [tRPC](../trpc/) を使います。

## 読み進める

[Quickstart](./quickstart) で query と resolver error を実行します。[使い方](./how-to) では variables、partial data、subscription を扱います。公開 API は [リファレンス](./reference) にあります。
