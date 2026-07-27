# Perf Suite — ai-llm

Threshold source: [docs/quality/perf-thresholds.md](../../quality/perf-thresholds)

## Serial p95 (concurrency = 1)

| op | p95 | cap | gate | regression |
|---|---|---|---|---|
| anthropicMessagesCreate | 9.12ms | 40ms | PASS | stable |
| openAiChatCompletionsCreate | 9.15ms | 40ms | PASS | stable |
| vercelGenerateText | 9.12ms | 40ms | PASS | stable |
| langchainInvoke | 9.09ms | 40ms | PASS | stable |

## Concurrent p95 (concurrency = 10, 50 iter each)

| op | p95 | cap | gate |
|---|---|---|---|
| anthropicMessagesCreate | 9.16ms | 80ms | PASS |
| openAiChatCompletionsCreate | 9.16ms | 80ms | PASS |
| vercelGenerateText | 9.18ms | 80ms | PASS |
| langchainInvoke | 9.16ms | 80ms | PASS |

## Memory retention (200 iter, arrayBuffers axis is the gate; heap is informational)

| op | heapUsed Δ | arrayBuffers Δ | cap | gc exposed | verdict |
|---|---|---|---|---|---|
| anthropicMessagesCreate | 26432 B | 0 B | 102400 B | yes | PASS |
| openAiChatCompletionsCreate | 4264 B | 0 B | 102400 B | yes | PASS |
| vercelGenerateText | 5776 B | 0 B | 102400 B | yes | PASS |
| langchainInvoke | 4440 B | 0 B | 102400 B | yes | PASS |

## Detailed serial reports

### anthropicMessagesCreate

# Perf Report — anthropicMessagesCreate.serial

| metric | value |
|---|---|
| iterations | 200 |
| warmup | 5 |
| p50 | 9.07ms |
| p95 | 9.12ms |
| p99 | 9.16ms |
| mean | 8.85ms |
| stdev | 0.38ms |
| min | 7.12ms |
| max | 9.39ms |
| total | 1770.74ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p50 | 9.07ms | 9.04ms | +0.03ms | +0.35% |
| p95 | 9.12ms | 9.11ms | +0.01ms | +0.13% |
| p99 | 9.16ms | 9.18ms | -0.02ms | -0.20% |
| mean | 8.85ms | 8.81ms | +0.04ms | +0.51% |
| min | 7.12ms | 7.48ms | -0.37ms | -4.90% |
| max | 9.39ms | 9.62ms | -0.23ms | -2.37% |
| total | 1770.74ms | 1761.78ms | +8.95ms | +0.51% |

### openAiChatCompletionsCreate

# Perf Report — openAiChatCompletionsCreate.serial

| metric | value |
|---|---|
| iterations | 200 |
| warmup | 5 |
| p50 | 9.09ms |
| p95 | 9.15ms |
| p99 | 9.16ms |
| mean | 8.91ms |
| stdev | 0.34ms |
| min | 7.74ms |
| max | 9.26ms |
| total | 1781.95ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p50 | 9.09ms | 9.06ms | +0.03ms | +0.30% |
| p95 | 9.15ms | 9.18ms | -0.04ms | -0.41% |
| p99 | 9.16ms | 9.76ms | -0.60ms | -6.13% |
| mean | 8.91ms | 8.86ms | +0.05ms | +0.59% |
| min | 7.74ms | 7.93ms | -0.19ms | -2.42% |
| max | 9.26ms | 10.48ms | -1.22ms | -11.64% |
| total | 1781.95ms | 1771.58ms | +10.37ms | +0.59% |

### vercelGenerateText

# Perf Report — vercelGenerateText.serial

| metric | value |
|---|---|
| iterations | 200 |
| warmup | 5 |
| p50 | 9.06ms |
| p95 | 9.12ms |
| p99 | 9.14ms |
| mean | 8.93ms |
| stdev | 0.31ms |
| min | 7.91ms |
| max | 9.72ms |
| total | 1785.29ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p50 | 9.06ms | 8.84ms | +0.23ms | +2.59% |
| p95 | 9.12ms | 11.27ms | -2.15ms | -19.07% |
| p99 | 9.14ms | 17.24ms | -8.10ms | -46.99% |
| mean | 8.93ms | 9.14ms | -0.21ms | -2.34% |
| min | 7.91ms | 7.19ms | +0.72ms | +10.04% |
| max | 9.72ms | 20.98ms | -11.26ms | -53.66% |
| total | 1785.29ms | 1828.07ms | -42.78ms | -2.34% |

### langchainInvoke

# Perf Report — langchainInvoke.serial

| metric | value |
|---|---|
| iterations | 200 |
| warmup | 5 |
| p50 | 9.06ms |
| p95 | 9.09ms |
| p99 | 9.12ms |
| mean | 8.87ms |
| stdev | 0.36ms |
| min | 7.25ms |
| max | 9.15ms |
| total | 1774.27ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p50 | 9.06ms | 9.06ms | -0.00ms | -0.01% |
| p95 | 9.09ms | 9.11ms | -0.01ms | -0.14% |
| p99 | 9.12ms | 9.18ms | -0.06ms | -0.64% |
| mean | 8.87ms | 8.86ms | +0.01ms | +0.10% |
| min | 7.25ms | 7.93ms | -0.68ms | -8.60% |
| max | 9.15ms | 9.34ms | -0.19ms | -2.08% |
| total | 1774.27ms | 1772.55ms | +1.72ms | +0.10% |

