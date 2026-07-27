# Streaming

`@kiwa-lab/streaming` は、Kafka、Redpanda、NATS、JetStream を使うイベント処理の contract を、broker なしで test する in-memory adapter です。producer が topic へ書いた値を consumer group がどの partition と offset から読むか、handler が失敗したときにどこで処理を止めるかを、一つの Node.js process で確認できます。

![producerがtopicへ送信しconsumerが処理後にcommitまたはDLQへ進む流れ](/images/kiwa-docs/ai-realtime/streaming-overview.png)

## 何を検証する library か

Kafka mock では producer、consumer、admin が同じ in-memory state を共有します。key を持つ message は決定的な hash で partition を選び、key がない message は現在の総件数から順に割り当てられます。consumer は `run` を呼んだ時点で保持している message を処理し、成功すれば既定で次に読む offset を commit します。失敗した handler は `run` を reject し、その message の offset を進めません。

NATS mock は完全一致、1階層の `*`、末尾の `>` を使った subject matching を同期的に処理します。JetStream の stream と durable consumer、KV、Object Store も同じ mock に含まれます。Redpanda mock は Kafka mock に schema registry を加えたもので、schema の kind と必須 field の互換性を登録前に確認できます。DLQ helper は retry の上限に達した message を隔離するまでの試行回数を test します。

## 採用する判断

イベントを発行した後に、どの consumer group が何を読んだか、offset をいつ進めるか、失敗を retry と DLQ のどちらへ渡すかを unit test で固定したいときに使います。実 broker を立ち上げる前に、application のイベント payload と処理の境界を速く確認する用途に向いています。partition 数、key、group ID、手動 commit を expectation として明示できるため、単に handler を直接呼ぶ test より配信の前提を残せます。

ただし network 接続、Kafka protocol、SSL、SASL、broker election、consumer coordinator、NATS server、永続化、実 schema registry の完全な互換性判定は実行しません。`run` は背景で継続購読する client ではなく、現在の message を同期的に走査します。認証、再接続、保持ポリシー、consumer rebalance、負荷、実クラスタとの相性は container または実 broker を使う integration test で検証してください。

## 利用の流れ

最初に Quickstart で、一件の message を送信し、consumer が読んで auto commit することを確認します。次に How-to で、handler の成功と commit を分ける手動 commit、DLQ の最終失敗、schema 変更、NATS subject を一つの test file に追加します。テスト間で state が混ざらないよう、Kafka、NATS、Redpanda、DLQ は test ごとに新しく作成します。

[Quickstart](./quickstart) は producer と consumer の往復を扱います。[Kafka の処理を検証する](./how-to) は失敗経路と schema を扱います。公開 API と provider ごとの制約は [リファレンス](./reference) を参照してください。接続後の実行状況を確認する場合は [Observability](/libraries/ai-realtime/observability/) も利用できます。
