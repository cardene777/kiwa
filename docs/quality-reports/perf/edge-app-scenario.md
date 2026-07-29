# Perf Suite — edge-app-scenario

Threshold source: [docs/quality/perf-thresholds.md](../../quality/perf-thresholds)

## Serial p95 (concurrency = 1)

| op | p95 | cap | gate | regression |
|---|---|---|---|---|
| edge_fetch_workflow (10 invokeEdgeHandler) | 0.46ms | 100ms | PASS | stable (差 0.22ms が下限 0.5ms 未満で判定を保留) — gate 無効 (regressionGate=false) |
| kv_bound_batch (5 invokeEdgeHandler with KV read) | 0.04ms | 100ms | PASS | stable (検知には +0.5ms (baseline 比 +580%) 以上の悪化が必要) — gate 無効 (regressionGate=false) |
| handler_error_handling (5 throw + catch) | 0.04ms | 100ms | PASS | stable (検知には +0.5ms (baseline 比 +1219%) 以上の悪化が必要) — gate 無効 (regressionGate=false) |

## Concurrent p95 (concurrency = 4, 5 iter each)

| op | p95 | cap | gate |
|---|---|---|---|
| edge_fetch_workflow (10 invokeEdgeHandler) | 0.68ms | 200ms | PASS |
| kv_bound_batch (5 invokeEdgeHandler with KV read) | 0.37ms | 200ms | PASS |
| handler_error_handling (5 throw + catch) | 0.17ms | 200ms | PASS |

## Memory retention (20 iter, arrayBuffers axis is the gate; heap is informational)

| op | heapUsed Δ | arrayBuffers Δ | cap | gc exposed | verdict |
|---|---|---|---|---|---|
| edge_fetch_workflow (10 invokeEdgeHandler) | 39304 B | -7313 B | 102400 B | yes | PASS |
| kv_bound_batch (5 invokeEdgeHandler with KV read) | -96568 B | -716 B | 102400 B | yes | PASS |
| handler_error_handling (5 throw + catch) | 712 B | 0 B | 102400 B | yes | PASS |

## Detailed serial reports

### edge_fetch_workflow (10 invokeEdgeHandler)

# Perf Report — edge_fetch_workflow (10 invokeEdgeHandler).serial

| metric | value |
|---|---|
| iterations | 20 |
| warmup | 3 |
| p50 | 0.22ms |
| p95 | 0.46ms |
| p99 | 0.49ms |
| mean | 0.26ms |
| stdev | 0.12ms |
| min | 0.11ms |
| max | 0.50ms |
| total | 5.19ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p50 | 0.22ms | 0.17ms | +0.05ms | +29.08% |
| p95 | 0.46ms | 0.24ms | +0.22ms | +92.74% |
| p99 | 0.49ms | 0.28ms | +0.21ms | +75.60% |
| mean | 0.26ms | 0.17ms | +0.09ms | +53.35% |
| min | 0.11ms | 0.10ms | +0.01ms | +13.02% |
| max | 0.50ms | 0.29ms | +0.21ms | +72.06% |
| total | 5.19ms | 3.38ms | +1.81ms | +53.35% |

### kv_bound_batch (5 invokeEdgeHandler with KV read)

# Perf Report — kv_bound_batch (5 invokeEdgeHandler with KV read).serial

| metric | value |
|---|---|
| iterations | 20 |
| warmup | 3 |
| p50 | 0.03ms |
| p95 | 0.04ms |
| p99 | 0.09ms |
| mean | 0.03ms |
| stdev | 0.02ms |
| min | 0.02ms |
| max | 0.11ms |
| total | 0.61ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p50 | 0.03ms | 0.04ms | -0.01ms | -34.59% |
| p95 | 0.04ms | 0.09ms | -0.05ms | -54.16% |
| p99 | 0.09ms | 0.62ms | -0.52ms | -85.02% |
| mean | 0.03ms | 0.08ms | -0.05ms | -60.58% |
| min | 0.02ms | 0.04ms | -0.01ms | -40.27% |
| max | 0.11ms | 0.75ms | -0.64ms | -85.91% |
| total | 0.61ms | 1.54ms | -0.93ms | -60.58% |

### handler_error_handling (5 throw + catch)

# Perf Report — handler_error_handling (5 throw + catch).serial

| metric | value |
|---|---|
| iterations | 20 |
| warmup | 3 |
| p50 | 0.04ms |
| p95 | 0.04ms |
| p99 | 0.05ms |
| mean | 0.04ms |
| stdev | 0.00ms |
| min | 0.04ms |
| max | 0.05ms |
| total | 0.75ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p50 | 0.04ms | 0.03ms | +0.00ms | +14.91% |
| p95 | 0.04ms | 0.04ms | +0.00ms | +3.27% |
| p99 | 0.05ms | 0.11ms | -0.06ms | -57.00% |
| mean | 0.04ms | 0.04ms | +0.00ms | +1.87% |
| min | 0.04ms | 0.03ms | +0.00ms | +15.13% |
| max | 0.05ms | 0.12ms | -0.08ms | -61.98% |
| total | 0.75ms | 0.74ms | +0.01ms | +1.87% |

