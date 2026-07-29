# Perf Suite — nuxt

Threshold source: [docs/quality/perf-thresholds.md](../../../quality/perf-thresholds)

## Serial p95 (concurrency = 1)

| op | p95 | cap | gate | regression |
|---|---|---|---|---|
| invokeEventHandler | 0.00ms | 5ms | PASS | stable (検知には +0.5ms (baseline 比 +15082%) 以上の悪化が必要) — gate 無効 (regressionGate=false) |
| invokeRouteMiddleware | 0.00ms | 5ms | PASS | stable (検知には +0.5ms (baseline 比 +44362%) 以上の悪化が必要) — gate 無効 (regressionGate=false) |

## Concurrent p95 (concurrency = 10, 50 iter each)

| op | p95 | cap | gate |
|---|---|---|---|
| invokeEventHandler | 0.02ms | 10ms | PASS |
| invokeRouteMiddleware | 0.02ms | 10ms | PASS |

## Memory retention (200 iter, arrayBuffers axis is the gate; heap is informational)

| op | heapUsed Δ | arrayBuffers Δ | cap | gc exposed | verdict |
|---|---|---|---|---|---|
| invokeEventHandler | -4344 B | -32400 B | 102400 B | yes | PASS |
| invokeRouteMiddleware | 2000 B | 0 B | 102400 B | yes | PASS |

## Detailed serial reports

### invokeEventHandler

# Perf Report — invokeEventHandler.serial

| metric | value |
|---|---|
| iterations | 200 |
| warmup | 5 |
| p50 | 0.00ms |
| p95 | 0.00ms |
| p99 | 0.02ms |
| mean | 0.00ms |
| stdev | 0.00ms |
| min | 0.00ms |
| max | 0.05ms |
| total | 0.42ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p50 | 0.00ms | 0.00ms | +0.00ms | +31.96% |
| p95 | 0.00ms | 0.00ms | +0.00ms | +44.61% |
| p99 | 0.02ms | 0.02ms | -0.00ms | -0.78% |
| mean | 0.00ms | 0.00ms | +0.00ms | +23.40% |
| min | 0.00ms | 0.00ms | +0.00ms | +36.46% |
| max | 0.05ms | 0.02ms | +0.03ms | +136.85% |
| total | 0.42ms | 0.34ms | +0.08ms | +23.40% |

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
| max | 0.01ms |
| total | 0.18ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p50 | 0.00ms | 0.00ms | +0.00ms | +0.13% |
| p95 | 0.00ms | 0.00ms | -0.00ms | -22.37% |
| p99 | 0.01ms | 0.01ms | -0.00ms | -0.40% |
| mean | 0.00ms | 0.00ms | +0.00ms | +7.06% |
| min | 0.00ms | 0.00ms | +0.00ms | +38.38% |
| max | 0.01ms | 0.01ms | +0.00ms | +20.37% |
| total | 0.18ms | 0.17ms | +0.01ms | +7.06% |

