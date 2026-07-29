# Perf Suite — dogfood-openai-tool-agent

Threshold source: [docs/quality/perf-thresholds.md](../../quality/perf-thresholds)

測定系の分解能 = 0.00017ms (何もしない関数を同じ経路で呼んだ時の p10)。 回帰判定の絶対下限は既定でこの 2 倍 = 0.00033ms、 op ごとの実効値は下表の「下限」 列。

## Serial (concurrency = 1)

| op | p10 (回帰判定) | p95 (上限判定) | cap | 下限 | gate | regression |
|---|---|---|---|---|---|---|
| validateToolSchemas | 31.68ms | 33.45ms | 50ms | 0.00033ms | PASS | stable — gate 無効 (regressionGate=false) |
| runToolLoop | 26.61ms | 27.48ms | 100ms | 0.00033ms | PASS | stable — gate 無効 (regressionGate=false) |
| runParallelToolCall | 13.15ms | 14.56ms | 100ms | 0.00033ms | PASS | stable — gate 無効 (regressionGate=false) |

## Concurrent p95 (concurrency = 10, 50 iter each)

| op | p95 | cap | gate |
|---|---|---|---|
| validateToolSchemas | 33.87ms | 100ms | PASS |
| runToolLoop | 27.76ms | 200ms | PASS |
| runParallelToolCall | 14.14ms | 200ms | PASS |

## Memory retention (200 iter, arrayBuffers axis is the gate; heap is informational)

| op | heapUsed Δ | arrayBuffers Δ | cap | gc exposed | verdict |
|---|---|---|---|---|---|
| validateToolSchemas | 4472 B | 0 B | 102400 B | yes | PASS |
| runToolLoop | -20360 B | 0 B | 102400 B | yes | PASS |
| runParallelToolCall | -1120 B | 0 B | 102400 B | yes | PASS |

## Detailed serial reports

### validateToolSchemas

# Perf Report — validateToolSchemas.serial

| metric | value |
|---|---|
| iterations | 40 |
| warmup | 5 |
| p10 | 31.68ms |
| p50 | 32.93ms |
| p95 | 33.45ms |
| p99 | 33.95ms |
| mean | 32.74ms |
| stdev | 0.72ms |
| min | 30.88ms |
| max | 34.23ms |
| total | 1309.54ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 31.68ms | 31.88ms | -0.20ms | -0.62% |
| p50 | 32.93ms | 33.06ms | -0.13ms | -0.40% |
| p95 | 33.45ms | 34.54ms | -1.09ms | -3.15% |
| p99 | 33.95ms | 35.34ms | -1.39ms | -3.93% |
| mean | 32.74ms | 33.12ms | -0.39ms | -1.17% |
| min | 30.88ms | 31.26ms | -0.38ms | -1.22% |
| max | 34.23ms | 35.36ms | -1.13ms | -3.19% |
| total | 1309.54ms | 1324.98ms | -15.44ms | -1.17% |

### runToolLoop

# Perf Report — runToolLoop.serial

| metric | value |
|---|---|
| iterations | 40 |
| warmup | 5 |
| p10 | 26.61ms |
| p50 | 27.36ms |
| p95 | 27.48ms |
| p99 | 27.65ms |
| mean | 27.16ms |
| stdev | 0.39ms |
| min | 25.95ms |
| max | 27.75ms |
| total | 1086.56ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 26.61ms | 26.32ms | +0.28ms | +1.08% |
| p50 | 27.36ms | 27.51ms | -0.15ms | -0.56% |
| p95 | 27.48ms | 29.28ms | -1.80ms | -6.15% |
| p99 | 27.65ms | 29.40ms | -1.75ms | -5.95% |
| mean | 27.16ms | 27.45ms | -0.29ms | -1.05% |
| min | 25.95ms | 25.36ms | +0.59ms | +2.34% |
| max | 27.75ms | 29.41ms | -1.67ms | -5.66% |
| total | 1086.56ms | 1098.10ms | -11.54ms | -1.05% |

### runParallelToolCall

# Perf Report — runParallelToolCall.serial

| metric | value |
|---|---|
| iterations | 40 |
| warmup | 5 |
| p10 | 13.15ms |
| p50 | 13.70ms |
| p95 | 14.56ms |
| p99 | 15.43ms |
| mean | 13.69ms |
| stdev | 0.60ms |
| min | 12.26ms |
| max | 15.57ms |
| total | 547.41ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 13.15ms | 12.98ms | +0.17ms | +1.29% |
| p50 | 13.70ms | 13.69ms | +0.0046ms | +0.03% |
| p95 | 14.56ms | 13.77ms | +0.79ms | +5.75% |
| p99 | 15.43ms | 15.22ms | +0.21ms | +1.38% |
| mean | 13.69ms | 13.59ms | +0.10ms | +0.73% |
| min | 12.26ms | 12.22ms | +0.04ms | +0.34% |
| max | 15.57ms | 16.09ms | -0.52ms | -3.23% |
| total | 547.41ms | 543.46ms | +3.95ms | +0.73% |

