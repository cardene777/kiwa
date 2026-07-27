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
| rpcClient$get | 0.04ms | 10ms | PASS |

## Memory retention (200 iter, arrayBuffers axis is the gate; heap is informational)

| op | heapUsed Δ | arrayBuffers Δ | cap | gc exposed | verdict |
|---|---|---|---|---|---|
| invokeRoute | -21536 B | 0 B | 102400 B | yes | PASS |
| rpcClient$get | -912 B | 0 B | 102400 B | yes | PASS |

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
| total | 0.58ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p50 | 0.00ms | 0.00ms | +0.00ms | +22.90% |
| p95 | 0.01ms | 0.01ms | -0.00ms | -5.32% |
| p99 | 0.01ms | 0.02ms | -0.00ms | -8.60% |
| mean | 0.00ms | 0.00ms | +0.00ms | +5.02% |
| min | 0.00ms | 0.00ms | -0.00ms | -2.34% |
| max | 0.03ms | 0.03ms | +0.00ms | +1.21% |
| total | 0.58ms | 0.56ms | +0.03ms | +5.02% |

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
| total | 0.60ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p50 | 0.00ms | 0.00ms | -0.00ms | -14.28% |
| p95 | 0.00ms | 0.00ms | -0.00ms | -3.20% |
| p99 | 0.01ms | 0.01ms | -0.00ms | -1.19% |
| mean | 0.00ms | 0.00ms | -0.00ms | -11.00% |
| min | 0.00ms | 0.00ms | -0.00ms | -8.82% |
| max | 0.01ms | 0.01ms | -0.00ms | -9.38% |
| total | 0.60ms | 0.67ms | -0.07ms | -11.00% |

