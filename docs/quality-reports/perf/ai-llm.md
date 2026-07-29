# Perf Suite — ai-llm

Threshold source: [docs/quality/perf-thresholds.md](../../quality/perf-thresholds)

測定系の分解能 = 0.00017ms (何もしない関数を同じ経路で呼んだ時の p10)。 回帰判定の絶対下限は既定でこの 2 倍 = 0.00033ms、 op ごとの実効値は下表の「下限」 列。

## Serial (concurrency = 1)

| op | p10 (実測) | p95 (上限判定) | cap | 下限 | gate | regression |
|---|---|---|---|---|---|---|
| anthropicMessagesCreate | 8.58ms | 10.18ms | 40ms | 0.00034ms | PASS | stable — gate 無効 (regressionGate=false) |
| openAiChatCompletionsCreate | 8.64ms | 11.52ms | 40ms | 0.00033ms | PASS | stable (p10 +3% (閾値未満)、 p95 +20% (裾は実行間の振れ幅と区別できないため判定には使わない)) — gate 無効 (regressionGate=false) |
| vercelGenerateText | 8.48ms | 10.38ms | 40ms | 0.00033ms | PASS | stable — gate 無効 (regressionGate=false) |
| langchainInvoke | 8.50ms | 10.24ms | 40ms | 0.00033ms | PASS | stable — gate 無効 (regressionGate=false) |

## 実行内正規化 (回帰判定はこの比で行う)

回帰判定は実測値そのものではなく、 同じ実行の中で 1 呼出ずつ交互に測った基準 op との比を読む。 実行と実行の間で機械の状態が変わっても、 その差が分子と分母で相殺される。 「換算後 p10」 は今回の比を baseline を測った時の基準 p10 で ms に戻した値で、 baseline の実測 p10 と直接比べられる。

| op | 基準 op | 基準 p10 | 実測 p10 | 比 | baseline の比 | 換算後 p10 | baseline p10 |
|---|---|---|---|---|---|---|---|
| anthropicMessagesCreate | cpu | 0.08ms | 8.58ms | 105.119 | 102.364 | 8.66ms | 8.44ms |
| openAiChatCompletionsCreate | cpu | 0.08ms | 8.64ms | 104.164 | 101.211 | 8.64ms | 8.39ms |
| vercelGenerateText | cpu | 0.08ms | 8.48ms | 102.507 | 100.281 | 8.50ms | 8.32ms |
| langchainInvoke | cpu | 0.08ms | 8.50ms | 102.553 | 100.186 | 8.40ms | 8.21ms |

## Concurrent p95 (concurrency = 10, 50 iter each)

| op | p95 | cap | gate |
|---|---|---|---|
| anthropicMessagesCreate | 10.20ms | 80ms | PASS |
| openAiChatCompletionsCreate | 10.19ms | 80ms | PASS |
| vercelGenerateText | 10.11ms | 80ms | PASS |
| langchainInvoke | 10.18ms | 80ms | PASS |

## Memory retention (200 iter, arrayBuffers axis is the gate; heap is informational)

| op | heapUsed Δ | arrayBuffers Δ | cap | gc exposed | verdict |
|---|---|---|---|---|---|
| anthropicMessagesCreate | 21600 B | 0 B | 102400 B | yes | PASS |
| openAiChatCompletionsCreate | 2816 B | 0 B | 102400 B | yes | PASS |
| vercelGenerateText | 6216 B | 0 B | 102400 B | yes | PASS |
| langchainInvoke | 4272 B | 0 B | 102400 B | yes | PASS |

## Detailed serial reports

### anthropicMessagesCreate

# Perf Report — anthropicMessagesCreate.serial

