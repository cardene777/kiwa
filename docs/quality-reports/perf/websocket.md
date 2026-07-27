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
| sendMessage | -7848 B | 0 B | 102400 B | yes | PASS |
| broadcastMessage | 21400 B | 0 B | 102400 B | yes | PASS |
| captureBinaryFrame | 1216 B | 0 B | 102400 B | yes | PASS |

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
| total | 0.11ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p50 | 0.00ms | 0.00ms | 0.00ms | 0.00% |
| p95 | 0.00ms | 0.00ms | +0.00ms | +6.43% |
| p99 | 0.00ms | 0.01ms | -0.00ms | -36.24% |
| mean | 0.00ms | 0.00ms | -0.00ms | -6.82% |
| min | 0.00ms | 0.00ms | 0.00ms | 0.00% |
| max | 0.01ms | 0.01ms | -0.00ms | -28.96% |
| total | 0.11ms | 0.12ms | -0.01ms | -6.82% |

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
| total | 0.09ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p50 | 0.00ms | 0.00ms | +0.00ms | +12.28% |
| p95 | 0.00ms | 0.00ms | +0.00ms | +8.40% |
| p99 | 0.00ms | 0.00ms | +0.00ms | +12.07% |
| mean | 0.00ms | 0.00ms | +0.00ms | +12.56% |
| min | 0.00ms | 0.00ms | +0.00ms | +33.20% |
| max | 0.00ms | 0.00ms | +0.00ms | +14.31% |
| total | 0.09ms | 0.08ms | +0.01ms | +12.56% |

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
| max | 0.01ms |
| total | 0.09ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p50 | 0.00ms | 0.00ms | 0.00ms | 0.00% |
| p95 | 0.00ms | 0.00ms | +0.00ms | +76.59% |
| p99 | 0.01ms | 0.00ms | +0.00ms | +177.16% |
| mean | 0.00ms | 0.00ms | +0.00ms | +8.90% |
| min | 0.00ms | 0.00ms | 0.00ms | 0.00% |
| max | 0.01ms | 0.01ms | -0.00ms | -5.56% |
| total | 0.09ms | 0.08ms | +0.01ms | +8.90% |

