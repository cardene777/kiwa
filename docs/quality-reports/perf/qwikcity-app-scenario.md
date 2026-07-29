# Perf Suite — qwikcity-app-scenario

Threshold source: [docs/quality/perf-thresholds.md](../../quality/perf-thresholds)

## Serial p95 (concurrency = 1)

| op | p95 | cap | gate | regression |
|---|---|---|---|---|
| route_loader_workflow (10 invokeRouteLoader) | 0.03ms | 100ms | PASS | stable (検知には +0.5ms (baseline 比 +2852%) 以上の悪化が必要) — gate 無効 (regressionGate=false) |
| route_action_form_batch (5 invokeRouteAction with FormData) | 0.01ms | 100ms | PASS | stable (検知には +0.5ms (baseline 比 +2680%) 以上の悪化が必要) — gate 無効 (regressionGate=false) |
| loader_error_handling (5 throw + catch) | 0.03ms | 100ms | PASS | stable (検知には +0.5ms (baseline 比 +2169%) 以上の悪化が必要) — gate 無効 (regressionGate=false) |

## Concurrent p95 (concurrency = 4, 5 iter each)

| op | p95 | cap | gate |
|---|---|---|---|
| route_loader_workflow (10 invokeRouteLoader) | 0.05ms | 200ms | PASS |
| route_action_form_batch (5 invokeRouteAction with FormData) | 0.03ms | 200ms | PASS |
| loader_error_handling (5 throw + catch) | 0.11ms | 200ms | PASS |

## Memory retention (20 iter, arrayBuffers axis is the gate; heap is informational)

| op | heapUsed Δ | arrayBuffers Δ | cap | gc exposed | verdict |
|---|---|---|---|---|---|
| route_loader_workflow (10 invokeRouteLoader) | -96 B | 0 B | 102400 B | yes | PASS |
| route_action_form_batch (5 invokeRouteAction with FormData) | -7632 B | 0 B | 102400 B | yes | PASS |
| loader_error_handling (5 throw + catch) | -14608 B | 0 B | 102400 B | yes | PASS |

## Detailed serial reports

### route_loader_workflow (10 invokeRouteLoader)

# Perf Report — route_loader_workflow (10 invokeRouteLoader).serial

| metric | value |
|---|---|
| iterations | 20 |
| warmup | 3 |
| p50 | 0.02ms |
| p95 | 0.03ms |
| p99 | 0.08ms |
| mean | 0.03ms |
| stdev | 0.02ms |
| min | 0.02ms |
| max | 0.10ms |
| total | 0.51ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p50 | 0.02ms | 0.01ms | +0.01ms | +113.17% |
| p95 | 0.03ms | 0.02ms | +0.01ms | +69.81% |
| p99 | 0.08ms | 0.02ms | +0.06ms | +271.16% |
| mean | 0.03ms | 0.01ms | +0.01ms | +132.62% |
| min | 0.02ms | 0.01ms | +0.01ms | +174.01% |
| max | 0.10ms | 0.02ms | +0.07ms | +308.45% |
| total | 0.51ms | 0.22ms | +0.29ms | +132.62% |

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
| total | 0.13ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p50 | 0.01ms | 0.01ms | +0.00ms | +10.57% |
| p95 | 0.01ms | 0.02ms | -0.01ms | -60.49% |
| p99 | 0.01ms | 0.03ms | -0.02ms | -66.33% |
| mean | 0.01ms | 0.01ms | -0.00ms | -7.96% |
| min | 0.01ms | 0.00ms | +0.00ms | +51.50% |
| max | 0.01ms | 0.03ms | -0.02ms | -67.33% |
| total | 0.13ms | 0.15ms | -0.01ms | -7.96% |

### loader_error_handling (5 throw + catch)

# Perf Report — loader_error_handling (5 throw + catch).serial

| metric | value |
|---|---|
| iterations | 20 |
| warmup | 3 |
| p50 | 0.02ms |
| p95 | 0.03ms |
| p99 | 0.04ms |
| mean | 0.02ms |
| stdev | 0.00ms |
| min | 0.02ms |
| max | 0.04ms |
| total | 0.49ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p50 | 0.02ms | 0.02ms | +0.00ms | +14.65% |
| p95 | 0.03ms | 0.02ms | +0.00ms | +13.73% |
| p99 | 0.04ms | 0.02ms | +0.01ms | +46.56% |
| mean | 0.02ms | 0.02ms | +0.00ms | +16.39% |
| min | 0.02ms | 0.02ms | +0.00ms | +14.79% |
| max | 0.04ms | 0.02ms | +0.01ms | +54.21% |
| total | 0.49ms | 0.42ms | +0.07ms | +16.39% |

