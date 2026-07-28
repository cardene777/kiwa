# Perf Suite — rust-lib

Threshold source: [docs/quality/perf-thresholds.md](../../quality/perf-thresholds)

## Serial p95 (concurrency = 1)

| op | p95 | cap | gate | regression |
|---|---|---|---|---|
| invokeAxumHandler | 0.00ms | 5ms | PASS | stable (検知には +0.5ms (baseline 比 +6345%) 以上の悪化が必要) |
| invokeActixHandler | 0.00ms | 5ms | PASS | stable (検知には +0.5ms (baseline 比 +29044%) 以上の悪化が必要) |
| captureTowerMiddleware | 0.00ms | 5ms | PASS | stable (検知には +0.5ms (baseline 比 +39670%) 以上の悪化が必要) |
| invokeRocketRoute | 0.00ms | 5ms | PASS | stable (検知には +0.5ms (baseline 比 +35001%) 以上の悪化が必要) |

## Concurrent p95 (concurrency = 10, 50 iter each)

| op | p95 | cap | gate |
|---|---|---|---|
| invokeAxumHandler | 0.01ms | 10ms | PASS |
| invokeActixHandler | 0.01ms | 10ms | PASS |
| captureTowerMiddleware | 0.01ms | 10ms | PASS |
| invokeRocketRoute | 0.01ms | 10ms | PASS |

## Memory retention (200 iter, arrayBuffers axis is the gate; heap is informational)

| op | heapUsed Δ | arrayBuffers Δ | cap | gc exposed | verdict |
|---|---|---|---|---|---|
| invokeAxumHandler | -5600 B | 0 B | 102400 B | yes | PASS |
| invokeActixHandler | 2736 B | 0 B | 102400 B | yes | PASS |
| captureTowerMiddleware | 712 B | 0 B | 102400 B | yes | PASS |
| invokeRocketRoute | 4656 B | 0 B | 102400 B | yes | PASS |

## Detailed serial reports

### invokeAxumHandler

# Perf Report — invokeAxumHandler.serial

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
| total | 0.20ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p50 | 0.00ms | 0.00ms | -0.00ms | -58.33% |
| p95 | 0.00ms | 0.01ms | -0.01ms | -63.76% |
| p99 | 0.01ms | 0.02ms | -0.01ms | -57.29% |
| mean | 0.00ms | 0.00ms | -0.00ms | -57.38% |
| min | 0.00ms | 0.00ms | -0.00ms | -59.29% |
| max | 0.01ms | 0.04ms | -0.02ms | -60.47% |
| total | 0.20ms | 0.47ms | -0.27ms | -57.38% |

### invokeActixHandler

# Perf Report — invokeActixHandler.serial

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
| total | 0.13ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p50 | 0.00ms | 0.00ms | -0.00ms | -7.75% |
| p95 | 0.00ms | 0.00ms | -0.00ms | -7.80% |
| p99 | 0.00ms | 0.01ms | -0.00ms | -50.57% |
| mean | 0.00ms | 0.00ms | -0.00ms | -21.88% |
| min | 0.00ms | 0.00ms | -0.00ms | -8.40% |
| max | 0.01ms | 0.02ms | -0.01ms | -59.18% |
| total | 0.13ms | 0.16ms | -0.04ms | -21.88% |

### captureTowerMiddleware

# Perf Report — captureTowerMiddleware.serial

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
| total | 0.17ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p50 | 0.00ms | 0.00ms | -0.00ms | -23.58% |
| p95 | 0.00ms | 0.00ms | +0.00ms | +15.73% |
| p99 | 0.01ms | 0.00ms | +0.00ms | +29.46% |
| mean | 0.00ms | 0.00ms | -0.00ms | -11.22% |
| min | 0.00ms | 0.00ms | -0.00ms | -23.59% |
| max | 0.01ms | 0.01ms | +0.00ms | +25.12% |
| total | 0.17ms | 0.19ms | -0.02ms | -11.22% |

### invokeRocketRoute

# Perf Report — invokeRocketRoute.serial

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
| total | 0.13ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p50 | 0.00ms | 0.00ms | -0.00ms | -3.64% |
| p95 | 0.00ms | 0.00ms | -0.00ms | -28.40% |
| p99 | 0.00ms | 0.00ms | -0.00ms | -3.73% |
| mean | 0.00ms | 0.00ms | -0.00ms | -2.93% |
| min | 0.00ms | 0.00ms | 0.00ms | 0.00% |
| max | 0.01ms | 0.01ms | -0.00ms | -6.38% |
| total | 0.13ms | 0.14ms | -0.00ms | -2.93% |

