# Perf Suite — ai-llm

Threshold source: [docs/quality/perf-thresholds.md](../../quality/perf-thresholds)

測定系の分解能 = 0.00017ms (何もしない関数を同じ経路で呼んだ時の p10)。 回帰判定の絶対下限は既定でこの 2 倍 = 0.00033ms、 op ごとの実効値は下表の「下限」 列。

## Serial (concurrency = 1)

| op | p10 (回帰判定) | p95 (上限判定) | cap | 下限 | gate | regression |
|---|---|---|---|---|---|---|
| anthropicMessagesCreate | 8.49ms | 9.13ms | 40ms | 0.00033ms | PASS | stable — gate 無効 (regressionGate=false) |
| openAiChatCompletionsCreate | 8.66ms | 9.13ms | 40ms | 0.00033ms | PASS | stable — gate 無効 (regressionGate=false) |
| vercelGenerateText | 8.32ms | 9.10ms | 40ms | 0.00033ms | PASS | stable — gate 無効 (regressionGate=false) |
| langchainInvoke | 8.53ms | 9.10ms | 40ms | 0.00033ms | PASS | stable — gate 無効 (regressionGate=false) |

## Concurrent p95 (concurrency = 10, 50 iter each)

| op | p95 | cap | gate |
|---|---|---|---|
| anthropicMessagesCreate | 9.18ms | 80ms | PASS |
| openAiChatCompletionsCreate | 9.13ms | 80ms | PASS |
| vercelGenerateText | 9.15ms | 80ms | PASS |
| langchainInvoke | 9.11ms | 80ms | PASS |

## Memory retention (200 iter, arrayBuffers axis is the gate; heap is informational)

| op | heapUsed Δ | arrayBuffers Δ | cap | gc exposed | verdict |
|---|---|---|---|---|---|
| anthropicMessagesCreate | 31584 B | 0 B | 102400 B | yes | PASS |
| openAiChatCompletionsCreate | 2784 B | 0 B | 102400 B | yes | PASS |
| vercelGenerateText | 6104 B | 0 B | 102400 B | yes | PASS |
| langchainInvoke | 4240 B | 0 B | 102400 B | yes | PASS |

## Detailed serial reports

### anthropicMessagesCreate

# Perf Report — anthropicMessagesCreate.serial

| metric | value |
|---|---|
| iterations | 200 |
| warmup | 5 |
| p10 | 8.49ms |
| p50 | 9.08ms |
| p95 | 9.13ms |
| p99 | 9.17ms |
| mean | 8.98ms |
| stdev | 0.25ms |
| min | 8.09ms |
| max | 9.20ms |
| total | 1796.02ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 8.49ms | 8.37ms | +0.12ms | +1.40% |
| p50 | 9.08ms | 9.09ms | -0.01ms | -0.11% |
| p95 | 9.13ms | 9.13ms | -0.0037ms | -0.04% |
| p99 | 9.17ms | 9.18ms | -0.01ms | -0.14% |
| mean | 8.98ms | 8.92ms | +0.06ms | +0.64% |
| min | 8.09ms | 7.43ms | +0.66ms | +8.85% |
| max | 9.20ms | 9.18ms | +0.02ms | +0.25% |
| total | 1796.02ms | 1784.62ms | +11.40ms | +0.64% |

### openAiChatCompletionsCreate

# Perf Report — openAiChatCompletionsCreate.serial

| metric | value |
|---|---|
| iterations | 200 |
| warmup | 5 |
| p10 | 8.66ms |
| p50 | 9.07ms |
| p95 | 9.13ms |
| p99 | 9.54ms |
| mean | 9.00ms |
| stdev | 0.30ms |
| min | 7.94ms |
| max | 10.86ms |
| total | 1800.45ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 8.66ms | 8.39ms | +0.27ms | +3.17% |
| p50 | 9.07ms | 9.09ms | -0.02ms | -0.22% |
| p95 | 9.13ms | 9.13ms | +0.0090ms | +0.10% |
| p99 | 9.54ms | 9.15ms | +0.39ms | +4.25% |
| mean | 9.00ms | 8.93ms | +0.07ms | +0.78% |
| min | 7.94ms | 7.47ms | +0.47ms | +6.27% |
| max | 10.86ms | 9.16ms | +1.70ms | +18.56% |
| total | 1800.45ms | 1786.58ms | +13.87ms | +0.78% |

### vercelGenerateText

# Perf Report — vercelGenerateText.serial

| metric | value |
|---|---|
| iterations | 200 |
| warmup | 5 |
| p10 | 8.32ms |
| p50 | 9.06ms |
| p95 | 9.10ms |
| p99 | 9.17ms |
| mean | 8.92ms |
| stdev | 0.32ms |
| min | 7.91ms |
| max | 9.66ms |
| total | 1784.07ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 8.32ms | 8.28ms | +0.04ms | +0.51% |
| p50 | 9.06ms | 9.09ms | -0.03ms | -0.31% |
| p95 | 9.10ms | 9.16ms | -0.06ms | -0.68% |
| p99 | 9.17ms | 9.42ms | -0.25ms | -2.71% |
| mean | 8.92ms | 8.91ms | +0.01ms | +0.14% |
| min | 7.91ms | 7.89ms | +0.02ms | +0.27% |
| max | 9.66ms | 10.71ms | -1.05ms | -9.78% |
| total | 1784.07ms | 1781.63ms | +2.44ms | +0.14% |

### langchainInvoke

# Perf Report — langchainInvoke.serial

| metric | value |
|---|---|
| iterations | 200 |
| warmup | 5 |
| p10 | 8.53ms |
| p50 | 9.06ms |
| p95 | 9.10ms |
| p99 | 9.13ms |
| mean | 8.96ms |
| stdev | 0.28ms |
| min | 7.81ms |
| max | 9.15ms |
| total | 1791.98ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 8.53ms | 8.19ms | +0.34ms | +4.15% |
| p50 | 9.06ms | 9.08ms | -0.02ms | -0.25% |
| p95 | 9.10ms | 9.38ms | -0.28ms | -2.98% |
| p99 | 9.13ms | 9.92ms | -0.79ms | -7.96% |
| mean | 8.96ms | 8.89ms | +0.07ms | +0.79% |
| min | 7.81ms | 7.11ms | +0.70ms | +9.78% |
| max | 9.15ms | 11.03ms | -1.88ms | -17.01% |
| total | 1791.98ms | 1777.91ms | +14.07ms | +0.79% |

