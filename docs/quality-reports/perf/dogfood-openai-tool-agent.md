# Perf Suite — dogfood-openai-tool-agent

Threshold source: [docs/quality/perf-thresholds.md](../../quality/perf-thresholds)

測定系の分解能 = 0.00046ms (何もしない関数を同じ経路で呼んだ時の p10)。 回帰判定の絶対下限は既定でこの 2 倍 = 0.00092ms、 op ごとの実効値は下表の「下限」 列。

## Serial (concurrency = 1)

| op | p10 (回帰判定) | p95 (上限判定) | cap | 下限 | gate | regression |
|---|---|---|---|---|---|---|
| validateToolSchemas | 32.10ms | 33.49ms | 50ms | 0.00092ms | PASS | stable — gate 無効 (regressionGate=false) |
| runToolLoop | 26.50ms | 27.65ms | 100ms | 0.00092ms | PASS | stable — gate 無効 (regressionGate=false) |
| runParallelToolCall | 12.94ms | 14.03ms | 100ms | 0.00092ms | PASS | stable — gate 無効 (regressionGate=false) |

## Concurrent p95 (concurrency = 10, 50 iter each)

| op | p95 | cap | gate |
|---|---|---|---|
| validateToolSchemas | 33.91ms | 100ms | PASS |
| runToolLoop | 27.97ms | 200ms | PASS |
| runParallelToolCall | 14.19ms | 200ms | PASS |

## Memory retention (200 iter, arrayBuffers axis is the gate; heap is informational)

| op | heapUsed Δ | arrayBuffers Δ | cap | gc exposed | verdict |
|---|---|---|---|---|---|
| validateToolSchemas | 4424 B | 0 B | 102400 B | yes | PASS |
| runToolLoop | -19128 B | 0 B | 102400 B | yes | PASS |
| runParallelToolCall | -2816 B | 0 B | 102400 B | yes | PASS |

## Detailed serial reports

### validateToolSchemas

# Perf Report — validateToolSchemas.serial

| metric | value |
|---|---|
| iterations | 40 |
| warmup | 5 |
| p10 | 32.10ms |
| p50 | 33.03ms |
| p95 | 33.49ms |
| p99 | 33.95ms |
| mean | 32.92ms |
| stdev | 0.61ms |
| min | 31.02ms |
| max | 34.21ms |
| total | 1316.93ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 32.10ms | 31.88ms | +0.22ms | +0.70% |
| p50 | 33.03ms | 33.06ms | -0.04ms | -0.11% |
| p95 | 33.49ms | 34.54ms | -1.05ms | -3.03% |
| p99 | 33.95ms | 35.34ms | -1.39ms | -3.94% |
| mean | 32.92ms | 33.12ms | -0.20ms | -0.61% |
| min | 31.02ms | 31.26ms | -0.24ms | -0.77% |
| max | 34.21ms | 35.36ms | -1.15ms | -3.25% |
| total | 1316.93ms | 1324.98ms | -8.05ms | -0.61% |

### runToolLoop

# Perf Report — runToolLoop.serial

| metric | value |
|---|---|
| iterations | 40 |
| warmup | 5 |
| p10 | 26.50ms |
| p50 | 27.21ms |
| p95 | 27.65ms |
| p99 | 27.72ms |
| mean | 27.15ms |
| stdev | 0.45ms |
| min | 25.75ms |
| max | 27.73ms |
| total | 1085.83ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 26.50ms | 26.32ms | +0.18ms | +0.67% |
| p50 | 27.21ms | 27.51ms | -0.31ms | -1.12% |
| p95 | 27.65ms | 29.28ms | -1.63ms | -5.57% |
| p99 | 27.72ms | 29.40ms | -1.68ms | -5.70% |
| mean | 27.15ms | 27.45ms | -0.31ms | -1.12% |
| min | 25.75ms | 25.36ms | +0.39ms | +1.55% |
| max | 27.73ms | 29.41ms | -1.69ms | -5.74% |
| total | 1085.83ms | 1098.10ms | -12.27ms | -1.12% |

### runParallelToolCall

# Perf Report — runParallelToolCall.serial

| metric | value |
|---|---|
| iterations | 40 |
| warmup | 5 |
| p10 | 12.94ms |
| p50 | 13.75ms |
| p95 | 14.03ms |
| p99 | 14.48ms |
| mean | 13.54ms |
| stdev | 0.50ms |
| min | 12.13ms |
| max | 14.49ms |
| total | 541.72ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 12.94ms | 12.98ms | -0.03ms | -0.26% |
| p50 | 13.75ms | 13.69ms | +0.06ms | +0.41% |
| p95 | 14.03ms | 13.77ms | +0.27ms | +1.93% |
| p99 | 14.48ms | 15.22ms | -0.74ms | -4.84% |
| mean | 13.54ms | 13.59ms | -0.04ms | -0.32% |
| min | 12.13ms | 12.22ms | -0.09ms | -0.74% |
| max | 14.49ms | 16.09ms | -1.60ms | -9.95% |
| total | 541.72ms | 543.46ms | -1.74ms | -0.32% |

