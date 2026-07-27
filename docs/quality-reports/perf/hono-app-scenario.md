# Perf Suite — hono-app-scenario

Threshold source: [docs/quality/perf-thresholds.md](../../quality/perf-thresholds)

## Serial p95 (concurrency = 1)

| op | p95 | cap | gate | regression |
|---|---|---|---|---|
| route_workflow (10 invokeRoute GET+POST mix) | 0.03ms | 100ms | PASS | stable |
| rpc_client_batch (5 rpc calls) | 0.02ms | 100ms | PASS | stable |
| route_error_handling (5 throw + catch) | 0.05ms | 100ms | PASS | stable |

## Concurrent p95 (concurrency = 4, 5 iter each)

| op | p95 | cap | gate |
|---|---|---|---|
| route_workflow (10 invokeRoute GET+POST mix) | 0.13ms | 200ms | PASS |
| rpc_client_batch (5 rpc calls) | 0.16ms | 200ms | PASS |
| route_error_handling (5 throw + catch) | 0.19ms | 200ms | PASS |

## Memory retention (20 iter, arrayBuffers axis is the gate; heap is informational)

| op | heapUsed Δ | arrayBuffers Δ | cap | gc exposed | verdict |
|---|---|---|---|---|---|
| route_workflow (10 invokeRoute GET+POST mix) | 16784 B | -9233 B | 102400 B | yes | PASS |
| rpc_client_batch (5 rpc calls) | 656 B | 0 B | 102400 B | yes | PASS |
| route_error_handling (5 throw + catch) | 1512 B | 0 B | 102400 B | yes | PASS |

## Detailed serial reports

### route_workflow (10 invokeRoute GET+POST mix)

# Perf Report — route_workflow (10 invokeRoute GET+POST mix).serial

| metric | value |
|---|---|
| iterations | 20 |
| warmup | 3 |
| p50 | 0.02ms |
| p95 | 0.03ms |
| p99 | 0.04ms |
| mean | 0.03ms |
| stdev | 0.01ms |
| min | 0.02ms |
| max | 0.04ms |
| total | 0.51ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p50 | 0.02ms | 0.02ms | -0.00ms | -0.28% |
| p95 | 0.03ms | 0.04ms | -0.00ms | -2.77% |
| p99 | 0.04ms | 0.04ms | +0.00ms | +2.72% |
| mean | 0.03ms | 0.03ms | -0.00ms | -0.63% |
| min | 0.02ms | 0.02ms | -0.00ms | -1.98% |
| max | 0.04ms | 0.04ms | +0.00ms | +3.90% |
| total | 0.51ms | 0.51ms | -0.00ms | -0.63% |

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
| max | 0.02ms |
| total | 0.37ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p50 | 0.02ms | 0.01ms | +0.00ms | +20.08% |
| p95 | 0.02ms | 0.02ms | +0.00ms | +22.57% |
| p99 | 0.02ms | 0.02ms | +0.00ms | +16.40% |
| mean | 0.02ms | 0.02ms | +0.00ms | +22.26% |
| min | 0.02ms | 0.01ms | +0.00ms | +24.63% |
| max | 0.02ms | 0.02ms | +0.00ms | +15.06% |
| total | 0.37ms | 0.30ms | +0.07ms | +22.26% |

### route_error_handling (5 throw + catch)

# Perf Report — route_error_handling (5 throw + catch).serial

| metric | value |
|---|---|
| iterations | 20 |
| warmup | 3 |
| p50 | 0.04ms |
| p95 | 0.05ms |
| p99 | 0.05ms |
| mean | 0.04ms |
| stdev | 0.00ms |
| min | 0.04ms |
| max | 0.05ms |
| total | 0.87ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p50 | 0.04ms | 0.04ms | +0.00ms | +12.32% |
| p95 | 0.05ms | 0.04ms | +0.00ms | +2.58% |
| p99 | 0.05ms | 0.05ms | -0.00ms | -6.95% |
| mean | 0.04ms | 0.04ms | +0.00ms | +9.61% |
| min | 0.04ms | 0.04ms | +0.00ms | +9.71% |
| max | 0.05ms | 0.05ms | -0.00ms | -9.06% |
| total | 0.87ms | 0.79ms | +0.08ms | +9.61% |

