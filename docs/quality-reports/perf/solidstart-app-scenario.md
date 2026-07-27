# Perf Suite — solidstart-app-scenario

Threshold source: [docs/quality/perf-thresholds.md](../../quality/perf-thresholds)

## Serial p95 (concurrency = 1)

| op | p95 | cap | gate | regression |
|---|---|---|---|---|
| server_function_workflow (10 invokeServerFunction) | 0.01ms | 100ms | PASS | stable |
| api_route_batch (5 invokeApiRoute) | 0.14ms | 100ms | PASS | regressed |
| fn_error_handling (5 throw + catch) | 0.02ms | 100ms | PASS | stable |

## Concurrent p95 (concurrency = 4, 5 iter each)

| op | p95 | cap | gate |
|---|---|---|---|
| server_function_workflow (10 invokeServerFunction) | 0.02ms | 200ms | PASS |
| api_route_batch (5 invokeApiRoute) | 0.48ms | 200ms | PASS |
| fn_error_handling (5 throw + catch) | 0.06ms | 200ms | PASS |

## Memory retention (20 iter, arrayBuffers axis is the gate; heap is informational)

| op | heapUsed Δ | arrayBuffers Δ | cap | verdict |
|---|---|---|---|---|
| server_function_workflow (10 invokeServerFunction) | 1061816 B | 0 B | 102400 B | PASS |
| api_route_batch (5 invokeApiRoute) | 1393608 B | 1800 B | 102400 B | PASS |
| fn_error_handling (5 throw + catch) | 305776 B | 0 B | 102400 B | PASS |

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
| total | 0.10ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p50 | 0.00ms | 0.00ms | +0.00ms | +24.84% |
| p95 | 0.01ms | 0.01ms | +0.00ms | +36.97% |
| p99 | 0.01ms | 0.01ms | +0.00ms | +42.05% |
| mean | 0.00ms | 0.00ms | +0.00ms | +17.10% |
| min | 0.00ms | 0.00ms | +0.00ms | +1.21% |
| max | 0.01ms | 0.01ms | +0.00ms | +42.94% |
| total | 0.10ms | 0.08ms | +0.01ms | +17.10% |

### api_route_batch (5 invokeApiRoute)

# Perf Report — api_route_batch (5 invokeApiRoute).serial

| metric | value |
|---|---|
| iterations | 20 |
| warmup | 3 |
| p50 | 0.07ms |
| p95 | 0.14ms |
| p99 | 0.18ms |
| mean | 0.08ms |
| stdev | 0.03ms |
| min | 0.05ms |
| max | 0.19ms |
| total | 1.61ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p50 | 0.07ms | 0.06ms | +0.01ms | +24.79% |
| p95 | 0.14ms | 0.08ms | +0.05ms | +65.39% |
| p99 | 0.18ms | 0.09ms | +0.09ms | +110.14% |
| mean | 0.08ms | 0.06ms | +0.02ms | +31.69% |
| min | 0.05ms | 0.05ms | +0.01ms | +14.24% |
| max | 0.19ms | 0.09ms | +0.10ms | +121.01% |
| total | 1.61ms | 1.23ms | +0.39ms | +31.69% |

### fn_error_handling (5 throw + catch)

# Perf Report — fn_error_handling (5 throw + catch).serial

| metric | value |
|---|---|
| iterations | 20 |
| warmup | 3 |
| p50 | 0.02ms |
| p95 | 0.02ms |
| p99 | 0.03ms |
| mean | 0.02ms |
| stdev | 0.00ms |
| min | 0.01ms |
| max | 0.03ms |
| total | 0.32ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p50 | 0.02ms | 0.01ms | +0.00ms | +39.09% |
| p95 | 0.02ms | 0.02ms | -0.00ms | -15.42% |
| p99 | 0.03ms | 0.03ms | -0.00ms | -0.18% |
| mean | 0.02ms | 0.02ms | +0.00ms | +2.48% |
| min | 0.01ms | 0.01ms | -0.00ms | -2.49% |
| max | 0.03ms | 0.03ms | +0.00ms | +3.25% |
| total | 0.32ms | 0.31ms | +0.01ms | +2.48% |

