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
| route_workflow (10 invokeRoute GET+POST mix) | 0.10ms | 200ms | PASS |
| rpc_client_batch (5 rpc calls) | 0.10ms | 200ms | PASS |
| route_error_handling (5 throw + catch) | 0.15ms | 200ms | PASS |

## Memory retention (20 iter, arrayBuffers axis is the gate; heap is informational)

| op | heapUsed Δ | arrayBuffers Δ | cap | gc exposed | verdict |
|---|---|---|---|---|---|
| route_workflow (10 invokeRoute GET+POST mix) | -244024 B | 0 B | 102400 B | yes | PASS |
| rpc_client_batch (5 rpc calls) | 9096 B | 0 B | 102400 B | yes | PASS |
| route_error_handling (5 throw + catch) | 1048 B | 0 B | 102400 B | yes | PASS |

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
| mean | 0.02ms |
| stdev | 0.01ms |
| min | 0.02ms |
| max | 0.04ms |
| total | 0.48ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p50 | 0.02ms | 0.02ms | -0.00ms | -2.04% |
| p95 | 0.04ms | 0.04ms | -0.00ms | -0.49% |
| p99 | 0.04ms | 0.04ms | +0.00ms | +0.73% |
| mean | 0.02ms | 0.03ms | -0.00ms | -5.59% |
| min | 0.02ms | 0.02ms | -0.00ms | -2.38% |
| max | 0.04ms | 0.04ms | +0.00ms | +1.00% |
| total | 0.48ms | 0.51ms | -0.03ms | -5.59% |

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
| min | 0.01ms |
| max | 0.02ms |
| total | 0.33ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p50 | 0.02ms | 0.01ms | +0.00ms | +4.32% |
| p95 | 0.02ms | 0.02ms | +0.00ms | +8.59% |
| p99 | 0.02ms | 0.02ms | +0.00ms | +11.43% |
| mean | 0.02ms | 0.02ms | +0.00ms | +7.49% |
| min | 0.01ms | 0.01ms | +0.00ms | +6.38% |
| max | 0.02ms | 0.02ms | +0.00ms | +12.05% |
| total | 0.33ms | 0.30ms | +0.02ms | +7.49% |

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
| total | 0.72ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p50 | 0.04ms | 0.04ms | -0.00ms | -8.59% |
| p95 | 0.04ms | 0.04ms | -0.00ms | -10.74% |
| p99 | 0.04ms | 0.05ms | -0.01ms | -17.93% |
| mean | 0.04ms | 0.04ms | -0.00ms | -8.41% |
| min | 0.03ms | 0.04ms | -0.00ms | -7.48% |
| max | 0.04ms | 0.05ms | -0.01ms | -19.52% |
| total | 0.72ms | 0.79ms | -0.07ms | -8.41% |