| metric | value |
|---|---|
| iterations | 200 |
| warmup | 5 |
| p10 | 8.58ms |
| p50 | 10.08ms |
| p95 | 10.18ms |
| p99 | 12.07ms |
| mean | 9.66ms |
| stdev | 0.79ms |
| min | 8.00ms |
| max | 13.50ms |
| total | 1932.28ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 8.58ms | 8.44ms | +0.14ms | +1.71% |
| p50 | 10.08ms | 9.11ms | +0.97ms | +10.69% |
| p95 | 10.18ms | 10.30ms | -0.12ms | -1.17% |
| p99 | 12.07ms | 13.03ms | -0.97ms | -7.41% |
| mean | 9.66ms | 9.19ms | +0.47ms | +5.13% |
| min | 8.00ms | 7.99ms | +0.0085ms | +0.11% |
| max | 13.50ms | 19.61ms | -6.11ms | -31.15% |
| total | 1932.28ms | 1838.03ms | +94.25ms | +5.13% |

### openAiChatCompletionsCreate

# Perf Report — openAiChatCompletionsCreate.serial

| metric | value |
|---|---|
| iterations | 200 |
| warmup | 5 |
| p10 | 8.64ms |
| p50 | 10.08ms |
| p95 | 11.52ms |
| p99 | 13.04ms |
| mean | 9.87ms |
| stdev | 1.11ms |
| min | 7.59ms |
| max | 19.21ms |
| total | 1973.04ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 8.64ms | 8.39ms | +0.24ms | +2.92% |
| p50 | 10.08ms | 9.11ms | +0.98ms | +10.72% |
| p95 | 11.52ms | 9.59ms | +1.93ms | +20.08% |
| p99 | 13.04ms | 13.01ms | +0.03ms | +0.27% |
| mean | 9.87ms | 9.26ms | +0.61ms | +6.59% |
| min | 7.59ms | 7.39ms | +0.20ms | +2.67% |
| max | 19.21ms | 46.41ms | -27.20ms | -58.62% |
| total | 1973.04ms | 1851.02ms | +122.02ms | +6.59% |

### vercelGenerateText

# Perf Report — vercelGenerateText.serial

| metric | value |
|---|---|
| iterations | 200 |
| warmup | 5 |
| p10 | 8.48ms |
| p50 | 10.07ms |
| p95 | 10.38ms |
| p99 | 12.15ms |
| mean | 9.67ms |
| stdev | 0.81ms |
| min | 7.77ms |
| max | 12.97ms |
| total | 1934.53ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 8.48ms | 8.32ms | +0.16ms | +1.91% |
| p50 | 10.07ms | 9.09ms | +0.98ms | +10.79% |
| p95 | 10.38ms | 10.13ms | +0.25ms | +2.48% |
| p99 | 12.15ms | 12.27ms | -0.11ms | -0.93% |
| mean | 9.67ms | 9.13ms | +0.54ms | +5.96% |
| min | 7.77ms | 7.14ms | +0.64ms | +8.90% |
| max | 12.97ms | 21.95ms | -8.97ms | -40.89% |
| total | 1934.53ms | 1825.73ms | +108.80ms | +5.96% |

### langchainInvoke

# Perf Report — langchainInvoke.serial

| metric | value |
|---|---|
| iterations | 200 |
| warmup | 5 |
| p10 | 8.50ms |
| p50 | 10.06ms |
| p95 | 10.24ms |
| p99 | 10.84ms |
| mean | 9.61ms |
| stdev | 0.73ms |
| min | 8.11ms |
| max | 13.44ms |
| total | 1922.93ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 8.50ms | 8.21ms | +0.30ms | +3.62% |
| p50 | 10.06ms | 9.06ms | +0.99ms | +10.98% |
| p95 | 10.24ms | 9.11ms | +1.13ms | +12.35% |
| p99 | 10.84ms | 9.14ms | +1.70ms | +18.64% |
| mean | 9.61ms | 8.87ms | +0.75ms | +8.45% |
| min | 8.11ms | 7.52ms | +0.59ms | +7.81% |
| max | 13.44ms | 9.20ms | +4.24ms | +46.07% |
| total | 1922.93ms | 1773.11ms | +149.83ms | +8.45% |

