# Perf Suite — hono

Threshold source: [docs/quality/perf-thresholds.md](../../quality/perf-thresholds)

## Serial p95 (concurrency = 1)

| op | p95 | cap | gate | regression |
|---|---|---|---|---|
| invokeRoute | 0.01ms | 5ms | PASS | stable |
| rpcClient$get | 0.00ms | 5ms | PASS | stable |

## Concurrent p95 (concurrency = 10, 50 iter each)

| op | p95 | cap | gate |
|---|---|---|---|
| invokeRoute | 0.04ms | 10ms | PASS |
| rpcClient$get | 0.04ms | 10ms | PASS |

## Memory retention (200 iter, arrayBuffers axis is the gate; heap is informational)

| op | heapUsed Δ | arrayBuffers Δ | cap | gc exposed | verdict |
|---|---|---|---|---|---|
| invokeRoute | -8584 B | 0 B | 102400 B | yes | PASS |
| rpcClient$get | 1392 B | 0 B | 102400 B | yes | PASS |

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
| total | 0.60ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p50 | 0.00ms | 0.00ms | +0.00ms | +14.60% |
| p95 | 0.01ms | 0.01ms | -0.00ms | -16.66% |
| p99 | 0.02ms | 0.02ms | +0.00ms | +11.71% |
| mean | 0.00ms | 0.00ms | +0.00ms | +8.56% |
| min | 0.00ms | 0.00ms | +0.00ms | +7.14% |
| max | 0.03ms | 0.03ms | +0.00ms | +13.90% |
| total | 0.60ms | 0.56ms | +0.05ms | +8.56% |

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
| max | 0.01ms |
| total | 0.69ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p50 | 0.00ms | 0.00ms | -0.00ms | -2.59% |
| p95 | 0.00ms | 0.00ms | +0.00ms | +31.49% |
| p99 | 0.01ms | 0.01ms | +0.00ms | +28.62% |
| mean | 0.00ms | 0.00ms | +0.00ms | +3.05% |
| min | 0.00ms | 0.00ms | +0.00ms | +2.97% |
| max | 0.01ms | 0.01ms | +0.00ms | +12.85% |
| total | 0.69ms | 0.67ms | +0.02ms | +3.05% |

