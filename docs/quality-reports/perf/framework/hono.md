# Perf Suite — hono

Threshold source: [docs/quality/perf-thresholds.md](../../../quality/perf-thresholds)

## Serial p95 (concurrency = 1)

| op | p95 | cap | gate | regression |
|---|---|---|---|---|
| invokeRoute | 0.01ms | 5ms | PASS | stable |
| rpcClient$get | 0.00ms | 5ms | PASS | stable |

## Concurrent p95 (concurrency = 10, 50 iter each)

| op | p95 | cap | gate |
|---|---|---|---|
| invokeRoute | 0.04ms | 10ms | PASS |
| rpcClient$get | 0.14ms | 10ms | PASS |

## Memory retention (200 iter, arrayBuffers axis is the gate; heap is informational)

| op | heapUsed Δ | arrayBuffers Δ | cap | gc exposed | verdict |
|---|---|---|---|---|---|
| invokeRoute | 20448 B | 0 B | 102400 B | yes | PASS |
| rpcClient$get | 1360 B | 0 B | 102400 B | yes | PASS |

## Detailed serial reports

### invokeRoute

# Perf Report — invokeRoute.serial

| metric | value |
|---|---|
| iterations | 200 |
| warmup | 5 |
| p50 | 0.00ms |
| p95 | 0.01ms |
| p99 | 0.01ms |
| mean | 0.00ms |
| stdev | 0.00ms |
| min | 0.00ms |
| max | 0.03ms |
| total | 0.54ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p50 | 0.00ms | 0.00ms | +0.00ms | +2.05% |
| p95 | 0.01ms | 0.01ms | -0.00ms | -8.80% |
| p99 | 0.01ms | 0.02ms | -0.00ms | -13.90% |
| mean | 0.00ms | 0.00ms | -0.00ms | -2.96% |
| min | 0.00ms | 0.00ms | +0.00ms | +4.74% |
| max | 0.03ms | 0.03ms | -0.00ms | -0.91% |
| total | 0.54ms | 0.56ms | -0.02ms | -2.96% |

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
| stdev | 0.01ms |
| min | 0.00ms |
| max | 0.17ms |
| total | 0.86ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p50 | 0.00ms | 0.00ms | -0.00ms | -1.31% |
| p95 | 0.00ms | 0.00ms | +0.00ms | +29.72% |
| p99 | 0.01ms | 0.01ms | +0.00ms | +48.30% |
| mean | 0.00ms | 0.00ms | +0.00ms | +27.79% |
| min | 0.00ms | 0.00ms | +0.00ms | +4.41% |
| max | 0.17ms | 0.01ms | +0.15ms | +1286.81% |
| total | 0.86ms | 0.67ms | +0.19ms | +27.79% |

