# MCP リファレンス

## サーバーとクライアント

| API | 説明 |
| --- | --- |
| `new McpServer(config)` | MCP サーバーを作ります |
| `McpServer.register(tool, handler)` | ツールとその handler を登録します |
| `McpClient` | initialize、tools list、tools call を行うクライアントです |
| `connectClientToServer(server, config)` | インメモリ転送へ接続し初期化済みの client を返します |
| `InMemoryTransport` | client と server を接続する転送です |
| `MCP_PROTOCOL_VERSION` | 実装する MCP protocol version です |

## ツール

| API | 説明 |
| --- | --- |
| `ToolRegistry` | 登録済みツールの管理と呼び出しを行います |
| `validateSchema(schema, input)` | object、string、number、boolean の入力スキーマを検証します |
| `textContent(text)` | text 型の `ToolCallContent` を作ります |
| `registerAllFixtureTools(server)` | echo、calc、weather、search、db query を登録します |
| `registerEcho` など | 個別の fixture ツールを登録します |

McpRpcError はclientが受け取るJSON RPC errorです。code、message、dataを保持します。error responseのIDがrequest IDと一致しない場合もinternal errorとしてthrowします。エラーコードは JsonRpcErrorCode で参照できます。

## 実行境界

InMemoryTransport はnotificationに対するserverのnull responseを空のsuccess responseへ変換します。notificationの結果はclient側で破棄されます。任意の McpTransport を注入できるため、別transportのresponse IDやerror処理をtestできますが、network transportは提供しません。

fixture toolはtest専用です。weatherは固定都市、searchは小さなword-overlap corpus、db-queryはmock rowsに対するSELECT判定だけを行います。実databaseや検索indexを操作しません。

<!-- kiwa-public-api:start -->
## エラー診断

次の一覧は、公開 entry point から到達する実装が明示的に送出する Error と TypeError です。template literal の値は実行時の入力で置き換わります。

| 送出する message | 発生箇所 |
| --- | --- |
| <code v-pre>mock db supports SELECT only, got: $&#123;sql.slice(0, 20)&#125;...</code> | [packages/mcp/src/fixture.ts](https://github.com/cardene777/kiwa/blob/main/packages/mcp/src/fixture.ts#L221) |
| <code v-pre>echo: message must be a string</code> | [packages/mcp/src/fixture.ts](https://github.com/cardene777/kiwa/blob/main/packages/mcp/src/fixture.ts#L40) |
| <code v-pre>division by zero</code> | [packages/mcp/src/fixture.ts](https://github.com/cardene777/kiwa/blob/main/packages/mcp/src/fixture.ts#L83) |
| <code v-pre>unknown op: $&#123;String(op)&#125;</code> | [packages/mcp/src/fixture.ts](https://github.com/cardene777/kiwa/blob/main/packages/mcp/src/fixture.ts#L88) |
| <code v-pre>tool.name must be a non-empty string</code> | [packages/mcp/src/tools.ts](https://github.com/cardene777/kiwa/blob/main/packages/mcp/src/tools.ts#L30) |

## API 契約

[公開 entry point](https://github.com/cardene777/kiwa/blob/main/packages/mcp/src/index.ts) から同期しています。宣言元ごとにページを分けています。

| 宣言元 | 値 | 型 |
| --- | --- | --- |
| [client.ts](./api/client) | 4 | 1 |
| [fixture.ts](./api/fixture) | 16 | 0 |
| [server.ts](./api/server) | 2 | 1 |
| [tools.ts](./api/tools) | 3 | 1 |
| [types.ts](./api/types) | 1 | 16 |

<!-- kiwa-public-api:end -->
