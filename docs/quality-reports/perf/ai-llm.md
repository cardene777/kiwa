# Perf Suite — ai-llm

Threshold source: [docs/quality/perf-thresholds.md](../../quality/perf-thresholds)

測定系の分解能 = 0.00017ms (何もしない関数を同じ経路で呼んだ時の p10)。 回帰判定の絶対下限は既定でこの 2 倍 = 0.00033ms、 op ごとの実効値は下表の「下限」 列。

## Serial (concurrency = 1)

| op | p10 (実測) | p95 (上限判定) | cap | 下限 | gate | regression |
|---|---|---|---|---|---|---|
| anthropicMessagesCreate | 8.33ms | 9.18ms | 40ms | 0.00034ms | PASS | stable — gate 無効 (regressionGate=false) |
| openAiChatCompletionsCreate | 8.49ms | 9.14ms | 40ms | 0.00034ms | PASS | stable — gate 無効 (regressionGate=false) |
| vercelGenerateText | 8.56ms | 9.74ms | 40ms | 0.00033ms | PASS | stable — gate 無効 (regressionGate=false) |
| langchainInvoke | 8.32ms | 9.95ms | 40ms | 0.00033ms | PASS | stable — gate 無効 (regressionGate=false) |

## 実行内正規化 (回帰判定はこの比で行う)

回帰判定は実測値そのものではなく、 同じ実行の中で 1 呼出ずつ交互に測った基準 op との比を読む。 実行と実行の間で機械の状態が変わっても、 その差が分子と分母で相殺される。 「換算後 p10」 は今回の比を baseline を測った時の基準 p10 で ms に戻した値で、 baseline の実測 p10 と直接比べられる。

| op | 基準 op | 基準 p10 | 基準 p95 | 実測 p10 | 比 | baseline の比 | 換算後 p10 | baseline p10 |
|---|---|---|---|---|---|---|---|---|
| anthropicMessagesCreate | cpu | 0.08ms | 0.10ms | 8.33ms | 101.871 | 101.988 | 8.42ms | 8.43ms |
| openAiChatCompletionsCreate | cpu | 0.08ms | 0.11ms | 8.49ms | 103.252 | 107.893 | 8.60ms | 8.98ms |
| vercelGenerateText | cpu | 0.08ms | 0.13ms | 8.56ms | 103.237 | 107.188 | 8.61ms | 8.94ms |
| langchainInvoke | cpu | 0.08ms | 0.16ms | 8.32ms | 100.225 | 102.815 | 8.34ms | 8.55ms |

## Concurrent p95 (concurrency = 10, 50 iter each)

| op | p95 | cap | gate |
|---|---|---|---|
| anthropicMessagesCreate | 9.19ms | 80ms | PASS |
| openAiChatCompletionsCreate | 9.23ms | 80ms | PASS |
| vercelGenerateText | 9.15ms | 80ms | PASS |
| langchainInvoke | 9.53ms | 80ms | PASS |

## Memory retention (200 iter, arrayBuffers axis is the gate; heap is informational)

| op | heapUsed Δ | arrayBuffers Δ | cap | gc exposed | verdict |
|---|---|---|---|---|---|
| anthropicMessagesCreate | 21616 B | 0 B | 102400 B | yes | PASS |
| openAiChatCompletionsCreate | 4128 B | 0 B | 102400 B | yes | PASS |
| vercelGenerateText | 5064 B | 0 B | 102400 B | yes | PASS |
| langchainInvoke | 4272 B | 0 B | 102400 B | yes | PASS |

## Detailed serial reports

### anthropicMessagesCreate

# Perf Report — anthropicMessagesCreate.serial

| metric | value |
|---|---|
| iterations | 200 |
| warmup | 5 |
| p10 | 8.33ms |
| p50 | 9.09ms |
| p95 | 9.18ms |
| p99 | 9.39ms |
| mean | 8.91ms |
| stdev | 0.35ms |
| min | 7.77ms |
| max | 9.77ms |
| total | 1782.09ms |

## Baseline diff

