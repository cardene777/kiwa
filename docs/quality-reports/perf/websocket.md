# Perf Suite — websocket

Threshold source: [docs/quality/perf-thresholds.md](../../quality/perf-thresholds)

## Serial p95 (concurrency = 1)

| op | p95 | cap | gate | regression |
|---|---|---|---|---|
| sendMessage | 0.00ms | 5ms | PASS | stable |
| broadcastMessage | 0.00ms | 5ms | PASS | stable |
| captureBinaryFrame | 0.00ms | 5ms | PASS | improved |

## Concurrent p95 (concurrency = 10, 50 iter each)

| op | p95 | cap | gate |
|---|---|---|---|
| sendMessage | 0.01ms | 10ms | PASS |
| broadcastMessage | 0.01ms | 10ms | PASS |
| captureBinaryFrame | 0.01ms | 10ms | PASS |

## Memory retention (200 iter, arrayBuffers axis is the gate; heap is informational)

| op | heapUsed Δ | arrayBuffers Δ | cap | verdict |
|---|---|---|---|---|
| sendMessage | 371448 B | 0 B | 102400 B | PASS |
| broadcastMessage | 241176 B | 0 B | 102400 B | PASS |
| captureBinaryFrame | -53032 B | 0 B | 102400 B | PASS |

## Detailed serial reports

### sendMessage

# Perf Report — sendMessage.serial

| metric | value |
|---|---|
| iterations | 200 |
| warmup | 5 |
| p50 | 0.00ms |
| p95 | 0.00ms |
| p99 | 0.01ms |
| mean | 0.00ms |
| stdev | 0.00ms |
| min | 0.00ms |
| max | 0.01ms |
| total | 0.12ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p50 | 0.00ms | 0.00ms | -0.00ms | -16.60% |
| p95 | 0.00ms | 0.00ms | -0.00ms | -22.86% |
| p99 | 0.01ms | 0.00ms | +0.00ms | +93.42% |
| mean | 0.00ms | 0.00ms | -0.00ms | -5.94% |
| min | 0.00ms | 0.00ms | -0.00ms | -33.33% |
| max | 0.01ms | 0.01ms | -0.00ms | -5.50% |
| total | 0.12ms | 0.12ms | -0.01ms | -5.94% |

### broadcastMessage

# Perf Report — broadcastMessage.serial

| metric | value |
|---|---|
| iterations | 200 |
| warmup | 5 |
| p50 | 0.00ms |
| p95 | 0.00ms |
| p99 | 0.00ms |
| mean | 0.00ms |
| stdev | 0.00ms |
| min | 0.00ms |
| max | 0.00ms |
| total | 0.08ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p50 | 0.00ms | 0.00ms | -0.00ms | -19.90% |
| p95 | 0.00ms | 0.00ms | -0.00ms | -0.16% |
| p99 | 0.00ms | 0.00ms | -0.00ms | -45.17% |
| mean | 0.00ms | 0.00ms | -0.00ms | -20.37% |
| min | 0.00ms | 0.00ms | -0.00ms | -30.05% |
| max | 0.00ms | 0.01ms | -0.00ms | -31.71% |
| total | 0.08ms | 0.10ms | -0.02ms | -20.37% |

### captureBinaryFrame

# Perf Report — captureBinaryFrame.serial

| metric | value |
|---|---|
| iterations | 200 |
| warmup | 5 |
| p50 | 0.00ms |
| p95 | 0.00ms |
| p99 | 0.00ms |
| mean | 0.00ms |
| stdev | 0.00ms |
| min | 0.00ms |
| max | 0.01ms |
| total | 0.08ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p50 | 0.00ms | 0.00ms | -0.00ms | -22.13% |
| p95 | 0.00ms | 0.00ms | -0.00ms | -70.17% |
| p99 | 0.00ms | 0.00ms | +0.00ms | +17.86% |
| mean | 0.00ms | 0.00ms | -0.00ms | -27.04% |
| min | 0.00ms | 0.00ms | -0.00ms | -24.92% |
| max | 0.01ms | 0.01ms | -0.00ms | -29.84% |
| total | 0.08ms | 0.11ms | -0.03ms | -27.04% |

