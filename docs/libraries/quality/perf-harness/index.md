# Perf Harness

`@kiwa-lab/perf-harness` は、同じ非同期 operation を複数回測定し、baseline と比較して性能回帰を判断する library です。単発の経過時間で合否を決める代わりに、warmup 後の sample、percentile、外れ値、測定環境を記録します。変更によって p95 やメモリ差分が悪化していないかを、review 可能な証拠として残すために使います。

<img src="/images/kiwa-docs/quality/perf-harness-overview.webp" alt="操作を測定して同じ環境のbaselineと比較し性能gateを評価する流れ" width="1672" height="941" loading="lazy" decoding="async">

## 何を測定する library か

`measure` は一つの operation を warmup と本計測に分け、p50、p95、p99、平均、標準偏差、MAD、外れ値数を返します。`trimPercent` を指定すると元の sample を消さず、外れ値を除外した集計を別に残します。測定値そのものより、同じ入力で繰り返しても同じ性質を確認できる operation を選ぶことが重要です。

baseline を比較するときは p95 の差と bootstrap 信頼区間、許容する悪化率を合わせて `stable` または `regressed` を判断します。serial、concurrent、memory の三層をまとめる helper もありますが、gate が失敗した場合は個別の report を見て、どの実行形態が変わったかを確認します。

## 採用する判断

変更前後で adapter、parser、cache、worker の処理時間や allocation が悪化していないかを確認したい場合に使います。入力、反復回数、warmup、許容する回帰率を code に残せるため、性能要求を曖昧な「速くする」ではなく testable な contract にできます。

本番 SLA、負荷試験、実利用者の体感を証明する library ではありません。wall clock は OS scheduler と共有 CI の影響を受けます。machine、Node.js、git SHA などの環境が違う baseline は比較対象にせず、`envMismatch` を確認して release gate の判定から外します。比較自体を続けるかは呼び出し側の policy です。

## 利用の流れ

最初に Quickstart で副作用のない小さな operation を測定し、絶対的な速さではなく sample と percentile の関係を assertion します。次に How-to で baseline を保存し、同じ環境でのみ p95 の回帰を gate に渡します。外部 service や database を含む operation は、test が残した resource を `finally` で閉じてから比較します。

[Quickstart](./quickstart) は operation の測定を扱います。[Baseline と比較する](./how-to) は regression と三層 report を扱います。公開 API と既定値は [リファレンス](./reference) を参照してください。計測値を品質指標へ集める場合は [Quality Metrics](/libraries/quality/quality-metrics/) も利用できます。
