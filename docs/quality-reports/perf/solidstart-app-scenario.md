# Perf Suite — solidstart-app-scenario

Threshold source: [docs/quality/perf-thresholds.md](../../quality/perf-thresholds)

## Serial p95 (concurrency = 1)

| op | p95 | cap | gate | regression |
|---|---|---|---|---|
| server_function_workflow (10 invokeServerFunction) | 0.01ms | 100ms | PASS | stable |
| api_route_batch (5 invokeApiRoute) | 0.10ms | 100ms | PASS | stable |
| fn_error_handling (5 throw + catch) | 0.02ms | 100ms | PASS | stable |

## Concurrent p95 (concurrency = 4, 5 iter each)

| op | p95 | cap | gate |
|---|---|---|---|
| server_function_workflow (10 invokeServerFunction) | 0.02ms | 200ms | PASS |
| api_route_batch (5 invokeApiRoute) | 0.25ms | 200ms | PASS |
| fn_error_handling (5 throw + catch) | 0.07ms | 200ms | PASS |

## Memory retention (20 iter, arrayBuffers axis is the gate; heap is informational)

| op | heapUsed Δ | arrayBuffers Δ | cap | gc exposed | verdict |
|---|---|---|---|---|---|
| server_function_workflow (10 invokeServerFunction) | 470280 B | 0 B | 102400 B | yes | PASS |
| api_route_batch (5 invokeApiRoute) | 7656 B | 0 B | 102400 B | yes | PASS |
| fn_error_handling (5 throw + catch) | -528 B | 0 B | 102400 B | yes | PASS |

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
| p50 | 0.00ms | 0.00ms | -0.00ms | -14.87% |
| p95 | 0.01ms | 0.01ms | +0.00ms | +18.75% |
| p99 | 0.01ms | 0.01ms | -0.00ms | -21.59% |
| mean | 0.00ms | 0.00ms | -0.00ms | -9.70% |
| min | 0.00ms | 0.00ms | -0.00ms | -9.08% |
| max | 0.01ms | 0.01ms | -0.00ms | -26.66% |
| total | 0.09ms | 0.10ms | -0.01ms | -9.70% |

### api_route_batch (5 invokeApiRoute)

# Perf Report — api_route_batch (5 invokeApiRoute).serial

| metric | value |
|---|---|
| iterations | 20 |
| warmup | 3 |
| p50 | 0.07ms |
| p95 | 0.10ms |
| p99 | 0.13ms |
| mean | 0.07ms |
| stdev | 0.02ms |
| min | 0.05ms |
| max | 0.14ms |
| total | 1.46ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p50 | 0.07ms | 0.06ms | +0.01ms | +13.16% |
| p95 | 0.10ms | 0.10ms | +0.00ms | +3.44% |
| p99 | 0.13ms | 0.10ms | +0.03ms | +31.69% |
| mean | 0.07ms | 0.07ms | +0.01ms | +12.23% |
| min | 0.05ms | 0.05ms | +0.00ms | +4.64% |
| max | 0.14ms | 0.10ms | +0.04ms | +38.53% |
| total | 1.46ms | 1.30ms | +0.16ms | +12.23% |

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
| stdev | 0.00ms |
| min | 0.01ms |
| max | 0.03ms |
| total | 0.30ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p50 | 0.01ms | 0.02ms | -0.01ms | -28.92% |
| p95 | 0.02ms | 0.02ms | -0.00ms | -2.29% |
| p99 | 0.03ms | 0.02ms | +0.01ms | +31.64% |
| mean | 0.01ms | 0.02ms | -0.00ms | -17.03% |
| min | 0.01ms | 0.02ms | -0.01ms | -35.66% |
| max | 0.03ms | 0.02ms | +0.01ms | +39.57% |
| total | 0.30ms | 0.36ms | -0.06ms | -17.03% |

