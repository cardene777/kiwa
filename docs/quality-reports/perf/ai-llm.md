# Perf Suite — ai-llm

Threshold source: [docs/quality/perf-thresholds.md](../../quality/perf-thresholds)

測定系の分解能 = 0.00017ms (何もしない関数を同じ経路で呼んだ時の p10)。 回帰判定の絶対下限は既定でこの 2 倍 = 0.00033ms、 op ごとの実効値は下表の「下限」 列。

## Serial (concurrency = 1)

| op | p10 (実測) | p95 (上限判定) | cap | 下限 | gate | regression |
|---|---|---|---|---|---|---|
| anthropicMessagesCreate | 8.56ms | 10.15ms | 40ms | 0.00033ms | PASS | stable — gate 無効 (regressionGate=false) |
| openAiChatCompletionsCreate | 8.45ms | 10.14ms | 40ms | 0.00034ms | PASS | stable — gate 無効 (regressionGate=false) |
| vercelGenerateText | 8.61ms | 10.40ms | 40ms | 0.00033ms | PASS | stable — gate 無効 (regressionGate=false) |
| langchainInvoke | 8.50ms | 10.21ms | 40ms | 0.00033ms | PASS | stable — gate 無効 (regressionGate=false) |

## 実行内正規化 (回帰判定はこの比で行う)

回帰判定は実測値そのものではなく、 同じ実行の中で 1 呼出ずつ交互に測った基準 op との比を読む。 実行と実行の間で機械の状態が変わっても、 その差が分子と分母で相殺される。 「換算後 p10」 は今回の比を baseline を測った時の基準 p10 で ms に戻した値で、 baseline の実測 p10 と直接比べられる。


