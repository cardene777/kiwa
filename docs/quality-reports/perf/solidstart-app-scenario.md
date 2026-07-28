# Perf Suite — solidstart-app-scenario

Threshold source: [docs/quality/perf-thresholds.md](../../quality/perf-thresholds)

## Serial p95 (concurrency = 1)

| op | p95 | cap | gate | regression |
|---|---|---|---|---|
| server_function_workflow (10 invokeServerFunction) | 0.01ms | 100ms | PASS | stable (差 0.05ms が下限 0.5ms 未満で判定を保留) |
| api_route_batch (5 invokeApiRoute) | 0.12ms | 100ms | PASS | stable (検知には +0.5ms (baseline 比 +477%) 以上の悪化が必要) |
| fn_error_handling (5 throw + catch) | 0.02ms | 100ms | PASS | stable (検知には +0.5ms (baseline 比 +1787%) 以上の悪化が必要) |

## Concurrent p95 (concurrency = 4, 5 iter each)

| op | p95 | cap | gate |
|---|---|---|---|
| server_function_workflow (10 invokeServerFunction) | 0.09ms | 200ms | PASS |
| api_route_batch (5 invokeApiRoute) | 0.31ms | 200ms | PASS |
| fn_error_handling (5 throw + catch) | 0.07ms | 200ms | PASS |

## Memory retention (20 iter, arrayBuffers axis is the gate; heap is informational)

| op | heapUsed Δ | arrayBuffers Δ | cap | gc exposed | verdict |
|---|---|---|---|---|---|
| server_function_workflow (10 invokeServerFunction) | 3704 B | 0 B | 102400 B | yes | PASS |
| api_route_batch (5 invokeApiRoute) | 16496 B | -3132 B | 102400 B | yes | PASS |
| fn_error_handling (5 throw + catch) | 632 B | 0 B | 102400 B | yes | PASS |

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
| p50 | 0.00ms | 0.00ms | +0.00ms | +9.90% |
| p95 | 0.01ms | 0.05ms | -0.05ms | -89.09% |
| p99 | 0.01ms | 0.07ms | -0.07ms | -91.14% |
| mean | 0.00ms | 0.01ms | -0.01ms | -64.75% |
| min | 0.00ms | 0.00ms | +0.00ms | +17.79% |
| max | 0.01ms | 0.08ms | -0.07ms | -91.47% |
| total | 0.10ms | 0.27ms | -0.18ms | -64.75% |

### api_route_batch (5 invokeApiRoute)

# Perf Report — api_route_batch (5 invokeApiRoute).serial

| metric | value |
|---|---|
| iterations | 20 |
| warmup | 3 |
| p50 | 0.08ms |
| p95 | 0.12ms |
| p99 | 0.13ms |
| mean | 0.09ms |
| stdev | 0.02ms |
| min | 0.07ms |
| max | 0.14ms |
| total | 1.71ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p50 | 0.08ms | 0.06ms | +0.01ms | +22.12% |
| p95 | 0.12ms | 0.10ms | +0.02ms | +17.94% |
| p99 | 0.13ms | 0.12ms | +0.02ms | +13.23% |
| mean | 0.09ms | 0.07ms | +0.01ms | +21.27% |
| min | 0.07ms | 0.06ms | +0.01ms | +18.18% |
| max | 0.14ms | 0.12ms | +0.02ms | +12.22% |
| total | 1.71ms | 1.41ms | +0.30ms | +21.27% |

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
| p50 | 0.02ms | 0.02ms | -0.00ms | -8.66% |
| p95 | 0.02ms | 0.03ms | -0.01ms | -28.70% |
| p99 | 0.03ms | 0.05ms | -0.02ms | -46.24% |
| mean | 0.02ms | 0.02ms | -0.01ms | -24.52% |
| min | 0.01ms | 0.02ms | -0.01ms | -37.79% |
| max | 0.03ms | 0.06ms | -0.03ms | -48.46% |
| total | 0.32ms | 0.43ms | -0.10ms | -24.52% |

