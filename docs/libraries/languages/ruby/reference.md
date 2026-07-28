# ruby リファレンス

## 公開 API

`createRubyAppEnv` は framework、route、session、cookie、ActiveRecord操作記録を持つ環境を作ります。`dispatchRailsRequest` は Rails風のbefore actionとactionを、`dispatchGenericRequest` は Sinatra、Roda、Hanami風のrouteを実行します。`renderERB` と `captureActiveRecord` は入力契約と操作記録を扱います。

## 設定

`framework` は `rails`、`sinatra`、`roda`、`hanami` を選べ、未指定時は `rails` です。`initialSession` と `initialCookies` は環境ごとに浅く複製されます。

generic route は環境作成時の `routes` または `env.addRoute` で登録します。methodは `GET`、`POST`、`PUT`、`PATCH`、`DELETE` だけです。pathは完全一致、または同数のsegmentからなる `:name` のワイルドカードで一致します。値の抽出やquery string解析は行いません。

## 結果の分岐

controller dispatch はresponse、`beforeActionCount`、空の`renderCalls`を返します。before action は登録順にawaitされ、いずれかがthrowするとactionは呼ばれず、その例外が伝わります。actionが返すcookieとsessionはresponseの値であり、環境へ自動反映されません。

generic dispatch は一致時に `{ matched: true }`、不一致時に `{ matched: false }` と404responseを返します。handlerの例外は捕捉しません。ActiveRecord capture はrecord済みqueryの順序と集計をsnapshotとして返すため、statusが成功でも余分な操作を検出できます。

## 表示と補助関数

`renderERB` は `<%= variable %>` のみを展開し、`html`、`variables`、`missing`を返します。未指定localは空文字になり、例外にはなりません。`withRetry`、`withTimeout`、`withRateLimit`、`withCircuitBreaker`、`withObservability`、`withIdempotencyKey` は環境と独立した非同期wrapperです。timeoutは元の処理をcancelせず、idempotencyは成功値のみをkeyごとにメモリへ保持します。

## 後始末と制約

環境はroute、session、cookie、操作記録を保持します。テストごとに作り直すか、`clear`で初期化してください。Ruby VM、Railsのcallback実装、実database、実template engineは起動しません。

<!-- kiwa-public-api:start -->
## エラー診断

次の一覧は、公開 entry point から到達する実装が明示的に送出する Error と TypeError です。template literal の値は実行時の入力で置き換わります。

| 送出する message | 発生箇所 |
| --- | --- |
| <code v-pre>rate limit $&#123;options.maxRequests&#125;/$&#123;options.windowMs&#125;ms exceeded</code> | [packages/ruby/src/resilience.ts](https://github.com/cardene777/kiwa/blob/main/packages/ruby/src/resilience.ts#L57) |
| <code v-pre>circuit breaker open</code> | [packages/ruby/src/resilience.ts](https://github.com/cardene777/kiwa/blob/main/packages/ruby/src/resilience.ts#L72) |

## API 契約

[公開 entry point](https://github.com/cardene777/kiwa/blob/main/packages/ruby/src/index.ts) から同期しています。宣言元ごとにページを分けています。

| 宣言元 | 値 | 型 |
| --- | --- | --- |
| [active-record.ts](./api/active-record) | 1 | 3 |
| [env.ts](./api/env) | 1 | 7 |
| [erb.ts](./api/erb) | 1 | 2 |
| [generic.ts](./api/generic) | 1 | 1 |
| [rails.ts](./api/rails) | 1 | 4 |
| [resilience.ts](./api/resilience) | 7 | 7 |

<!-- kiwa-public-api:end -->
