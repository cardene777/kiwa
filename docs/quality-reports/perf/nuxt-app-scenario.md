# Perf Suite — nuxt-app-scenario

Threshold source: [docs/quality/perf-thresholds.md](../../quality/perf-thresholds)

## Serial p95 (concurrency = 1)

| op | p95 | cap | gate | regression |
|---|---|---|---|---|
| event_handler_workflow (10 invokeEventHandler) | 0.01ms | 100ms | PASS | stable |
| middleware_chain (5 invokeRouteMiddleware) | 0.01ms | 100ms | PASS | stable |
| handler_error_handling (5 throw + catch) | 0.02ms | 100ms | PASS | stable |

## Concurrent p95 (concurrency = 4, 5 iter each)

| op | p95 | cap | gate |
|---|---|---|---|
| event_handler_workflow (10 invokeEventHandler) | 0.05ms | 200ms | PASS |
| middleware_chain (5 invokeRouteMiddleware) | 0.02ms | 200ms | PASS |
| handler_error_handling (5 throw + catch) | 0.11ms | 200ms | PASS |

## Memory retention (20 iter, arrayBuffers axis is the gate; heap is informational)

| op | heapUsed Δ | arrayBuffers Δ | cap | gc exposed | verdict |
|---|---|---|---|---|---|
| event_handler_workflow (10 invokeEventHandler) | 6224 B | 0 B | 102400 B | yes | PASS |
| middleware_chain (5 invokeRouteMiddleware) | 3080 B | 0 B | 102400 B | yes | PASS |
| handler_error_handling (5 throw + catch) | 10704 B | 0 B | 102400 B | yes | PASS |

## Detailed serial reports

### event_handler_workflow (10 invokeEventHandler)

# Perf Report — event_handler_workflow (10 invokeEventHandler).serial

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
| total | 0.25ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p50 | 0.01ms | 0.01ms | +0.00ms | +14.03% |
| p95 | 0.01ms | 0.02ms | -0.00ms | -20.34% |
| p99 | 0.02ms | 0.02ms | -0.00ms | -7.91% |
| mean | 0.01ms | 0.01ms | +0.00ms | +11.38% |
| min | 0.01ms | 0.01ms | +0.00ms | +35.35% |
| max | 0.02ms | 0.02ms | -0.00ms | -5.33% |
| total | 0.25ms | 0.22ms | +0.03ms | +11.38% |

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
| total | 0.09ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p50 | 0.00ms | 0.01ms | -0.00ms | -49.75% |
| p95 | 0.01ms | 0.04ms | -0.04ms | -88.13% |
| p99 | 0.01ms | 0.05ms | -0.04ms | -86.52% |
| mean | 0.00ms | 0.01ms | -0.01ms | -59.76% |
| min | 0.00ms | 0.00ms | +0.00ms | +1.26% |
| max | 0.01ms | 0.05ms | -0.04ms | -86.14% |
| total | 0.09ms | 0.21ms | -0.13ms | -59.76% |

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
| max | 0.03ms |
| total | 0.47ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p50 | 0.02ms | 0.02ms | +0.00ms | +4.70% |
| p95 | 0.02ms | 0.02ms | +0.00ms | +0.92% |
| p99 | 0.03ms | 0.03ms | -0.00ms | -12.08% |
| mean | 0.02ms | 0.02ms | +0.00ms | +12.07% |
| min | 0.02ms | 0.01ms | +0.01ms | +53.36% |
| max | 0.03ms | 0.03ms | -0.00ms | -14.41% |
| total | 0.47ms | 0.42ms | +0.05ms | +12.07% |

