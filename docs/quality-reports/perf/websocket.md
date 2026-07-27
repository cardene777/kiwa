# Perf Suite — websocket

Threshold source: [docs/quality/perf-thresholds.md](../../quality/perf-thresholds)

## Serial p95 (concurrency = 1)

| op | p95 | cap | gate | regression |
|---|---|---|---|---|
| sendMessage | 0.00ms | 5ms | PASS | stable |
| broadcastMessage | 0.00ms | 5ms | PASS | stable |
| captureBinaryFrame | 0.00ms | 5ms | PASS | stable |

## Concurrent p95 (concurrency = 10, 50 iter each)

| op | p95 | cap | gate |
|---|---|---|---|
| sendMessage | 0.01ms | 10ms | PASS |
| broadcastMessage | 0.01ms | 10ms | PASS |
| captureBinaryFrame | 0.01ms | 10ms | PASS |

## Memory retention (200 iter, arrayBuffers axis is the gate; heap is informational)

| op | heapUsed Δ | arrayBuffers Δ | cap | gc exposed | verdict |
|---|---|---|---|---|---|
| sendMessage | 368120 B | 0 B | 102400 B | yes | PASS |
| broadcastMessage | 20648 B | 0 B | 102400 B | yes | PASS |
| captureBinaryFrame | 480 B | 0 B | 102400 B | yes | PASS |

## Detailed serial reports

### sendMessage

# Perf Report — sendMessage.serial

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
| total | 0.12ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p50 | 0.00ms | 0.00ms | 0.00ms | 0.00% |
| p95 | 0.00ms | 0.00ms | +0.00ms | +11.35% |
| p99 | 0.00ms | 0.01ms | -0.00ms | -34.51% |
| mean | 0.00ms | 0.00ms | -0.00ms | -0.82% |
| min | 0.00ms | 0.00ms | 0.00ms | 0.00% |
| max | 0.01ms | 0.01ms | -0.00ms | -9.66% |
| total | 0.12ms | 0.12ms | -0.00ms | -0.82% |

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
| p50 | 0.00ms | 0.00ms | 0.00ms | 0.00% |
| p95 | 0.00ms | 0.00ms | 0.00ms | 0.00% |
| p99 | 0.00ms | 0.00ms | +0.00ms | +43.30% |
| mean | 0.00ms | 0.00ms | +0.00ms | +5.47% |
| min | 0.00ms | 0.00ms | +0.00ms | +16.80% |
| max | 0.00ms | 0.00ms | +0.00ms | +16.90% |
| total | 0.08ms | 0.08ms | +0.00ms | +5.47% |

### captureBinaryFrame

# Perf Report — captureBinaryFrame.serial

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
| max | 0.02ms |
| total | 0.10ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p50 | 0.00ms | 0.00ms | 0.00ms | 0.00% |
| p95 | 0.00ms | 0.00ms | +0.00ms | +11.57% |
| p99 | 0.01ms | 0.00ms | +0.00ms | +208.02% |
| mean | 0.00ms | 0.00ms | +0.00ms | +20.89% |
| min | 0.00ms | 0.00ms | 0.00ms | 0.00% |
| max | 0.02ms | 0.01ms | +0.01ms | +78.71% |
| total | 0.10ms | 0.08ms | +0.02ms | +20.89% |

