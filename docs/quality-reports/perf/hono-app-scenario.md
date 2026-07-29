# Perf Suite — hono-app-scenario

Threshold source: [docs/quality/perf-thresholds.md](../../quality/perf-thresholds)

## Serial p95 (concurrency = 1)

| op | p95 | cap | gate | regression |
|---|---|---|---|---|
| route_workflow (10 invokeRoute GET+POST mix) | 0.06ms | 100ms | PASS | stable (検知には +0.5ms (baseline 比 +1226%) 以上の悪化が必要) — gate 無効 (regressionGate=false) |
| rpc_client_batch (5 rpc calls) | 0.02ms | 100ms | PASS | stable (差 0.11ms が下限 0.5ms 未満で判定を保留) — gate 無効 (regressionGate=false) |
| route_error_handling (5 throw + catch) | 0.04ms | 100ms | PASS | stable (検知には +0.5ms (baseline 比 +915%) 以上の悪化が必要) — gate 無効 (regressionGate=false) |

## Concurrent p95 (concurrency = 4, 5 iter each)

| op | p95 | cap | gate |
|---|---|---|---|
| route_workflow (10 invokeRoute GET+POST mix) | 0.12ms | 200ms | PASS |
| rpc_client_batch (5 rpc calls) | 0.07ms | 200ms | PASS |
| route_error_handling (5 throw + catch) | 0.20ms | 200ms | PASS |

## Memory retention (20 iter, arrayBuffers axis is the gate; heap is informational)

| op | heapUsed Δ | arrayBuffers Δ | cap | gc exposed | verdict |
|---|---|---|---|---|---|
| route_workflow (10 invokeRoute GET+POST mix) | 26288 B | 0 B | 102400 B | yes | PASS |
| rpc_client_batch (5 rpc calls) | -272 B | 0 B | 102400 B | yes | PASS |
| route_error_handling (5 throw + catch) | 1408 B | 0 B | 102400 B | yes | PASS |

## Detailed serial reports

### route_workflow (10 invokeRoute GET+POST mix)

# Perf Report — route_workflow (10 invokeRoute GET+POST mix).serial

| metric | value |
|---|---|
| iterations | 20 |
| warmup | 3 |
| p50 | 0.03ms |
| p95 | 0.06ms |
| p99 | 0.40ms |
| mean | 0.05ms |
| stdev | 0.10ms |
| min | 0.02ms |
| max | 0.48ms |
| total | 1.02ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p50 | 0.03ms | 0.03ms | -0.00ms | -13.40% |
| p95 | 0.06ms | 0.04ms | +0.02ms | +58.71% |
| p99 | 0.40ms | 0.05ms | +0.35ms | +773.42% |
| mean | 0.05ms | 0.03ms | +0.02ms | +61.32% |
| min | 0.02ms | 0.03ms | -0.01ms | -21.07% |
| max | 0.48ms | 0.05ms | +0.44ms | +928.22% |
| total | 1.02ms | 0.63ms | +0.39ms | +61.32% |

### rpc_client_batch (5 rpc calls)

# Perf Report — rpc_client_batch (5 rpc calls).serial

| metric | value |
|---|---|
| iterations | 20 |
| warmup | 3 |
| p50 | 0.02ms |
| p95 | 0.02ms |
| p99 | 0.02ms |
| mean | 0.02ms |
| stdev | 0.00ms |
| min | 0.02ms |
| max | 0.03ms |
| total | 0.37ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p50 | 0.02ms | 0.01ms | +0.00ms | +22.70% |
| p95 | 0.02ms | 0.13ms | -0.11ms | -83.95% |
| p99 | 0.02ms | 0.16ms | -0.14ms | -85.19% |
| mean | 0.02ms | 0.03ms | -0.01ms | -43.45% |
| min | 0.02ms | 0.01ms | +0.00ms | +18.05% |
| max | 0.03ms | 0.17ms | -0.15ms | -85.43% |
| total | 0.37ms | 0.66ms | -0.29ms | -43.45% |

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
| min | 0.04ms |
| max | 0.04ms |
| total | 0.78ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p50 | 0.04ms | 0.04ms | +0.00ms | +0.16% |
| p95 | 0.04ms | 0.05ms | -0.01ms | -22.35% |
| p99 | 0.04ms | 0.10ms | -0.06ms | -56.38% |
| mean | 0.04ms | 0.04ms | -0.00ms | -8.51% |
| min | 0.04ms | 0.04ms | +0.00ms | +1.01% |
| max | 0.04ms | 0.11ms | -0.07ms | -60.64% |
| total | 0.78ms | 0.86ms | -0.07ms | -8.51% |

