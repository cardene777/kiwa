# kiwa-test-rs

`kiwa-test-rs` は、Rust の `cargo test` に deterministic な fixture、HTTP mock server、in-process web framework adapter を加える crate です。unit test の状態を `KiwaEnv` に閉じ込め、scope を抜けた時点で `Drop` に cleanup を任せます。HTTP を含む test では、実 service に接続せず、test が起動した一時 server または router を対象に request と response を検証します。

<img src="/images/kiwa-docs/native-languages/rust-overview.webp" alt="Rust の in process router 検証" width="1200" height="658" loading="lazy" decoding="async">

fixture だけを使う場合は feature を外して軽く導入できます。HTTP client の送信 contract まで検証する場合は default の `integration` feature を使い、Axum、actix-web、tower-http、contract tooling は必要な feature だけを選びます。feature を有効にしていない module は export されないため、依存を増やさずに unit test から始められます。

この crate は実 network や実 chain を自動で構成するものではありません。`Mode::Live` は real resource を使う test であることを表す fixture の値で、database、認証、外部 API、Reth node を開始しません。integration mock server の route は method と完全一致する path だけを扱います。複雑な matcher や response sequence が必要な場合は、専用 mock library と併用してください。

## 選ぶ場面

同じ入力から同じ test state を作りたい場合、HTTP client が送った query、header、body を確認したい場合、または Axum や actix-web の router を port なしで実行したい場合に向いています。`tower-http` feature は middleware stack の request を同じ in-process path で検証します。Foundry、Alloy、Reth の helper は feature gate の背後にあり、各 CLI や provider の実動作は別の integration environment で確認します。

[Quickstart](./quickstart) では fixture を導入して `cargo test` まで実行します。Axum router の route、404、lifecycle を確認する場合は [Axum router を検証する](./how-to) を使います。feature ごとの公開 API、既定値、失敗時の扱いは [リファレンス](./reference) にあります。
