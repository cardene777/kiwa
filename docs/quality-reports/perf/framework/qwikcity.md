# Perf Suite — qwikcity

Threshold source: [docs/quality/perf-thresholds.md](../../../quality/perf-thresholds)

## Serial p95 (concurrency = 1)

| op | p95 | cap | gate | regression |
|---|---|---|---|---|
| invokeRouteLoader | 0.00ms | 5ms | PASS | stable (検知には +0.5ms (baseline 比 +22433%) 以上の悪化が必要) — gate 無効 (regressionGate=false) |
| invokeRouteAction | 0.00ms | 5ms | PASS | stable (検知には +0.5ms (baseline 比 +41249%) 以上の悪化が必要) — gate 無効 (regressionGate=false) |

## Concurrent p95 (concurrency = 10, 50 iter each)

| op | p95 | cap | gate |
|---|---|---|---|
| invokeRouteLoader | 0.02ms | 10ms | PASS |
| invokeRouteAction | 0.02ms | 10ms | PASS |

## Memory retention (200 iter, arrayBuffers axis is the gate; heap is informational)

| op | heapUsed Δ | arrayBuffers Δ | cap | gc exposed | verdict |
|---|---|---|---|---|---|
| invokeRouteLoader | -16856 B | 0 B | 102400 B | yes | PASS |
| invokeRouteAction | -4784 B | 0 B | 102400 B | yes | PASS |

## Detailed serial reports

### invokeRouteLoader

# Perf Report — invokeRouteLoader.serial

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
| total | 0.30ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p50 | 0.00ms | 0.00ms | +0.00ms | +36.45% |
| p95 | 0.00ms | 0.00ms | +0.00ms | +64.60% |
| p99 | 0.01ms | 0.01ms | +0.00ms | +16.54% |
| mean | 0.00ms | 0.00ms | +0.00ms | +22.38% |
| min | 0.00ms | 0.00ms | +0.00ms | +11.72% |
| max | 0.02ms | 0.02ms | +0.00ms | +10.42% |
| total | 0.30ms | 0.25ms | +0.06ms | +22.38% |

### invokeRouteAction

# Perf Report — invokeRouteAction.serial

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
| p50 | 0.00ms | 0.00ms | +0.00ms | +29.38% |
| p95 | 0.00ms | 0.00ms | +0.00ms | +14.12% |
| p99 | 0.01ms | 0.01ms | +0.00ms | +2.96% |
| mean | 0.00ms | 0.00ms | +0.00ms | +20.90% |
| min | 0.00ms | 0.00ms | +0.00ms | +20.00% |
| max | 0.01ms | 0.01ms | +0.00ms | +26.41% |
| total | 0.23ms | 0.19ms | +0.04ms | +20.90% |

