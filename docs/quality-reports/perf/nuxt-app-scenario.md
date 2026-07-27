# Perf Suite — nuxt-app-scenario

Threshold source: [docs/quality/perf-thresholds.md](../../quality/perf-thresholds)

## Serial p95 (concurrency = 1)

| op | p95 | cap | gate | regression |
|---|---|---|---|---|
| event_handler_workflow (10 invokeEventHandler) | 0.02ms | 100ms | PASS | stable |
| middleware_chain (5 invokeRouteMiddleware) | 0.00ms | 100ms | PASS | stable |
| handler_error_handling (5 throw + catch) | 0.02ms | 100ms | PASS | stable |

## Concurrent p95 (concurrency = 4, 5 iter each)

| op | p95 | cap | gate |
|---|---|---|---|
| event_handler_workflow (10 invokeEventHandler) | 0.05ms | 200ms | PASS |
| middleware_chain (5 invokeRouteMiddleware) | 0.01ms | 200ms | PASS |
| handler_error_handling (5 throw + catch) | 0.09ms | 200ms | PASS |

## Memory retention (20 iter, arrayBuffers axis is the gate; heap is informational)

| op | heapUsed Δ | arrayBuffers Δ | cap | gc exposed | verdict |
|---|---|---|---|---|---|
| event_handler_workflow (10 invokeEventHandler) | -2440 B | 0 B | 102400 B | yes | PASS |
| middleware_chain (5 invokeRouteMiddleware) | 3080 B | 0 B | 102400 B | yes | PASS |
| handler_error_handling (5 throw + catch) | 184 B | 0 B | 102400 B | yes | PASS |

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
| total | 0.24ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p50 | 0.01ms | 0.01ms | +0.00ms | +7.53% |
| p95 | 0.02ms | 0.02ms | +0.00ms | +10.82% |
| p99 | 0.02ms | 0.02ms | +0.00ms | +5.29% |
| mean | 0.01ms | 0.01ms | +0.00ms | +6.48% |
| min | 0.01ms | 0.01ms | +0.00ms | +2.52% |
| max | 0.02ms | 0.02ms | +0.00ms | +4.14% |
| total | 0.24ms | 0.22ms | +0.01ms | +6.48% |

### middleware_chain (5 invokeRouteMiddleware)

# Perf Report — middleware_chain (5 invokeRouteMiddleware).serial

| metric | value |
|---|---|
| iterations | 20 |
| warmup | 3 |
| p50 | 0.00ms |
| p95 | 0.00ms |
| p99 | 0.01ms |
| mean | 0.00ms |
| stdev | 0.00ms |
| min | 0.00ms |
| max | 0.01ms |
| total | 0.07ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p50 | 0.00ms | 0.01ms | -0.01ms | -60.29% |
| p95 | 0.00ms | 0.04ms | -0.04ms | -89.18% |
| p99 | 0.01ms | 0.05ms | -0.04ms | -88.01% |
| mean | 0.00ms | 0.01ms | -0.01ms | -66.32% |
| min | 0.00ms | 0.00ms | -0.00ms | -24.99% |
| max | 0.01ms | 0.05ms | -0.04ms | -87.73% |
| total | 0.07ms | 0.21ms | -0.14ms | -66.32% |

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
| stdev | 0.01ms |
| min | 0.01ms |
| max | 0.03ms |
| total | 0.38ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p50 | 0.02ms | 0.02ms | -0.00ms | -3.29% |
| p95 | 0.02ms | 0.02ms | -0.00ms | -3.58% |
| p99 | 0.03ms | 0.03ms | -0.00ms | -0.95% |
| mean | 0.02ms | 0.02ms | -0.00ms | -9.04% |
| min | 0.01ms | 0.01ms | -0.00ms | -3.79% |
| max | 0.03ms | 0.03ms | -0.00ms | -0.49% |
| total | 0.38ms | 0.42ms | -0.04ms | -9.04% |

