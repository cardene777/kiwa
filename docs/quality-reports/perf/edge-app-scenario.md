# Perf Suite — edge-app-scenario

Threshold source: [docs/quality/perf-thresholds.md](../../quality/perf-thresholds)

## Serial p95 (concurrency = 1)

| op | p95 | cap | gate | regression |
|---|---|---|---|---|
| edge_fetch_workflow (10 invokeEdgeHandler) | 0.18ms | 100ms | PASS | stable |
| kv_bound_batch (5 invokeEdgeHandler with KV read) | 0.04ms | 100ms | PASS | stable |
| handler_error_handling (5 throw + catch) | 0.04ms | 100ms | PASS | stable |

## Concurrent p95 (concurrency = 4, 5 iter each)

| op | p95 | cap | gate |
|---|---|---|---|
| edge_fetch_workflow (10 invokeEdgeHandler) | 0.62ms | 200ms | PASS |
| kv_bound_batch (5 invokeEdgeHandler with KV read) | 0.13ms | 200ms | PASS |
| handler_error_handling (5 throw + catch) | 0.14ms | 200ms | PASS |

## Memory retention (20 iter, arrayBuffers axis is the gate; heap is informational)

| op | heapUsed Δ | arrayBuffers Δ | cap | gc exposed | verdict |
|---|---|---|---|---|---|
| edge_fetch_workflow (10 invokeEdgeHandler) | 116632 B | 18 B | 102400 B | yes | PASS |
| kv_bound_batch (5 invokeEdgeHandler with KV read) | -72072 B | 0 B | 102400 B | yes | PASS |
| handler_error_handling (5 throw + catch) | 912 B | 0 B | 102400 B | yes | PASS |

## Detailed serial reports

### edge_fetch_workflow (10 invokeEdgeHandler)

# Perf Report — edge_fetch_workflow (10 invokeEdgeHandler).serial

| metric | value |
|---|---|
| iterations | 20 |
| warmup | 3 |
| p50 | 0.10ms |
| p95 | 0.18ms |
| p99 | 0.20ms |
| mean | 0.12ms |
| stdev | 0.03ms |
| min | 0.09ms |
| max | 0.20ms |
| total | 2.36ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p50 | 0.10ms | 0.10ms | +0.00ms | +0.28% |
| p95 | 0.18ms | 0.14ms | +0.05ms | +33.70% |
| p99 | 0.20ms | 0.17ms | +0.03ms | +19.30% |
| mean | 0.12ms | 0.11ms | +0.01ms | +8.55% |
| min | 0.09ms | 0.09ms | +0.00ms | +1.19% |
| max | 0.20ms | 0.17ms | +0.03ms | +16.41% |
| total | 2.36ms | 2.18ms | +0.19ms | +8.55% |

### kv_bound_batch (5 invokeEdgeHandler with KV read)

# Perf Report — kv_bound_batch (5 invokeEdgeHandler with KV read).serial

| metric | value |
|---|---|
| iterations | 20 |
| warmup | 3 |
| p50 | 0.03ms |
| p95 | 0.04ms |
| p99 | 0.11ms |
| mean | 0.04ms |
| stdev | 0.02ms |
| min | 0.03ms |
| max | 0.13ms |
| total | 0.72ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p50 | 0.03ms | 0.03ms | +0.00ms | +8.58% |
| p95 | 0.04ms | 0.04ms | +0.00ms | +7.18% |
| p99 | 0.11ms | 0.10ms | +0.01ms | +12.08% |
| mean | 0.04ms | 0.03ms | +0.00ms | +9.67% |
| min | 0.03ms | 0.03ms | -0.00ms | -1.12% |
| max | 0.13ms | 0.11ms | +0.01ms | +12.48% |
| total | 0.72ms | 0.66ms | +0.06ms | +9.67% |

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
| p50 | 0.03ms | 0.03ms | +0.00ms | +11.93% |
| p95 | 0.04ms | 0.07ms | -0.03ms | -48.07% |
| p99 | 0.04ms | 0.13ms | -0.09ms | -68.46% |
| mean | 0.03ms | 0.04ms | -0.00ms | -9.38% |
| min | 0.03ms | 0.03ms | +0.00ms | +11.27% |
| max | 0.04ms | 0.14ms | -0.10ms | -71.01% |
| total | 0.69ms | 0.76ms | -0.07ms | -9.38% |

