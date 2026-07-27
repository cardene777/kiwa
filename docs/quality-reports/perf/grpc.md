# Perf Suite — grpc

Threshold source: [docs/quality/perf-thresholds.md](../../quality/perf-thresholds)

## Serial p95 (concurrency = 1)

| op | p95 | cap | gate | regression |
|---|---|---|---|---|
| invokeUnary | 0.00ms | 5ms | PASS | stable |
| invokeServerStream | 0.00ms | 5ms | PASS | improved |

## Concurrent p95 (concurrency = 10, 50 iter each)

| op | p95 | cap | gate |
|---|---|---|---|
| invokeUnary | 0.01ms | 10ms | PASS |
| invokeServerStream | 0.01ms | 10ms | PASS |

## Memory retention (200 iter, arrayBuffers axis is the gate; heap is informational)

| op | heapUsed Δ | arrayBuffers Δ | cap | verdict |
|---|---|---|---|---|
| invokeUnary | 592472 B | 0 B | 102400 B | PASS |
| invokeServerStream | 1026088 B | 0 B | 102400 B | PASS |

## Detailed serial reports

### invokeUnary

# Perf Report — invokeUnary.serial

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
| total | 0.16ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p50 | 0.00ms | 0.00ms | -0.00ms | -15.91% |
| p95 | 0.00ms | 0.00ms | +0.00ms | +21.46% |
| p99 | 0.00ms | 0.00ms | -0.00ms | -13.53% |
| mean | 0.00ms | 0.00ms | -0.00ms | -15.06% |
| min | 0.00ms | 0.00ms | -0.00ms | -29.38% |
| max | 0.01ms | 0.01ms | -0.00ms | -16.25% |
| total | 0.16ms | 0.19ms | -0.03ms | -15.06% |

### invokeServerStream

# Perf Report — invokeServerStream.serial

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
| total | 0.23ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p50 | 0.00ms | 0.00ms | -0.00ms | -68.56% |
| p95 | 0.00ms | 0.01ms | -0.01ms | -81.93% |
| p99 | 0.01ms | 0.02ms | -0.01ms | -69.62% |
| mean | 0.00ms | 0.00ms | -0.00ms | -74.92% |
| min | 0.00ms | 0.00ms | -0.00ms | -64.29% |
| max | 0.01ms | 0.12ms | -0.11ms | -92.76% |
| total | 0.23ms | 0.90ms | -0.68ms | -74.92% |

