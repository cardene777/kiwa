# Perf Suite — nuxt-app-scenario

Threshold source: [docs/quality/perf-thresholds.md](../../quality/perf-thresholds)

## Serial p95 (concurrency = 1)

| op | p95 | cap | gate | regression |
|---|---|---|---|---|
| event_handler_workflow (10 invokeEventHandler) | 0.02ms | 100ms | PASS | stable |
| middleware_chain (5 invokeRouteMiddleware) | 0.01ms | 100ms | PASS | stable |
| handler_error_handling (5 throw + catch) | 0.03ms | 100ms | PASS | stable |

## Concurrent p95 (concurrency = 4, 5 iter each)

| op | p95 | cap | gate |
|---|---|---|---|
| event_handler_workflow (10 invokeEventHandler) | 0.05ms | 200ms | PASS |
| middleware_chain (5 invokeRouteMiddleware) | 0.01ms | 200ms | PASS |
| handler_error_handling (5 throw + catch) | 0.07ms | 200ms | PASS |

## Memory retention (20 iter, arrayBuffers axis is the gate; heap is informational)

| op | heapUsed Δ | arrayBuffers Δ | cap | verdict |
|---|---|---|---|---|
| event_handler_workflow (10 invokeEventHandler) | 1475312 B | 0 B | 102400 B | PASS |
| middleware_chain (5 invokeRouteMiddleware) | 254544 B | 0 B | 102400 B | PASS |
| handler_error_handling (5 throw + catch) | 445664 B | 0 B | 102400 B | PASS |

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
| p50 | 0.01ms | 0.01ms | +0.00ms | +24.82% |
| p95 | 0.02ms | 0.02ms | -0.00ms | -2.56% |
| p99 | 0.02ms | 0.02ms | +0.00ms | +2.52% |
| mean | 0.01ms | 0.01ms | +0.00ms | +5.66% |
| min | 0.01ms | 0.01ms | 0.00ms | 0.00% |
| max | 0.02ms | 0.02ms | +0.00ms | +3.54% |
| total | 0.22ms | 0.21ms | +0.01ms | +5.66% |

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
| total | 0.08ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p50 | 0.00ms | 0.00ms | +0.00ms | +11.02% |
| p95 | 0.01ms | 0.01ms | +0.00ms | +2.03% |
| p99 | 0.01ms | 0.01ms | +0.00ms | +24.37% |
| mean | 0.00ms | 0.00ms | +0.00ms | +14.58% |
| min | 0.00ms | 0.00ms | -0.00ms | -1.70% |
| max | 0.01ms | 0.01ms | +0.00ms | +28.22% |
| total | 0.08ms | 0.07ms | +0.01ms | +14.58% |

### handler_error_handling (5 throw + catch)

# Perf Report — handler_error_handling (5 throw + catch).serial

| metric | value |
|---|---|
| iterations | 20 |
| warmup | 3 |
| p50 | 0.02ms |
| p95 | 0.03ms |
| p99 | 0.04ms |
| mean | 0.02ms |
| stdev | 0.01ms |
| min | 0.01ms |
| max | 0.04ms |
| total | 0.40ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p50 | 0.02ms | 0.02ms | +0.00ms | +28.43% |
| p95 | 0.03ms | 0.03ms | -0.00ms | -4.30% |
| p99 | 0.04ms | 0.05ms | -0.01ms | -23.75% |
| mean | 0.02ms | 0.02ms | -0.00ms | -4.59% |
| min | 0.01ms | 0.02ms | -0.00ms | -6.03% |
| max | 0.04ms | 0.05ms | -0.01ms | -26.27% |
| total | 0.40ms | 0.42ms | -0.02ms | -4.59% |