「実行間のばらつき」 は baseline が持つ過去の比が、 baseline 自身の比からどれだけ離れたかの最大値。 その op が実装を変えずに測るだけでどれだけ動くかを表す。 判定はこの幅の 2 倍と相対閾値の大きい方を超えた差だけを有意として扱う (#1739)。 履歴が 3 件に満たない op では推定できないため n/a になり、 相対閾値だけで判定する。

| op | 基準 op | 基準 p10 | 基準 p95 | 実測 p10 | 比 | baseline の比 | 実行間のばらつき | 実効閾値 | 換算後 p10 | baseline p10 |
|---|---|---|---|---|---|---|---|---|---|---|
| anthropicMessagesCreate | cpu | 0.08ms | 0.11ms | 8.56ms | 103.373 | 101.988 | n/a | 20.0% | 8.54ms | 8.43ms |
| openAiChatCompletionsCreate | cpu | 0.08ms | 0.12ms | 8.45ms | 101.874 | 107.893 | n/a | 20.0% | 8.48ms | 8.98ms |
| vercelGenerateText | cpu | 0.08ms | 0.18ms | 8.61ms | 103.194 | 107.188 | n/a | 20.0% | 8.60ms | 8.94ms |
| langchainInvoke | cpu | 0.08ms | 0.15ms | 8.50ms | 101.660 | 102.815 | n/a | 20.0% | 8.46ms | 8.55ms |

## Concurrent p95 (concurrency = 10, 50 iter each)

| op | p95 | cap | gate |
|---|---|---|---|
| anthropicMessagesCreate | 10.17ms | 80ms | PASS |
| openAiChatCompletionsCreate | 10.13ms | 80ms | PASS |
| vercelGenerateText | 10.51ms | 80ms | PASS |
| langchainInvoke | 10.26ms | 80ms | PASS |

## Memory retention (200 iter, arrayBuffers axis is the gate; heap is informational)

| op | heapUsed Δ | arrayBuffers Δ | cap | gc exposed | 呼出 (空回し + 反復) | verdict |
|---|---|---|---|---|---|---|
| anthropicMessagesCreate | 16728 B | 0 B | 102400 B | yes | 220 (20 + 200) | PASS |
| openAiChatCompletionsCreate | 4128 B | 0 B | 102400 B | yes | 220 (20 + 200) | PASS |
| vercelGenerateText | 6136 B | 0 B | 102400 B | yes | 220 (20 + 200) | PASS |
| langchainInvoke | 4272 B | 0 B | 102400 B | yes | 220 (20 + 200) | PASS |

## Detailed serial reports

### anthropicMessagesCreate

# Perf Report — anthropicMessagesCreate.serial

| metric | value |
|---|---|
| iterations | 200 |
| warmup | 5 |
| p10 | 8.56ms |
| p50 | 10.07ms |
| p95 | 10.15ms |
| p99 | 10.23ms |
| mean | 9.67ms |
| stdev | 0.63ms |
| min | 8.11ms |
| max | 10.42ms |
| total | 1933.43ms |

## Baseline diff

current は baseline を測った時の機械の速さへ換算済み (倍率 0.998)。 回帰判定が読む量と同じ。 実測値は上表。

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 8.54ms | 8.43ms | +0.11ms | +1.36% |
| p50 | 10.05ms | 9.93ms | +0.12ms | +1.22% |
| p95 | 10.13ms | 10.54ms | -0.40ms | -3.83% |
| p99 | 10.21ms | 11.53ms | -1.31ms | -11.40% |
| mean | 9.65ms | 9.67ms | -0.03ms | -0.27% |
| min | 8.09ms | 7.74ms | +0.34ms | +4.45% |
| max | 10.40ms | 15.66ms | -5.27ms | -33.62% |
| total | 1929.53ms | 1934.74ms | -5.21ms | -0.27% |

### openAiChatCompletionsCreate

# Perf Report — openAiChatCompletionsCreate.serial

| metric | value |
|---|---|
| iterations | 200 |
| warmup | 5 |
| p10 | 8.45ms |
| p50 | 10.06ms |
| p95 | 10.14ms |
| p99 | 11.45ms |
| mean | 9.68ms |
| stdev | 0.77ms |
| min | 7.53ms |
| max | 13.95ms |
| total | 1936.34ms |

## Baseline diff

current は baseline を測った時の機械の速さへ換算済み (倍率 1.003)。 回帰判定が読む量と同じ。 実測値は上表。

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 8.48ms | 8.98ms | -0.50ms | -5.58% |
| p50 | 10.10ms | 10.14ms | -0.04ms | -0.40% |
| p95 | 10.17ms | 11.62ms | -1.45ms | -12.48% |
| p99 | 11.49ms | 12.58ms | -1.08ms | -8.62% |
| mean | 9.72ms | 10.10ms | -0.38ms | -3.81% |
| min | 7.55ms | 7.94ms | -0.39ms | -4.95% |
| max | 14.00ms | 13.09ms | +0.90ms | +6.91% |
| total | 1943.06ms | 2020.02ms | -76.96ms | -3.81% |

### vercelGenerateText

# Perf Report — vercelGenerateText.serial

| metric | value |
|---|---|
| iterations | 200 |
| warmup | 5 |
| p10 | 8.61ms |
| p50 | 10.07ms |
| p95 | 10.40ms |
| p99 | 11.76ms |
| mean | 9.76ms |
| stdev | 1.90ms |
| min | 7.40ms |
| max | 34.13ms |
| total | 1952.84ms |

## Baseline diff

current は baseline を測った時の機械の速さへ換算済み (倍率 0.999)。 回帰判定が読む量と同じ。 実測値は上表。

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 8.60ms | 8.94ms | -0.33ms | -3.73% |
| p50 | 10.07ms | 10.40ms | -0.33ms | -3.16% |
| p95 | 10.39ms | 13.14ms | -2.75ms | -20.90% |
| p99 | 11.75ms | 15.14ms | -3.39ms | -22.41% |
| mean | 9.76ms | 10.90ms | -1.14ms | -10.46% |
| min | 7.39ms | 7.59ms | -0.20ms | -2.59% |
| max | 34.11ms | 61.91ms | -27.80ms | -44.91% |
| total | 1951.85ms | 2179.98ms | -228.13ms | -10.46% |

### langchainInvoke

# Perf Report — langchainInvoke.serial

| metric | value |
|---|---|
| iterations | 200 |
| warmup | 5 |
| p10 | 8.50ms |
| p50 | 10.07ms |
| p95 | 10.21ms |
| p99 | 11.64ms |
| mean | 9.60ms |
| stdev | 0.77ms |
| min | 7.39ms |
| max | 13.33ms |
| total | 1920.20ms |

## Baseline diff

current は baseline を測った時の機械の速さへ換算済み (倍率 0.995)。 回帰判定が読む量と同じ。 実測値は上表。

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 8.46ms | 8.55ms | -0.10ms | -1.12% |
| p50 | 10.03ms | 9.69ms | +0.34ms | +3.55% |
| p95 | 10.16ms | 10.96ms | -0.80ms | -7.33% |
| p99 | 11.59ms | 11.64ms | -0.05ms | -0.42% |
| mean | 9.56ms | 9.62ms | -0.07ms | -0.69% |
| min | 7.35ms | 7.62ms | -0.26ms | -3.46% |
| max | 13.27ms | 13.15ms | +0.12ms | +0.90% |
| total | 1911.49ms | 1924.70ms | -13.21ms | -0.69% |

