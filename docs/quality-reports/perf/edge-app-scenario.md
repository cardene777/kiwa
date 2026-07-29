# Perf Suite — edge-app-scenario

Threshold source: [docs/quality/perf-thresholds.md](../../quality/perf-thresholds)

測定系の分解能 = 0.00025ms (何もしない関数を同じ経路で呼んだ時の p10)。 回帰判定の絶対下限は既定でこの 2 倍 = 0.00050ms、 op ごとの実効値は下表の「下限」 列。

## Serial (concurrency = 1)

| op | p10 (回帰判定) | p95 (上限判定) | cap | 下限 | gate | regression |
|---|---|---|---|---|---|---|
| edge_fetch_workflow (10 invokeEdgeHandler) | 0.09ms | 0.14ms | 100ms | 0.00050ms | PASS | stable — gate 無効 (regressionGate=false) |
| kv_bound_batch (5 invokeEdgeHandler with KV read) | 0.03ms | 0.03ms | 100ms | 0.00050ms | PASS | stable — gate 無効 (regressionGate=false) |
| handler_error_handling (5 throw + catch) | 0.03ms | 0.03ms | 100ms | 0.00050ms | PASS | stable — gate 無効 (regressionGate=false) |

## Concurrent p95 (concurrency = 4, 5 iter each)

| op | p95 | cap | gate |
|---|---|---|---|
| edge_fetch_workflow (10 invokeEdgeHandler) | 0.50ms | 200ms | PASS |
| kv_bound_batch (5 invokeEdgeHandler with KV read) | 0.50ms | 200ms | PASS |
| handler_error_handling (5 throw + catch) | 0.13ms | 200ms | PASS |

## Memory retention (20 iter, arrayBuffers axis is the gate; heap is informational)

| op | heapUsed Δ | arrayBuffers Δ | cap | gc exposed | verdict |
|---|---|---|---|---|---|
| edge_fetch_workflow (10 invokeEdgeHandler) | 101688 B | 0 B | 102400 B | yes | PASS |
| kv_bound_batch (5 invokeEdgeHandler with KV read) | -91184 B | 0 B | 102400 B | yes | PASS |
| handler_error_handling (5 throw + catch) | 712 B | 0 B | 102400 B | yes | PASS |

## Detailed serial reports

### edge_fetch_workflow (10 invokeEdgeHandler)

# Perf Report — edge_fetch_workflow (10 invokeEdgeHandler).serial

| metric | value |
|---|---|
| iterations | 20 |
| warmup | 3 |
| p10 | 0.09ms |
| p50 | 0.11ms |
| p95 | 0.14ms |
| p99 | 0.15ms |
| mean | 0.11ms |
| stdev | 0.02ms |
| min | 0.09ms |
| max | 0.16ms |
| total | 2.21ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.09ms | 0.09ms | -0.0014ms | -1.55% |
| p50 | 0.11ms | 0.10ms | +0.01ms | +12.80% |
| p95 | 0.14ms | 0.14ms | +0.0049ms | +3.57% |
| p99 | 0.15ms | 0.15ms | +0.0070ms | +4.76% |
| mean | 0.11ms | 0.11ms | +0.0048ms | +4.52% |
| min | 0.09ms | 0.09ms | -0.00071ms | -0.78% |
| max | 0.16ms | 0.15ms | +0.0075ms | +5.04% |
| total | 2.21ms | 2.11ms | +0.10ms | +4.52% |

### kv_bound_batch (5 invokeEdgeHandler with KV read)

# Perf Report — kv_bound_batch (5 invokeEdgeHandler with KV read).serial

| metric | value |
|---|---|
| iterations | 20 |
| warmup | 3 |
| p10 | 0.03ms |
| p50 | 0.03ms |
| p95 | 0.03ms |
| p99 | 0.03ms |
| mean | 0.03ms |
| stdev | 0.0023ms |
| min | 0.02ms |
| max | 0.03ms |
| total | 0.55ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.03ms | 0.02ms | +0.0019ms | +7.97% |
| p50 | 0.03ms | 0.02ms | +0.0026ms | +10.63% |
| p95 | 0.03ms | 0.03ms | +0.0024ms | +8.17% |
| p99 | 0.03ms | 0.03ms | +0.0013ms | +4.10% |
| mean | 0.03ms | 0.03ms | +0.0021ms | +8.26% |
| min | 0.02ms | 0.02ms | +0.0022ms | +9.88% |
| max | 0.03ms | 0.03ms | +0.0010ms | +3.18% |
| total | 0.55ms | 0.50ms | +0.04ms | +8.26% |

### handler_error_handling (5 throw + catch)

# Perf Report — handler_error_handling (5 throw + catch).serial

| metric | value |
|---|---|
| iterations | 20 |
| warmup | 3 |
| p10 | 0.03ms |
| p50 | 0.03ms |
| p95 | 0.03ms |
| p99 | 0.04ms |
| mean | 0.03ms |
| stdev | 0.0015ms |
| min | 0.03ms |
| max | 0.04ms |
| total | 0.61ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.03ms | 0.03ms | -0.00057ms | -1.89% |
| p50 | 0.03ms | 0.03ms | -0.00058ms | -1.89% |
| p95 | 0.03ms | 0.03ms | +0.00015ms | +0.45% |
| p99 | 0.04ms | 0.04ms | -0.00014ms | -0.38% |
| mean | 0.03ms | 0.03ms | -0.00056ms | -1.78% |
| min | 0.03ms | 0.03ms | -0.00021ms | -0.70% |
| max | 0.04ms | 0.04ms | -0.00021ms | -0.57% |
| total | 0.61ms | 0.62ms | -0.01ms | -1.78% |

