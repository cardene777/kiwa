# Perf Suite — dogfood-anthropic-chatbot

Threshold source: [docs/quality/perf-thresholds.md](../../quality/perf-thresholds)

## Serial p95 (concurrency = 1)

| op | p95 | cap | gate | regression |
|---|---|---|---|---|
| reply | 9.15ms | 30ms | PASS | n/a (baseline seeded) |
| replyStream | 15.35ms | 50ms | PASS | n/a (baseline seeded) |
| toolLoop | 18.25ms | 100ms | PASS | n/a (baseline seeded) |

## Concurrent p95 (concurrency = 10, 50 iter each)

| op | p95 | cap | gate |
|---|---|---|---|
| reply | 9.26ms | 60ms | PASS |
| replyStream | 15.47ms | 100ms | PASS |
| toolLoop | 18.46ms | 200ms | PASS |

## Memory retention (200 iter, arrayBuffers axis is the gate; heap is informational)

| op | heapUsed Δ | arrayBuffers Δ | cap | verdict |
|---|---|---|---|---|
| reply | -4565704 B | -2796 B | 102400 B | PASS |
| replyStream | -4284352 B | 0 B | 102400 B | PASS |
| toolLoop | -543168 B | 0 B | 102400 B | PASS |

## Detailed serial reports

### reply

# Perf Report — reply.serial

| metric | value |
|---|---|
| iterations | 60 |
| warmup | 5 |
| p50 | 9.07ms |
| p95 | 9.15ms |
| p99 | 9.20ms |
| mean | 8.96ms |
| stdev | 0.28ms |
| min | 8.02ms |
| max | 9.20ms |
| total | 537.73ms |

### replyStream

# Perf Report — replyStream.serial

| metric | value |
|---|---|
| iterations | 60 |
| warmup | 5 |
| p50 | 15.08ms |
| p95 | 15.35ms |
| p99 | 16.27ms |
| mean | 14.86ms |
| stdev | 0.66ms |
| min | 12.64ms |
| max | 16.27ms |
| total | 891.32ms |

### toolLoop

# Perf Report — toolLoop.serial

| metric | value |
|---|---|
| iterations | 60 |
| warmup | 5 |
| p50 | 18.12ms |
| p95 | 18.25ms |
| p99 | 18.31ms |
| mean | 17.91ms |
| stdev | 0.43ms |
| min | 16.61ms |
| max | 18.31ms |
| total | 1074.78ms |

