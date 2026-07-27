# Perf Suite — edge-app-scenario

Threshold source: [docs/quality/perf-thresholds.md](../../quality/perf-thresholds)

## Serial p95 (concurrency = 1)

| op | p95 | cap | gate | regression |
|---|---|---|---|---|
| edge_fetch_workflow (10 invokeEdgeHandler) | 0.14ms | 100ms | PASS | stable |
| kv_bound_batch (5 invokeEdgeHandler with KV read) | 0.03ms | 100ms | PASS | stable |
| handler_error_handling (5 throw + catch) | 0.04ms | 100ms | PASS | stable |

## Concurrent p95 (concurrency = 4, 5 iter each)

| op | p95 | cap | gate |
|---|---|---|---|
| edge_fetch_workflow (10 invokeEdgeHandler) | 0.63ms | 200ms | PASS |
| kv_bound_batch (5 invokeEdgeHandler with KV read) | 0.11ms | 200ms | PASS |
| handler_error_handling (5 throw + catch) | 0.14ms | 200ms | PASS |

## Memory retention (20 iter, arrayBuffers axis is the gate; heap is informational)

| op | heapUsed Δ | arrayBuffers Δ | cap | gc exposed | verdict |
|---|---|---|---|---|---|
| edge_fetch_workflow (10 invokeEdgeHandler) | 94896 B | 18 B | 102400 B | yes | PASS |
| kv_bound_batch (5 invokeEdgeHandler with KV read) | -68192 B | 0 B | 102400 B | yes | PASS |
| handler_error_handling (5 throw + catch) | 1376 B | 0 B | 102400 B | yes | PASS |

## Detailed serial reports

### edge_fetch_workflow (10 invokeEdgeHandler)

# Perf Report — edge_fetch_workflow (10 invokeEdgeHandler).serial

| metric | value |
|---|---|
| iterations | 20 |
| warmup | 3 |
| p50 | 0.11ms |
| p95 | 0.14ms |
| p99 | 0.16ms |
| mean | 0.11ms |
| stdev | 0.02ms |
| min | 0.09ms |
| max | 0.17ms |
| total | 2.18ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p50 | 0.11ms | 0.10ms | +0.00ms | +1.72% |
| p95 | 0.14ms | 0.14ms | +0.00ms | +0.93% |
| p99 | 0.16ms | 0.17ms | -0.00ms | -2.66% |
| mean | 0.11ms | 0.11ms | +0.00ms | +0.26% |
| min | 0.09ms | 0.09ms | +0.00ms | +0.38% |
| max | 0.17ms | 0.17ms | -0.01ms | -3.38% |
| total | 2.18ms | 2.18ms | +0.01ms | +0.26% |

### kv_bound_batch (5 invokeEdgeHandler with KV read)

# Perf Report — kv_bound_batch (5 invokeEdgeHandler with KV read).serial

| metric | value |
|---|---|
| iterations | 20 |
| warmup | 3 |
| p50 | 0.02ms |
| p95 | 0.03ms |
| p99 | 0.03ms |
| mean | 0.03ms |
| stdev | 0.00ms |
| min | 0.02ms |
| max | 0.03ms |
| total | 0.51ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p50 | 0.02ms | 0.03ms | -0.00ms | -12.05% |
| p95 | 0.03ms | 0.04ms | -0.01ms | -18.79% |
| p99 | 0.03ms | 0.10ms | -0.07ms | -67.41% |
| mean | 0.03ms | 0.03ms | -0.01ms | -22.27% |
| min | 0.02ms | 0.03ms | -0.00ms | -8.77% |
| max | 0.03ms | 0.11ms | -0.08ms | -71.40% |
| total | 0.51ms | 0.66ms | -0.15ms | -22.27% |

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
| total | 0.66ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p50 | 0.03ms | 0.03ms | +0.00ms | +5.38% |
| p95 | 0.04ms | 0.07ms | -0.03ms | -47.91% |
| p99 | 0.04ms | 0.13ms | -0.09ms | -70.02% |
| mean | 0.03ms | 0.04ms | -0.01ms | -13.20% |
| min | 0.03ms | 0.03ms | +0.00ms | +7.27% |
| max | 0.04ms | 0.14ms | -0.10ms | -72.79% |
| total | 0.66ms | 0.76ms | -0.10ms | -13.20% |

