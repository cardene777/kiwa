# Perf Suite — edge-app-scenario

Threshold source: [docs/quality/perf-thresholds.md](../../quality/perf-thresholds)

測定系の分解能 = 0.00021ms (何もしない関数を同じ経路で呼んだ時の p10)。 回帰判定の絶対下限は既定でこの 2 倍 = 0.00042ms、 op ごとの実効値は下表の「下限」 列。

## Serial (concurrency = 1)

| op | p10 (回帰判定) | p95 (上限判定) | cap | 下限 | gate | regression |
|---|---|---|---|---|---|---|
| edge_fetch_workflow (10 invokeEdgeHandler) | 0.09ms | 0.13ms | 100ms | 0.00042ms | PASS | stable — gate 無効 (regressionGate=false) |
| kv_bound_batch (5 invokeEdgeHandler with KV read) | 0.02ms | 0.03ms | 100ms | 0.00042ms | PASS | stable — gate 無効 (regressionGate=false) |
| handler_error_handling (5 throw + catch) | 0.03ms | 0.03ms | 100ms | 0.00042ms | PASS | stable — gate 無効 (regressionGate=false) |

## Concurrent p95 (concurrency = 4, 5 iter each)

| op | p95 | cap | gate |
|---|---|---|---|
| edge_fetch_workflow (10 invokeEdgeHandler) | 0.41ms | 200ms | PASS |
| kv_bound_batch (5 invokeEdgeHandler with KV read) | 0.09ms | 200ms | PASS |
| handler_error_handling (5 throw + catch) | 0.13ms | 200ms | PASS |

## Memory retention (20 iter, arrayBuffers axis is the gate; heap is informational)

| op | heapUsed Δ | arrayBuffers Δ | cap | gc exposed | verdict |
|---|---|---|---|---|---|
| edge_fetch_workflow (10 invokeEdgeHandler) | 112384 B | 0 B | 102400 B | yes | PASS |
| kv_bound_batch (5 invokeEdgeHandler with KV read) | -91928 B | 0 B | 102400 B | yes | PASS |
| handler_error_handling (5 throw + catch) | -312 B | 0 B | 102400 B | yes | PASS |

## Detailed serial reports

### edge_fetch_workflow (10 invokeEdgeHandler)

# Perf Report — edge_fetch_workflow (10 invokeEdgeHandler).serial

| metric | value |
|---|---|
| iterations | 20 |
| warmup | 3 |
| p10 | 0.09ms |
| p50 | 0.10ms |
| p95 | 0.13ms |
| p99 | 0.17ms |
| mean | 0.10ms |
| stdev | 0.02ms |
| min | 0.08ms |
| max | 0.18ms |
| total | 2.07ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.09ms | 0.09ms | -0.0060ms | -6.49% |
| p50 | 0.10ms | 0.10ms | -0.0028ms | -2.80% |
| p95 | 0.13ms | 0.14ms | -0.0093ms | -6.76% |
| p99 | 0.17ms | 0.15ms | +0.02ms | +15.83% |
| mean | 0.10ms | 0.11ms | -0.0019ms | -1.82% |
| min | 0.08ms | 0.09ms | -0.0058ms | -6.39% |
| max | 0.18ms | 0.15ms | +0.03ms | +21.10% |
| total | 2.07ms | 2.11ms | -0.04ms | -1.82% |

### kv_bound_batch (5 invokeEdgeHandler with KV read)

# Perf Report — kv_bound_batch (5 invokeEdgeHandler with KV read).serial

| metric | value |
|---|---|
| iterations | 20 |
| warmup | 3 |
| p10 | 0.02ms |
| p50 | 0.02ms |
| p95 | 0.03ms |
| p99 | 0.03ms |
| mean | 0.02ms |
| stdev | 0.0029ms |
| min | 0.02ms |
| max | 0.03ms |
| total | 0.46ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.02ms | 0.02ms | -0.0032ms | -13.56% |
| p50 | 0.02ms | 0.02ms | -0.0024ms | -9.77% |
| p95 | 0.03ms | 0.03ms | -0.0024ms | -8.11% |
| p99 | 0.03ms | 0.03ms | -0.0048ms | -14.96% |
| mean | 0.02ms | 0.03ms | -0.0021ms | -8.19% |
| min | 0.02ms | 0.02ms | -0.0020ms | -9.13% |
| max | 0.03ms | 0.03ms | -0.0054ms | -16.52% |
| total | 0.46ms | 0.50ms | -0.04ms | -8.19% |

### handler_error_handling (5 throw + catch)

# Perf Report — handler_error_handling (5 throw + catch).serial

| metric | value |
|---|---|
| iterations | 20 |
| warmup | 3 |
| p10 | 0.03ms |
| p50 | 0.03ms |
| p95 | 0.03ms |
| p99 | 0.03ms |
| mean | 0.03ms |
| stdev | 0.00097ms |
| min | 0.03ms |
| max | 0.03ms |
| total | 0.61ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.03ms | 0.03ms | -0.00075ms | -2.46% |
| p50 | 0.03ms | 0.03ms | -0.00060ms | -1.96% |
| p95 | 0.03ms | 0.03ms | -0.0015ms | -4.40% |
| p99 | 0.03ms | 0.04ms | -0.0027ms | -7.41% |
| mean | 0.03ms | 0.03ms | -0.00076ms | -2.44% |
| min | 0.03ms | 0.03ms | -0.00042ms | -1.39% |
| max | 0.03ms | 0.04ms | -0.0030ms | -8.09% |
| total | 0.61ms | 0.62ms | -0.02ms | -2.44% |

