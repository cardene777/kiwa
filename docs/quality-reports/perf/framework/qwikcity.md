# Perf Suite — qwikcity

Threshold source: [docs/quality/perf-thresholds.md](../../../quality/perf-thresholds)

## Serial p95 (concurrency = 1)

| op | p95 | cap | gate | regression |
|---|---|---|---|---|
| invokeRouteLoader | 0.00ms | 5ms | PASS | stable (検知には +0.5ms (baseline 比 +22433%) 以上の悪化が必要) |
| invokeRouteAction | 0.00ms | 5ms | PASS | stable (検知には +0.5ms (baseline 比 +41249%) 以上の悪化が必要) |

## Concurrent p95 (concurrency = 10, 50 iter each)

| op | p95 | cap | gate |
|---|---|---|---|
| invokeRouteLoader | 0.02ms | 10ms | PASS |
| invokeRouteAction | 0.01ms | 10ms | PASS |

## Memory retention (200 iter, arrayBuffers axis is the gate; heap is informational)

| op | heapUsed Δ | arrayBuffers Δ | cap | gc exposed | verdict |
|---|---|---|---|---|---|
| invokeRouteLoader | -16384 B | 0 B | 102400 B | yes | PASS |
| invokeRouteAction | -15040 B | 0 B | 102400 B | yes | PASS |

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
| total | 0.27ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p50 | 0.00ms | 0.00ms | +0.00ms | +12.23% |
| p95 | 0.00ms | 0.00ms | +0.00ms | +14.47% |
| p99 | 0.01ms | 0.01ms | +0.00ms | +0.99% |
| mean | 0.00ms | 0.00ms | +0.00ms | +7.17% |
| min | 0.00ms | 0.00ms | 0.00ms | 0.00% |
| max | 0.02ms | 0.02ms | +0.01ms | +46.61% |
| total | 0.27ms | 0.25ms | +0.02ms | +7.17% |

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
| total | 0.19ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p50 | 0.00ms | 0.00ms | 0.00ms | 0.00% |
| p95 | 0.00ms | 0.00ms | +0.00ms | +6.76% |
| p99 | 0.01ms | 0.01ms | -0.00ms | -4.32% |
| mean | 0.00ms | 0.00ms | -0.00ms | -0.40% |
| min | 0.00ms | 0.00ms | 0.00ms | 0.00% |
| max | 0.01ms | 0.01ms | +0.00ms | +7.17% |
| total | 0.19ms | 0.19ms | -0.00ms | -0.40% |

