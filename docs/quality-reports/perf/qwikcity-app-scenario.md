# Perf Suite — qwikcity-app-scenario

Threshold source: [docs/quality/perf-thresholds.md](../../quality/perf-thresholds)

## Serial p95 (concurrency = 1)

| op | p95 | cap | gate | regression |
|---|---|---|---|---|
| route_loader_workflow (10 invokeRouteLoader) | 0.01ms | 100ms | PASS | stable |
| route_action_form_batch (5 invokeRouteAction with FormData) | 0.01ms | 100ms | PASS | stable |
| loader_error_handling (5 throw + catch) | 0.02ms | 100ms | PASS | stable |

## Concurrent p95 (concurrency = 4, 5 iter each)

| op | p95 | cap | gate |
|---|---|---|---|
| route_loader_workflow (10 invokeRouteLoader) | 0.04ms | 200ms | PASS |
| route_action_form_batch (5 invokeRouteAction with FormData) | 0.03ms | 200ms | PASS |
| loader_error_handling (5 throw + catch) | 0.09ms | 200ms | PASS |

## Memory retention (20 iter, arrayBuffers axis is the gate; heap is informational)

| op | heapUsed Δ | arrayBuffers Δ | cap | gc exposed | verdict |
|---|---|---|---|---|---|
| route_loader_workflow (10 invokeRouteLoader) | 6784 B | 0 B | 102400 B | yes | PASS |
| route_action_form_batch (5 invokeRouteAction with FormData) | 5600 B | 0 B | 102400 B | yes | PASS |
| loader_error_handling (5 throw + catch) | -14496 B | 0 B | 102400 B | yes | PASS |

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
| max | 0.03ms |
| total | 0.19ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p50 | 0.01ms | 0.01ms | -0.00ms | -24.70% |
| p95 | 0.01ms | 0.01ms | -0.00ms | -4.49% |
| p99 | 0.02ms | 0.02ms | +0.01ms | +28.05% |
| mean | 0.01ms | 0.01ms | -0.00ms | -10.70% |
| min | 0.01ms | 0.01ms | -0.00ms | -10.53% |
| max | 0.03ms | 0.02ms | +0.01ms | +33.26% |
| total | 0.19ms | 0.21ms | -0.02ms | -10.70% |

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
| total | 0.12ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p50 | 0.01ms | 0.01ms | +0.00ms | +0.73% |
| p95 | 0.01ms | 0.01ms | +0.00ms | +0.95% |
| p99 | 0.01ms | 0.01ms | -0.00ms | -13.53% |
| mean | 0.01ms | 0.01ms | +0.00ms | +1.01% |
| min | 0.00ms | 0.00ms | +0.00ms | +3.02% |
| max | 0.01ms | 0.01ms | -0.00ms | -15.56% |
| total | 0.12ms | 0.12ms | +0.00ms | +1.01% |

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
| total | 0.40ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p50 | 0.02ms | 0.02ms | -0.00ms | -5.27% |
| p95 | 0.02ms | 0.08ms | -0.06ms | -73.26% |
| p99 | 0.02ms | 0.14ms | -0.12ms | -83.92% |
| mean | 0.02ms | 0.03ms | -0.01ms | -34.27% |
| min | 0.02ms | 0.02ms | -0.00ms | -4.77% |
| max | 0.02ms | 0.15ms | -0.13ms | -85.31% |
| total | 0.40ms | 0.61ms | -0.21ms | -34.27% |

