# Perf Suite — dogfood-openai-tool-agent

Threshold source: [docs/quality/perf-thresholds.md](../../quality/perf-thresholds)

測定系の分解能 = 0.00017ms (何もしない関数を同じ経路で呼んだ時の p10)。 回帰判定の絶対下限は既定でこの 2 倍 = 0.00033ms、 op ごとの実効値は下表の「下限」 列。

## Serial (concurrency = 1)

| op | p10 (回帰判定) | p95 (上限判定) | cap | 下限 | gate | regression |
|---|---|---|---|---|---|---|
| validateToolSchemas | 33.91ms | 36.40ms | 50ms | 0.00033ms | PASS | stable — gate 無効 (regressionGate=false) |
| runToolLoop | 28.40ms | 30.54ms | 100ms | 0.00033ms | PASS | stable — gate 無効 (regressionGate=false) |
| runParallelToolCall | 13.88ms | 15.32ms | 100ms | 0.00033ms | PASS | stable — gate 無効 (regressionGate=false) |

## Concurrent p95 (concurrency = 10, 50 iter each)

| op | p95 | cap | gate |
|---|---|---|---|
| validateToolSchemas | 36.50ms | 100ms | PASS |
| runToolLoop | 30.69ms | 200ms | PASS |
| runParallelToolCall | 15.43ms | 200ms | PASS |

## Memory retention (200 iter, arrayBuffers axis is the gate; heap is informational)

| op | heapUsed Δ | arrayBuffers Δ | cap | gc exposed | verdict |
|---|---|---|---|---|---|
| validateToolSchemas | 5176 B | 0 B | 102400 B | yes | PASS |
| runToolLoop | -20360 B | 0 B | 102400 B | yes | PASS |
| runParallelToolCall | -1120 B | 0 B | 102400 B | yes | PASS |

## Detailed serial reports

### validateToolSchemas

# Perf Report — validateToolSchemas.serial

| metric | value |
|---|---|
| iterations | 40 |
| warmup | 5 |
| p10 | 33.91ms |
| p50 | 34.86ms |
| p95 | 36.40ms |
| p99 | 36.44ms |
| mean | 34.91ms |
| stdev | 1.13ms |
| min | 31.13ms |
| max | 36.44ms |
| total | 1396.44ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 33.91ms | 31.88ms | +2.03ms | +6.37% |
| p50 | 34.86ms | 33.06ms | +1.80ms | +5.45% |
| p95 | 36.40ms | 34.54ms | +1.85ms | +5.37% |
| p99 | 36.44ms | 35.34ms | +1.10ms | +3.11% |
| mean | 34.91ms | 33.12ms | +1.79ms | +5.39% |
| min | 31.13ms | 31.26ms | -0.13ms | -0.43% |
| max | 36.44ms | 35.36ms | +1.08ms | +3.06% |
| total | 1396.44ms | 1324.98ms | +71.46ms | +5.39% |

### runToolLoop

# Perf Report — runToolLoop.serial

| metric | value |
|---|---|
| iterations | 40 |
| warmup | 5 |
| p10 | 28.40ms |
| p50 | 29.66ms |
| p95 | 30.54ms |
| p99 | 30.60ms |
| mean | 29.51ms |
| stdev | 0.85ms |
| min | 27.31ms |
| max | 30.63ms |
| total | 1180.33ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 28.40ms | 26.32ms | +2.08ms | +7.89% |
| p50 | 29.66ms | 27.51ms | +2.15ms | +7.80% |
| p95 | 30.54ms | 29.28ms | +1.26ms | +4.29% |
| p99 | 30.60ms | 29.40ms | +1.21ms | +4.11% |
| mean | 29.51ms | 27.45ms | +2.06ms | +7.49% |
| min | 27.31ms | 25.36ms | +1.96ms | +7.72% |
| max | 30.63ms | 29.41ms | +1.22ms | +4.14% |
| total | 1180.33ms | 1098.10ms | +82.23ms | +7.49% |

### runParallelToolCall

# Perf Report — runParallelToolCall.serial

| metric | value |
|---|---|
| iterations | 40 |
| warmup | 5 |
| p10 | 13.88ms |
| p50 | 15.06ms |
| p95 | 15.32ms |
| p99 | 15.36ms |
| mean | 14.69ms |
| stdev | 0.72ms |
| min | 12.79ms |
| max | 15.36ms |
| total | 587.45ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 13.88ms | 12.98ms | +0.90ms | +6.97% |
| p50 | 15.06ms | 13.69ms | +1.37ms | +10.00% |
| p95 | 15.32ms | 13.77ms | +1.55ms | +11.26% |
| p99 | 15.36ms | 15.22ms | +0.14ms | +0.90% |
| mean | 14.69ms | 13.59ms | +1.10ms | +8.09% |
| min | 12.79ms | 12.22ms | +0.57ms | +4.68% |
| max | 15.36ms | 16.09ms | -0.74ms | -4.57% |
| total | 587.45ms | 543.46ms | +43.99ms | +8.09% |

