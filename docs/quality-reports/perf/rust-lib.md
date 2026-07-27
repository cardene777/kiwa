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
| invokeAxumHandler | -2544 B | 0 B | 102400 B | yes | PASS |
| invokeActixHandler | 4880 B | 0 B | 102400 B | yes | PASS |
| captureTowerMiddleware | 944 B | 0 B | 102400 B | yes | PASS |
| invokeRocketRoute | 2720 B | 0 B | 102400 B | yes | PASS |

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
| p95 | 0.00ms | 0.00ms | -0.00ms | -6.49% |
| p99 | 0.01ms | 0.01ms | -0.00ms | -9.18% |
| mean | 0.00ms | 0.00ms | +0.00ms | +6.53% |
| min | 0.00ms | 0.00ms | 0.00ms | 0.00% |
| max | 0.01ms | 0.01ms | +0.00ms | +6.76% |
| total | 0.19ms | 0.18ms | +0.01ms | +6.53% |

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
| max | 0.00ms |
| total | 0.12ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p50 | 0.00ms | 0.00ms | 0.00ms | 0.00% |
| p95 | 0.00ms | 0.00ms | -0.00ms | -2.71% |
| p99 | 0.00ms | 0.00ms | +0.00ms | +3.01% |
| mean | 0.00ms | 0.00ms | -0.00ms | -0.31% |
| min | 0.00ms | 0.00ms | 0.00ms | 0.00% |
| max | 0.00ms | 0.00ms | +0.00ms | +19.35% |
| total | 0.12ms | 0.12ms | -0.00ms | -0.31% |

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
| total | 0.18ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p50 | 0.00ms | 0.00ms | -0.00ms | -17.66% |
| p95 | 0.00ms | 0.00ms | +0.00ms | +42.37% |
| p99 | 0.01ms | 0.01ms | +0.00ms | +29.62% |
| mean | 0.00ms | 0.00ms | -0.00ms | -2.18% |
| min | 0.00ms | 0.00ms | -0.00ms | -20.00% |
| max | 0.01ms | 0.01ms | +0.00ms | +29.43% |
| total | 0.18ms | 0.18ms | -0.00ms | -2.18% |

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
| p95 | 0.00ms | 0.00ms | -0.00ms | -14.13% |
| p99 | 0.00ms | 0.00ms | +0.00ms | +4.34% |
| mean | 0.00ms | 0.00ms | -0.00ms | -3.73% |
| min | 0.00ms | 0.00ms | 0.00ms | 0.00% |
| max | 0.01ms | 0.01ms | +0.00ms | +8.32% |
| total | 0.12ms | 0.13ms | -0.00ms | -3.73% |

