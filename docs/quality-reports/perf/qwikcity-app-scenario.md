# Perf Suite — qwikcity-app-scenario

Threshold source: [docs/quality/perf-thresholds.md](../../quality/perf-thresholds)

## Serial p95 (concurrency = 1)

| op | p95 | cap | gate | regression |
|---|---|---|---|---|
| route_loader_workflow (10 invokeRouteLoader) | 0.01ms | 100ms | PASS | stable (検知には +0.5ms (baseline 比 +2852%) 以上の悪化が必要) |
| route_action_form_batch (5 invokeRouteAction with FormData) | 0.01ms | 100ms | PASS | stable (検知には +0.5ms (baseline 比 +2680%) 以上の悪化が必要) |
| loader_error_handling (5 throw + catch) | 0.02ms | 100ms | PASS | stable (検知には +0.5ms (baseline 比 +2169%) 以上の悪化が必要) |

## Concurrent p95 (concurrency = 4, 5 iter each)

| op | p95 | cap | gate |
|---|---|---|---|
| route_loader_workflow (10 invokeRouteLoader) | 0.04ms | 200ms | PASS |
| route_action_form_batch (5 invokeRouteAction with FormData) | 0.02ms | 200ms | PASS |
| loader_error_handling (5 throw + catch) | 0.11ms | 200ms | PASS |

## Memory retention (20 iter, arrayBuffers axis is the gate; heap is informational)

| op | heapUsed Δ | arrayBuffers Δ | cap | gc exposed | verdict |
|---|---|---|---|---|---|
| route_loader_workflow (10 invokeRouteLoader) | 22032 B | 0 B | 102400 B | yes | PASS |
| route_action_form_batch (5 invokeRouteAction with FormData) | -7632 B | 0 B | 102400 B | yes | PASS |
| loader_error_handling (5 throw + catch) | -14424 B | 0 B | 102400 B | yes | PASS |

## Detailed serial reports

### route_loader_workflow (10 invokeRouteLoader)

# Perf Report — route_loader_workflow (10 invokeRouteLoader).serial

| metric | value |
|---|---|
| iterations | 20 |
| warmup | 3 |
| p50 | 0.01ms |
| p95 | 0.01ms |
| p99 | 0.02ms |
| mean | 0.01ms |
| stdev | 0.00ms |
| min | 0.01ms |
| max | 0.02ms |
| total | 0.19ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p50 | 0.01ms | 0.01ms | -0.00ms | -17.90% |
| p95 | 0.01ms | 0.02ms | -0.00ms | -21.39% |
| p99 | 0.02ms | 0.02ms | -0.01ms | -25.18% |
| mean | 0.01ms | 0.01ms | -0.00ms | -15.58% |
| min | 0.01ms | 0.01ms | -0.00ms | -4.53% |
| max | 0.02ms | 0.02ms | -0.01ms | -25.88% |
| total | 0.19ms | 0.22ms | -0.03ms | -15.58% |

### route_action_form_batch (5 invokeRouteAction with FormData)

# Perf Report — route_action_form_batch (5 invokeRouteAction with FormData).serial

| metric | value |
|---|---|
| iterations | 20 |
| warmup | 3 |
| p50 | 0.01ms |
| p95 | 0.01ms |
| p99 | 0.02ms |
| mean | 0.01ms |
| stdev | 0.00ms |
| min | 0.00ms |
| max | 0.02ms |
| total | 0.14ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p50 | 0.01ms | 0.01ms | +0.00ms | +16.57% |
| p95 | 0.01ms | 0.02ms | -0.01ms | -45.92% |
| p99 | 0.02ms | 0.03ms | -0.01ms | -40.11% |
| mean | 0.01ms | 0.01ms | -0.00ms | -2.56% |
| min | 0.00ms | 0.00ms | +0.00ms | +14.88% |
| max | 0.02ms | 0.03ms | -0.01ms | -39.11% |
| total | 0.14ms | 0.15ms | -0.00ms | -2.56% |

### loader_error_handling (5 throw + catch)

# Perf Report — loader_error_handling (5 throw + catch).serial

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
| total | 0.42ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p50 | 0.02ms | 0.02ms | +0.00ms | +0.82% |
| p95 | 0.02ms | 0.02ms | -0.00ms | -2.38% |
| p99 | 0.02ms | 0.02ms | -0.00ms | -5.37% |
| mean | 0.02ms | 0.02ms | +0.00ms | +0.65% |
| min | 0.02ms | 0.02ms | +0.00ms | +0.41% |
| max | 0.02ms | 0.02ms | -0.00ms | -6.06% |
| total | 0.42ms | 0.42ms | +0.00ms | +0.65% |

