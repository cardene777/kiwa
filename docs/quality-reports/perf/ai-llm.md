# Perf Suite — ai-llm

Threshold source: [docs/quality/perf-thresholds.md](../../quality/perf-thresholds)

測定系の分解能 = 0.00017ms (何もしない関数を同じ経路で呼んだ時の p10)。 回帰判定の絶対下限は既定でこの 2 倍 = 0.00033ms、 op ごとの実効値は下表の「下限」 列。

## Serial (concurrency = 1)

| op | p10 (回帰判定) | p95 (上限判定) | cap | 下限 | gate | regression |
|---|---|---|---|---|---|---|
| anthropicMessagesCreate | 8.36ms | 9.68ms | 40ms | 0.00033ms | PASS | stable — gate 無効 (regressionGate=false) |
| openAiChatCompletionsCreate | 8.30ms | 9.10ms | 40ms | 0.00033ms | PASS | stable — gate 無効 (regressionGate=false) |
| vercelGenerateText | 8.30ms | 9.12ms | 40ms | 0.00033ms | PASS | stable — gate 無効 (regressionGate=false) |
| langchainInvoke | 8.46ms | 9.11ms | 40ms | 0.00033ms | PASS | stable — gate 無効 (regressionGate=false) |

## Concurrent p95 (concurrency = 10, 50 iter each)

| op | p95 | cap | gate |
|---|---|---|---|
| anthropicMessagesCreate | 9.24ms | 80ms | PASS |
| openAiChatCompletionsCreate | 9.12ms | 80ms | PASS |
| vercelGenerateText | 9.15ms | 80ms | PASS |
| langchainInvoke | 9.19ms | 80ms | PASS |

## Memory retention (200 iter, arrayBuffers axis is the gate; heap is informational)

| op | heapUsed Δ | arrayBuffers Δ | cap | gc exposed | verdict |
|---|---|---|---|---|---|
| anthropicMessagesCreate | 31440 B | 0 B | 102400 B | yes | PASS |
| openAiChatCompletionsCreate | 4096 B | 0 B | 102400 B | yes | PASS |
| vercelGenerateText | 5112 B | 0 B | 102400 B | yes | PASS |
| langchainInvoke | 3184 B | 0 B | 102400 B | yes | PASS |

## Detailed serial reports

### anthropicMessagesCreate

# Perf Report — anthropicMessagesCreate.serial

| metric | value |
|---|---|
| iterations | 200 |
| warmup | 5 |
| p10 | 8.36ms |
| p50 | 9.09ms |
| p95 | 9.68ms |
| p99 | 10.73ms |
| mean | 9.01ms |
| stdev | 0.56ms |
| min | 7.65ms |
| max | 13.19ms |
| total | 1802.92ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 8.36ms | 8.37ms | -0.0057ms | -0.07% |
| p50 | 9.09ms | 9.09ms | +0.0036ms | +0.04% |
| p95 | 9.68ms | 9.13ms | +0.55ms | +6.01% |
| p99 | 10.73ms | 9.18ms | +1.56ms | +16.96% |
| mean | 9.01ms | 8.92ms | +0.09ms | +1.03% |
| min | 7.65ms | 7.43ms | +0.22ms | +2.90% |
| max | 13.19ms | 9.18ms | +4.01ms | +43.63% |
| total | 1802.92ms | 1784.62ms | +18.30ms | +1.03% |

### openAiChatCompletionsCreate

# Perf Report — openAiChatCompletionsCreate.serial

| metric | value |
|---|---|
| iterations | 200 |
| warmup | 5 |
| p10 | 8.30ms |
| p50 | 9.06ms |
| p95 | 9.10ms |
| p99 | 9.14ms |
| mean | 8.84ms |
| stdev | 0.32ms |
| min | 8.07ms |
| max | 9.19ms |
| total | 1767.30ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 8.30ms | 8.39ms | -0.09ms | -1.05% |
| p50 | 9.06ms | 9.09ms | -0.03ms | -0.34% |
| p95 | 9.10ms | 9.13ms | -0.02ms | -0.23% |
| p99 | 9.14ms | 9.15ms | -0.01ms | -0.12% |
| mean | 8.84ms | 8.93ms | -0.10ms | -1.08% |
| min | 8.07ms | 7.47ms | +0.60ms | +8.03% |
| max | 9.19ms | 9.16ms | +0.03ms | +0.34% |
| total | 1767.30ms | 1786.58ms | -19.28ms | -1.08% |

### vercelGenerateText

# Perf Report — vercelGenerateText.serial

| metric | value |
|---|---|
| iterations | 200 |
| warmup | 5 |
| p10 | 8.30ms |
| p50 | 9.07ms |
| p95 | 9.12ms |
| p99 | 9.23ms |
| mean | 8.90ms |
| stdev | 0.34ms |
| min | 7.71ms |
| max | 9.61ms |
| total | 1779.42ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 8.30ms | 8.28ms | +0.02ms | +0.25% |
| p50 | 9.07ms | 9.09ms | -0.01ms | -0.13% |
| p95 | 9.12ms | 9.16ms | -0.04ms | -0.48% |
| p99 | 9.23ms | 9.42ms | -0.20ms | -2.08% |
| mean | 8.90ms | 8.91ms | -0.01ms | -0.12% |
| min | 7.71ms | 7.89ms | -0.18ms | -2.26% |
| max | 9.61ms | 10.71ms | -1.09ms | -10.21% |
| total | 1779.42ms | 1781.63ms | -2.21ms | -0.12% |

### langchainInvoke

# Perf Report — langchainInvoke.serial

| metric | value |
|---|---|
| iterations | 200 |
| warmup | 5 |
| p10 | 8.46ms |
| p50 | 9.08ms |
| p95 | 9.11ms |
| p99 | 9.17ms |
| mean | 8.95ms |
| stdev | 0.29ms |
| min | 7.96ms |
| max | 9.82ms |
| total | 1790.04ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 8.46ms | 8.19ms | +0.27ms | +3.26% |
| p50 | 9.08ms | 9.08ms | +0.00021ms | +0.00% |
| p95 | 9.11ms | 9.38ms | -0.27ms | -2.88% |
| p99 | 9.17ms | 9.92ms | -0.74ms | -7.50% |
| mean | 8.95ms | 8.89ms | +0.06ms | +0.68% |
| min | 7.96ms | 7.11ms | +0.85ms | +11.90% |
| max | 9.82ms | 11.03ms | -1.21ms | -10.97% |
| total | 1790.04ms | 1777.91ms | +12.14ms | +0.68% |

