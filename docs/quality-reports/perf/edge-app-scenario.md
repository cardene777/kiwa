# Perf Suite — edge-app-scenario

Threshold source: [docs/quality/perf-thresholds.md](../../quality/perf-thresholds)

## Serial p95 (concurrency = 1)

| op | p95 | cap | gate | regression |
|---|---|---|---|---|
| edge_fetch_workflow (10 invokeEdgeHandler) | 0.39ms | 100ms | PASS | stable (検知には +0.5ms (baseline 比 +208%) 以上の悪化が必要) |
| kv_bound_batch (5 invokeEdgeHandler with KV read) | 0.05ms | 100ms | PASS | stable (差 0.04ms が下限 0.5ms 未満で判定を保留) |
| handler_error_handling (5 throw + catch) | 0.04ms | 100ms | PASS | stable (検知には +0.5ms (baseline 比 +1219%) 以上の悪化が必要) |

## Concurrent p95 (concurrency = 4, 5 iter each)

| op | p95 | cap | gate |
|---|---|---|---|
| edge_fetch_workflow (10 invokeEdgeHandler) | 0.82ms | 200ms | PASS |
| kv_bound_batch (5 invokeEdgeHandler with KV read) | 0.14ms | 200ms | PASS |
| handler_error_handling (5 throw + catch) | 0.14ms | 200ms | PASS |

## Memory retention (20 iter, arrayBuffers axis is the gate; heap is informational)

| op | heapUsed Δ | arrayBuffers Δ | cap | gc exposed | verdict |
|---|---|---|---|---|---|
| edge_fetch_workflow (10 invokeEdgeHandler) | 62872 B | 3402 B | 102400 B | yes | PASS |
| kv_bound_batch (5 invokeEdgeHandler with KV read) | -616 B | 0 B | 102400 B | yes | PASS |
| handler_error_handling (5 throw + catch) | 712 B | 0 B | 102400 B | yes | PASS |

## Detailed serial reports

### edge_fetch_workflow (10 invokeEdgeHandler)

# Perf Report — edge_fetch_workflow (10 invokeEdgeHandler).serial

| metric | value |
|---|---|
| iterations | 20 |
| warmup | 3 |
| p50 | 0.11ms |
| p95 | 0.39ms |
| p99 | 0.43ms |
| mean | 0.16ms |
| stdev | 0.11ms |
| min | 0.09ms |
| max | 0.44ms |
| total | 3.23ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p50 | 0.11ms | 0.17ms | -0.06ms | -32.53% |
| p95 | 0.39ms | 0.24ms | +0.15ms | +62.32% |
| p99 | 0.43ms | 0.28ms | +0.15ms | +52.61% |
| mean | 0.16ms | 0.17ms | -0.01ms | -4.49% |
| min | 0.09ms | 0.10ms | -0.01ms | -6.72% |
| max | 0.44ms | 0.29ms | +0.15ms | +50.61% |
| total | 3.23ms | 3.38ms | -0.15ms | -4.49% |

### kv_bound_batch (5 invokeEdgeHandler with KV read)

# Perf Report — kv_bound_batch (5 invokeEdgeHandler with KV read).serial

| metric | value |
|---|---|
| iterations | 20 |
| warmup | 3 |
| p50 | 0.04ms |
| p95 | 0.05ms |
| p99 | 0.05ms |
| mean | 0.04ms |
| stdev | 0.00ms |
| min | 0.04ms |
| max | 0.05ms |
| total | 0.83ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p50 | 0.04ms | 0.04ms | +0.00ms | +0.21% |
| p95 | 0.05ms | 0.09ms | -0.04ms | -47.56% |
| p99 | 0.05ms | 0.62ms | -0.57ms | -92.59% |
| mean | 0.04ms | 0.08ms | -0.04ms | -46.36% |
| min | 0.04ms | 0.04ms | +0.00ms | +7.40% |
| max | 0.05ms | 0.75ms | -0.70ms | -93.89% |
| total | 0.83ms | 1.54ms | -0.71ms | -46.36% |

### handler_error_handling (5 throw + catch)

# Perf Report — handler_error_handling (5 throw + catch).serial

| metric | value |
|---|---|
| iterations | 20 |
| warmup | 3 |
| p50 | 0.03ms |
| p95 | 0.04ms |
| p99 | 0.04ms |
| mean | 0.03ms |
| stdev | 0.00ms |
| min | 0.03ms |
| max | 0.04ms |
| total | 0.69ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p50 | 0.03ms | 0.03ms | +0.00ms | +4.60% |
| p95 | 0.04ms | 0.04ms | -0.00ms | -5.96% |
| p99 | 0.04ms | 0.11ms | -0.07ms | -62.82% |
| mean | 0.03ms | 0.04ms | -0.00ms | -6.90% |
| min | 0.03ms | 0.03ms | +0.00ms | +2.95% |
| max | 0.04ms | 0.12ms | -0.08ms | -67.53% |
| total | 0.69ms | 0.74ms | -0.05ms | -6.90% |

