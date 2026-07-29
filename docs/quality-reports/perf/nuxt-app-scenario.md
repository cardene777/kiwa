# Perf Suite — nuxt-app-scenario

Threshold source: [docs/quality/perf-thresholds.md](../../quality/perf-thresholds)

## Serial p95 (concurrency = 1)

| op | p95 | cap | gate | regression |
|---|---|---|---|---|
| event_handler_workflow (10 invokeEventHandler) | 0.02ms | 100ms | PASS | stable (差 0.02ms が下限 0.5ms 未満で判定を保留) — gate 無効 (regressionGate=false) |
| middleware_chain (5 invokeRouteMiddleware) | 0.01ms | 100ms | PASS | stable (検知には +0.5ms (baseline 比 +8328%) 以上の悪化が必要) — gate 無効 (regressionGate=false) |
| handler_error_handling (5 throw + catch) | 0.03ms | 100ms | PASS | stable (検知には +0.5ms (baseline 比 +1777%) 以上の悪化が必要) — gate 無効 (regressionGate=false) |

## Concurrent p95 (concurrency = 4, 5 iter each)

| op | p95 | cap | gate |
|---|---|---|---|
| event_handler_workflow (10 invokeEventHandler) | 0.05ms | 200ms | PASS |
| middleware_chain (5 invokeRouteMiddleware) | 0.02ms | 200ms | PASS |
| handler_error_handling (5 throw + catch) | 0.26ms | 200ms | PASS |

## Memory retention (20 iter, arrayBuffers axis is the gate; heap is informational)

| op | heapUsed Δ | arrayBuffers Δ | cap | gc exposed | verdict |
|---|---|---|---|---|---|
| event_handler_workflow (10 invokeEventHandler) | 9320 B | 0 B | 102400 B | yes | PASS |
| middleware_chain (5 invokeRouteMiddleware) | 2936 B | 0 B | 102400 B | yes | PASS |
| handler_error_handling (5 throw + catch) | 9232 B | 0 B | 102400 B | yes | PASS |

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
| total | 0.27ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p50 | 0.01ms | 0.01ms | +0.00ms | +11.84% |
| p95 | 0.02ms | 0.05ms | -0.02ms | -50.52% |
| p99 | 0.02ms | 0.07ms | -0.04ms | -63.04% |
| mean | 0.01ms | 0.02ms | -0.01ms | -37.36% |
| min | 0.01ms | 0.01ms | -0.00ms | -2.22% |
| max | 0.02ms | 0.07ms | -0.05ms | -65.09% |
| total | 0.27ms | 0.43ms | -0.16ms | -37.36% |

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
| p50 | 0.00ms | 0.00ms | +0.00ms | +8.33% |
| p95 | 0.01ms | 0.01ms | -0.00ms | -3.20% |
| p99 | 0.01ms | 0.01ms | -0.00ms | -23.08% |
| mean | 0.00ms | 0.00ms | +0.00ms | +15.35% |
| min | 0.00ms | 0.00ms | +0.00ms | +36.50% |
| max | 0.01ms | 0.01ms | -0.00ms | -26.60% |
| total | 0.08ms | 0.07ms | +0.01ms | +15.35% |

### handler_error_handling (5 throw + catch)

# Perf Report — handler_error_handling (5 throw + catch).serial

| metric | value |
|---|---|
| iterations | 20 |
| warmup | 3 |
| p50 | 0.03ms |
| p95 | 0.03ms |
| p99 | 0.03ms |
| mean | 0.03ms |
| stdev | 0.00ms |
| min | 0.02ms |
| max | 0.03ms |
| total | 0.53ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p50 | 0.03ms | 0.02ms | +0.00ms | +9.94% |
| p95 | 0.03ms | 0.03ms | +0.00ms | +0.93% |
| p99 | 0.03ms | 0.04ms | -0.01ms | -20.96% |
| mean | 0.03ms | 0.02ms | +0.00ms | +20.28% |
| min | 0.02ms | 0.01ms | +0.01ms | +59.39% |
| max | 0.03ms | 0.04ms | -0.01ms | -24.87% |
| total | 0.53ms | 0.44ms | +0.09ms | +20.28% |

