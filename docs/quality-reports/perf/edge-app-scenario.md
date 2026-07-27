# Perf Suite — edge-app-scenario

Threshold source: [docs/quality/perf-thresholds.md](../../quality/perf-thresholds)

## Serial p95 (concurrency = 1)

| op | p95 | cap | gate | regression |
|---|---|---|---|---|
| edge_fetch_workflow (10 invokeEdgeHandler) | 0.13ms | 100ms | PASS | stable |
| kv_bound_batch (5 invokeEdgeHandler with KV read) | 0.03ms | 100ms | PASS | stable |
| handler_error_handling (5 throw + catch) | 0.03ms | 100ms | PASS | stable |

## Concurrent p95 (concurrency = 4, 5 iter each)

| op | p95 | cap | gate |
|---|---|---|---|
| edge_fetch_workflow (10 invokeEdgeHandler) | 0.40ms | 200ms | PASS |
| kv_bound_batch (5 invokeEdgeHandler with KV read) | 0.09ms | 200ms | PASS |
| handler_error_handling (5 throw + catch) | 0.08ms | 200ms | PASS |

## Memory retention (20 iter, arrayBuffers axis is the gate; heap is informational)

| op | heapUsed Δ | arrayBuffers Δ | cap | verdict |
|---|---|---|---|---|
| edge_fetch_workflow (10 invokeEdgeHandler) | -4273944 B | -25488 B | 102400 B | PASS |
| kv_bound_batch (5 invokeEdgeHandler with KV read) | 1270920 B | 400 B | 102400 B | PASS |
| handler_error_handling (5 throw + catch) | -7538552 B | 0 B | 102400 B | PASS |

## Detailed serial reports

### edge_fetch_workflow (10 invokeEdgeHandler)

# Perf Report — edge_fetch_workflow (10 invokeEdgeHandler).serial

| metric | value |
|---|---|
| iterations | 20 |
| warmup | 3 |
| p50 | 0.10ms |
| p95 | 0.13ms |
| p99 | 0.16ms |
| mean | 0.11ms |
| stdev | 0.02ms |
| min | 0.08ms |
| max | 0.17ms |
| total | 2.11ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p50 | 0.10ms | 0.10ms | +0.01ms | +5.91% |
| p95 | 0.13ms | 0.12ms | +0.01ms | +4.37% |
| p99 | 0.16ms | 0.14ms | +0.02ms | +13.52% |
| mean | 0.11ms | 0.10ms | +0.00ms | +3.59% |
| min | 0.08ms | 0.08ms | +0.00ms | +2.25% |
| max | 0.17ms | 0.14ms | +0.02ms | +15.44% |
| total | 2.11ms | 2.04ms | +0.07ms | +3.59% |

### kv_bound_batch (5 invokeEdgeHandler with KV read)

# Perf Report — kv_bound_batch (5 invokeEdgeHandler with KV read).serial

| metric | value |
|---|---|
| iterations | 20 |
| warmup | 3 |
| p50 | 0.02ms |
| p95 | 0.03ms |
| p99 | 0.03ms |
| mean | 0.02ms |
| stdev | 0.00ms |
| min | 0.02ms |
| max | 0.03ms |
| total | 0.47ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p50 | 0.02ms | 0.02ms | -0.00ms | -1.93% |
| p95 | 0.03ms | 0.03ms | +0.00ms | +7.84% |
| p99 | 0.03ms | 0.03ms | -0.00ms | -11.74% |
| mean | 0.02ms | 0.02ms | +0.00ms | +2.29% |
| min | 0.02ms | 0.02ms | +0.00ms | +0.92% |
| max | 0.03ms | 0.04ms | -0.01ms | -15.40% |
| total | 0.47ms | 0.46ms | +0.01ms | +2.29% |

### handler_error_handling (5 throw + catch)

# Perf Report — handler_error_handling (5 throw + catch).serial

| metric | value |
|---|---|
| iterations | 20 |
| warmup | 3 |
| p50 | 0.02ms |
| p95 | 0.03ms |
| p99 | 0.05ms |
| mean | 0.02ms |
| stdev | 0.01ms |
| min | 0.02ms |
| max | 0.05ms |
| total | 0.45ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p50 | 0.02ms | 0.02ms | -0.00ms | -15.11% |
| p95 | 0.03ms | 0.05ms | -0.02ms | -36.34% |
| p99 | 0.05ms | 0.23ms | -0.18ms | -78.78% |
| mean | 0.02ms | 0.04ms | -0.01ms | -38.45% |
| min | 0.02ms | 0.02ms | -0.00ms | -7.45% |
| max | 0.05ms | 0.28ms | -0.23ms | -80.72% |
| total | 0.45ms | 0.73ms | -0.28ms | -38.45% |

