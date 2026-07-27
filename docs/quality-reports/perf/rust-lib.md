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
| captureTowerMiddleware | 0.02ms | 10ms | PASS |
| invokeRocketRoute | 0.01ms | 10ms | PASS |

## Memory retention (200 iter, arrayBuffers axis is the gate; heap is informational)

| op | heapUsed Δ | arrayBuffers Δ | cap | gc exposed | verdict |
|---|---|---|---|---|---|
| invokeAxumHandler | -13536 B | 0 B | 102400 B | yes | PASS |
| invokeActixHandler | 4024 B | 0 B | 102400 B | yes | PASS |
| captureTowerMiddleware | 624 B | 0 B | 102400 B | yes | PASS |
| invokeRocketRoute | 4856 B | 0 B | 102400 B | yes | PASS |

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
| p50 | 0.00ms | 0.00ms | +0.00ms | +14.24% |
| p95 | 0.00ms | 0.00ms | +0.00ms | +7.82% |
| p99 | 0.01ms | 0.01ms | -0.00ms | -7.78% |
| mean | 0.00ms | 0.00ms | +0.00ms | +8.64% |
| min | 0.00ms | 0.00ms | +0.00ms | +9.17% |
| max | 0.01ms | 0.01ms | -0.00ms | -4.00% |
| total | 0.20ms | 0.18ms | +0.02ms | +8.64% |

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
| total | 0.14ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p50 | 0.00ms | 0.00ms | +0.00ms | +16.60% |
| p95 | 0.00ms | 0.00ms | +0.00ms | +10.60% |
| p99 | 0.00ms | 0.00ms | +0.00ms | +16.07% |
| mean | 0.00ms | 0.00ms | +0.00ms | +13.25% |
| min | 0.00ms | 0.00ms | +0.00ms | +9.17% |
| max | 0.01ms | 0.00ms | +0.00ms | +32.26% |
| total | 0.14ms | 0.12ms | +0.02ms | +13.25% |

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
| total | 0.20ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p50 | 0.00ms | 0.00ms | +0.00ms | +5.93% |
| p95 | 0.00ms | 0.00ms | +0.00ms | +0.78% |
| p99 | 0.01ms | 0.01ms | +0.00ms | +17.71% |
| mean | 0.00ms | 0.00ms | +0.00ms | +11.85% |
| min | 0.00ms | 0.00ms | 0.00ms | 0.00% |
| max | 0.01ms | 0.01ms | +0.00ms | +20.56% |
| total | 0.20ms | 0.18ms | +0.02ms | +11.85% |

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
| p50 | 0.00ms | 0.00ms | +0.00ms | +3.78% |
| p95 | 0.00ms | 0.00ms | +0.00ms | +35.48% |
| p99 | 0.00ms | 0.00ms | +0.00ms | +21.64% |
| mean | 0.00ms | 0.00ms | +0.00ms | +8.63% |
| min | 0.00ms | 0.00ms | +0.00ms | +18.12% |
| max | 0.01ms | 0.01ms | +0.00ms | +21.66% |
| total | 0.14ms | 0.13ms | +0.01ms | +8.63% |

