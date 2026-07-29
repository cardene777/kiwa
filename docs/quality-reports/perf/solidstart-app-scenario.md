# Perf Suite — solidstart-app-scenario

Threshold source: [docs/quality/perf-thresholds.md](../../quality/perf-thresholds)

## Serial p95 (concurrency = 1)

| op | p95 | cap | gate | regression |
|---|---|---|---|---|
| server_function_workflow (10 invokeServerFunction) | 0.02ms | 100ms | PASS | stable (検知には +0.5ms (baseline 比 +987%) 以上の悪化が必要) — gate 無効 (regressionGate=false) |
| api_route_batch (5 invokeApiRoute) | 0.14ms | 100ms | PASS | stable (検知には +0.5ms (baseline 比 +477%) 以上の悪化が必要) — gate 無効 (regressionGate=false) |
| fn_error_handling (5 throw + catch) | 0.02ms | 100ms | PASS | stable (検知には +0.5ms (baseline 比 +1787%) 以上の悪化が必要) — gate 無効 (regressionGate=false) |

## Concurrent p95 (concurrency = 4, 5 iter each)

| op | p95 | cap | gate |
|---|---|---|---|
| server_function_workflow (10 invokeServerFunction) | 0.04ms | 200ms | PASS |
| api_route_batch (5 invokeApiRoute) | 0.26ms | 200ms | PASS |
| fn_error_handling (5 throw + catch) | 4.83ms | 200ms | PASS |

## Memory retention (20 iter, arrayBuffers axis is the gate; heap is informational)

| op | heapUsed Δ | arrayBuffers Δ | cap | gc exposed | verdict |
|---|---|---|---|---|---|
| server_function_workflow (10 invokeServerFunction) | 1008 B | 0 B | 102400 B | yes | PASS |
| api_route_batch (5 invokeApiRoute) | 17864 B | -4860 B | 102400 B | yes | PASS |
| fn_error_handling (5 throw + catch) | 4904 B | 0 B | 102400 B | yes | PASS |

## Detailed serial reports

### server_function_workflow (10 invokeServerFunction)

# Perf Report — server_function_workflow (10 invokeServerFunction).serial

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
| total | 0.21ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p50 | 0.01ms | 0.00ms | +0.00ms | +116.82% |
| p95 | 0.02ms | 0.05ms | -0.03ms | -68.53% |
| p99 | 0.02ms | 0.07ms | -0.06ms | -76.21% |
| mean | 0.01ms | 0.01ms | -0.00ms | -23.64% |
| min | 0.01ms | 0.00ms | +0.00ms | +128.88% |
| max | 0.02ms | 0.08ms | -0.06ms | -77.42% |
| total | 0.21ms | 0.27ms | -0.06ms | -23.64% |

### api_route_batch (5 invokeApiRoute)

# Perf Report — api_route_batch (5 invokeApiRoute).serial

| metric | value |
|---|---|
| iterations | 20 |
| warmup | 3 |
| p50 | 0.10ms |
| p95 | 0.14ms |
| p99 | 0.16ms |
| mean | 0.10ms |
| stdev | 0.02ms |
| min | 0.06ms |
| max | 0.17ms |
| total | 2.00ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p50 | 0.10ms | 0.06ms | +0.03ms | +51.81% |
| p95 | 0.14ms | 0.10ms | +0.04ms | +34.71% |
| p99 | 0.16ms | 0.12ms | +0.04ms | +34.64% |
| mean | 0.10ms | 0.07ms | +0.03ms | +42.35% |
| min | 0.06ms | 0.06ms | +0.01ms | +12.97% |
| max | 0.17ms | 0.12ms | +0.04ms | +34.62% |
| total | 2.00ms | 1.41ms | +0.60ms | +42.35% |

### fn_error_handling (5 throw + catch)

# Perf Report — fn_error_handling (5 throw + catch).serial

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
| total | 0.40ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p50 | 0.02ms | 0.02ms | +0.00ms | +4.06% |
| p95 | 0.02ms | 0.03ms | -0.01ms | -25.98% |
| p99 | 0.02ms | 0.05ms | -0.03ms | -55.82% |
| mean | 0.02ms | 0.02ms | -0.00ms | -7.39% |
| min | 0.02ms | 0.02ms | +0.00ms | +0.45% |
| max | 0.02ms | 0.06ms | -0.03ms | -59.59% |
| total | 0.40ms | 0.43ms | -0.03ms | -7.39% |

