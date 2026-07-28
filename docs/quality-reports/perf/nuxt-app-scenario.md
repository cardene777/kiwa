# Perf Suite — nuxt-app-scenario

Threshold source: [docs/quality/perf-thresholds.md](../../quality/perf-thresholds)

## Serial p95 (concurrency = 1)

| op | p95 | cap | gate | regression |
|---|---|---|---|---|
| event_handler_workflow (10 invokeEventHandler) | 0.02ms | 100ms | PASS | stable (差 0.03ms が下限 0.5ms 未満で判定を保留) |
| middleware_chain (5 invokeRouteMiddleware) | 0.01ms | 100ms | PASS | stable (検知には +0.5ms (baseline 比 +8328%) 以上の悪化が必要) |
| handler_error_handling (5 throw + catch) | 0.02ms | 100ms | PASS | stable (検知には +0.5ms (baseline 比 +1777%) 以上の悪化が必要) |

## Concurrent p95 (concurrency = 4, 5 iter each)

| op | p95 | cap | gate |
|---|---|---|---|
| event_handler_workflow (10 invokeEventHandler) | 0.11ms | 200ms | PASS |
| middleware_chain (5 invokeRouteMiddleware) | 0.02ms | 200ms | PASS |
| handler_error_handling (5 throw + catch) | 0.09ms | 200ms | PASS |

## Memory retention (20 iter, arrayBuffers axis is the gate; heap is informational)

| op | heapUsed Δ | arrayBuffers Δ | cap | gc exposed | verdict |
|---|---|---|---|---|---|
| event_handler_workflow (10 invokeEventHandler) | 6040 B | 0 B | 102400 B | yes | PASS |
| middleware_chain (5 invokeRouteMiddleware) | -3552 B | 0 B | 102400 B | yes | PASS |
| handler_error_handling (5 throw + catch) | 1344 B | 0 B | 102400 B | yes | PASS |

## Detailed serial reports

### event_handler_workflow (10 invokeEventHandler)

# Perf Report — event_handler_workflow (10 invokeEventHandler).serial

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
| total | 0.22ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p50 | 0.01ms | 0.01ms | -0.00ms | -15.27% |
| p95 | 0.02ms | 0.05ms | -0.03ms | -66.94% |
| p99 | 0.02ms | 0.07ms | -0.05ms | -70.73% |
| mean | 0.01ms | 0.02ms | -0.01ms | -49.14% |
| min | 0.01ms | 0.01ms | -0.00ms | -8.89% |
| max | 0.02ms | 0.07ms | -0.05ms | -71.35% |
| total | 0.22ms | 0.43ms | -0.21ms | -49.14% |

### middleware_chain (5 invokeRouteMiddleware)

# Perf Report — middleware_chain (5 invokeRouteMiddleware).serial

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
| total | 0.07ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p50 | 0.00ms | 0.00ms | -0.00ms | -2.97% |
| p95 | 0.01ms | 0.01ms | +0.00ms | +0.55% |
| p99 | 0.01ms | 0.01ms | -0.00ms | -9.12% |
| mean | 0.00ms | 0.00ms | -0.00ms | -1.41% |
| min | 0.00ms | 0.00ms | -0.00ms | -7.96% |
| max | 0.01ms | 0.01ms | -0.00ms | -10.84% |
| total | 0.07ms | 0.07ms | -0.00ms | -1.41% |

### handler_error_handling (5 throw + catch)

# Perf Report — handler_error_handling (5 throw + catch).serial

| metric | value |
|---|---|
| iterations | 20 |
| warmup | 3 |
| p50 | 0.02ms |
| p95 | 0.02ms |
| p99 | 0.03ms |
| mean | 0.02ms |
| stdev | 0.00ms |
| min | 0.02ms |
| max | 0.04ms |
| total | 0.46ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p50 | 0.02ms | 0.02ms | -0.00ms | -6.16% |
| p95 | 0.02ms | 0.03ms | -0.00ms | -13.57% |
| p99 | 0.03ms | 0.04ms | -0.00ms | -11.39% |
| mean | 0.02ms | 0.02ms | +0.00ms | +5.00% |
| min | 0.02ms | 0.01ms | +0.01ms | +44.81% |
| max | 0.04ms | 0.04ms | -0.00ms | -11.00% |
| total | 0.46ms | 0.44ms | +0.02ms | +5.00% |

