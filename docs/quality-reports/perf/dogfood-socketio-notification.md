# Perf Suite — dogfood-socketio-notification

Threshold source: [docs/quality/perf-thresholds.md](../../quality/perf-thresholds)

## Serial p95 (concurrency = 1)

| op | p95 | cap | gate | regression |
|---|---|---|---|---|
| subscribeRoom | 3.48ms | 50ms | PASS | stable |
| deliverNotification | 3.49ms | 30ms | PASS | stable |
| getPending | 0.00ms | 30ms | PASS | stable |
| simulateReconnect | 0.00ms | 100ms | PASS | stable |

## Concurrent p95 (concurrency = 10, 50 iter each)

| op | p95 | cap | gate |
|---|---|---|---|
| subscribeRoom | 3.56ms | 100ms | PASS |
| deliverNotification | 3.65ms | 60ms | PASS |
| getPending | 0.01ms | 60ms | PASS |
| simulateReconnect | 0.01ms | 200ms | PASS |

## Memory retention (200 iter, arrayBuffers axis is the gate; heap is informational)

| op | heapUsed Δ | arrayBuffers Δ | cap | verdict |
|---|---|---|---|---|
| subscribeRoom | 1432304 B | 0 B | 102400 B | PASS |
| deliverNotification | 853080 B | 0 B | 102400 B | PASS |
| getPending | 320704 B | 0 B | 102400 B | PASS |
| simulateReconnect | 435496 B | 0 B | 102400 B | PASS |

## Detailed serial reports

### subscribeRoom

# Perf Report — subscribeRoom.serial

| metric | value |
|---|---|
| iterations | 40 |
| warmup | 5 |
| p50 | 3.43ms |
| p95 | 3.48ms |
| p99 | 3.52ms |
| mean | 3.40ms |
| stdev | 0.18ms |
| min | 2.35ms |
| max | 3.52ms |
| total | 135.85ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p50 | 3.43ms | 3.44ms | -0.01ms | -0.25% |
| p95 | 3.48ms | 3.48ms | +0.01ms | +0.19% |
| p99 | 3.52ms | 3.48ms | +0.04ms | +1.05% |
| mean | 3.40ms | 3.40ms | -0.01ms | -0.21% |
| min | 2.35ms | 2.31ms | +0.03ms | +1.46% |
| max | 3.52ms | 3.48ms | +0.04ms | +1.05% |
| total | 135.85ms | 136.15ms | -0.29ms | -0.21% |

### deliverNotification

# Perf Report — deliverNotification.serial

| metric | value |
|---|---|
| iterations | 40 |
| warmup | 5 |
| p50 | 3.43ms |
| p95 | 3.49ms |
| p99 | 3.50ms |
| mean | 3.35ms |
| stdev | 0.30ms |
| min | 2.30ms |
| max | 3.50ms |
| total | 134.16ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p50 | 3.43ms | 3.46ms | -0.02ms | -0.67% |
| p95 | 3.49ms | 3.68ms | -0.19ms | -5.24% |
| p99 | 3.50ms | 3.78ms | -0.28ms | -7.33% |
| mean | 3.35ms | 3.40ms | -0.05ms | -1.48% |
| min | 2.30ms | 2.32ms | -0.01ms | -0.56% |
| max | 3.50ms | 3.78ms | -0.28ms | -7.33% |
| total | 134.16ms | 136.18ms | -2.02ms | -1.48% |

### getPending

# Perf Report — getPending.serial

| metric | value |
|---|---|
| iterations | 40 |
| warmup | 5 |
| p50 | 0.00ms |
| p95 | 0.00ms |
| p99 | 0.00ms |
| mean | 0.00ms |
| stdev | 0.00ms |
| min | 0.00ms |
| max | 0.00ms |
| total | 0.03ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p50 | 0.00ms | 0.00ms | -0.00ms | -35.68% |
| p95 | 0.00ms | 0.00ms | -0.00ms | -7.94% |
| p99 | 0.00ms | 0.01ms | -0.00ms | -47.71% |
| mean | 0.00ms | 0.00ms | -0.00ms | -34.70% |
| min | 0.00ms | 0.00ms | -0.00ms | -38.45% |
| max | 0.00ms | 0.01ms | -0.00ms | -47.71% |
| total | 0.03ms | 0.05ms | -0.02ms | -34.70% |

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
| total | 0.04ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p50 | 0.00ms | 0.00ms | -0.00ms | -38.93% |
| p95 | 0.00ms | 0.00ms | -0.00ms | -26.65% |
| p99 | 0.01ms | 0.01ms | -0.00ms | -42.21% |
| mean | 0.00ms | 0.00ms | -0.00ms | -38.05% |
| min | 0.00ms | 0.00ms | -0.00ms | -35.31% |
| max | 0.01ms | 0.01ms | -0.00ms | -42.21% |
| total | 0.04ms | 0.06ms | -0.02ms | -38.05% |

