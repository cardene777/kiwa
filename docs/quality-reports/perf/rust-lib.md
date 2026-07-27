# Perf Suite — rust-lib

Threshold source: [docs/quality/perf-thresholds.md](../../quality/perf-thresholds)

## Serial p95 (concurrency = 1)

| op | p95 | cap | gate | regression |
|---|---|---|---|---|
| invokeAxumHandler | 0.00ms | 5ms | PASS | stable |
| invokeActixHandler | 0.00ms | 5ms | PASS | stable |
| captureTowerMiddleware | 0.00ms | 5ms | PASS | stable |
| invokeRocketRoute | 0.00ms | 5ms | PASS | stable |

## Concurrent p95 (concurrency = 10, 50 iter each)

| op | p95 | cap | gate |
|---|---|---|---|
| invokeAxumHandler | 0.01ms | 10ms | PASS |
| invokeActixHandler | 0.01ms | 10ms | PASS |
| captureTowerMiddleware | 0.01ms | 10ms | PASS |
| invokeRocketRoute | 0.01ms | 10ms | PASS |

## Memory retention (200 iter, arrayBuffers axis is the gate; heap is informational)

| op | heapUsed Δ | arrayBuffers Δ | cap | verdict |
|---|---|---|---|---|
| invokeAxumHandler | 805856 B | 0 B | 102400 B | PASS |
| invokeActixHandler | 419736 B | 0 B | 102400 B | PASS |
| captureTowerMiddleware | 477696 B | 0 B | 102400 B | PASS |
| invokeRocketRoute | 430368 B | 0 B | 102400 B | PASS |

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
| total | 0.19ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p50 | 0.00ms | 0.00ms | +0.00ms | +7.20% |
| p95 | 0.00ms | 0.00ms | -0.00ms | -22.89% |
| p99 | 0.01ms | 0.01ms | -0.00ms | -2.97% |
| mean | 0.00ms | 0.00ms | -0.00ms | -52.47% |
| min | 0.00ms | 0.00ms | +0.00ms | +8.40% |
| max | 0.01ms | 0.21ms | -0.20ms | -94.20% |
| total | 0.19ms | 0.39ms | -0.20ms | -52.47% |

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
| total | 0.15ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p50 | 0.00ms | 0.00ms | 0.00ms | 0.00% |
| p95 | 0.00ms | 0.00ms | -0.00ms | -0.43% |
| p99 | 0.00ms | 0.00ms | -0.00ms | -0.10% |
| mean | 0.00ms | 0.00ms | -0.00ms | -3.32% |
| min | 0.00ms | 0.00ms | +0.00ms | +7.56% |
| max | 0.01ms | 0.00ms | +0.00ms | +15.93% |
| total | 0.15ms | 0.16ms | -0.01ms | -3.32% |

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
| total | 0.19ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p50 | 0.00ms | 0.00ms | -0.00ms | -15.11% |
| p95 | 0.00ms | 0.00ms | -0.00ms | -27.18% |
| p99 | 0.01ms | 0.01ms | -0.00ms | -7.90% |
| mean | 0.00ms | 0.00ms | -0.00ms | -22.85% |
| min | 0.00ms | 0.00ms | -0.00ms | -16.67% |
| max | 0.01ms | 0.01ms | +0.00ms | +29.66% |
| total | 0.19ms | 0.25ms | -0.06ms | -22.85% |

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
| total | 0.14ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p50 | 0.00ms | 0.00ms | 0.00ms | 0.00% |
| p95 | 0.00ms | 0.00ms | -0.00ms | -8.54% |
| p99 | 0.00ms | 0.00ms | +0.00ms | +25.39% |
| mean | 0.00ms | 0.00ms | +0.00ms | +1.06% |
| min | 0.00ms | 0.00ms | 0.00ms | 0.00% |
| max | 0.01ms | 0.01ms | +0.00ms | +5.75% |
| total | 0.14ms | 0.14ms | +0.00ms | +1.06% |

