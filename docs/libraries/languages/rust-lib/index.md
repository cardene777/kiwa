# @kiwa-lab/rust-lib

`@kiwa-lab/rust-lib` は、axum、actix-web、tower-http、Rocket の handler contract を TypeScript の test process から検証する mock harness です。Rust compiler、Tokio、実 server、framework crate は起動しません。handler に body を渡し、method、path、headers、extractor、guard 名を結果の記録として返すことで、アプリがどの入力と応答を約束するかを素早く固定します。

<img src="/images/kiwa-docs/languages/rust-lib-overview.webp" alt="Rust handlerの応答と失敗理由を分けて観測する構造" width="1200" height="675" loading="lazy" decoding="async">

axum、actix、Rocket の adapter は、handler の成功を status `200` と body に包み、例外を status `500`、body `null`、`reason` に変換します。これは framework が実際に作る `IntoResponse` や `Responder` を再現するものではなく、アプリの成功と失敗の分岐を同じ assertion 形式にそろえるための契約です。headers、extractors、guards は handler に注入されず、結果に記録される metadata です。

Tower adapter は middleware の entered と exited の順番を記録します。middleware が `next` を呼ばず response を返せば、後続と handler は実行されません。route environment は method と path の完全一致だけを扱い、登録した handler を自動 dispatch しません。

## 使う判断

Rust service の handler が受け取る body、返す domain value、失敗時の分岐、middleware の適用順を短い TypeScript test で確認したい場合に使います。retry、timeout、rate limit、circuit breaker、idempotency は framework から独立した async wrapper として検証できます。

extractor、request guard、route parameter、body parse、HTTP serialization、実 network は対象外です。Rust framework の binding、router、middleware、cancellation を確認する場合は、対象 crate を使った Rust integration test を追加してください。

## 読み進める

[Quickstart](./quickstart) は axum 風 handler を保存して実行する最小 test です。[使い方](./how-to) は Rocket の失敗、Tower の短絡、resilience wrapper を扱います。[リファレンス](./reference) は入力、戻り値、状態を持つ helper の制約を確認するためのページです。
