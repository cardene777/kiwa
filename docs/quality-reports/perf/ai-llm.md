# Perf Suite — ai-llm

Threshold source: [docs/quality/perf-thresholds.md](../../quality/perf-thresholds)

## Serial p95 (concurrency = 1)

| op | p95 | cap | gate | regression |
|---|---|---|---|---|
| anthropicMessagesCreate | 9.11ms | 40ms | PASS | stable |
| openAiChatCompletionsCreate | 10.63ms | 40ms | PASS | stable |
| vercelGenerateText | 9.10ms | 40ms | PASS | stable |
| langchainInvoke | 9.27ms | 40ms | PASS | stable |

## Concurrent p95 (concurrency = 10, 50 iter each)

| op | p95 | cap | gate |
|---|---|---|---|
| anthropicMessagesCreate | 9.21ms | 80ms | PASS |
| openAiChatCompletionsCreate | 9.15ms | 80ms | PASS |
| vercelGenerateText | 9.13ms | 80ms | PASS |
| langchainInvoke | 9.14ms | 80ms | PASS |

## Memory retention (200 iter, arrayBuffers axis is the gate; heap is informational)

| op | heapUsed Δ | arrayBuffers Δ | cap | verdict |
|---|---|---|---|---|
| anthropicMessagesCreate | 984704 B | 0 B | 102400 B | PASS |
| openAiChatCompletionsCreate | -681992 B | -8192 B | 102400 B | PASS |
| vercelGenerateText | -802056 B | 0 B | 102400 B | PASS |
| langchainInvoke | -139872 B | 0 B | 102400 B | PASS |

## Detailed serial reports

### anthropicMessagesCreate

# Perf Report — anthropicMessagesCreate.serial

| metric | value |
|---|---|
| iterations | 200 |
| warmup | 5 |
| p50 | 9.06ms |
| p95 | 9.11ms |
| p99 | 9.16ms |
| mean | 8.94ms |
| stdev | 0.30ms |
| min | 7.10ms |
| max | 9.68ms |
| total | 1788.59ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p50 | 9.06ms | 9.08ms | -0.01ms | -0.15% |
| p95 | 9.11ms | 9.18ms | -0.07ms | -0.75% |
| p99 | 9.16ms | 9.24ms | -0.08ms | -0.91% |
| mean | 8.94ms | 8.95ms | -0.01ms | -0.09% |
| min | 7.10ms | 7.20ms | -0.10ms | -1.40% |
| max | 9.68ms | 9.42ms | +0.26ms | +2.76% |
| total | 1788.59ms | 1790.19ms | -1.60ms | -0.09% |

### openAiChatCompletionsCreate

# Perf Report — openAiChatCompletionsCreate.serial

| metric | value |
|---|---|
| iterations | 200 |
| warmup | 5 |
| p50 | 9.07ms |
| p95 | 10.63ms |
| p99 | 12.65ms |
| mean | 9.16ms |
| stdev | 0.83ms |
| min | 7.74ms |
| max | 14.79ms |
| total | 1831.10ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p50 | 9.07ms | 9.07ms | -0.00ms | -0.01% |
| p95 | 10.63ms | 9.13ms | +1.50ms | +16.39% |
| p99 | 12.65ms | 9.30ms | +3.35ms | +36.02% |
| mean | 9.16ms | 9.02ms | +0.14ms | +1.55% |
| min | 7.74ms | 7.92ms | -0.18ms | -2.23% |
| max | 14.79ms | 14.79ms | +0.00ms | +0.01% |
| total | 1831.10ms | 1803.22ms | +27.88ms | +1.55% |

### vercelGenerateText

# Perf Report — vercelGenerateText.serial

| metric | value |
|---|---|
| iterations | 200 |
| warmup | 5 |
| p50 | 9.05ms |
| p95 | 9.10ms |
| p99 | 9.18ms |
| mean | 8.96ms |
| stdev | 0.25ms |
| min | 7.85ms |
| max | 9.43ms |
| total | 1792.10ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p50 | 9.05ms | 9.08ms | -0.03ms | -0.34% |
| p95 | 9.10ms | 10.33ms | -1.23ms | -11.95% |
| p99 | 9.18ms | 11.90ms | -2.73ms | -22.92% |
| mean | 8.96ms | 9.14ms | -0.18ms | -1.98% |
| min | 7.85ms | 7.45ms | +0.40ms | +5.36% |
| max | 9.43ms | 15.05ms | -5.62ms | -37.32% |
| total | 1792.10ms | 1828.35ms | -36.25ms | -1.98% |

### langchainInvoke

# Perf Report — langchainInvoke.serial

| metric | value |
|---|---|
| iterations | 200 |
| warmup | 5 |
| p50 | 9.06ms |
| p95 | 9.27ms |
| p99 | 9.81ms |
| mean | 9.02ms |
| stdev | 1.10ms |
| min | 7.46ms |
| max | 21.58ms |
| total | 1804.09ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p50 | 9.06ms | 9.07ms | -0.01ms | -0.14% |
| p95 | 9.27ms | 9.68ms | -0.41ms | -4.26% |
| p99 | 9.81ms | 10.27ms | -0.46ms | -4.45% |
| mean | 9.02ms | 9.03ms | -0.01ms | -0.07% |
| min | 7.46ms | 7.79ms | -0.33ms | -4.29% |
| max | 21.58ms | 11.11ms | +10.47ms | +94.18% |
| total | 1804.09ms | 1805.41ms | -1.32ms | -0.07% |

