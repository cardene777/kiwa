# Perf Suite — hono-app-scenario

Threshold source: [docs/quality/perf-thresholds.md](../../quality/perf-thresholds)

## Serial p95 (concurrency = 1)

| op | p95 | cap | gate | regression |
|---|---|---|---|---|
| route_workflow (10 invokeRoute GET+POST mix) | 0.05ms | 100ms | PASS | stable (検知には +0.5ms (baseline 比 +1226%) 以上の悪化が必要) |
| rpc_client_batch (5 rpc calls) | 0.02ms | 100ms | PASS | stable (差 0.12ms が下限 0.5ms 未満で判定を保留) |
| route_error_handling (5 throw + catch) | 0.04ms | 100ms | PASS | stable (差 0.02ms が下限 0.5ms 未満で判定を保留) |

## Concurrent p95 (concurrency = 4, 5 iter each)

| op | p95 | cap | gate |
|---|---|---|---|
| route_workflow (10 invokeRoute GET+POST mix) | 0.11ms | 200ms | PASS |
| rpc_client_batch (5 rpc calls) | 0.07ms | 200ms | PASS |
| route_error_handling (5 throw + catch) | 0.17ms | 200ms | PASS |

## Memory retention (20 iter, arrayBuffers axis is the gate; heap is informational)

| op | heapUsed Δ | arrayBuffers Δ | cap | gc exposed | verdict |
|---|---|---|---|---|---|
| route_workflow (10 invokeRoute GET+POST mix) | 6136 B | 0 B | 102400 B | yes | PASS |
| rpc_client_batch (5 rpc calls) | -480 B | 0 B | 102400 B | yes | PASS |
| route_error_handling (5 throw + catch) | 752 B | 0 B | 102400 B | yes | PASS |

## Detailed serial reports

### route_workflow (10 invokeRoute GET+POST mix)

# Perf Report — route_workflow (10 invokeRoute GET+POST mix).serial

| metric | value |
|---|---|
| iterations | 20 |
| warmup | 3 |
| p50 | 0.03ms |
| p95 | 0.05ms |
| p99 | 0.05ms |
| mean | 0.03ms |
| stdev | 0.01ms |
| min | 0.02ms |
| max | 0.06ms |
| total | 0.59ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p50 | 0.03ms | 0.03ms | -0.00ms | -12.98% |
| p95 | 0.05ms | 0.04ms | +0.01ms | +20.15% |
| p99 | 0.05ms | 0.05ms | +0.01ms | +18.35% |
| mean | 0.03ms | 0.03ms | -0.00ms | -5.65% |
| min | 0.02ms | 0.03ms | -0.01ms | -25.00% |
| max | 0.06ms | 0.05ms | +0.01ms | +17.96% |
| total | 0.59ms | 0.63ms | -0.04ms | -5.65% |

### rpc_client_batch (5 rpc calls)

# Perf Report — rpc_client_batch (5 rpc calls).serial

| metric | value |
|---|---|
| iterations | 20 |
| warmup | 3 |
| p50 | 0.01ms |
| p95 | 0.02ms |
| p99 | 0.02ms |
| mean | 0.01ms |
| stdev | 0.00ms |
| min | 0.01ms |
| max | 0.02ms |
| total | 0.30ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p50 | 0.01ms | 0.01ms | -0.00ms | -2.10% |
| p95 | 0.02ms | 0.13ms | -0.12ms | -86.40% |
| p99 | 0.02ms | 0.16ms | -0.14ms | -86.91% |
| mean | 0.01ms | 0.03ms | -0.02ms | -54.52% |
| min | 0.01ms | 0.01ms | -0.00ms | -12.43% |
| max | 0.02ms | 0.17ms | -0.15ms | -87.01% |
| total | 0.30ms | 0.66ms | -0.36ms | -54.52% |

### route_error_handling (5 throw + catch)

# Perf Report — route_error_handling (5 throw + catch).serial

| metric | value |
|---|---|
| iterations | 20 |
| warmup | 3 |
| p50 | 0.04ms |
| p95 | 0.04ms |
| p99 | 0.04ms |
| mean | 0.04ms |
| stdev | 0.00ms |
| min | 0.03ms |
| max | 0.04ms |
| total | 0.73ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p50 | 0.04ms | 0.04ms | -0.00ms | -4.94% |
| p95 | 0.04ms | 0.05ms | -0.02ms | -28.69% |
| p99 | 0.04ms | 0.10ms | -0.06ms | -60.07% |
| mean | 0.04ms | 0.04ms | -0.01ms | -14.73% |
| min | 0.03ms | 0.04ms | -0.00ms | -6.25% |
| max | 0.04ms | 0.11ms | -0.07ms | -64.00% |
| total | 0.73ms | 0.86ms | -0.13ms | -14.73% |

