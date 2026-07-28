# Perf Suite — hono

Threshold source: [docs/quality/perf-thresholds.md](../../../quality/perf-thresholds)

## Serial p95 (concurrency = 1)

| op | p95 | cap | gate | regression |
|---|---|---|---|---|
| invokeRoute | 0.01ms | 5ms | PASS | stable (検知には +0.5ms (baseline 比 +9430%) 以上の悪化が必要) |
| rpcClient$get | 0.01ms | 5ms | PASS | stable (検知には +0.5ms (baseline 比 +13030%) 以上の悪化が必要) |

## Concurrent p95 (concurrency = 10, 50 iter each)

| op | p95 | cap | gate |
|---|---|---|---|
| invokeRoute | 0.04ms | 10ms | PASS |
| rpcClient$get | 0.04ms | 10ms | PASS |

## Memory retention (200 iter, arrayBuffers axis is the gate; heap is informational)

| op | heapUsed Δ | arrayBuffers Δ | cap | gc exposed | verdict |
|---|---|---|---|---|---|
| invokeRoute | -9648 B | 0 B | 102400 B | yes | PASS |
| rpcClient$get | -15968 B | 0 B | 102400 B | yes | PASS |

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
| p50 | 0.00ms | 0.00ms | -0.00ms | -23.42% |
| p95 | 0.01ms | 0.01ms | +0.00ms | +23.25% |
| p99 | 0.02ms | 0.04ms | -0.02ms | -57.18% |
| mean | 0.00ms | 0.00ms | -0.00ms | -30.60% |
| min | 0.00ms | 0.00ms | -0.00ms | -27.14% |
| max | 0.03ms | 0.09ms | -0.06ms | -69.61% |
| total | 0.59ms | 0.85ms | -0.26ms | -30.60% |

### rpcClient$get

# Perf Report — rpcClient$get.serial

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
| max | 0.06ms |
| total | 0.71ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p50 | 0.00ms | 0.00ms | -0.00ms | -11.84% |
| p95 | 0.01ms | 0.00ms | +0.00ms | +36.08% |
| p99 | 0.01ms | 0.01ms | +0.00ms | +51.12% |
| mean | 0.00ms | 0.00ms | +0.00ms | +4.66% |
| min | 0.00ms | 0.00ms | -0.00ms | -11.13% |
| max | 0.06ms | 0.01ms | +0.05ms | +452.43% |
| total | 0.71ms | 0.67ms | +0.03ms | +4.66% |

