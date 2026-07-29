# Perf Suite — hono

Threshold source: [docs/quality/perf-thresholds.md](../../../quality/perf-thresholds)

## Serial p95 (concurrency = 1)

| op | p95 | cap | gate | regression |
|---|---|---|---|---|
| invokeRoute | 0.01ms | 5ms | PASS | stable (検知には +0.5ms (baseline 比 +9430%) 以上の悪化が必要) — gate 無効 (regressionGate=false) |
| rpcClient$get | 0.00ms | 5ms | PASS | stable (検知には +0.5ms (baseline 比 +13030%) 以上の悪化が必要) — gate 無効 (regressionGate=false) |

## Concurrent p95 (concurrency = 10, 50 iter each)

| op | p95 | cap | gate |
|---|---|---|---|
| invokeRoute | 0.04ms | 10ms | PASS |
| rpcClient$get | 0.04ms | 10ms | PASS |

## Memory retention (200 iter, arrayBuffers axis is the gate; heap is informational)

| op | heapUsed Δ | arrayBuffers Δ | cap | gc exposed | verdict |
|---|---|---|---|---|---|
| invokeRoute | -3456 B | 0 B | 102400 B | yes | PASS |
| rpcClient$get | -16200 B | 0 B | 102400 B | yes | PASS |

## Detailed serial reports

### invokeRoute

# Perf Report — invokeRoute.serial

| metric | value |
|---|---|
| iterations | 200 |
| warmup | 5 |
| p50 | 0.00ms |
| p95 | 0.01ms |
| p99 | 0.02ms |
| mean | 0.00ms |
| stdev | 0.00ms |
| min | 0.00ms |
| max | 0.03ms |
| total | 0.59ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p50 | 0.00ms | 0.00ms | -0.00ms | -20.31% |
| p95 | 0.01ms | 0.01ms | +0.00ms | +13.13% |
| p99 | 0.02ms | 0.04ms | -0.02ms | -47.14% |
| mean | 0.00ms | 0.00ms | -0.00ms | -30.16% |
| min | 0.00ms | 0.00ms | -0.00ms | -22.05% |
| max | 0.03ms | 0.09ms | -0.06ms | -65.06% |
| total | 0.59ms | 0.85ms | -0.26ms | -30.16% |

### rpcClient$get

# Perf Report — rpcClient$get.serial

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
| total | 0.66ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p50 | 0.00ms | 0.00ms | -0.00ms | -6.60% |
| p95 | 0.00ms | 0.00ms | +0.00ms | +16.23% |
| p99 | 0.01ms | 0.01ms | +0.00ms | +45.53% |
| mean | 0.00ms | 0.00ms | -0.00ms | -1.69% |
| min | 0.00ms | 0.00ms | -0.00ms | -8.33% |
| max | 0.02ms | 0.01ms | +0.01ms | +51.67% |
| total | 0.66ms | 0.67ms | -0.01ms | -1.69% |