current は baseline を測った時の機械の速さへ換算済み (倍率 1.011)。 回帰判定が読む量と同じ。 実測値は上表。

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 8.42ms | 8.43ms | -0.0096ms | -0.11% |
| p50 | 9.19ms | 9.93ms | -0.74ms | -7.43% |
| p95 | 9.29ms | 10.54ms | -1.25ms | -11.86% |
| p99 | 9.50ms | 11.53ms | -2.03ms | -17.60% |
| mean | 9.01ms | 9.67ms | -0.66ms | -6.86% |
| min | 7.86ms | 7.74ms | +0.11ms | +1.48% |
| max | 9.88ms | 15.66ms | -5.78ms | -36.92% |
| total | 1802.06ms | 1934.74ms | -132.69ms | -6.86% |

### openAiChatCompletionsCreate

# Perf Report — openAiChatCompletionsCreate.serial

| metric | value |
|---|---|
| iterations | 200 |
| warmup | 5 |
| p10 | 8.49ms |
| p50 | 9.08ms |
| p95 | 9.14ms |
| p99 | 9.19ms |
| mean | 8.95ms |
| stdev | 0.27ms |
| min | 7.95ms |
| max | 9.32ms |
| total | 1790.16ms |

## Baseline diff

current は baseline を測った時の機械の速さへ換算済み (倍率 1.013)。 回帰判定が読む量と同じ。 実測値は上表。

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 8.60ms | 8.98ms | -0.39ms | -4.30% |
| p50 | 9.19ms | 10.14ms | -0.94ms | -9.32% |
| p95 | 9.26ms | 11.62ms | -2.37ms | -20.37% |
| p99 | 9.30ms | 12.58ms | -3.28ms | -26.05% |
| mean | 9.06ms | 10.10ms | -1.04ms | -10.26% |
| min | 8.05ms | 7.94ms | +0.11ms | +1.37% |
| max | 9.44ms | 13.09ms | -3.65ms | -27.89% |
| total | 1812.85ms | 2020.02ms | -207.16ms | -10.26% |

### vercelGenerateText

# Perf Report — vercelGenerateText.serial

| metric | value |
|---|---|
| iterations | 200 |
| warmup | 5 |
| p10 | 8.56ms |
| p50 | 9.08ms |
| p95 | 9.74ms |
| p99 | 10.48ms |
| mean | 9.04ms |
| stdev | 0.44ms |
| min | 7.31ms |
| max | 11.09ms |
| total | 1807.27ms |

## Baseline diff

current は baseline を測った時の機械の速さへ換算済み (倍率 1.006)。 回帰判定が読む量と同じ。 実測値は上表。

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 8.61ms | 8.94ms | -0.33ms | -3.69% |
| p50 | 9.14ms | 10.40ms | -1.26ms | -12.08% |
| p95 | 9.80ms | 13.14ms | -3.34ms | -25.39% |
| p99 | 10.54ms | 15.14ms | -4.60ms | -30.38% |
| mean | 9.09ms | 10.90ms | -1.81ms | -16.59% |
| min | 7.36ms | 7.59ms | -0.24ms | -3.10% |
| max | 11.16ms | 61.91ms | -50.76ms | -81.98% |
| total | 1818.27ms | 2179.98ms | -361.71ms | -16.59% |

### langchainInvoke

# Perf Report — langchainInvoke.serial

| metric | value |
|---|---|
| iterations | 200 |
| warmup | 5 |
| p10 | 8.32ms |
| p50 | 9.08ms |
| p95 | 9.95ms |
| p99 | 15.29ms |
| mean | 9.12ms |
| stdev | 1.15ms |
| min | 7.41ms |
| max | 20.16ms |
| total | 1824.21ms |

## Baseline diff

current は baseline を測った時の機械の速さへ換算済み (倍率 1.003)。 回帰判定が読む量と同じ。 実測値は上表。

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 8.34ms | 8.55ms | -0.22ms | -2.52% |
| p50 | 9.10ms | 9.69ms | -0.58ms | -6.02% |
| p95 | 9.97ms | 10.96ms | -0.99ms | -9.03% |
| p99 | 15.33ms | 11.64ms | +3.69ms | +31.71% |
| mean | 9.14ms | 9.62ms | -0.48ms | -4.98% |
| min | 7.43ms | 7.62ms | -0.19ms | -2.49% |
| max | 20.21ms | 13.15ms | +7.05ms | +53.62% |
| total | 1828.78ms | 1924.70ms | -95.92ms | -4.98% |

