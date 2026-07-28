# Perf Suite — ai-llm

Threshold source: [docs/quality/perf-thresholds.md](../../quality/perf-thresholds)

## Serial p95 (concurrency = 1)

| op | p95 | cap | gate | regression |
|---|---|---|---|---|
| anthropicMessagesCreate | 12.45ms | 40ms | PASS | regressed |
| openAiChatCompletionsCreate | 9.74ms | 40ms | PASS | improved |
| vercelGenerateText | 9.12ms | 40ms | PASS | stable |
| langchainInvoke | 9.67ms | 40ms | PASS | improved |

## Concurrent p95 (concurrency = 10, 50 iter each)

| op | p95 | cap | gate |
|---|---|---|---|
| anthropicMessagesCreate | 10.42ms | 80ms | PASS |
| openAiChatCompletionsCreate | 9.17ms | 80ms | PASS |
| vercelGenerateText | 9.15ms | 80ms | PASS |
| langchainInvoke | 9.26ms | 80ms | PASS |

## Memory retention (200 iter, arrayBuffers axis is the gate; heap is informational)

| op | heapUsed Δ | arrayBuffers Δ | cap | gc exposed | verdict |
|---|---|---|---|---|---|
| anthropicMessagesCreate | 29240 B | -8192 B | 102400 B | yes | PASS |
| openAiChatCompletionsCreate | -12904 B | 0 B | 102400 B | yes | PASS |
| vercelGenerateText | 6184 B | 0 B | 102400 B | yes | PASS |
| langchainInvoke | 2784 B | 0 B | 102400 B | yes | PASS |

## Detailed serial reports

### anthropicMessagesCreate

# Perf Report — anthropicMessagesCreate.serial

| metric | value |
|---|---|
| iterations | 200 |
| warmup | 5 |
| p50 | 9.13ms |
| p95 | 12.45ms |
| p99 | 13.94ms |
| mean | 9.47ms |
| stdev | 1.72ms |
| min | 7.26ms |
| max | 26.06ms |
| total | 1894.80ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p50 | 9.13ms | 9.12ms | +0.02ms | +0.18% |
| p95 | 12.45ms | 9.38ms | +3.07ms | +32.80% |
| p99 | 13.94ms | 10.77ms | +3.17ms | +29.46% |
| mean | 9.47ms | 8.97ms | +0.51ms | +5.64% |
| min | 7.26ms | 7.41ms | -0.14ms | -1.95% |
| max | 26.06ms | 11.68ms | +14.38ms | +123.10% |
| total | 1894.80ms | 1793.69ms | +101.11ms | +5.64% |

### openAiChatCompletionsCreate

# Perf Report — openAiChatCompletionsCreate.serial

| metric | value |
|---|---|
| iterations | 200 |
| warmup | 5 |
| p50 | 9.10ms |
| p95 | 9.74ms |
| p99 | 10.65ms |
| mean | 8.97ms |
| stdev | 0.57ms |
| min | 7.13ms |
| max | 12.29ms |
| total | 1794.24ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p50 | 9.10ms | 9.62ms | -0.52ms | -5.44% |
| p95 | 9.74ms | 19.59ms | -9.85ms | -50.28% |
| p99 | 10.65ms | 28.25ms | -17.60ms | -62.29% |
| mean | 8.97ms | 11.37ms | -2.40ms | -21.11% |
| min | 7.13ms | 7.43ms | -0.29ms | -3.96% |
| max | 12.29ms | 30.33ms | -18.04ms | -59.47% |
| total | 1794.24ms | 2274.38ms | -480.15ms | -21.11% |

### vercelGenerateText

# Perf Report — vercelGenerateText.serial

| metric | value |
|---|---|
| iterations | 200 |
| warmup | 5 |
| p50 | 9.07ms |
| p95 | 9.12ms |
| p99 | 9.14ms |
| mean | 8.84ms |
| stdev | 0.35ms |
| min | 7.36ms |
| max | 9.19ms |
| total | 1767.82ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p50 | 9.07ms | 9.10ms | -0.04ms | -0.40% |
| p95 | 9.12ms | 10.19ms | -1.07ms | -10.50% |
| p99 | 9.14ms | 12.23ms | -3.10ms | -25.32% |
| mean | 8.84ms | 9.11ms | -0.27ms | -2.97% |
| min | 7.36ms | 7.39ms | -0.04ms | -0.50% |
| max | 9.19ms | 16.42ms | -7.23ms | -44.03% |
| total | 1767.82ms | 1821.93ms | -54.11ms | -2.97% |

### langchainInvoke

# Perf Report — langchainInvoke.serial

| metric | value |
|---|---|
| iterations | 200 |
| warmup | 5 |
| p50 | 9.08ms |
| p95 | 9.67ms |
| p99 | 10.55ms |
| mean | 8.98ms |
| stdev | 0.58ms |
| min | 7.61ms |
| max | 13.97ms |
| total | 1795.33ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p50 | 9.08ms | 9.21ms | -0.13ms | -1.40% |
| p95 | 9.67ms | 13.16ms | -3.49ms | -26.52% |
| p99 | 10.55ms | 20.88ms | -10.33ms | -49.48% |
| mean | 8.98ms | 9.91ms | -0.93ms | -9.40% |
| min | 7.61ms | 7.41ms | +0.19ms | +2.61% |
| max | 13.97ms | 27.41ms | -13.43ms | -49.02% |
| total | 1795.33ms | 1981.58ms | -186.25ms | -9.40% |

