# Perf Suite — dogfood-openai-tool-agent

Threshold source: [docs/quality/perf-thresholds.md](../../quality/perf-thresholds)

## Serial p95 (concurrency = 1)

| op | p95 | cap | gate | regression |
|---|---|---|---|---|
| validateToolSchemas | 33.44ms | 50ms | PASS | stable |
| runToolLoop | 27.66ms | 100ms | PASS | stable |
| runParallelToolCall | 13.79ms | 100ms | PASS | stable |

## Concurrent p95 (concurrency = 10, 50 iter each)

| op | p95 | cap | gate |
|---|---|---|---|
| validateToolSchemas | 33.56ms | 100ms | PASS |
| runToolLoop | 28.03ms | 200ms | PASS |
| runParallelToolCall | 13.80ms | 200ms | PASS |

## Memory retention (200 iter, arrayBuffers axis is the gate; heap is informational)

| op | heapUsed Δ | arrayBuffers Δ | cap | verdict |
|---|---|---|---|---|
| validateToolSchemas | -4447552 B | 0 B | 102400 B | PASS |
| runToolLoop | -902544 B | 0 B | 102400 B | PASS |
| runParallelToolCall | -597808 B | 0 B | 102400 B | PASS |

## Detailed serial reports

### validateToolSchemas

# Perf Report — validateToolSchemas.serial

| metric | value |
|---|---|
| iterations | 40 |
| warmup | 5 |
| p50 | 33.22ms |
| p95 | 33.44ms |
| p99 | 33.57ms |
| mean | 33.03ms |
| stdev | 0.50ms |
| min | 31.38ms |
| max | 33.57ms |
| total | 1321.09ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p50 | 33.22ms | 33.23ms | -0.01ms | -0.03% |
| p95 | 33.44ms | 33.38ms | +0.06ms | +0.18% |
| p99 | 33.57ms | 35.00ms | -1.43ms | -4.09% |
| mean | 33.03ms | 33.01ms | +0.02ms | +0.06% |
| min | 31.38ms | 31.19ms | +0.19ms | +0.62% |
| max | 33.57ms | 35.00ms | -1.43ms | -4.09% |
| total | 1321.09ms | 1320.24ms | +0.85ms | +0.06% |

### runToolLoop

# Perf Report — runToolLoop.serial

| metric | value |
|---|---|
| iterations | 40 |
| warmup | 5 |
| p50 | 27.33ms |
| p95 | 27.66ms |
| p99 | 28.26ms |
| mean | 27.16ms |
| stdev | 0.53ms |
| min | 25.81ms |
| max | 28.26ms |
| total | 1086.58ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p50 | 27.33ms | 27.30ms | +0.03ms | +0.10% |
| p95 | 27.66ms | 28.07ms | -0.41ms | -1.46% |
| p99 | 28.26ms | 28.33ms | -0.07ms | -0.24% |
| mean | 27.16ms | 27.28ms | -0.11ms | -0.42% |
| min | 25.81ms | 25.93ms | -0.12ms | -0.45% |
| max | 28.26ms | 28.33ms | -0.07ms | -0.24% |
| total | 1086.58ms | 1091.16ms | -4.59ms | -0.42% |

### runParallelToolCall

# Perf Report — runParallelToolCall.serial

| metric | value |
|---|---|
| iterations | 40 |
| warmup | 5 |
| p50 | 13.65ms |
| p95 | 13.79ms |
| p99 | 13.84ms |
| mean | 13.50ms |
| stdev | 0.36ms |
| min | 12.20ms |
| max | 13.84ms |
| total | 540.06ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p50 | 13.65ms | 13.62ms | +0.03ms | +0.22% |
| p95 | 13.79ms | 13.71ms | +0.07ms | +0.54% |
| p99 | 13.84ms | 13.81ms | +0.03ms | +0.21% |
| mean | 13.50ms | 13.48ms | +0.02ms | +0.13% |
| min | 12.20ms | 12.47ms | -0.26ms | -2.10% |
| max | 13.84ms | 13.81ms | +0.03ms | +0.21% |
| total | 540.06ms | 539.37ms | +0.69ms | +0.13% |

