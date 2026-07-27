# Perf Suite — qwikcity-app-scenario

Threshold source: [docs/quality/perf-thresholds.md](../../quality/perf-thresholds)

## Serial p95 (concurrency = 1)

| op | p95 | cap | gate | regression |
|---|---|---|---|---|
| route_loader_workflow (10 invokeRouteLoader) | 0.02ms | 100ms | PASS | stable |
| route_action_form_batch (5 invokeRouteAction with FormData) | 0.01ms | 100ms | PASS | stable |
| loader_error_handling (5 throw + catch) | 0.02ms | 100ms | PASS | stable |

## Concurrent p95 (concurrency = 4, 5 iter each)

| op | p95 | cap | gate |
|---|---|---|---|
| route_loader_workflow (10 invokeRouteLoader) | 0.03ms | 200ms | PASS |
| route_action_form_batch (5 invokeRouteAction with FormData) | 0.02ms | 200ms | PASS |
| loader_error_handling (5 throw + catch) | 0.10ms | 200ms | PASS |

## Memory retention (20 iter, arrayBuffers axis is the gate; heap is informational)

| op | heapUsed Δ | arrayBuffers Δ | cap | gc exposed | verdict |
|---|---|---|---|---|---|
| route_loader_workflow (10 invokeRouteLoader) | -1256 B | 0 B | 102400 B | yes | PASS |
| route_action_form_batch (5 invokeRouteAction with FormData) | 2088 B | 0 B | 102400 B | yes | PASS |
| loader_error_handling (5 throw + catch) | -15584 B | 0 B | 102400 B | yes | PASS |

## Detailed serial reports

### route_loader_workflow (10 invokeRouteLoader)

# Perf Report — route_loader_workflow (10 invokeRouteLoader).serial

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
| total | 0.20ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p50 | 0.01ms | 0.01ms | -0.00ms | -2.23% |
| p95 | 0.02ms | 0.01ms | +0.00ms | +16.99% |
| p99 | 0.02ms | 0.02ms | -0.00ms | -4.11% |
| mean | 0.01ms | 0.01ms | -0.00ms | -7.84% |
| min | 0.01ms | 0.01ms | -0.00ms | -11.58% |
| max | 0.02ms | 0.02ms | -0.00ms | -7.48% |
| total | 0.20ms | 0.21ms | -0.02ms | -7.84% |

### route_action_form_batch (5 invokeRouteAction with FormData)

# Perf Report — route_action_form_batch (5 invokeRouteAction with FormData).serial

| metric | value |
|---|---|
| iterations | 20 |
| warmup | 3 |
| p50 | 0.01ms |
| p95 | 0.01ms |
| p99 | 0.01ms |
| mean | 0.01ms |
| stdev | 0.00ms |
| min | 0.00ms |
| max | 0.01ms |
| total | 0.13ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p50 | 0.01ms | 0.01ms | +0.00ms | +7.20% |
| p95 | 0.01ms | 0.01ms | +0.00ms | +14.22% |
| p99 | 0.01ms | 0.01ms | -0.00ms | -10.67% |
| mean | 0.01ms | 0.01ms | +0.00ms | +9.10% |
| min | 0.00ms | 0.00ms | +0.00ms | +11.02% |
| max | 0.01ms | 0.01ms | -0.00ms | -14.17% |
| total | 0.13ms | 0.12ms | +0.01ms | +9.10% |

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
| total | 0.41ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p50 | 0.02ms | 0.02ms | -0.00ms | -1.52% |
| p95 | 0.02ms | 0.08ms | -0.06ms | -72.84% |
| p99 | 0.02ms | 0.14ms | -0.12ms | -84.14% |
| mean | 0.02ms | 0.03ms | -0.01ms | -32.15% |
| min | 0.02ms | 0.02ms | -0.00ms | -0.83% |
| max | 0.02ms | 0.15ms | -0.13ms | -85.60% |
| total | 0.41ms | 0.61ms | -0.20ms | -32.15% |

