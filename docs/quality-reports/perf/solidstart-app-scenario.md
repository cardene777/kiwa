# Perf Suite — solidstart-app-scenario

Threshold source: [docs/quality/perf-thresholds.md](../../quality/perf-thresholds)

## Serial p95 (concurrency = 1)

| op | p95 | cap | gate | regression |
|---|---|---|---|---|
| server_function_workflow (10 invokeServerFunction) | 0.01ms | 100ms | PASS | stable |
| api_route_batch (5 invokeApiRoute) | 0.13ms | 100ms | PASS | stable |
| fn_error_handling (5 throw + catch) | 0.03ms | 100ms | PASS | stable |

## Concurrent p95 (concurrency = 4, 5 iter each)

| op | p95 | cap | gate |
|---|---|---|---|
| server_function_workflow (10 invokeServerFunction) | 0.03ms | 200ms | PASS |
| api_route_batch (5 invokeApiRoute) | 0.25ms | 200ms | PASS |
| fn_error_handling (5 throw + catch) | 0.07ms | 200ms | PASS |

## Memory retention (20 iter, arrayBuffers axis is the gate; heap is informational)

| op | heapUsed Δ | arrayBuffers Δ | cap | gc exposed | verdict |
|---|---|---|---|---|---|
| server_function_workflow (10 invokeServerFunction) | 11888 B | 0 B | 102400 B | yes | PASS |
| api_route_batch (5 invokeApiRoute) | 8360 B | 0 B | 102400 B | yes | PASS |
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
| p50 | 0.00ms | 0.00ms | -0.00ms | -12.32% |
| p95 | 0.01ms | 0.01ms | -0.00ms | -10.69% |
| p99 | 0.01ms | 0.01ms | -0.00ms | -12.15% |
| mean | 0.00ms | 0.00ms | -0.00ms | -10.09% |
| min | 0.00ms | 0.00ms | -0.00ms | -6.82% |
| max | 0.01ms | 0.01ms | -0.00ms | -12.34% |
| total | 0.09ms | 0.10ms | -0.01ms | -10.09% |

### api_route_batch (5 invokeApiRoute)

# Perf Report — api_route_batch (5 invokeApiRoute).serial

| metric | value |
|---|---|
| iterations | 20 |
| warmup | 3 |
| p50 | 0.08ms |
| p95 | 0.13ms |
| p99 | 0.16ms |
| mean | 0.08ms |
| stdev | 0.03ms |
| min | 0.06ms |
| max | 0.17ms |
| total | 1.69ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p50 | 0.08ms | 0.06ms | +0.02ms | +30.18% |
| p95 | 0.13ms | 0.10ms | +0.03ms | +36.31% |
| p99 | 0.16ms | 0.10ms | +0.06ms | +65.01% |
| mean | 0.08ms | 0.07ms | +0.02ms | +29.36% |
| min | 0.06ms | 0.05ms | +0.01ms | +12.16% |
| max | 0.17ms | 0.10ms | +0.07ms | +71.96% |
| total | 1.69ms | 1.30ms | +0.38ms | +29.36% |

### fn_error_handling (5 throw + catch)

# Perf Report — fn_error_handling (5 throw + catch).serial

| metric | value |
|---|---|
| iterations | 20 |
| warmup | 3 |
| p50 | 0.02ms |
| p95 | 0.03ms |
| p99 | 0.03ms |
| mean | 0.02ms |
| stdev | 0.00ms |
| min | 0.01ms |
| max | 0.03ms |
| total | 0.41ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p50 | 0.02ms | 0.02ms | +0.00ms | +11.60% |
| p95 | 0.03ms | 0.02ms | +0.01ms | +43.09% |
| p99 | 0.03ms | 0.02ms | +0.01ms | +54.75% |
| mean | 0.02ms | 0.02ms | +0.00ms | +13.42% |
| min | 0.01ms | 0.02ms | -0.00ms | -15.42% |
| max | 0.03ms | 0.02ms | +0.01ms | +57.48% |
| total | 0.41ms | 0.36ms | +0.05ms | +13.42% |

