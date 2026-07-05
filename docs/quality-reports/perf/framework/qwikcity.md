# Perf Suite — qwikcity

Threshold source: [docs/quality/perf-thresholds.md](../../quality/perf-thresholds)

## Serial p95 (concurrency = 1)

| op | p95 | cap | gate | regression |
|---|---|---|---|---|
| invokeRouteLoader | 0.00ms | 5ms | PASS | stable |
| invokeRouteAction | 0.00ms | 5ms | PASS | stable |

## Concurrent p95 (concurrency = 10, 50 iter each)

| op | p95 | cap | gate |
|---|---|---|---|
| invokeRouteLoader | 0.02ms | 10ms | PASS |
| invokeRouteAction | 0.02ms | 10ms | PASS |

## Memory retention (200 iter, arrayBuffers axis is the gate; heap is informational)

| op | heapUsed Δ | arrayBuffers Δ | cap | verdict |
|---|---|---|---|---|
| invokeRouteLoader | 31400 B | 0 B | 102400 B | PASS |
| invokeRouteAction | 674424 B | 0 B | 102400 B | PASS |

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
| p50 | 0.00ms | 0.00ms | +0.00ms | +14.29% |
| p95 | 0.00ms | 0.00ms | +0.00ms | +25.01% |
| p99 | 0.01ms | 0.01ms | +0.01ms | +84.03% |
| mean | 0.00ms | 0.00ms | +0.00ms | +23.27% |
| min | 0.00ms | 0.00ms | +0.00ms | +10.62% |
| max | 0.02ms | 0.01ms | +0.00ms | +35.63% |
| total | 0.30ms | 0.24ms | +0.06ms | +23.27% |

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
| total | 0.26ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p50 | 0.00ms | 0.00ms | +0.00ms | +5.60% |
| p95 | 0.00ms | 0.00ms | +0.00ms | +10.13% |
| p99 | 0.01ms | 0.01ms | +0.00ms | +58.46% |
| mean | 0.00ms | 0.00ms | +0.00ms | +8.48% |
| min | 0.00ms | 0.00ms | +0.00ms | +13.28% |
| max | 0.01ms | 0.01ms | +0.00ms | +3.51% |
| total | 0.26ms | 0.24ms | +0.02ms | +8.48% |

