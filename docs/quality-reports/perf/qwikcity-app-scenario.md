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
| loader_error_handling (5 throw + catch) | 0.07ms | 200ms | PASS |

## Memory retention (20 iter, arrayBuffers axis is the gate; heap is informational)

| op | heapUsed Δ | arrayBuffers Δ | cap | verdict |
|---|---|---|---|---|
| route_loader_workflow (10 invokeRouteLoader) | 854496 B | 0 B | 102400 B | PASS |
| route_action_form_batch (5 invokeRouteAction with FormData) | 494760 B | 0 B | 102400 B | PASS |
| loader_error_handling (5 throw + catch) | 376904 B | 0 B | 102400 B | PASS |

## Detailed serial reports

### route_loader_workflow (10 invokeRouteLoader)

# Perf Report — route_loader_workflow (10 invokeRouteLoader).serial

| metric | value |
|---|---|
| iterations | 20 |
| warmup | 3 |
| p50 | 0.01ms |
| p95 | 0.01ms |
| p99 | 0.05ms |
| mean | 0.01ms |
| stdev | 0.01ms |
| min | 0.01ms |
| max | 0.05ms |
| total | 0.22ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p50 | 0.01ms | 0.01ms | +0.00ms | +3.39% |
| p95 | 0.01ms | 0.01ms | +0.00ms | +10.24% |
| p99 | 0.05ms | 0.02ms | +0.02ms | +88.30% |
| mean | 0.01ms | 0.01ms | +0.00ms | +16.96% |
| min | 0.01ms | 0.01ms | 0.00ms | 0.00% |
| max | 0.05ms | 0.03ms | +0.03ms | +96.70% |
| total | 0.22ms | 0.19ms | +0.03ms | +16.96% |

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
| min | 0.01ms |
| max | 0.01ms |
| total | 0.14ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p50 | 0.01ms | 0.01ms | +0.00ms | +7.74% |
| p95 | 0.01ms | 0.01ms | +0.00ms | +17.90% |
| p99 | 0.01ms | 0.01ms | +0.00ms | +14.84% |
| mean | 0.01ms | 0.01ms | +0.00ms | +13.58% |
| min | 0.01ms | 0.00ms | +0.00ms | +24.28% |
| max | 0.01ms | 0.01ms | +0.00ms | +14.22% |
| total | 0.14ms | 0.12ms | +0.02ms | +13.58% |

### loader_error_handling (5 throw + catch)

# Perf Report — loader_error_handling (5 throw + catch).serial

| metric | value |
|---|---|
| iterations | 20 |
| warmup | 3 |
| p50 | 0.02ms |
| p95 | 0.02ms |
| p99 | 0.03ms |
| mean | 0.02ms |
| stdev | 0.01ms |
| min | 0.01ms |
| max | 0.03ms |
| total | 0.36ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p50 | 0.02ms | 0.02ms | +0.00ms | +28.46% |
| p95 | 0.02ms | 0.03ms | -0.01ms | -26.05% |
| p99 | 0.03ms | 0.03ms | -0.00ms | -7.84% |
| mean | 0.02ms | 0.02ms | -0.00ms | -2.92% |
| min | 0.01ms | 0.01ms | -0.00ms | -3.52% |
| max | 0.03ms | 0.03ms | -0.00ms | -3.67% |
| total | 0.36ms | 0.38ms | -0.01ms | -2.92% |

