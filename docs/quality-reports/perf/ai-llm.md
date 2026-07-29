# Perf Suite — ai-llm

Threshold source: [docs/quality/perf-thresholds.md](../../quality/perf-thresholds)

測定系の分解能 = 0.00042ms (何もしない関数を同じ経路で呼んだ時の p10)。 回帰判定の絶対下限は既定でこの 2 倍 = 0.00083ms、 op ごとの実効値は下表の「下限」 列。

## Serial (concurrency = 1)

| op | p10 (回帰判定) | p95 (上限判定) | cap | 下限 | gate | regression |
|---|---|---|---|---|---|---|
| anthropicMessagesCreate | 8.31ms | 9.17ms | 40ms | 0.00083ms | PASS | stable — gate 無効 (regressionGate=false) |
| openAiChatCompletionsCreate | 8.33ms | 9.13ms | 40ms | 0.00083ms | PASS | stable — gate 無効 (regressionGate=false) |
| vercelGenerateText | 8.35ms | 9.27ms | 40ms | 0.00083ms | PASS | stable — gate 無効 (regressionGate=false) |
| langchainInvoke | 8.32ms | 9.76ms | 40ms | 0.00083ms | PASS | stable — gate 無効 (regressionGate=false) |

## Concurrent p95 (concurrency = 10, 50 iter each)

| op | p95 | cap | gate |
|---|---|---|---|
| anthropicMessagesCreate | 9.30ms | 80ms | PASS |
| openAiChatCompletionsCreate | 9.26ms | 80ms | PASS |
| vercelGenerateText | 9.16ms | 80ms | PASS |
| langchainInvoke | 12.96ms | 80ms | PASS |

## Memory retention (200 iter, arrayBuffers axis is the gate; heap is informational)

| op | heapUsed Δ | arrayBuffers Δ | cap | gc exposed | verdict |
|---|---|---|---|---|---|
| anthropicMessagesCreate | 30824 B | 0 B | 102400 B | yes | PASS |
| openAiChatCompletionsCreate | 4096 B | 0 B | 102400 B | yes | PASS |
| vercelGenerateText | 6104 B | 0 B | 102400 B | yes | PASS |
| langchainInvoke | 4240 B | 0 B | 102400 B | yes | PASS |

## Detailed serial reports

### anthropicMessagesCreate

# Perf Report — anthropicMessagesCreate.serial

| metric | value |
|---|---|
| iterations | 200 |
| warmup | 5 |
| p10 | 8.31ms |
| p50 | 9.09ms |
| p95 | 9.17ms |
| p99 | 9.31ms |
| mean | 8.91ms |
| stdev | 0.39ms |
| min | 7.22ms |
| max | 10.07ms |
| total | 1781.31ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 8.31ms | 8.37ms | -0.05ms | -0.65% |
| p50 | 9.09ms | 9.09ms | +0.0034ms | +0.04% |
| p95 | 9.17ms | 9.13ms | +0.03ms | +0.37% |
| p99 | 9.31ms | 9.18ms | +0.13ms | +1.41% |
| mean | 8.91ms | 8.92ms | -0.02ms | -0.19% |
| min | 7.22ms | 7.43ms | -0.21ms | -2.88% |
| max | 10.07ms | 9.18ms | +0.89ms | +9.67% |
| total | 1781.31ms | 1784.62ms | -3.31ms | -0.19% |

### openAiChatCompletionsCreate

# Perf Report — openAiChatCompletionsCreate.serial

| metric | value |
|---|---|
| iterations | 200 |
| warmup | 5 |
| p10 | 8.33ms |
| p50 | 9.08ms |
| p95 | 9.13ms |
| p99 | 9.21ms |
| mean | 8.91ms |
| stdev | 0.34ms |
| min | 7.20ms |
| max | 9.26ms |
| total | 1781.53ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 8.33ms | 8.39ms | -0.06ms | -0.70% |
| p50 | 9.08ms | 9.09ms | -0.01ms | -0.14% |
| p95 | 9.13ms | 9.13ms | +0.0022ms | +0.02% |
| p99 | 9.21ms | 9.15ms | +0.06ms | +0.69% |
| mean | 8.91ms | 8.93ms | -0.03ms | -0.28% |
| min | 7.20ms | 7.47ms | -0.27ms | -3.63% |
| max | 9.26ms | 9.16ms | +0.10ms | +1.10% |
| total | 1781.53ms | 1786.58ms | -5.06ms | -0.28% |

### vercelGenerateText

# Perf Report — vercelGenerateText.serial

| metric | value |
|---|---|
| iterations | 200 |
| warmup | 5 |
| p10 | 8.35ms |
| p50 | 9.08ms |
| p95 | 9.27ms |
| p99 | 10.06ms |
| mean | 8.95ms |
| stdev | 0.40ms |
| min | 7.94ms |
| max | 10.69ms |
| total | 1790.66ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 8.35ms | 8.28ms | +0.08ms | +0.93% |
| p50 | 9.08ms | 9.09ms | -0.0024ms | -0.03% |
| p95 | 9.27ms | 9.16ms | +0.11ms | +1.19% |
| p99 | 10.06ms | 9.42ms | +0.64ms | +6.77% |
| mean | 8.95ms | 8.91ms | +0.05ms | +0.51% |
| min | 7.94ms | 7.89ms | +0.06ms | +0.73% |
| max | 10.69ms | 10.71ms | -0.02ms | -0.18% |
| total | 1790.66ms | 1781.63ms | +9.03ms | +0.51% |

### langchainInvoke

# Perf Report — langchainInvoke.serial

| metric | value |
|---|---|
| iterations | 200 |
| warmup | 5 |
| p10 | 8.32ms |
| p50 | 9.10ms |
| p95 | 9.76ms |
| p99 | 11.98ms |
| mean | 9.04ms |
| stdev | 0.71ms |
| min | 7.14ms |
| max | 14.65ms |
| total | 1808.08ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 8.32ms | 8.19ms | +0.13ms | +1.61% |
| p50 | 9.10ms | 9.08ms | +0.02ms | +0.24% |
| p95 | 9.76ms | 9.38ms | +0.38ms | +4.09% |
| p99 | 11.98ms | 9.92ms | +2.06ms | +20.80% |
| mean | 9.04ms | 8.89ms | +0.15ms | +1.70% |
| min | 7.14ms | 7.11ms | +0.03ms | +0.40% |
| max | 14.65ms | 11.03ms | +3.62ms | +32.86% |
| total | 1808.08ms | 1777.91ms | +30.17ms | +1.70% |

