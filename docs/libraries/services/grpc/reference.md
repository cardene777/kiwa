# @kiwa-lab/grpc リファレンス

in-process service registry、RPC invocation、status、metadata、deadline、interceptor、cancel token の公開 API です。

## service と method

`createGrpcServer({ provider })` は `provider` と service Map を持つ server を作ります。provider の既定値は `grpc-js` です。provider は `grpc-js`、`nice-grpc`、`twirp`、`connect` を受け取りますが、invocation の実行方法を切り替えません。

`defineService(name, methods)` は method Map を作ります。同じ service name を `addService` すると既存 service を上書きします。同じ method name が method array に複数ある場合は後ろの definition が残ります。

| method type | handler input | invoke API | result |
| --- | --- | --- | --- |
| `unary` | request、任意 metadata | `invokeUnary` | `UnaryResult` |
| `server-stream` | request、任意 metadata | `invokeServerStream` | `StreamResult` |
| `client-stream` | request の AsyncIterable、任意 metadata | `invokeClientStream` | `UnaryResult` |
| `bidi` | request の AsyncIterable、任意 metadata | `invokeBidi` | `StreamResult` |

client stream と bidi の public invoke API は request array を受け取ります。stream result の `responses` は handler 完了までに yield した全 value です。

## result と status

`UnaryResult` は `ok`、任意の `response`、`status`、`trailingMetadata` を持ちます。`StreamResult` は `responses` array を持ちます。成功 status は `{ code: 0, message: "" }` です。

method 未登録または type 不一致では code `12`、message `method not found: service/method` の結果を返します。handler error は numeric code を持てばその値、なければ code `2` と error message に変換されます。trailing metadata は現在常に空配列です。

`STATUS_CODES` は 0 から 16 の gRPC status code mapping です。`encodeStatus` は `grpc-status` と URL encode した `grpc-message` を返し、`decodeStatus` はそれを戻します。

## metadata

`createMetadata(record)` は key を小文字化した entry array を返します。`mergeMetadata(a, b)` は key ごとに後ろの b を優先し、同じ key を一つにします。

## deadline と cancel

`createDeadlineContext(deadlineMs, now)` は start timestamp を保持します。`remainingDeadlineMs` は 0 未満にならず、`isDeadlineExceeded` は残り時間が 0 の場合に true です。これらは純粋な計算で、RPC invocation を自動 cancel しません。

`createCancelToken` は `isCanceled`、`cancel`、`reason`、`onCancel` を返します。cancel は最初の一度だけ handler を呼び、cancel 後に登録した handler は直ちに呼ばれます。invoke helper とは自動接続されません。

## interceptor

`composeInterceptors(interceptors)` は `(context, final)` を受け取る chain を作ります。interceptor が同じ `next()` を二回呼ぶと error になります。RPC invocation はこの chain を自動実行しないため、interceptor を使う test では戻り値の function を明示的に呼びます。

<!-- kiwa-public-api:start -->
## エラー診断

次の一覧は、公開 entry point から到達する実装が明示的に送出する Error と TypeError です。template literal の値は実行時の入力で置き換わります。

| 送出する message | 発生箇所 |
| --- | --- |
| <code v-pre>next() called multiple times in same interceptor</code> | [packages/grpc/src/interceptor.ts](https://github.com/cardene777/kiwa/blob/main/packages/grpc/src/interceptor.ts#L27) |

## API 契約

[公開 entry point](https://github.com/cardene777/kiwa/blob/main/packages/grpc/src/index.ts) から同期しています。宣言元ごとにページを分けています。

| 宣言元 | 値 | 型 |
| --- | --- | --- |
| [cancel.ts](./api/cancel) | 1 | 1 |
| [deadline.ts](./api/deadline) | 3 | 1 |
| [interceptor.ts](./api/interceptor) | 1 | 2 |
| [invoke.ts](./api/invoke) | 4 | 6 |
| [metadata.ts](./api/metadata) | 2 | 1 |
| [server.ts](./api/server) | 2 | 6 |
| [status.ts](./api/status) | 3 | 2 |

<!-- kiwa-public-api:end -->
