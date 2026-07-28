# Perf Suite — websocket

Threshold source: [docs/quality/perf-thresholds.md](../../quality/perf-thresholds)

## Serial p95 (concurrency = 1)

| op | p95 | cap | gate | regression |
|---|---|---|---|---|
| sendMessage | 0.00ms | 5ms | PASS | stable (検知には +0.5ms (baseline 比 +52192%) 以上の悪化が必要) |
| broadcastMessage | 0.00ms | 5ms | PASS | stable (検知には +0.5ms (baseline 比 +91358%) 以上の悪化が必要) |
| captureBinaryFrame | 0.00ms | 5ms | PASS | stable (検知には +0.5ms (baseline 比 +119589%) 以上の悪化が必要) |

## Concurrent p95 (concurrency = 10, 50 iter each)

| op | p95 | cap | gate |
|---|---|---|---|
| sendMessage | 0.01ms | 10ms | PASS |
| broadcastMessage | 0.01ms | 10ms | PASS |
| captureBinaryFrame | 0.01ms | 10ms | PASS |

## Memory retention (200 iter, arrayBuffers axis is the gate; heap is informational)

| op | heapUsed Δ | arrayBuffers Δ | cap | gc exposed | verdict |
|---|---|---|---|---|---|
| sendMessage | -3320 B | 0 B | 102400 B | yes | PASS |
| broadcastMessage | 6160 B | 0 B | 102400 B | yes | PASS |
| captureBinaryFrame | 520 B | 0 B | 102400 B | yes | PASS |

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
| p50 | 0.00ms | 0.00ms | -0.00ms | -16.60% |
| p95 | 0.00ms | 0.00ms | -0.00ms | -21.50% |
| p99 | 0.00ms | 0.01ms | -0.00ms | -54.66% |
| mean | 0.00ms | 0.00ms | -0.00ms | -16.86% |
| min | 0.00ms | 0.00ms | -0.00ms | -45.41% |
| max | 0.01ms | 0.01ms | -0.00ms | -15.21% |
| total | 0.12ms | 0.14ms | -0.02ms | -16.86% |

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
| max | 0.01ms |
| total | 0.09ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p50 | 0.00ms | 0.00ms | -0.00ms | -10.93% |
| p95 | 0.00ms | 0.00ms | +0.00ms | +7.46% |
| p99 | 0.00ms | 0.00ms | +0.00ms | +33.44% |
| mean | 0.00ms | 0.00ms | -0.00ms | -0.51% |
| min | 0.00ms | 0.00ms | -0.00ms | -12.61% |
| max | 0.01ms | 0.00ms | +0.01ms | +140.64% |
| total | 0.09ms | 0.09ms | -0.00ms | -0.51% |

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
| p50 | 0.00ms | 0.00ms | -0.00ms | -12.31% |
| p95 | 0.00ms | 0.00ms | +0.00ms | +20.09% |
| p99 | 0.00ms | 0.00ms | +0.00ms | +56.01% |
| mean | 0.00ms | 0.00ms | -0.00ms | -10.42% |
| min | 0.00ms | 0.00ms | 0.00ms | 0.00% |
| max | 0.01ms | 0.01ms | -0.00ms | -39.87% |
| total | 0.08ms | 0.09ms | -0.01ms | -10.42% |

