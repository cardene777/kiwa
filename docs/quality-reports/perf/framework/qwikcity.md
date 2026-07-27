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
| invokeRouteAction | 0.01ms | 10ms | PASS |

## Memory retention (200 iter, arrayBuffers axis is the gate; heap is informational)

| op | heapUsed Δ | arrayBuffers Δ | cap | gc exposed | verdict |
|---|---|---|---|---|---|
| invokeRouteLoader | -291080 B | 0 B | 102400 B | yes | PASS |
| invokeRouteAction | 704 B | 0 B | 102400 B | yes | PASS |

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
| max | 0.01ms |
| total | 0.26ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p50 | 0.00ms | 0.00ms | +0.00ms | +25.09% |
| p95 | 0.00ms | 0.01ms | -0.01ms | -71.71% |
| p99 | 0.01ms | 0.24ms | -0.23ms | -95.69% |
| mean | 0.00ms | 0.01ms | -0.01ms | -81.03% |
| min | 0.00ms | 0.00ms | 0.00ms | 0.00% |
| max | 0.01ms | 0.43ms | -0.41ms | -96.57% |
| total | 0.26ms | 1.37ms | -1.11ms | -81.03% |

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
| total | 0.20ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p50 | 0.00ms | 0.00ms | -0.00ms | -10.61% |
| p95 | 0.00ms | 0.00ms | +0.00ms | +9.14% |
| p99 | 0.01ms | 0.01ms | +0.00ms | +46.40% |
| mean | 0.00ms | 0.00ms | -0.00ms | -1.81% |
| min | 0.00ms | 0.00ms | -0.00ms | -6.16% |
| max | 0.01ms | 0.01ms | +0.00ms | +4.61% |
| total | 0.20ms | 0.20ms | -0.00ms | -1.81% |

