# Perf Suite — ai-llm

Threshold source: [docs/quality/perf-thresholds.md](../../quality/perf-thresholds)

## Serial p95 (concurrency = 1)

| op | p95 | cap | gate | regression |
|---|---|---|---|---|
| anthropicMessagesCreate | 9.39ms | 40ms | PASS | stable — gate 無効 (regressionGate=false) |
| openAiChatCompletionsCreate | 10.79ms | 40ms | PASS | improved — gate 無効 (regressionGate=false) |
| vercelGenerateText | 9.78ms | 40ms | PASS | stable — gate 無効 (regressionGate=false) |
| langchainInvoke | 10.23ms | 40ms | PASS | improved — gate 無効 (regressionGate=false) |

## Concurrent p95 (concurrency = 10, 50 iter each)

| op | p95 | cap | gate |
|---|---|---|---|
| anthropicMessagesCreate | 9.30ms | 80ms | PASS |
| openAiChatCompletionsCreate | 10.00ms | 80ms | PASS |
| vercelGenerateText | 10.71ms | 80ms | PASS |
| langchainInvoke | 9.77ms | 80ms | PASS |

## Memory retention (200 iter, arrayBuffers axis is the gate; heap is informational)

| op | heapUsed Δ | arrayBuffers Δ | cap | gc exposed | verdict |
|---|---|---|---|---|---|
| anthropicMessagesCreate | 28824 B | 0 B | 102400 B | yes | PASS |
| openAiChatCompletionsCreate | 4064 B | 0 B | 102400 B | yes | PASS |
| vercelGenerateText | 6184 B | 0 B | 102400 B | yes | PASS |
| langchainInvoke | 4160 B | 0 B | 102400 B | yes | PASS |

## Detailed serial reports

### anthropicMessagesCreate

# Perf Report — anthropicMessagesCreate.serial

| metric | value |
|---|---|
| iterations | 200 |
| warmup | 5 |
| p50 | 9.11ms |
| p95 | 9.39ms |
| p99 | 10.12ms |
| mean | 8.95ms |
| stdev | 0.46ms |
| min | 7.46ms |
| max | 10.82ms |
| total | 1790.26ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p50 | 9.11ms | 9.12ms | -0.01ms | -0.10% |
| p95 | 9.39ms | 9.38ms | +0.01ms | +0.14% |
| p99 | 10.12ms | 10.77ms | -0.65ms | -6.05% |
| mean | 8.95ms | 8.97ms | -0.02ms | -0.19% |
| min | 7.46ms | 7.41ms | +0.06ms | +0.78% |
| max | 10.82ms | 11.68ms | -0.86ms | -7.34% |
| total | 1790.26ms | 1793.69ms | -3.43ms | -0.19% |

### openAiChatCompletionsCreate

# Perf Report — openAiChatCompletionsCreate.serial

| metric | value |
|---|---|
| iterations | 200 |
| warmup | 5 |
| p50 | 9.13ms |
| p95 | 10.79ms |
| p99 | 14.40ms |
| mean | 9.35ms |
| stdev | 1.29ms |
| min | 7.35ms |
| max | 19.63ms |
| total | 1869.69ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p50 | 9.13ms | 9.62ms | -0.49ms | -5.12% |
| p95 | 10.79ms | 19.59ms | -8.80ms | -44.92% |
| p99 | 14.40ms | 28.25ms | -13.85ms | -49.02% |
| mean | 9.35ms | 11.37ms | -2.02ms | -17.79% |
| min | 7.35ms | 7.43ms | -0.08ms | -1.09% |
| max | 19.63ms | 30.33ms | -10.71ms | -35.29% |
| total | 1869.69ms | 2274.38ms | -404.69ms | -17.79% |

### vercelGenerateText

# Perf Report — vercelGenerateText.serial

| metric | value |
|---|---|
| iterations | 200 |
| warmup | 5 |
| p50 | 9.13ms |
| p95 | 9.78ms |
| p99 | 10.36ms |
| mean | 9.02ms |
| stdev | 0.50ms |
| min | 7.72ms |
| max | 11.07ms |
| total | 1804.93ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p50 | 9.13ms | 9.10ms | +0.02ms | +0.24% |
| p95 | 9.78ms | 10.19ms | -0.40ms | -3.96% |
| p99 | 10.36ms | 12.23ms | -1.87ms | -15.28% |
| mean | 9.02ms | 9.11ms | -0.09ms | -0.93% |
| min | 7.72ms | 7.39ms | +0.33ms | +4.49% |
| max | 11.07ms | 16.42ms | -5.35ms | -32.58% |
| total | 1804.93ms | 1821.93ms | -17.00ms | -0.93% |

### langchainInvoke

# Perf Report — langchainInvoke.serial

| metric | value |
|---|---|
| iterations | 200 |
| warmup | 5 |
| p50 | 9.15ms |
| p95 | 10.23ms |
| p99 | 12.49ms |
| mean | 9.19ms |
| stdev | 0.71ms |
| min | 7.80ms |
| max | 12.91ms |
| total | 1838.53ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p50 | 9.15ms | 9.21ms | -0.06ms | -0.69% |
| p95 | 10.23ms | 13.16ms | -2.94ms | -22.32% |
| p99 | 12.49ms | 20.88ms | -8.39ms | -40.18% |
| mean | 9.19ms | 9.91ms | -0.72ms | -7.22% |
| min | 7.80ms | 7.41ms | +0.38ms | +5.19% |
| max | 12.91ms | 27.41ms | -14.49ms | -52.88% |
| total | 1838.53ms | 1981.58ms | -143.04ms | -7.22% |

