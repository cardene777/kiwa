# Perf Suite — ai-llm

Threshold source: [docs/quality/perf-thresholds.md](../../quality/perf-thresholds)

測定系の分解能 = 0.00017ms (何もしない関数を同じ経路で呼んだ時の p10)。 回帰判定の絶対下限は既定でこの 2 倍 = 0.00033ms、 op ごとの実効値は下表の「下限」 列。

## Serial (concurrency = 1)

| op | p10 (回帰判定) | p95 (上限判定) | cap | 下限 | gate | regression |
|---|---|---|---|---|---|---|
| anthropicMessagesCreate | 8.45ms | 9.17ms | 40ms | 0.00033ms | PASS | stable — gate 無効 (regressionGate=false) |
| openAiChatCompletionsCreate | 8.33ms | 9.14ms | 40ms | 0.00033ms | PASS | stable — gate 無効 (regressionGate=false) |
| vercelGenerateText | 8.31ms | 9.14ms | 40ms | 0.00033ms | PASS | stable — gate 無効 (regressionGate=false) |
| langchainInvoke | 8.37ms | 9.30ms | 40ms | 0.00033ms | PASS | stable — gate 無効 (regressionGate=false) |

## Concurrent p95 (concurrency = 10, 50 iter each)

| op | p95 | cap | gate |
|---|---|---|---|
| anthropicMessagesCreate | 9.35ms | 80ms | PASS |
| openAiChatCompletionsCreate | 9.12ms | 80ms | PASS |
| vercelGenerateText | 9.20ms | 80ms | PASS |
| langchainInvoke | 9.15ms | 80ms | PASS |

## Memory retention (200 iter, arrayBuffers axis is the gate; heap is informational)

| op | heapUsed Δ | arrayBuffers Δ | cap | gc exposed | verdict |
|---|---|---|---|---|---|
| anthropicMessagesCreate | 30672 B | -8192 B | 102400 B | yes | PASS |
| openAiChatCompletionsCreate | 4096 B | 0 B | 102400 B | yes | PASS |
| vercelGenerateText | 6104 B | 0 B | 102400 B | yes | PASS |
| langchainInvoke | 3104 B | 0 B | 102400 B | yes | PASS |

## Detailed serial reports

### anthropicMessagesCreate

# Perf Report — anthropicMessagesCreate.serial

| metric | value |
|---|---|
| iterations | 200 |
| warmup | 5 |
| p10 | 8.45ms |
| p50 | 9.10ms |
| p95 | 9.17ms |
| p99 | 14.76ms |
| mean | 9.03ms |
| stdev | 0.87ms |
| min | 7.49ms |
| max | 16.54ms |
| total | 1805.89ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 8.45ms | 8.37ms | +0.08ms | +0.99% |
| p50 | 9.10ms | 9.09ms | +0.01ms | +0.13% |
| p95 | 9.17ms | 9.13ms | +0.04ms | +0.45% |
| p99 | 14.76ms | 9.18ms | +5.58ms | +60.85% |
| mean | 9.03ms | 8.92ms | +0.11ms | +1.19% |
| min | 7.49ms | 7.43ms | +0.06ms | +0.80% |
| max | 16.54ms | 9.18ms | +7.36ms | +80.22% |
| total | 1805.89ms | 1784.62ms | +21.27ms | +1.19% |

### openAiChatCompletionsCreate

# Perf Report — openAiChatCompletionsCreate.serial

| metric | value |
|---|---|
| iterations | 200 |
| warmup | 5 |
| p10 | 8.33ms |
| p50 | 9.09ms |
| p95 | 9.14ms |
| p99 | 9.19ms |
| mean | 8.92ms |
| stdev | 0.33ms |
| min | 7.61ms |
| max | 9.25ms |
| total | 1784.43ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 8.33ms | 8.39ms | -0.06ms | -0.69% |
| p50 | 9.09ms | 9.09ms | -0.0051ms | -0.06% |
| p95 | 9.14ms | 9.13ms | +0.02ms | +0.21% |
| p99 | 9.19ms | 9.15ms | +0.04ms | +0.49% |
| mean | 8.92ms | 8.93ms | -0.01ms | -0.12% |
| min | 7.61ms | 7.47ms | +0.14ms | +1.87% |
| max | 9.25ms | 9.16ms | +0.09ms | +0.96% |
| total | 1784.43ms | 1786.58ms | -2.15ms | -0.12% |

### vercelGenerateText

# Perf Report — vercelGenerateText.serial

| metric | value |
|---|---|
| iterations | 200 |
| warmup | 5 |
| p10 | 8.31ms |
| p50 | 9.08ms |
| p95 | 9.14ms |
| p99 | 9.23ms |
| mean | 8.92ms |
| stdev | 0.33ms |
| min | 7.74ms |
| max | 9.43ms |
| total | 1783.40ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 8.31ms | 8.28ms | +0.03ms | +0.41% |
| p50 | 9.08ms | 9.09ms | -0.0026ms | -0.03% |
| p95 | 9.14ms | 9.16ms | -0.03ms | -0.29% |
| p99 | 9.23ms | 9.42ms | -0.20ms | -2.07% |
| mean | 8.92ms | 8.91ms | +0.0089ms | +0.10% |
| min | 7.74ms | 7.89ms | -0.14ms | -1.81% |
| max | 9.43ms | 10.71ms | -1.27ms | -11.90% |
| total | 1783.40ms | 1781.63ms | +1.77ms | +0.10% |

### langchainInvoke

# Perf Report — langchainInvoke.serial

| metric | value |
|---|---|
| iterations | 200 |
| warmup | 5 |
| p10 | 8.37ms |
| p50 | 9.09ms |
| p95 | 9.30ms |
| p99 | 9.72ms |
| mean | 8.98ms |
| stdev | 0.34ms |
| min | 7.97ms |
| max | 10.01ms |
| total | 1795.00ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 8.37ms | 8.19ms | +0.18ms | +2.23% |
| p50 | 9.09ms | 9.08ms | +0.01ms | +0.13% |
| p95 | 9.30ms | 9.38ms | -0.08ms | -0.84% |
| p99 | 9.72ms | 9.92ms | -0.20ms | -2.02% |
| mean | 8.98ms | 8.89ms | +0.09ms | +0.96% |
| min | 7.97ms | 7.11ms | +0.86ms | +12.13% |
| max | 10.01ms | 11.03ms | -1.02ms | -9.21% |
| total | 1795.00ms | 1777.91ms | +17.10ms | +0.96% |

