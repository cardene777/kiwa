# Perf Suite — ai-llm

Threshold source: [docs/quality/perf-thresholds.md](../../quality/perf-thresholds)

## Serial p95 (concurrency = 1)

| op | p95 | cap | gate | regression |
|---|---|---|---|---|
| anthropicMessagesCreate | 9.18ms | 40ms | PASS | n/a (baseline seeded) |
| openAiChatCompletionsCreate | 9.13ms | 40ms | PASS | n/a (baseline seeded) |
| vercelGenerateText | 10.33ms | 40ms | PASS | n/a (baseline seeded) |
| langchainInvoke | 9.68ms | 40ms | PASS | n/a (baseline seeded) |

## Concurrent p95 (concurrency = 10, 50 iter each)

| op | p95 | cap | gate |
|---|---|---|---|
| anthropicMessagesCreate | 9.22ms | 80ms | PASS |
| openAiChatCompletionsCreate | 9.12ms | 80ms | PASS |
| vercelGenerateText | 16.28ms | 80ms | PASS |
| langchainInvoke | 9.12ms | 80ms | PASS |

## Memory retention (200 iter, arrayBuffers axis is the gate; heap is informational)

| op | heapUsed Δ | arrayBuffers Δ | cap | verdict |
|---|---|---|---|---|
| anthropicMessagesCreate | 924080 B | 0 B | 102400 B | PASS |
| openAiChatCompletionsCreate | -2240256 B | 0 B | 102400 B | PASS |
| vercelGenerateText | 90312 B | 0 B | 102400 B | PASS |
| langchainInvoke | -712824 B | 0 B | 102400 B | PASS |

## Detailed serial reports

### anthropicMessagesCreate

# Perf Report — anthropicMessagesCreate.serial

| metric | value |
|---|---|
| iterations | 200 |
| warmup | 5 |
| p50 | 9.08ms |
| p95 | 9.18ms |
| p99 | 9.24ms |
| mean | 8.95ms |
| stdev | 0.35ms |
| min | 7.20ms |
| max | 9.42ms |
| total | 1790.19ms |

### openAiChatCompletionsCreate

# Perf Report — openAiChatCompletionsCreate.serial

| metric | value |
|---|---|
| iterations | 200 |
| warmup | 5 |
| p50 | 9.07ms |
| p95 | 9.13ms |
| p99 | 9.30ms |
| mean | 9.02ms |
| stdev | 0.49ms |
| min | 7.92ms |
| max | 14.79ms |
| total | 1803.22ms |

### vercelGenerateText

# Perf Report — vercelGenerateText.serial

| metric | value |
|---|---|
| iterations | 200 |
| warmup | 5 |
| p50 | 9.08ms |
| p95 | 10.33ms |
| p99 | 11.90ms |
| mean | 9.14ms |
| stdev | 0.78ms |
| min | 7.45ms |
| max | 15.05ms |
| total | 1828.35ms |

### langchainInvoke

# Perf Report — langchainInvoke.serial

| metric | value |
|---|---|
| iterations | 200 |
| warmup | 5 |
| p50 | 9.07ms |
| p95 | 9.68ms |
| p99 | 10.27ms |
| mean | 9.03ms |
| stdev | 0.43ms |
| min | 7.79ms |
| max | 11.11ms |
| total | 1805.41ms |

