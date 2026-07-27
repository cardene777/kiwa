# Perf Suite — hono-app-scenario

Threshold source: [docs/quality/perf-thresholds.md](../../quality/perf-thresholds)

## Serial p95 (concurrency = 1)

| op | p95 | cap | gate | regression |
|---|---|---|---|---|
| route_workflow (10 invokeRoute GET+POST mix) | 0.04ms | 100ms | PASS | stable |
| rpc_client_batch (5 rpc calls) | 0.02ms | 100ms | PASS | stable |
| route_error_handling (5 throw + catch) | 0.04ms | 100ms | PASS | stable |

## Concurrent p95 (concurrency = 4, 5 iter each)

| op | p95 | cap | gate |
|---|---|---|---|
| route_workflow (10 invokeRoute GET+POST mix) | 0.13ms | 200ms | PASS |
| rpc_client_batch (5 rpc calls) | 0.06ms | 200ms | PASS |
| route_error_handling (5 throw + catch) | 0.12ms | 200ms | PASS |

## Memory retention (20 iter, arrayBuffers axis is the gate; heap is informational)

| op | heapUsed Δ | arrayBuffers Δ | cap | verdict |
|---|---|---|---|---|
| route_workflow (10 invokeRoute GET+POST mix) | 1492232 B | 0 B | 102400 B | PASS |
| rpc_client_batch (5 rpc calls) | 735352 B | 0 B | 102400 B | PASS |
| route_error_handling (5 throw + catch) | 606312 B | 0 B | 102400 B | PASS |

## Detailed serial reports

### route_workflow (10 invokeRoute GET+POST mix)

# Perf Report — route_workflow (10 invokeRoute GET+POST mix).serial

| metric | value |
|---|---|
| iterations | 20 |
| warmup | 3 |
| p50 | 0.02ms |
| p95 | 0.04ms |
| p99 | 0.04ms |
| mean | 0.03ms |
| stdev | 0.00ms |
| min | 0.02ms |
| max | 0.04ms |
| total | 0.54ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p50 | 0.02ms | 0.02ms | +0.00ms | +12.19% |
| p95 | 0.04ms | 0.04ms | -0.00ms | -0.71% |
| p99 | 0.04ms | 0.04ms | +0.00ms | +0.76% |
| mean | 0.03ms | 0.02ms | +0.00ms | +12.41% |
| min | 0.02ms | 0.02ms | +0.00ms | +14.28% |
| max | 0.04ms | 0.04ms | +0.00ms | +1.11% |
| total | 0.54ms | 0.48ms | +0.06ms | +12.41% |

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
| total | 0.29ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p50 | 0.01ms | 0.02ms | -0.00ms | -16.73% |
| p95 | 0.02ms | 0.03ms | -0.01ms | -25.08% |
| p99 | 0.02ms | 0.04ms | -0.02ms | -47.74% |
| mean | 0.01ms | 0.02ms | -0.00ms | -20.83% |
| min | 0.01ms | 0.01ms | -0.00ms | -12.57% |
| max | 0.02ms | 0.05ms | -0.02ms | -50.98% |
| total | 0.29ms | 0.37ms | -0.08ms | -20.83% |

### route_error_handling (5 throw + catch)

# Perf Report — route_error_handling (5 throw + catch).serial

| metric | value |
|---|---|
| iterations | 20 |
| warmup | 3 |
| p50 | 0.03ms |
| p95 | 0.04ms |
| p99 | 0.05ms |
| mean | 0.03ms |
| stdev | 0.01ms |
| min | 0.02ms |
| max | 0.05ms |
| total | 0.57ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p50 | 0.03ms | 0.03ms | -0.00ms | -7.39% |
| p95 | 0.04ms | 0.04ms | -0.00ms | -3.23% |
| p99 | 0.05ms | 0.05ms | -0.00ms | -2.40% |
| mean | 0.03ms | 0.03ms | -0.00ms | -7.67% |
| min | 0.02ms | 0.03ms | -0.00ms | -5.73% |
| max | 0.05ms | 0.05ms | -0.00ms | -2.21% |
| total | 0.57ms | 0.61ms | -0.05ms | -7.67% |

