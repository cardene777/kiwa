# Perf Suite — dogfood-openai-tool-agent

Threshold source: [docs/quality/perf-thresholds.md](../../quality/perf-thresholds)

測定系の分解能 = 0.00017ms (何もしない関数を同じ経路で呼んだ時の p10)。 回帰判定の絶対下限は既定でこの 2 倍 = 0.00033ms、 op ごとの実効値は下表の「下限」 列。

## Serial (concurrency = 1)

| op | p10 (回帰判定) | p95 (上限判定) | cap | 下限 | gate | regression |
|---|---|---|---|---|---|---|
| validateToolSchemas | 32.14ms | 33.64ms | 50ms | 0.00033ms | PASS | stable — gate 無効 (regressionGate=false) |
| runToolLoop | 26.36ms | 27.51ms | 100ms | 0.00033ms | PASS | stable — gate 無効 (regressionGate=false) |
| runParallelToolCall | 13.09ms | 14.57ms | 100ms | 0.00033ms | PASS | stable — gate 無効 (regressionGate=false) |

## Concurrent p95 (concurrency = 10, 50 iter each)

| op | p95 | cap | gate |
|---|---|---|---|
| validateToolSchemas | 33.59ms | 100ms | PASS |
| runToolLoop | 27.76ms | 200ms | PASS |
| runParallelToolCall | 14.18ms | 200ms | PASS |

## Memory retention (200 iter, arrayBuffers axis is the gate; heap is informational)

| op | heapUsed Δ | arrayBuffers Δ | cap | gc exposed | verdict |
|---|---|---|---|---|---|
| validateToolSchemas | 3960 B | 0 B | 102400 B | yes | PASS |
| runToolLoop | -20376 B | 0 B | 102400 B | yes | PASS |
| runParallelToolCall | -2448 B | 0 B | 102400 B | yes | PASS |

## Detailed serial reports

### validateToolSchemas

# Perf Report — validateToolSchemas.serial

| metric | value |
|---|---|
| iterations | 40 |
| warmup | 5 |
| p10 | 32.14ms |
| p50 | 33.13ms |
| p95 | 33.64ms |
| p99 | 34.46ms |
| mean | 32.94ms |
| stdev | 0.72ms |
| min | 30.81ms |
| max | 34.51ms |
| total | 1317.70ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 32.14ms | 31.88ms | +0.26ms | +0.82% |
| p50 | 33.13ms | 33.06ms | +0.07ms | +0.21% |
| p95 | 33.64ms | 34.54ms | -0.90ms | -2.61% |
| p99 | 34.46ms | 35.34ms | -0.88ms | -2.48% |
| mean | 32.94ms | 33.12ms | -0.18ms | -0.55% |
| min | 30.81ms | 31.26ms | -0.45ms | -1.44% |
| max | 34.51ms | 35.36ms | -0.85ms | -2.40% |
| total | 1317.70ms | 1324.98ms | -7.28ms | -0.55% |

### runToolLoop

# Perf Report — runToolLoop.serial

| metric | value |
|---|---|
| iterations | 40 |
| warmup | 5 |
| p10 | 26.36ms |
| p50 | 27.33ms |
| p95 | 27.51ms |
| p99 | 27.58ms |
| mean | 27.11ms |
| stdev | 0.47ms |
| min | 25.79ms |
| max | 27.59ms |
| total | 1084.34ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 26.36ms | 26.32ms | +0.03ms | +0.13% |
| p50 | 27.33ms | 27.51ms | -0.19ms | -0.67% |
| p95 | 27.51ms | 29.28ms | -1.77ms | -6.03% |
| p99 | 27.58ms | 29.40ms | -1.82ms | -6.19% |
| mean | 27.11ms | 27.45ms | -0.34ms | -1.25% |
| min | 25.79ms | 25.36ms | +0.43ms | +1.69% |
| max | 27.59ms | 29.41ms | -1.83ms | -6.21% |
| total | 1084.34ms | 1098.10ms | -13.76ms | -1.25% |

### runParallelToolCall

# Perf Report — runParallelToolCall.serial

| metric | value |
|---|---|
| iterations | 40 |
| warmup | 5 |
| p10 | 13.09ms |
| p50 | 13.74ms |
| p95 | 14.57ms |
| p99 | 16.89ms |
| mean | 13.71ms |
| stdev | 0.88ms |
| min | 11.92ms |
| max | 18.04ms |
| total | 548.20ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 13.09ms | 12.98ms | +0.12ms | +0.89% |
| p50 | 13.74ms | 13.69ms | +0.05ms | +0.37% |
| p95 | 14.57ms | 13.77ms | +0.81ms | +5.85% |
| p99 | 16.89ms | 15.22ms | +1.67ms | +10.97% |
| mean | 13.71ms | 13.59ms | +0.12ms | +0.87% |
| min | 11.92ms | 12.22ms | -0.30ms | -2.44% |
| max | 18.04ms | 16.09ms | +1.94ms | +12.07% |
| total | 548.20ms | 543.46ms | +4.74ms | +0.87% |

