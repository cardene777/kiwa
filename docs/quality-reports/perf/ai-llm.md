# Perf Suite — ai-llm

Threshold source: [docs/quality/perf-thresholds.md](../../quality/perf-thresholds)

## Serial p95 (concurrency = 1)

| op | p95 | cap | gate | regression |
|---|---|---|---|---|
| anthropicMessagesCreate | 9.10ms | 40ms | PASS | stable |
| openAiChatCompletionsCreate | 9.09ms | 40ms | PASS | stable |
| vercelGenerateText | 9.12ms | 40ms | PASS | stable |
| langchainInvoke | 9.10ms | 40ms | PASS | stable |

## Concurrent p95 (concurrency = 10, 50 iter each)

| op | p95 | cap | gate |
|---|---|---|---|
| anthropicMessagesCreate | 9.17ms | 80ms | PASS |
| openAiChatCompletionsCreate | 9.12ms | 80ms | PASS |
| vercelGenerateText | 9.32ms | 80ms | PASS |
| langchainInvoke | 9.11ms | 80ms | PASS |

## Memory retention (200 iter, arrayBuffers axis is the gate; heap is informational)

| op | heapUsed Δ | arrayBuffers Δ | cap | gc exposed | verdict |
|---|---|---|---|---|---|
| anthropicMessagesCreate | 28232 B | 0 B | 102400 B | yes | PASS |
| openAiChatCompletionsCreate | -11696 B | 0 B | 102400 B | yes | PASS |
| vercelGenerateText | 5920 B | 0 B | 102400 B | yes | PASS |
| langchainInvoke | 2984 B | 0 B | 102400 B | yes | PASS |

## Detailed serial reports

### anthropicMessagesCreate

# Perf Report — anthropicMessagesCreate.serial

| metric | value |
|---|---|
| iterations | 200 |
| warmup | 5 |
| p50 | 9.05ms |
| p95 | 9.10ms |
| p99 | 9.11ms |
| mean | 8.81ms |
| stdev | 0.44ms |
| min | 7.40ms |
| max | 11.91ms |
| total | 1761.87ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p50 | 9.05ms | 9.04ms | +0.01ms | +0.11% |
| p95 | 9.10ms | 9.11ms | -0.00ms | -0.05% |
| p99 | 9.11ms | 9.18ms | -0.07ms | -0.77% |
| mean | 8.81ms | 8.81ms | +0.00ms | +0.00% |
| min | 7.40ms | 7.48ms | -0.09ms | -1.16% |
| max | 11.91ms | 9.62ms | +2.29ms | +23.85% |
| total | 1761.87ms | 1761.78ms | +0.08ms | +0.00% |

### openAiChatCompletionsCreate

# Perf Report — openAiChatCompletionsCreate.serial

| metric | value |
|---|---|
| iterations | 200 |
| warmup | 5 |
| p50 | 9.05ms |
| p95 | 9.09ms |
| p99 | 9.12ms |
| mean | 8.87ms |
| stdev | 0.31ms |
| min | 7.63ms |
| max | 9.19ms |
| total | 1773.72ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p50 | 9.05ms | 9.06ms | -0.01ms | -0.14% |
| p95 | 9.09ms | 9.18ms | -0.09ms | -0.96% |
| p99 | 9.12ms | 9.76ms | -0.63ms | -6.51% |
| mean | 8.87ms | 8.86ms | +0.01ms | +0.12% |
| min | 7.63ms | 7.93ms | -0.30ms | -3.76% |
| max | 9.19ms | 10.48ms | -1.28ms | -12.25% |
| total | 1773.72ms | 1771.58ms | +2.14ms | +0.12% |

### vercelGenerateText

# Perf Report — vercelGenerateText.serial

| metric | value |
|---|---|
| iterations | 200 |
| warmup | 5 |
| p50 | 9.07ms |
| p95 | 9.12ms |
| p99 | 9.44ms |
| mean | 8.86ms |
| stdev | 0.41ms |
| min | 7.30ms |
| max | 10.45ms |
| total | 1772.89ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p50 | 9.07ms | 8.84ms | +0.23ms | +2.61% |
| p95 | 9.12ms | 11.27ms | -2.15ms | -19.08% |
| p99 | 9.44ms | 17.24ms | -7.80ms | -45.26% |
| mean | 8.86ms | 9.14ms | -0.28ms | -3.02% |
| min | 7.30ms | 7.19ms | +0.11ms | +1.54% |
| max | 10.45ms | 20.98ms | -10.54ms | -50.22% |
| total | 1772.89ms | 1828.07ms | -55.17ms | -3.02% |

### langchainInvoke

# Perf Report — langchainInvoke.serial

| metric | value |
|---|---|
| iterations | 200 |
| warmup | 5 |
| p50 | 9.05ms |
| p95 | 9.10ms |
| p99 | 9.12ms |
| mean | 8.82ms |
| stdev | 0.39ms |
| min | 7.23ms |
| max | 9.13ms |
| total | 1764.87ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p50 | 9.05ms | 9.06ms | -0.01ms | -0.11% |
| p95 | 9.10ms | 9.11ms | -0.01ms | -0.11% |
| p99 | 9.12ms | 9.18ms | -0.06ms | -0.64% |
| mean | 8.82ms | 8.86ms | -0.04ms | -0.43% |
| min | 7.23ms | 7.93ms | -0.70ms | -8.88% |
| max | 9.13ms | 9.34ms | -0.21ms | -2.27% |
| total | 1764.87ms | 1772.55ms | -7.68ms | -0.43% |

