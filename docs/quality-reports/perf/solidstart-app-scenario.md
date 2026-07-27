# Perf Suite — solidstart-app-scenario

Threshold source: [docs/quality/perf-thresholds.md](../../quality/perf-thresholds)

## Serial p95 (concurrency = 1)

| op | p95 | cap | gate | regression |
|---|---|---|---|---|
| server_function_workflow (10 invokeServerFunction) | 0.01ms | 100ms | PASS | stable |
| api_route_batch (5 invokeApiRoute) | 0.09ms | 100ms | PASS | stable |
| fn_error_handling (5 throw + catch) | 0.02ms | 100ms | PASS | stable |

## Concurrent p95 (concurrency = 4, 5 iter each)

| op | p95 | cap | gate |
|---|---|---|---|
| server_function_workflow (10 invokeServerFunction) | 0.02ms | 200ms | PASS |
| api_route_batch (5 invokeApiRoute) | 0.61ms | 200ms | PASS |
| fn_error_handling (5 throw + catch) | 0.06ms | 200ms | PASS |

## Memory retention (20 iter, arrayBuffers axis is the gate; heap is informational)

| op | heapUsed Δ | arrayBuffers Δ | cap | gc exposed | verdict |
|---|---|---|---|---|---|
| server_function_workflow (10 invokeServerFunction) | 13512 B | 0 B | 102400 B | yes | PASS |
| api_route_batch (5 invokeApiRoute) | 8760 B | 0 B | 102400 B | yes | PASS |
| fn_error_handling (5 throw + catch) | 832 B | 0 B | 102400 B | yes | PASS |

## Detailed serial reports

### server_function_workflow (10 invokeServerFunction)

# Perf Report — server_function_workflow (10 invokeServerFunction).serial

| metric | value |
|---|---|
| iterations | 20 |
| warmup | 3 |
| p50 | 0.00ms |
| p95 | 0.01ms |
| p99 | 0.01ms |
| mean | 0.00ms |
| stdev | 0.00ms |
| min | 0.00ms |
| max | 0.01ms |
| total | 0.09ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p50 | 0.00ms | 0.00ms | +0.00ms | +4.60% |
| p95 | 0.01ms | 0.01ms | -0.00ms | -3.96% |
| p99 | 0.01ms | 0.01ms | -0.00ms | -1.92% |
| mean | 0.00ms | 0.00ms | -0.00ms | -5.58% |
| min | 0.00ms | 0.00ms | -0.00ms | -6.82% |
| max | 0.01ms | 0.01ms | -0.00ms | -1.66% |
| total | 0.09ms | 0.10ms | -0.01ms | -5.58% |

### api_route_batch (5 invokeApiRoute)

# Perf Report — api_route_batch (5 invokeApiRoute).serial

| metric | value |
|---|---|
| iterations | 20 |
| warmup | 3 |
| p50 | 0.06ms |
| p95 | 0.09ms |
| p99 | 0.09ms |
| mean | 0.07ms |
| stdev | 0.01ms |
| min | 0.06ms |
| max | 0.09ms |
| total | 1.36ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p50 | 0.06ms | 0.06ms | +0.01ms | +10.14% |
| p95 | 0.09ms | 0.10ms | -0.01ms | -6.93% |
| p99 | 0.09ms | 0.10ms | -0.00ms | -4.85% |
| mean | 0.07ms | 0.07ms | +0.00ms | +4.51% |
| min | 0.06ms | 0.05ms | +0.00ms | +6.00% |
| max | 0.09ms | 0.10ms | -0.00ms | -4.34% |
| total | 1.36ms | 1.30ms | +0.06ms | +4.51% |

### fn_error_handling (5 throw + catch)

# Perf Report — fn_error_handling (5 throw + catch).serial

| metric | value |
|---|---|
| iterations | 20 |
| warmup | 3 |
| p50 | 0.01ms |
| p95 | 0.02ms |
| p99 | 0.03ms |
| mean | 0.01ms |
| stdev | 0.01ms |
| min | 0.01ms |
| max | 0.04ms |
| total | 0.29ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p50 | 0.01ms | 0.02ms | -0.01ms | -34.54% |
| p95 | 0.02ms | 0.02ms | +0.00ms | +4.35% |
| p99 | 0.03ms | 0.02ms | +0.01ms | +60.82% |
| mean | 0.01ms | 0.02ms | -0.00ms | -19.24% |
| min | 0.01ms | 0.02ms | -0.01ms | -35.91% |
| max | 0.04ms | 0.02ms | +0.02ms | +74.01% |
| total | 0.29ms | 0.36ms | -0.07ms | -19.24% |

