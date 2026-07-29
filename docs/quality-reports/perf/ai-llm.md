# Perf Suite — ai-llm

Threshold source: [docs/quality/perf-thresholds.md](../../quality/perf-thresholds)

測定系の分解能 = 0.00017ms (何もしない関数を同じ経路で呼んだ時の p10)。 回帰判定の絶対下限は既定でこの 2 倍 = 0.00033ms、 op ごとの実効値は下表の「下限」 列。

## Serial (concurrency = 1)

| op | p10 (回帰判定) | p95 (上限判定) | cap | 下限 | gate | regression |
|---|---|---|---|---|---|---|
| anthropicMessagesCreate | 8.39ms | 9.79ms | 40ms | 0.00033ms | PASS | stable — gate 無効 (regressionGate=false) |
| openAiChatCompletionsCreate | 8.46ms | 9.21ms | 40ms | 0.00033ms | PASS | stable — gate 無効 (regressionGate=false) |
| vercelGenerateText | 8.37ms | 9.14ms | 40ms | 0.00033ms | PASS | stable — gate 無効 (regressionGate=false) |
| langchainInvoke | 8.40ms | 9.20ms | 40ms | 0.00033ms | PASS | stable — gate 無効 (regressionGate=false) |

## Concurrent p95 (concurrency = 10, 50 iter each)

| op | p95 | cap | gate |
|---|---|---|---|
| anthropicMessagesCreate | 9.27ms | 80ms | PASS |
| openAiChatCompletionsCreate | 10.18ms | 80ms | PASS |
| vercelGenerateText | 9.15ms | 80ms | PASS |
| langchainInvoke | 9.15ms | 80ms | PASS |

## Memory retention (200 iter, arrayBuffers axis is the gate; heap is informational)

| op | heapUsed Δ | arrayBuffers Δ | cap | gc exposed | verdict |
|---|---|---|---|---|---|
| anthropicMessagesCreate | 30744 B | 0 B | 102400 B | yes | PASS |
| openAiChatCompletionsCreate | 4096 B | 0 B | 102400 B | yes | PASS |
| vercelGenerateText | 5032 B | 0 B | 102400 B | yes | PASS |
| langchainInvoke | 3104 B | 0 B | 102400 B | yes | PASS |

## Detailed serial reports

### anthropicMessagesCreate

# Perf Report — anthropicMessagesCreate.serial

| metric | value |
|---|---|
| iterations | 200 |
| warmup | 5 |
| p10 | 8.39ms |
| p50 | 9.10ms |
| p95 | 9.79ms |
| p99 | 12.41ms |
| mean | 9.09ms |
| stdev | 0.67ms |
| min | 7.44ms |
| max | 14.15ms |
| total | 1818.59ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 8.39ms | 8.37ms | +0.02ms | +0.26% |
| p50 | 9.10ms | 9.09ms | +0.01ms | +0.13% |
| p95 | 9.79ms | 9.13ms | +0.66ms | +7.19% |
| p99 | 12.41ms | 9.18ms | +3.23ms | +35.22% |
| mean | 9.09ms | 8.92ms | +0.17ms | +1.90% |
| min | 7.44ms | 7.43ms | +0.0052ms | +0.07% |
| max | 14.15ms | 9.18ms | +4.97ms | +54.17% |
| total | 1818.59ms | 1784.62ms | +33.97ms | +1.90% |

### openAiChatCompletionsCreate

# Perf Report — openAiChatCompletionsCreate.serial

| metric | value |
|---|---|
| iterations | 200 |
| warmup | 5 |
| p10 | 8.46ms |
| p50 | 9.07ms |
| p95 | 9.21ms |
| p99 | 10.27ms |
| mean | 8.99ms |
| stdev | 0.67ms |
| min | 7.21ms |
| max | 16.59ms |
| total | 1797.90ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 8.46ms | 8.39ms | +0.07ms | +0.79% |
| p50 | 9.07ms | 9.09ms | -0.02ms | -0.27% |
| p95 | 9.21ms | 9.13ms | +0.08ms | +0.90% |
| p99 | 10.27ms | 9.15ms | +1.12ms | +12.19% |
| mean | 8.99ms | 8.93ms | +0.06ms | +0.63% |
| min | 7.21ms | 7.47ms | -0.26ms | -3.49% |
| max | 16.59ms | 9.16ms | +7.43ms | +81.06% |
| total | 1797.90ms | 1786.58ms | +11.31ms | +0.63% |

### vercelGenerateText

# Perf Report — vercelGenerateText.serial

| metric | value |
|---|---|
| iterations | 200 |
| warmup | 5 |
| p10 | 8.37ms |
| p50 | 9.07ms |
| p95 | 9.14ms |
| p99 | 10.94ms |
| mean | 8.93ms |
| stdev | 0.50ms |
| min | 7.35ms |
| max | 12.70ms |
| total | 1786.70ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 8.37ms | 8.28ms | +0.09ms | +1.11% |
| p50 | 9.07ms | 9.09ms | -0.01ms | -0.13% |
| p95 | 9.14ms | 9.16ms | -0.03ms | -0.29% |
| p99 | 10.94ms | 9.42ms | +1.52ms | +16.11% |
| mean | 8.93ms | 8.91ms | +0.03ms | +0.28% |
| min | 7.35ms | 7.89ms | -0.54ms | -6.83% |
| max | 12.70ms | 10.71ms | +1.99ms | +18.57% |
| total | 1786.70ms | 1781.63ms | +5.07ms | +0.28% |

### langchainInvoke

# Perf Report — langchainInvoke.serial

| metric | value |
|---|---|
| iterations | 200 |
| warmup | 5 |
| p10 | 8.40ms |
| p50 | 9.08ms |
| p95 | 9.20ms |
| p99 | 10.04ms |
| mean | 8.95ms |
| stdev | 0.37ms |
| min | 7.64ms |
| max | 10.77ms |
| total | 1790.94ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 8.40ms | 8.19ms | +0.21ms | +2.58% |
| p50 | 9.08ms | 9.08ms | +0.0031ms | +0.03% |
| p95 | 9.20ms | 9.38ms | -0.18ms | -1.89% |
| p99 | 10.04ms | 9.92ms | +0.12ms | +1.25% |
| mean | 8.95ms | 8.89ms | +0.07ms | +0.73% |
| min | 7.64ms | 7.11ms | +0.53ms | +7.42% |
| max | 10.77ms | 11.03ms | -0.25ms | -2.29% |
| total | 1790.94ms | 1777.91ms | +13.03ms | +0.73% |

