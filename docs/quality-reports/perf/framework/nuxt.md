# Perf Suite — nuxt

Threshold source: [docs/quality/perf-thresholds.md](../../../quality/perf-thresholds)

## Serial p95 (concurrency = 1)

| op | p95 | cap | gate | regression |
|---|---|---|---|---|
| invokeEventHandler | 0.00ms | 5ms | PASS | stable |
| invokeRouteMiddleware | 0.00ms | 5ms | PASS | stable |

## Concurrent p95 (concurrency = 10, 50 iter each)

| op | p95 | cap | gate |
|---|---|---|---|
| invokeEventHandler | 0.03ms | 10ms | PASS |
| invokeRouteMiddleware | 0.02ms | 10ms | PASS |

## Memory retention (200 iter, arrayBuffers axis is the gate; heap is informational)

| op | heapUsed Δ | arrayBuffers Δ | cap | gc exposed | verdict |
|---|---|---|---|---|---|
| invokeEventHandler | 265016 B | 0 B | 102400 B | yes | PASS |
| invokeRouteMiddleware | -528 B | 0 B | 102400 B | yes | PASS |

## Detailed serial reports

### invokeEventHandler

# Perf Report — invokeEventHandler.serial

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
| total | 0.32ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p50 | 0.00ms | 0.00ms | -0.00ms | -3.28% |
| p95 | 0.00ms | 0.00ms | +0.00ms | +24.80% |
| p99 | 0.01ms | 0.01ms | -0.00ms | -26.85% |
| mean | 0.00ms | 0.00ms | -0.00ms | -3.45% |
| min | 0.00ms | 0.00ms | 0.00ms | 0.00% |
| max | 0.02ms | 0.02ms | -0.00ms | -6.13% |
| total | 0.32ms | 0.33ms | -0.01ms | -3.45% |

### invokeRouteMiddleware

# Perf Report — invokeRouteMiddleware.serial

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
| p50 | 0.00ms | 0.00ms | -0.00ms | -16.67% |
| p95 | 0.00ms | 0.00ms | +0.00ms | +25.69% |
| p99 | 0.00ms | 0.00ms | +0.00ms | +7.64% |
| mean | 0.00ms | 0.00ms | -0.00ms | -1.52% |
| min | 0.00ms | 0.00ms | +0.00ms | +8.20% |
| max | 0.01ms | 0.00ms | +0.00ms | +35.90% |
| total | 0.16ms | 0.17ms | -0.00ms | -1.52% |

