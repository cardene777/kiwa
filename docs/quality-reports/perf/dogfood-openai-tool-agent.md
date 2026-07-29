# Perf Suite — dogfood-openai-tool-agent

Threshold source: [docs/quality/perf-thresholds.md](../../quality/perf-thresholds)

測定系の分解能 = 0.00017ms (何もしない関数を同じ経路で呼んだ時の p10)。 回帰判定の絶対下限は既定でこの 2 倍 = 0.00033ms、 op ごとの実効値は下表の「下限」 列。

## Serial (concurrency = 1)

| op | p10 (回帰判定) | p95 (上限判定) | cap | 下限 | gate | regression |
|---|---|---|---|---|---|---|
| validateToolSchemas | 32.54ms | 33.82ms | 50ms | 0.00033ms | PASS | stable — gate 無効 (regressionGate=false) |
| runToolLoop | 26.67ms | 28.09ms | 100ms | 0.00033ms | PASS | stable — gate 無効 (regressionGate=false) |
| runParallelToolCall | 13.02ms | 13.83ms | 100ms | 0.00033ms | PASS | stable — gate 無効 (regressionGate=false) |

## Concurrent p95 (concurrency = 10, 50 iter each)

| op | p95 | cap | gate |
|---|---|---|---|
| validateToolSchemas | 33.81ms | 100ms | PASS |
| runToolLoop | 27.86ms | 200ms | PASS |
| runParallelToolCall | 14.02ms | 200ms | PASS |

## Memory retention (200 iter, arrayBuffers axis is the gate; heap is informational)

| op | heapUsed Δ | arrayBuffers Δ | cap | gc exposed | verdict |
|---|---|---|---|---|---|
| validateToolSchemas | 3976 B | 0 B | 102400 B | yes | PASS |
| runToolLoop | -20360 B | 0 B | 102400 B | yes | PASS |
| runParallelToolCall | -1712 B | 0 B | 102400 B | yes | PASS |

## Detailed serial reports

### validateToolSchemas

# Perf Report — validateToolSchemas.serial

| metric | value |
|---|---|
| iterations | 40 |
| warmup | 5 |
| p10 | 32.54ms |
| p50 | 33.09ms |
| p95 | 33.82ms |
| p99 | 34.25ms |
| mean | 33.06ms |
| stdev | 0.60ms |
| min | 31.31ms |
| max | 34.36ms |
| total | 1322.44ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 32.54ms | 31.88ms | +0.66ms | +2.06% |
| p50 | 33.09ms | 33.06ms | +0.03ms | +0.09% |
| p95 | 33.82ms | 34.54ms | -0.72ms | -2.09% |
| p99 | 34.25ms | 35.34ms | -1.09ms | -3.10% |
| mean | 33.06ms | 33.12ms | -0.06ms | -0.19% |
| min | 31.31ms | 31.26ms | +0.04ms | +0.14% |
| max | 34.36ms | 35.36ms | -1.00ms | -2.82% |
| total | 1322.44ms | 1324.98ms | -2.54ms | -0.19% |

### runToolLoop

# Perf Report — runToolLoop.serial

| metric | value |
|---|---|
| iterations | 40 |
| warmup | 5 |
| p10 | 26.67ms |
| p50 | 27.36ms |
| p95 | 28.09ms |
| p99 | 28.86ms |
| mean | 27.29ms |
| stdev | 0.54ms |
| min | 26.39ms |
| max | 29.00ms |
| total | 1091.47ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 26.67ms | 26.32ms | +0.34ms | +1.31% |
| p50 | 27.36ms | 27.51ms | -0.16ms | -0.57% |
| p95 | 28.09ms | 29.28ms | -1.19ms | -4.05% |
| p99 | 28.86ms | 29.40ms | -0.54ms | -1.85% |
| mean | 27.29ms | 27.45ms | -0.17ms | -0.60% |
| min | 26.39ms | 25.36ms | +1.03ms | +4.08% |
| max | 29.00ms | 29.41ms | -0.41ms | -1.40% |
| total | 1091.47ms | 1098.10ms | -6.63ms | -0.60% |

### runParallelToolCall

# Perf Report — runParallelToolCall.serial

| metric | value |
|---|---|
| iterations | 40 |
| warmup | 5 |
| p10 | 13.02ms |
| p50 | 13.70ms |
| p95 | 13.83ms |
| p99 | 13.87ms |
| mean | 13.49ms |
| stdev | 0.39ms |
| min | 12.19ms |
| max | 13.89ms |
| total | 539.51ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 13.02ms | 12.98ms | +0.04ms | +0.29% |
| p50 | 13.70ms | 13.69ms | +0.0062ms | +0.05% |
| p95 | 13.83ms | 13.77ms | +0.06ms | +0.44% |
| p99 | 13.87ms | 15.22ms | -1.35ms | -8.89% |
| mean | 13.49ms | 13.59ms | -0.10ms | -0.73% |
| min | 12.19ms | 12.22ms | -0.03ms | -0.24% |
| max | 13.89ms | 16.09ms | -2.21ms | -13.72% |
| total | 539.51ms | 543.46ms | -3.95ms | -0.73% |

