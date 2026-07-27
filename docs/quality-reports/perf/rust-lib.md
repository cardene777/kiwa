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

| op | heapUsed Δ | arrayBuffers Δ | cap | gc exposed | verdict |
|---|---|---|---|---|---|
| invokeAxumHandler | -1552 B | 0 B | 102400 B | yes | PASS |
| invokeActixHandler | 5048 B | 0 B | 102400 B | yes | PASS |
| captureTowerMiddleware | -216 B | 0 B | 102400 B | yes | PASS |
| invokeRocketRoute | 5008 B | 0 B | 102400 B | yes | PASS |

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
| total | 0.17ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p50 | 0.00ms | 0.00ms | 0.00ms | 0.00% |
| p95 | 0.00ms | 0.00ms | -0.00ms | -14.97% |
| p99 | 0.01ms | 0.01ms | -0.00ms | -21.41% |
| mean | 0.00ms | 0.00ms | -0.00ms | -4.60% |
| min | 0.00ms | 0.00ms | 0.00ms | 0.00% |
| max | 0.01ms | 0.01ms | -0.00ms | -7.69% |
| total | 0.17ms | 0.18ms | -0.01ms | -4.60% |

### invokeActixHandler

# Perf Report — invokeActixHandler.serial

| metric | value |
|---|---|
| iterations | 200 |
| warmup | 5 |
| p50 | 0.00ms |
| p95 | 0.00ms |
| p99 | 0.01ms |
| mean | 0.00ms |
| stdev | 0.01ms |
| min | 0.00ms |
| max | 0.07ms |
| total | 0.21ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p50 | 0.00ms | 0.00ms | 0.00ms | 0.00% |
| p95 | 0.00ms | 0.00ms | +0.00ms | +10.47% |
| p99 | 0.01ms | 0.00ms | +0.00ms | +179.46% |
| mean | 0.00ms | 0.00ms | +0.00ms | +71.24% |
| min | 0.00ms | 0.00ms | 0.00ms | 0.00% |
| max | 0.07ms | 0.00ms | +0.07ms | +1797.83% |
| total | 0.21ms | 0.12ms | +0.09ms | +71.24% |

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
| p50 | 0.00ms | 0.00ms | -0.00ms | -17.51% |
| p95 | 0.00ms | 0.00ms | +0.00ms | +14.40% |
| p99 | 0.01ms | 0.01ms | +0.00ms | +0.32% |
| mean | 0.00ms | 0.00ms | -0.00ms | -5.03% |
| min | 0.00ms | 0.00ms | -0.00ms | -13.44% |
| max | 0.01ms | 0.01ms | +0.00ms | +15.72% |
| total | 0.17ms | 0.18ms | -0.01ms | -5.03% |

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
| total | 0.12ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p50 | 0.00ms | 0.00ms | -0.00ms | -7.75% |
| p95 | 0.00ms | 0.00ms | +0.00ms | +6.47% |
| p99 | 0.00ms | 0.00ms | -0.00ms | -1.32% |
| mean | 0.00ms | 0.00ms | -0.00ms | -6.23% |
| min | 0.00ms | 0.00ms | 0.00ms | 0.00% |
| max | 0.01ms | 0.01ms | +0.00ms | +10.00% |
| total | 0.12ms | 0.13ms | -0.01ms | -6.23% |

