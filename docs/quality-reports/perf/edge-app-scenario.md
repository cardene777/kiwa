# Perf Suite — edge-app-scenario

Threshold source: [docs/quality/perf-thresholds.md](../../quality/perf-thresholds)

## Serial p95 (concurrency = 1)

| op | p95 | cap | gate | regression |
|---|---|---|---|---|
| edge_fetch_workflow (10 invokeEdgeHandler) | 0.13ms | 100ms | PASS | stable |
| kv_bound_batch (5 invokeEdgeHandler with KV read) | 0.03ms | 100ms | PASS | stable |
| handler_error_handling (5 throw + catch) | 0.04ms | 100ms | PASS | stable |

## Concurrent p95 (concurrency = 4, 5 iter each)

| op | p95 | cap | gate |
|---|---|---|---|
| edge_fetch_workflow (10 invokeEdgeHandler) | 0.39ms | 200ms | PASS |
| kv_bound_batch (5 invokeEdgeHandler with KV read) | 0.14ms | 200ms | PASS |
| handler_error_handling (5 throw + catch) | 0.15ms | 200ms | PASS |

## Memory retention (20 iter, arrayBuffers axis is the gate; heap is informational)

| op | heapUsed Δ | arrayBuffers Δ | cap | gc exposed | verdict |
|---|---|---|---|---|---|
| edge_fetch_workflow (10 invokeEdgeHandler) | 81960 B | -10462 B | 102400 B | yes | PASS |
| kv_bound_batch (5 invokeEdgeHandler with KV read) | -71464 B | 0 B | 102400 B | yes | PASS |
| handler_error_handling (5 throw + catch) | 608 B | 0 B | 102400 B | yes | PASS |

## Detailed serial reports

### edge_fetch_workflow (10 invokeEdgeHandler)

# Perf Report — edge_fetch_workflow (10 invokeEdgeHandler).serial

| metric | value |
|---|---|
| iterations | 20 |
| warmup | 3 |
| p50 | 0.11ms |
| p95 | 0.13ms |
| p99 | 0.16ms |
| mean | 0.11ms |
| stdev | 0.02ms |
| min | 0.09ms |
| max | 0.17ms |
| total | 2.14ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p50 | 0.11ms | 0.10ms | +0.00ms | +1.30% |
| p95 | 0.13ms | 0.14ms | -0.01ms | -6.37% |
| p99 | 0.16ms | 0.17ms | -0.01ms | -4.63% |
| mean | 0.11ms | 0.11ms | -0.00ms | -1.53% |
| min | 0.09ms | 0.09ms | +0.00ms | +3.85% |
| max | 0.17ms | 0.17ms | -0.01ms | -4.28% |
| total | 2.14ms | 2.18ms | -0.03ms | -1.53% |

### kv_bound_batch (5 invokeEdgeHandler with KV read)

# Perf Report — kv_bound_batch (5 invokeEdgeHandler with KV read).serial

| metric | value |
|---|---|
| iterations | 20 |
| warmup | 3 |
| p50 | 0.03ms |
| p95 | 0.03ms |
| p99 | 0.04ms |
| mean | 0.03ms |
| stdev | 0.00ms |
| min | 0.03ms |
| max | 0.04ms |
| total | 0.63ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p50 | 0.03ms | 0.03ms | +0.00ms | +9.62% |
| p95 | 0.03ms | 0.04ms | -0.00ms | -8.32% |
| p99 | 0.04ms | 0.10ms | -0.06ms | -63.92% |
| mean | 0.03ms | 0.03ms | -0.00ms | -5.00% |
| min | 0.03ms | 0.03ms | +0.00ms | +11.00% |
| max | 0.04ms | 0.11ms | -0.08ms | -68.48% |
| total | 0.63ms | 0.66ms | -0.03ms | -5.00% |

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
| total | 0.65ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p50 | 0.03ms | 0.03ms | +0.00ms | +5.93% |
| p95 | 0.04ms | 0.07ms | -0.03ms | -48.38% |
| p99 | 0.04ms | 0.13ms | -0.09ms | -68.20% |
| mean | 0.03ms | 0.04ms | -0.01ms | -14.24% |
| min | 0.03ms | 0.03ms | +0.00ms | +2.14% |
| max | 0.04ms | 0.14ms | -0.10ms | -70.68% |
| total | 0.65ms | 0.76ms | -0.11ms | -14.24% |

