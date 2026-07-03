# Perf Suite — dogfood-openai-tool-agent

Threshold source: [docs/quality/perf-thresholds.md](../../quality/perf-thresholds)

## Serial p95 (concurrency = 1)

| op | p95 | cap | gate | regression |
|---|---|---|---|---|
| validateToolSchemas | 33.38ms | 50ms | PASS | n/a (baseline seeded) |
| runToolLoop | 28.07ms | 100ms | PASS | n/a (baseline seeded) |
| runParallelToolCall | 13.71ms | 100ms | PASS | n/a (baseline seeded) |

## Concurrent p95 (concurrency = 10, 50 iter each)

| op | p95 | cap | gate |
|---|---|---|---|
| validateToolSchemas | 35.92ms | 100ms | PASS |
| runToolLoop | 28.34ms | 200ms | PASS |
| runParallelToolCall | 13.95ms | 200ms | PASS |

## Memory retention (200 iter, arrayBuffers axis is the gate; heap is informational)

| op | heapUsed Δ | arrayBuffers Δ | cap | verdict |
|---|---|---|---|---|
| validateToolSchemas | -4256456 B | 0 B | 102400 B | PASS |
| runToolLoop | -806488 B | 0 B | 102400 B | PASS |
| runParallelToolCall | -643400 B | 0 B | 102400 B | PASS |

## Detailed serial reports

### validateToolSchemas

# Perf Report — validateToolSchemas.serial

| metric | value |
|---|---|
| iterations | 40 |
| warmup | 5 |
| p50 | 33.23ms |
| p95 | 33.38ms |
| p99 | 35.00ms |
| mean | 33.01ms |
| stdev | 0.60ms |
| min | 31.19ms |
| max | 35.00ms |
| total | 1320.24ms |

### runToolLoop

# Perf Report — runToolLoop.serial

| metric | value |
|---|---|
| iterations | 40 |
| warmup | 5 |
| p50 | 27.30ms |
| p95 | 28.07ms |
| p99 | 28.33ms |
| mean | 27.28ms |
| stdev | 0.44ms |
| min | 25.93ms |
| max | 28.33ms |
| total | 1091.16ms |

### runParallelToolCall

# Perf Report — runParallelToolCall.serial

| metric | value |
|---|---|
| iterations | 40 |
| warmup | 5 |
| p50 | 13.62ms |
| p95 | 13.71ms |
| p99 | 13.81ms |
| mean | 13.48ms |
| stdev | 0.33ms |
| min | 12.47ms |
| max | 13.81ms |
| total | 539.37ms |

