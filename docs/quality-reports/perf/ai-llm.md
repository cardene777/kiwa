# Perf Suite — ai-llm

Threshold source: [docs/quality/perf-thresholds.md](../../quality/perf-thresholds)

測定系の分解能 = 0.00021ms (何もしない関数を同じ経路で呼んだ時の p10)。 回帰判定の絶対下限は既定でこの 2 倍 = 0.00042ms、 op ごとの実効値は下表の「下限」 列。

## Serial (concurrency = 1)

| op | p10 (回帰判定) | p95 (上限判定) | cap | 下限 | gate | regression |
|---|---|---|---|---|---|---|
| anthropicMessagesCreate | 8.77ms | 11.28ms | 40ms | 0.00042ms | PASS | stable (p10 +5% (閾値未満)、 p95 +24% (裾は実行間の振れ幅と区別できないため判定には使わない)) — gate 無効 (regressionGate=false) |
| openAiChatCompletionsCreate | 8.47ms | 10.55ms | 40ms | 0.00042ms | PASS | stable — gate 無効 (regressionGate=false) |
| vercelGenerateText | 8.49ms | 11.04ms | 40ms | 0.00042ms | PASS | stable (p10 +3% (閾値未満)、 p95 +20% (裾は実行間の振れ幅と区別できないため判定には使わない)) — gate 無効 (regressionGate=false) |
| langchainInvoke | 8.45ms | 10.87ms | 40ms | 0.00042ms | PASS | stable — gate 無効 (regressionGate=false) |

## Concurrent p95 (concurrency = 10, 50 iter each)

| op | p95 | cap | gate |
|---|---|---|---|
| anthropicMessagesCreate | 11.11ms | 80ms | PASS |
| openAiChatCompletionsCreate | 10.17ms | 80ms | PASS |
| vercelGenerateText | 13.09ms | 80ms | PASS |
| langchainInvoke | 10.63ms | 80ms | PASS |

## Memory retention (200 iter, arrayBuffers axis is the gate; heap is informational)

| op | heapUsed Δ | arrayBuffers Δ | cap | gc exposed | verdict |
|---|---|---|---|---|---|
| anthropicMessagesCreate | 30944 B | -8192 B | 102400 B | yes | PASS |
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
| p10 | 8.77ms |
| p50 | 9.86ms |
| p95 | 11.28ms |
| p99 | 11.69ms |
| mean | 9.86ms |
| stdev | 0.92ms |
| min | 7.49ms |
| max | 14.18ms |
| total | 1971.66ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 8.77ms | 8.37ms | +0.40ms | +4.81% |
| p50 | 9.86ms | 9.09ms | +0.77ms | +8.50% |
| p95 | 11.28ms | 9.13ms | +2.15ms | +23.51% |
| p99 | 11.69ms | 9.18ms | +2.52ms | +27.40% |
| mean | 9.86ms | 8.92ms | +0.94ms | +10.48% |
| min | 7.49ms | 7.43ms | +0.06ms | +0.78% |
| max | 14.18ms | 9.18ms | +5.00ms | +54.50% |
| total | 1971.66ms | 1784.62ms | +187.04ms | +10.48% |

### openAiChatCompletionsCreate

# Perf Report — openAiChatCompletionsCreate.serial

| metric | value |
|---|---|
| iterations | 200 |
| warmup | 5 |
| p10 | 8.47ms |
| p50 | 10.06ms |
| p95 | 10.55ms |
| p99 | 11.03ms |
| mean | 9.67ms |
| stdev | 0.80ms |
| min | 8.12ms |
| max | 13.93ms |
| total | 1933.90ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 8.47ms | 8.39ms | +0.08ms | +0.96% |
| p50 | 10.06ms | 9.09ms | +0.97ms | +10.64% |
| p95 | 10.55ms | 9.13ms | +1.42ms | +15.61% |
| p99 | 11.03ms | 9.15ms | +1.88ms | +20.56% |
| mean | 9.67ms | 8.93ms | +0.74ms | +8.25% |
| min | 8.12ms | 7.47ms | +0.65ms | +8.64% |
| max | 13.93ms | 9.16ms | +4.76ms | +52.01% |
| total | 1933.90ms | 1786.58ms | +147.32ms | +8.25% |

### vercelGenerateText

# Perf Report — vercelGenerateText.serial

| metric | value |
|---|---|
| iterations | 200 |
| warmup | 5 |
| p10 | 8.49ms |
| p50 | 10.08ms |
| p95 | 11.04ms |
| p99 | 12.52ms |
| mean | 9.77ms |
| stdev | 0.89ms |
| min | 7.15ms |
| max | 13.27ms |
| total | 1954.03ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 8.49ms | 8.28ms | +0.22ms | +2.61% |
| p50 | 10.08ms | 9.09ms | +0.99ms | +10.90% |
| p95 | 11.04ms | 9.16ms | +1.88ms | +20.49% |
| p99 | 12.52ms | 9.42ms | +3.10ms | +32.91% |
| mean | 9.77ms | 8.91ms | +0.86ms | +9.68% |
| min | 7.15ms | 7.89ms | -0.74ms | -9.35% |
| max | 13.27ms | 10.71ms | +2.56ms | +23.94% |
| total | 1954.03ms | 1781.63ms | +172.40ms | +9.68% |

### langchainInvoke

# Perf Report — langchainInvoke.serial

| metric | value |
|---|---|
| iterations | 200 |
| warmup | 5 |
| p10 | 8.45ms |
| p50 | 9.89ms |
| p95 | 10.87ms |
| p99 | 11.47ms |
| mean | 9.76ms |
| stdev | 1.69ms |
| min | 7.50ms |
| max | 29.22ms |
| total | 1951.52ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 8.45ms | 8.19ms | +0.26ms | +3.13% |
| p50 | 9.89ms | 9.08ms | +0.81ms | +8.94% |
| p95 | 10.87ms | 9.38ms | +1.49ms | +15.91% |
| p99 | 11.47ms | 9.92ms | +1.55ms | +15.64% |
| mean | 9.76ms | 8.89ms | +0.87ms | +9.76% |
| min | 7.50ms | 7.11ms | +0.39ms | +5.54% |
| max | 29.22ms | 11.03ms | +18.19ms | +165.00% |
| total | 1951.52ms | 1777.91ms | +173.61ms | +9.76% |

