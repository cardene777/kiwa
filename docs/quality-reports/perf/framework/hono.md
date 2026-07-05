# Perf Suite — hono

Threshold source: [docs/quality/perf-thresholds.md](../../quality/perf-thresholds)

## Serial p95 (concurrency = 1)

| op | p95 | cap | gate | regression |
|---|---|---|---|---|
| invokeRoute | 0.01ms | 5ms | PASS | stable |
| rpcClient$get | 0.01ms | 5ms | PASS | regressed |

## Concurrent p95 (concurrency = 10, 50 iter each)

| op | p95 | cap | gate |
|---|---|---|---|
| invokeRoute | 0.04ms | 10ms | PASS |
| rpcClient$get | 0.11ms | 10ms | PASS |

## Memory retention (200 iter, arrayBuffers axis is the gate; heap is informational)

| op | heapUsed Δ | arrayBuffers Δ | cap | verdict |
|---|---|---|---|---|
| invokeRoute | 239712 B | 0 B | 102400 B | PASS |
| rpcClient$get | -2121344 B | 0 B | 102400 B | PASS |

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
| total | 0.63ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p50 | 0.00ms | 0.00ms | -0.00ms | -4.88% |
| p95 | 0.01ms | 0.00ms | +0.00ms | +38.13% |
| p99 | 0.01ms | 0.02ms | -0.00ms | -8.95% |
| mean | 0.00ms | 0.00ms | +0.00ms | +5.65% |
| min | 0.00ms | 0.00ms | +0.00ms | +16.30% |
| max | 0.03ms | 0.03ms | +0.00ms | +5.13% |
| total | 0.63ms | 0.59ms | +0.03ms | +5.65% |

### rpcClient$get

# Perf Report — rpcClient$get.serial

| metric | value |
|---|---|
| iterations | 200 |
| warmup | 5 |
| p50 | 0.00ms |
| p95 | 0.01ms |
| p99 | 0.03ms |
| mean | 0.01ms |
| stdev | 0.01ms |
| min | 0.00ms |
| max | 0.07ms |
| total | 1.05ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p50 | 0.00ms | 0.00ms | +0.00ms | +22.82% |
| p95 | 0.01ms | 0.01ms | +0.01ms | +153.69% |
| p99 | 0.03ms | 0.01ms | +0.02ms | +167.08% |
| mean | 0.01ms | 0.00ms | +0.00ms | +45.05% |
| min | 0.00ms | 0.00ms | +0.00ms | +16.91% |
| max | 0.07ms | 0.01ms | +0.06ms | +419.60% |
| total | 1.05ms | 0.73ms | +0.33ms | +45.05% |

