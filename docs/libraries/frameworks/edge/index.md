# @kiwa-lab/edge

`@kiwa-lab/edge` は、Edge handler の入力、応答、非同期の副作用を Node.js 上で直接検証する test adapter です。handler には Request、環境 binding、ExecutionContext を渡し、返された Response、`waitUntil` に登録された promise、`passThroughOnException` の呼び出しを test から観察できます。実 workerd、Miniflare、Cloudflare Workers、Vercel Edge Runtime は起動しません。

![Edge handlerの入力と非同期処理を観測する流れ](/images/kiwa-docs/frameworks/edge-overview.png)

`invokeEdgeHandler` は handler を直接呼び、例外を helper 自体の reject ではなく status `500` の Response と `error` に変換します。handler が background work を `waitUntil` へ渡した場合、promise は記録されますが helper は完了を待ちません。test は `waitedPromises` を明示的に await して、その成功または失敗を assertion します。この設計により、レスポンスを返す処理と終了後の処理を同じ test 内で分けて確認できます。

`createKvNamespace` は handler の binding を渡すための in-memory KV です。また semantics API は Durable Object、WebSocket、cron、R2 multipart、D1 replica などの状態遷移を provider 非依存の state machine として表します。これらは Cloudflare 互換 runtime ではなく、アプリが lifecycle の順序や失敗を正しく扱うかを素早く固定するためのモデルです。

## 使う判断

Edge endpoint の response、redirect、例外処理、background task を unit または integration test として確認するなら、この package を使います。KV を読んで JSON response を返すような handler や、Durable Object が終了後に操作を拒否するようなアプリ側の分岐を、deployment を待たずに検証できます。

CPU limit、subrequest limit、実 geo 情報、runtime が追加する header、WebSocket 接続、KV の replication delay は provider ごとに異なります。semantics API の state transition が通っても、実 runtime の設定まで保証するものではありません。runtime 固有の確認は deployment target ごとの integration test を追加します。

## 読み進める

[Quickstart](./quickstart) は handler と `waitUntil` の最小 test を保存して実行します。[使い方](./how-to) は KV の error、Durable Object の lifecycle、実 runtime との分担を説明します。[リファレンス](./reference) は request options、KV mock、semantics API の契約を調べるためのページです。
