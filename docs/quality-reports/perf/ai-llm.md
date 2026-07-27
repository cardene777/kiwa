# Perf Suite — ai-llm

Threshold source: [docs/quality/perf-thresholds.md](../../quality/perf-thresholds)

## Serial p95 (concurrency = 1)

| op | p95 | cap | gate | regression |
|---|---|---|---|---|
| anthropicMessagesCreate | 10.11ms | 40ms | PASS | stable |
| openAiChatCompletionsCreate | 10.11ms | 40ms | PASS | stable |
| vercelGenerateText | 10.12ms | 40ms | PASS | stable |
| langchainInvoke | 10.09ms | 40ms | PASS | stable |

## Concurrent p95 (concurrency = 10, 50 iter each)

| op | p95 | cap | gate |
|---|---|---|---|
| anthropicMessagesCreate | 10.76ms | 80ms | PASS |
| openAiChatCompletionsCreate | 10.14ms | 80ms | PASS |
| vercelGenerateText | 10.14ms | 80ms | PASS |
| langchainInvoke | 10.12ms | 80ms | PASS |

## Memory retention (200 iter, arrayBuffers axis is the gate; heap is informational)

| op | heapUsed Δ | arrayBuffers Δ | cap | gc exposed | verdict |
|---|---|---|---|---|---|
| anthropicMessagesCreate | 26728 B | 0 B | 102400 B | yes | PASS |
| openAiChatCompletionsCreate | 4264 B | 0 B | 102400 B | yes | PASS |
| vercelGenerateText | 4912 B | 0 B | 102400 B | yes | PASS |
| langchainInvoke | 3992 B | 0 B | 102400 B | yes | PASS |

## Detailed serial reports

### anthropicMessagesCreate

# Perf Report — anthropicMessagesCreate.serial

| metric | value |
|---|---|
| iterations | 200 |
| warmup | 5 |
| p50 | 9.86ms |
| p95 | 10.11ms |
| p99 | 10.14ms |
| mean | 9.46ms |
| stdev | 0.70ms |
| min | 8.04ms |
| max | 10.18ms |
| total | 1892.53ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p50 | 9.86ms | 9.04ms | +0.82ms | +9.06% |
| p95 | 10.11ms | 9.11ms | +1.00ms | +11.00% |
| p99 | 10.14ms | 9.18ms | +0.96ms | +10.41% |
| mean | 9.46ms | 8.81ms | +0.65ms | +7.42% |
| min | 8.04ms | 7.48ms | +0.56ms | +7.44% |
| max | 10.18ms | 9.62ms | +0.56ms | +5.79% |
| total | 1892.53ms | 1761.78ms | +130.74ms | +7.42% |

### openAiChatCompletionsCreate

# Perf Report — openAiChatCompletionsCreate.serial

| metric | value |
|---|---|
| iterations | 200 |
| warmup | 5 |
| p50 | 10.05ms |
| p95 | 10.11ms |
| p99 | 10.13ms |
| mean | 9.54ms |
| stdev | 0.68ms |
| min | 8.08ms |
| max | 10.53ms |
| total | 1907.82ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p50 | 10.05ms | 9.06ms | +0.99ms | +10.90% |
| p95 | 10.11ms | 9.18ms | +0.93ms | +10.10% |
| p99 | 10.13ms | 9.76ms | +0.37ms | +3.84% |
| mean | 9.54ms | 8.86ms | +0.68ms | +7.69% |
| min | 8.08ms | 7.93ms | +0.15ms | +1.84% |
| max | 10.53ms | 10.48ms | +0.05ms | +0.50% |
| total | 1907.82ms | 1771.58ms | +136.24ms | +7.69% |

### vercelGenerateText

# Perf Report — vercelGenerateText.serial

| metric | value |
|---|---|
| iterations | 200 |
| warmup | 5 |
| p50 | 10.07ms |
| p95 | 10.12ms |
| p99 | 10.67ms |
| mean | 9.61ms |
| stdev | 0.77ms |
| min | 7.56ms |
| max | 13.33ms |
| total | 1921.98ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p50 | 10.07ms | 8.84ms | +1.24ms | +13.99% |
| p95 | 10.12ms | 11.27ms | -1.15ms | -10.20% |
| p99 | 10.67ms | 17.24ms | -6.58ms | -38.13% |
| mean | 9.61ms | 9.14ms | +0.47ms | +5.14% |
| min | 7.56ms | 7.19ms | +0.37ms | +5.12% |
| max | 13.33ms | 20.98ms | -7.66ms | -36.50% |
| total | 1921.98ms | 1828.07ms | +93.91ms | +5.14% |

### langchainInvoke

# Perf Report — langchainInvoke.serial

| metric | value |
|---|---|
| iterations | 200 |
| warmup | 5 |
| p50 | 10.04ms |
| p95 | 10.09ms |
| p99 | 10.12ms |
| mean | 9.54ms |
| stdev | 0.66ms |
| min | 7.87ms |
| max | 10.13ms |
| total | 1908.64ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p50 | 10.04ms | 9.06ms | +0.97ms | +10.75% |
| p95 | 10.09ms | 9.11ms | +0.98ms | +10.79% |
| p99 | 10.12ms | 9.18ms | +0.94ms | +10.20% |
| mean | 9.54ms | 8.86ms | +0.68ms | +7.68% |
| min | 7.87ms | 7.93ms | -0.06ms | -0.81% |
| max | 10.13ms | 9.34ms | +0.79ms | +8.45% |
| total | 1908.64ms | 1772.55ms | +136.09ms | +7.68% |

