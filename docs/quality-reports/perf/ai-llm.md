# Perf Suite — ai-llm

Threshold source: [docs/quality/perf-thresholds.md](../../quality/perf-thresholds)

測定系の分解能 = 0.00017ms (何もしない関数を同じ経路で呼んだ時の p10)。 回帰判定の絶対下限は既定でこの 2 倍 = 0.00033ms、 op ごとの実効値は下表の「下限」 列。

## Serial (concurrency = 1)

| op | p10 (回帰判定) | p95 (上限判定) | cap | 下限 | gate | regression |
|---|---|---|---|---|---|---|
| anthropicMessagesCreate | 8.33ms | 9.99ms | 40ms | 0.00033ms | PASS | stable — gate 無効 (regressionGate=false) |
| openAiChatCompletionsCreate | 8.39ms | 9.16ms | 40ms | 0.00033ms | PASS | stable — gate 無効 (regressionGate=false) |
| vercelGenerateText | 8.34ms | 9.13ms | 40ms | 0.00033ms | PASS | stable — gate 無効 (regressionGate=false) |
| langchainInvoke | 8.34ms | 9.17ms | 40ms | 0.00033ms | PASS | stable — gate 無効 (regressionGate=false) |

## Concurrent p95 (concurrency = 10, 50 iter each)

| op | p95 | cap | gate |
|---|---|---|---|
| anthropicMessagesCreate | 10.50ms | 80ms | PASS |
| openAiChatCompletionsCreate | 9.21ms | 80ms | PASS |
| vercelGenerateText | 9.17ms | 80ms | PASS |
| langchainInvoke | 10.15ms | 80ms | PASS |

## Memory retention (200 iter, arrayBuffers axis is the gate; heap is informational)

| op | heapUsed Δ | arrayBuffers Δ | cap | gc exposed | verdict |
|---|---|---|---|---|---|
| anthropicMessagesCreate | 32296 B | -8192 B | 102400 B | yes | PASS |
| openAiChatCompletionsCreate | 4192 B | 0 B | 102400 B | yes | PASS |
| vercelGenerateText | 6104 B | 0 B | 102400 B | yes | PASS |
| langchainInvoke | 4240 B | 0 B | 102400 B | yes | PASS |

## Detailed serial reports

### anthropicMessagesCreate

# Perf Report — anthropicMessagesCreate.serial

| metric | value |
|---|---|
| iterations | 200 |
| warmup | 5 |
| p10 | 8.33ms |
| p50 | 9.12ms |
| p95 | 9.99ms |
| p99 | 11.26ms |
| mean | 9.10ms |
| stdev | 0.67ms |
| min | 7.22ms |
| max | 13.73ms |
| total | 1820.43ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 8.33ms | 8.37ms | -0.04ms | -0.49% |
| p50 | 9.12ms | 9.09ms | +0.03ms | +0.31% |
| p95 | 9.99ms | 9.13ms | +0.86ms | +9.37% |
| p99 | 11.26ms | 9.18ms | +2.09ms | +22.72% |
| mean | 9.10ms | 8.92ms | +0.18ms | +2.01% |
| min | 7.22ms | 7.43ms | -0.21ms | -2.86% |
| max | 13.73ms | 9.18ms | +4.55ms | +49.58% |
| total | 1820.43ms | 1784.62ms | +35.81ms | +2.01% |

### openAiChatCompletionsCreate

# Perf Report — openAiChatCompletionsCreate.serial

| metric | value |
|---|---|
| iterations | 200 |
| warmup | 5 |
| p10 | 8.39ms |
| p50 | 9.10ms |
| p95 | 9.16ms |
| p99 | 9.25ms |
| mean | 8.93ms |
| stdev | 0.34ms |
| min | 7.14ms |
| max | 9.41ms |
| total | 1785.48ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 8.39ms | 8.39ms | -0.0048ms | -0.06% |
| p50 | 9.10ms | 9.09ms | +0.0055ms | +0.06% |
| p95 | 9.16ms | 9.13ms | +0.04ms | +0.39% |
| p99 | 9.25ms | 9.15ms | +0.10ms | +1.10% |
| mean | 8.93ms | 8.93ms | -0.0055ms | -0.06% |
| min | 7.14ms | 7.47ms | -0.34ms | -4.54% |
| max | 9.41ms | 9.16ms | +0.25ms | +2.68% |
| total | 1785.48ms | 1786.58ms | -1.10ms | -0.06% |

### vercelGenerateText

# Perf Report — vercelGenerateText.serial

| metric | value |
|---|---|
| iterations | 200 |
| warmup | 5 |
| p10 | 8.34ms |
| p50 | 9.09ms |
| p95 | 9.13ms |
| p99 | 9.16ms |
| mean | 8.92ms |
| stdev | 0.33ms |
| min | 7.30ms |
| max | 9.32ms |
| total | 1784.08ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 8.34ms | 8.28ms | +0.07ms | +0.80% |
| p50 | 9.09ms | 9.09ms | +0.00015ms | +0.00% |
| p95 | 9.13ms | 9.16ms | -0.03ms | -0.36% |
| p99 | 9.16ms | 9.42ms | -0.27ms | -2.82% |
| mean | 8.92ms | 8.91ms | +0.01ms | +0.14% |
| min | 7.30ms | 7.89ms | -0.59ms | -7.43% |
| max | 9.32ms | 10.71ms | -1.39ms | -12.94% |
| total | 1784.08ms | 1781.63ms | +2.46ms | +0.14% |

### langchainInvoke

# Perf Report — langchainInvoke.serial

| metric | value |
|---|---|
| iterations | 200 |
| warmup | 5 |
| p10 | 8.34ms |
| p50 | 9.08ms |
| p95 | 9.17ms |
| p99 | 10.15ms |
| mean | 8.97ms |
| stdev | 0.45ms |
| min | 7.20ms |
| max | 12.67ms |
| total | 1794.80ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 8.34ms | 8.19ms | +0.15ms | +1.84% |
| p50 | 9.08ms | 9.08ms | +0.0053ms | +0.06% |
| p95 | 9.17ms | 9.38ms | -0.21ms | -2.24% |
| p99 | 10.15ms | 9.92ms | +0.23ms | +2.35% |
| mean | 8.97ms | 8.89ms | +0.08ms | +0.95% |
| min | 7.20ms | 7.11ms | +0.09ms | +1.26% |
| max | 12.67ms | 11.03ms | +1.64ms | +14.88% |
| total | 1794.80ms | 1777.91ms | +16.89ms | +0.95% |

