# Perf Suite — dogfood-ably-collab-cursor

Threshold source: [docs/quality/perf-thresholds.md](../../quality/perf-thresholds)

## Serial p95 (concurrency = 1)

| op | p95 | cap | gate | regression |
|---|---|---|---|---|
| joinBoard | 0.01ms | 50ms | PASS | n/a (baseline seeded) |
| moveCursor | 11.34ms | 100ms | PASS | n/a (baseline seeded) |
| rewindHistory | 0.04ms | 30ms | PASS | n/a (baseline seeded) |
| getPresence | 0.01ms | 30ms | PASS | n/a (baseline seeded) |

## Concurrent p95 (concurrency = 10, 50 iter each)

| op | p95 | cap | gate |
|---|---|---|---|
| joinBoard | 0.02ms | 100ms | PASS |
| moveCursor | 10.49ms | 200ms | PASS |
| rewindHistory | 0.04ms | 60ms | PASS |
| getPresence | 0.02ms | 60ms | PASS |

## Memory retention (200 iter, arrayBuffers axis is the gate; heap is informational)

| op | heapUsed Δ | arrayBuffers Δ | cap | verdict |
|---|---|---|---|---|
| joinBoard | 610528 B | 0 B | 102400 B | PASS |
| moveCursor | -3800264 B | 0 B | 102400 B | PASS |
| rewindHistory | 642904 B | 0 B | 102400 B | PASS |
| getPresence | 452800 B | 0 B | 102400 B | PASS |

## Detailed serial reports

### joinBoard

# Perf Report — joinBoard.serial

| metric | value |
|---|---|
| iterations | 40 |
| warmup | 5 |
| p50 | 0.00ms |
| p95 | 0.01ms |
| p99 | 0.02ms |
| mean | 0.00ms |
| stdev | 0.00ms |
| min | 0.00ms |
| max | 0.02ms |
| total | 0.13ms |

### moveCursor

# Perf Report — moveCursor.serial

| metric | value |
|---|---|
| iterations | 40 |
| warmup | 5 |
| p50 | 10.39ms |
| p95 | 11.34ms |
| p99 | 11.81ms |
| mean | 10.47ms |
| stdev | 0.52ms |
| min | 9.23ms |
| max | 11.81ms |
| total | 418.89ms |

### rewindHistory

# Perf Report — rewindHistory.serial

| metric | value |
|---|---|
| iterations | 40 |
| warmup | 5 |
| p50 | 0.00ms |
| p95 | 0.04ms |
| p99 | 0.13ms |
| mean | 0.01ms |
| stdev | 0.02ms |
| min | 0.00ms |
| max | 0.13ms |
| total | 0.48ms |

### getPresence

# Perf Report — getPresence.serial

| metric | value |
|---|---|
| iterations | 40 |
| warmup | 5 |
| p50 | 0.00ms |
| p95 | 0.01ms |
| p99 | 0.02ms |
| mean | 0.00ms |
| stdev | 0.00ms |
| min | 0.00ms |
| max | 0.02ms |
| total | 0.12ms |

