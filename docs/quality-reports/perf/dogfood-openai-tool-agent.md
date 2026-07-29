# Perf Suite — dogfood-openai-tool-agent

Threshold source: [docs/quality/perf-thresholds.md](../../quality/perf-thresholds)

測定系の分解能 = 0.00017ms (何もしない関数を同じ経路で呼んだ時の p10)。 回帰判定の絶対下限は既定でこの 2 倍 = 0.00033ms、 op ごとの実効値は下表の「下限」 列。

## Serial (concurrency = 1)

| op | p10 (回帰判定) | p95 (上限判定) | cap | 下限 | gate | regression |
|---|---|---|---|---|---|---|
| validateToolSchemas | 32.13ms | 34.02ms | 50ms | 0.00033ms | PASS | stable — gate 無効 (regressionGate=false) |
| runToolLoop | 26.71ms | 33.34ms | 100ms | 0.00033ms | PASS | stable — gate 無効 (regressionGate=false) |
| runParallelToolCall | 13.21ms | 13.85ms | 100ms | 0.00033ms | PASS | stable — gate 無効 (regressionGate=false) |

## Concurrent p95 (concurrency = 10, 50 iter each)

| op | p95 | cap | gate |
|---|---|---|---|
| validateToolSchemas | 36.93ms | 100ms | PASS |
| runToolLoop | 28.95ms | 200ms | PASS |
| runParallelToolCall | 14.91ms | 200ms | PASS |

## Memory retention (200 iter, arrayBuffers axis is the gate; heap is informational)

| op | heapUsed Δ | arrayBuffers Δ | cap | gc exposed | verdict |
|---|---|---|---|---|---|
| validateToolSchemas | 4408 B | 0 B | 102400 B | yes | PASS |
| runToolLoop | -20360 B | 0 B | 102400 B | yes | PASS |
| runParallelToolCall | -1872 B | 0 B | 102400 B | yes | PASS |

## Detailed serial reports

### validateToolSchemas

# Perf Report — validateToolSchemas.serial

| metric | value |
|---|---|
| iterations | 40 |
| warmup | 5 |
| p10 | 32.13ms |
| p50 | 32.97ms |
| p95 | 34.02ms |
| p99 | 34.92ms |
| mean | 32.96ms |
| stdev | 0.78ms |
| min | 30.79ms |
| max | 35.34ms |
| total | 1318.32ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 32.13ms | 31.88ms | +0.25ms | +0.77% |
| p50 | 32.97ms | 33.06ms | -0.10ms | -0.29% |
| p95 | 34.02ms | 34.54ms | -0.52ms | -1.51% |
| p99 | 34.92ms | 35.34ms | -0.42ms | -1.18% |
| mean | 32.96ms | 33.12ms | -0.17ms | -0.50% |
| min | 30.79ms | 31.26ms | -0.47ms | -1.50% |
| max | 35.34ms | 35.36ms | -0.01ms | -0.04% |
| total | 1318.32ms | 1324.98ms | -6.66ms | -0.50% |

### runToolLoop

# Perf Report — runToolLoop.serial

| metric | value |
|---|---|
| iterations | 40 |
| warmup | 5 |
| p10 | 26.71ms |
| p50 | 28.29ms |
| p95 | 33.34ms |
| p99 | 40.66ms |
| mean | 29.16ms |
| stdev | 3.20ms |
| min | 24.66ms |
| max | 44.09ms |
| total | 1166.21ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 26.71ms | 26.32ms | +0.39ms | +1.49% |
| p50 | 28.29ms | 27.51ms | +0.77ms | +2.81% |
| p95 | 33.34ms | 29.28ms | +4.06ms | +13.87% |
| p99 | 40.66ms | 29.40ms | +11.26ms | +38.32% |
| mean | 29.16ms | 27.45ms | +1.70ms | +6.20% |
| min | 24.66ms | 25.36ms | -0.70ms | -2.77% |
| max | 44.09ms | 29.41ms | +14.67ms | +49.88% |
| total | 1166.21ms | 1098.10ms | +68.11ms | +6.20% |

### runParallelToolCall

# Perf Report — runParallelToolCall.serial

| metric | value |
|---|---|
| iterations | 40 |
| warmup | 5 |
| p10 | 13.21ms |
| p50 | 13.74ms |
| p95 | 13.85ms |
| p99 | 14.35ms |
| mean | 13.65ms |
| stdev | 0.33ms |
| min | 12.61ms |
| max | 14.62ms |
| total | 546.13ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 13.21ms | 12.98ms | +0.23ms | +1.79% |
| p50 | 13.74ms | 13.69ms | +0.05ms | +0.36% |
| p95 | 13.85ms | 13.77ms | +0.08ms | +0.60% |
| p99 | 14.35ms | 15.22ms | -0.87ms | -5.72% |
| mean | 13.65ms | 13.59ms | +0.07ms | +0.49% |
| min | 12.61ms | 12.22ms | +0.40ms | +3.24% |
| max | 14.62ms | 16.09ms | -1.47ms | -9.15% |
| total | 546.13ms | 543.46ms | +2.67ms | +0.49% |

