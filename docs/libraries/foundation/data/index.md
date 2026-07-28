# @kiwa-lab/data

`@kiwa-lab/data` は、queue delivery と定期実行の判断を外部 infrastructure なしで検証する test adapter です。in-memory FIFO queue と手で進められる fake clock を提供し、worker が message を ack する、retry する、DLQ へ移すというアプリの分岐を同じ test process で再現します。

<img src="/images/kiwa-docs/foundation/data-overview.webp" alt="キュー配送を確認する流れ" width="1200" height="658" loading="lazy" decoding="async">

queue へ送られた message は、登録済み consumer が受け取ります。consumer が `ack()` すれば entry は完了し、`nack()` するか何も選ばなければ receive count を増やして再配送します。回数が `maxReceiveCount` に達した entry は DLQ へ移ります。`dedupKey` は queue に残っている間だけ同じ仕事の重複投入を一件にまとめ、ack または DLQ 移動で解放されます。

fake clock は実時間を待ちません。interval task を登録して `advanceMs` を呼ぶと、指定した範囲の発火を時刻順に await します。cron、batch、期限切れのロジックを、timer と sleep による不安定さなしで assertion したい場合に使います。

## 使う判断

worker の retry 方針、重複排除、DLQ への移動、定期 job の回数を unit または integration test で確認する場合に適しています。アプリが queue の結果に基づいて何を処理するかを高速に固定できます。`expectIdempotent` と `expectAtLeastOnce` はその代表的な delivery 契約を短く記述する helper です。

この adapter は provider emulator ではありません。`mode: "mock"` と `mode: "live"` はどちらも同じ in-memory queue を返し、network、visibility timeout、delayed delivery、parallel consumer、provider 固有の ordering は起動・再現しません。SQS、Pub/Sub、Redis などの実際の設定と delivery guarantee は、別の integration environment で確認します。

## 読み進める

[Quickstart](./quickstart) は retry の最小 test を helper で実行します。[使い方](./how-to) は dedup、DLQ、fake clock のそれぞれをアプリの assertion に結び付けます。[リファレンス](./reference) は option、既定値、失敗条件を調べるためのページです。
