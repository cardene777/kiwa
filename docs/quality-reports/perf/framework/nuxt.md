# Perf Suite — nuxt

Threshold source: [docs/quality/perf-thresholds.md](../../../quality/perf-thresholds)

## Serial p95 (concurrency = 1)

| op | p95 | cap | gate | regression |
|---|---|---|---|---|
| invokeEventHandler | 0.01ms | 5ms | PASS | stable (検知には +0.5ms (baseline 比 +15082%) 以上の悪化が必要) |
| invokeRouteMiddleware | 0.00ms | 5ms | PASS | stable (検知には +0.5ms (baseline 比 +44362%) 以上の悪化が必要) |

## Concurrent p95 (concurrency = 10, 50 iter each)

| op | p95 | cap | gate |
|---|---|---|---|
| invokeEventHandler | 0.03ms | 10ms | PASS |
| invokeRouteMiddleware | 0.02ms | 10ms | PASS |

## Memory retention (200 iter, arrayBuffers axis is the gate; heap is informational)

| op | heapUsed Δ | arrayBuffers Δ | cap | gc exposed | verdict |
|---|---|---|---|---|---|
| invokeEventHandler | -18600 B | 0 B | 102400 B | yes | PASS |
| invokeRouteMiddleware | -16320 B | 0 B | 102400 B | yes | PASS |

## Detailed serial reports

### invokeEventHandler

# Perf Report — invokeEventHandler.serial

| metric | value |
|---|---|
| iterations | 200 |
| warmup | 5 |
| p50 | 0.00ms |
| p95 | 0.01ms |
| p99 | 0.03ms |
| mean | 0.00ms |
| stdev | 0.00ms |
| min | 0.00ms |
| max | 0.04ms |
| total | 0.42ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p50 | 0.00ms | 0.00ms | +0.00ms | +15.93% |
| p95 | 0.01ms | 0.00ms | +0.00ms | +84.96% |
| p99 | 0.03ms | 0.02ms | +0.01ms | +87.33% |
| mean | 0.00ms | 0.00ms | +0.00ms | +22.47% |
| min | 0.00ms | 0.00ms | -0.00ms | -9.06% |
| max | 0.04ms | 0.02ms | +0.02ms | +80.64% |
| total | 0.42ms | 0.34ms | +0.08ms | +22.47% |

### invokeRouteMiddleware

# Perf Report — invokeRouteMiddleware.serial

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
| total | 0.17ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p50 | 0.00ms | 0.00ms | -0.00ms | -26.17% |
| p95 | 0.00ms | 0.00ms | -0.00ms | -6.90% |
| p99 | 0.01ms | 0.01ms | +0.00ms | +10.39% |
| mean | 0.00ms | 0.00ms | -0.00ms | -2.76% |
| min | 0.00ms | 0.00ms | -0.00ms | -0.18% |
| max | 0.02ms | 0.01ms | +0.01ms | +120.97% |
| total | 0.17ms | 0.17ms | -0.00ms | -2.76% |

