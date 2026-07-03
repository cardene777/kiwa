# Perf Suite — dogfood-socketio-notification

Threshold source: [docs/quality/perf-thresholds.md](../../quality/perf-thresholds)

## Serial p95 (concurrency = 1)

| op | p95 | cap | gate | regression |
|---|---|---|---|---|
| subscribeRoom | 3.48ms | 50ms | PASS | n/a (baseline seeded) |
| deliverNotification | 3.68ms | 30ms | PASS | n/a (baseline seeded) |
| getPending | 0.00ms | 30ms | PASS | n/a (baseline seeded) |
| simulateReconnect | 0.00ms | 100ms | PASS | n/a (baseline seeded) |

## Concurrent p95 (concurrency = 10, 50 iter each)

| op | p95 | cap | gate |
|---|---|---|---|
| subscribeRoom | 3.80ms | 100ms | PASS |
| deliverNotification | 3.53ms | 60ms | PASS |
| getPending | 0.01ms | 60ms | PASS |
| simulateReconnect | 0.01ms | 200ms | PASS |

## Memory retention (200 iter, arrayBuffers axis is the gate; heap is informational)

| op | heapUsed Δ | arrayBuffers Δ | cap | verdict |
|---|---|---|---|---|
| subscribeRoom | 1426936 B | 0 B | 102400 B | PASS |
| deliverNotification | 853112 B | 0 B | 102400 B | PASS |
| getPending | 584800 B | 0 B | 102400 B | PASS |
| simulateReconnect | 431376 B | 0 B | 102400 B | PASS |

## Detailed serial reports

### subscribeRoom

# Perf Report — subscribeRoom.serial

| metric | value |
|---|---|
| iterations | 40 |
| warmup | 5 |
| p50 | 3.44ms |
| p95 | 3.48ms |
| p99 | 3.48ms |
| mean | 3.40ms |
| stdev | 0.18ms |
| min | 2.31ms |
| max | 3.48ms |
| total | 136.15ms |

### deliverNotification

# Perf Report — deliverNotification.serial

| metric | value |
|---|---|
| iterations | 40 |
| warmup | 5 |
| p50 | 3.46ms |
| p95 | 3.68ms |
| p99 | 3.78ms |
| mean | 3.40ms |
| stdev | 0.31ms |
| min | 2.32ms |
| max | 3.78ms |
| total | 136.18ms |

### getPending

# Perf Report — getPending.serial

| metric | value |
|---|---|
| iterations | 40 |
| warmup | 5 |
| p50 | 0.00ms |
| p95 | 0.00ms |
| p99 | 0.01ms |
| mean | 0.00ms |
| stdev | 0.00ms |
| min | 0.00ms |
| max | 0.01ms |
| total | 0.05ms |

### simulateReconnect

# Perf Report — simulateReconnect.serial

| metric | value |
|---|---|
| iterations | 40 |
| warmup | 5 |
| p50 | 0.00ms |
| p95 | 0.00ms |
| p99 | 0.01ms |
| mean | 0.00ms |
| stdev | 0.00ms |
| min | 0.00ms |
| max | 0.01ms |
| total | 0.06ms |

