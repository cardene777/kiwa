# Observability

`@kiwa-lab/observability` はテスト実行履歴、仕様カバレッジ、flaky なテストを集約します。

## 検証する流れ

<img src="/images/kiwa-docs/ai-realtime/observability-overview.webp" alt="Vitestの実行結果と仕様IDからflaky履歴とcoverageをdashboardへ集約する流れ" width="1672" height="941" loading="lazy" decoding="async">

実行履歴と仕様カバレッジを別々に集め、dashboard で同じ test ID に結び付けます。Vitest 形式の結果を履歴へ変換すると、成功と失敗が混在する test を flaky として検出できます。仕様 Markdown にある ID と test code にある ID を比較すると、仕様だけに残った項目と test だけに残った項目を分けて確認できます。

## 使う場面

CIの結果から、失敗の傾向と仕様との対応漏れを確認するときに使います。collectorsとdashboardはin-memoryの値を扱い、Grafana、Prometheus、Loki、OpenTelemetry backendへ自動送信しません。

## 入力の境界

Vitest JSONは限定したreport shapeを受け取り、test IDは T-英数字-数字 の文字列だけを抽出します。spec coverageはspec Markdownをparseし、test code中の同じpatternを文字列として探すため、testを実行した事実やassertionの品質は判定しません。

## 読み進める

[Quickstart](./quickstart) で実行履歴から flaky test を検出し、[使い方](./how-to) で仕様との対応、telemetry、log と trace の結び付きを一つの test file にまとめます。品質のしきい値を判断するなら [Quality Metrics](/libraries/quality/quality-metrics/)、測定値を作るなら [Perf Harness](/libraries/quality/perf-harness/) を使います。dashboard API の全項目は [リファレンス](./reference) にあります。
