# Perf Suite — edge-app-scenario

Threshold source: [docs/quality/perf-thresholds.md](../../quality/perf-thresholds)

測定系の分解能 = 0.00025ms (何もしない関数を同じ経路で呼んだ時の p10)。 回帰判定の絶対下限は既定でこの 2 倍 = 0.00050ms、 op ごとの実効値は下表の「下限」 列。

## Serial (concurrency = 1)

| op | p10 (回帰判定) | p95 (上限判定) | cap | 下限 | gate | regression |
|---|---|---|---|---|---|---|
| edge_fetch_workflow (10 invokeEdgeHandler) | 0.09ms | 0.12ms | 100ms | 0.00050ms | PASS | stable — gate 無効 (regressionGate=false) |
| kv_bound_batch (5 invokeEdgeHandler with KV read) | 0.02ms | 0.03ms | 100ms | 0.00050ms | PASS | stable — gate 無効 (regressionGate=false) |
| handler_error_handling (5 throw + catch) | 0.03ms | 0.04ms | 100ms | 0.00050ms | PASS | stable — gate 無効 (regressionGate=false) |

## Concurrent p95 (concurrency = 4, 5 iter each)

| op | p95 | cap | gate |
|---|---|---|---|
| edge_fetch_workflow (10 invokeEdgeHandler) | 0.40ms | 200ms | PASS |
| kv_bound_batch (5 invokeEdgeHandler with KV read) | 0.10ms | 200ms | PASS |
| handler_error_handling (5 throw + catch) | 0.13ms | 200ms | PASS |

## Memory retention (20 iter, arrayBuffers axis is the gate; heap is informational)

| op | heapUsed Δ | arrayBuffers Δ | cap | gc exposed | verdict |
|---|---|---|---|---|---|
| edge_fetch_workflow (10 invokeEdgeHandler) | 82048 B | 0 B | 102400 B | yes | PASS |
| kv_bound_batch (5 invokeEdgeHandler with KV read) | -92360 B | 0 B | 102400 B | yes | PASS |
| handler_error_handling (5 throw + catch) | 168 B | 0 B | 102400 B | yes | PASS |

## Detailed serial reports

### edge_fetch_workflow (10 invokeEdgeHandler)

# Perf Report — edge_fetch_workflow (10 invokeEdgeHandler).serial

| metric | value |
|---|---|
| iterations | 20 |
| warmup | 3 |
| p10 | 0.09ms |
| p50 | 0.10ms |
| p95 | 0.12ms |
| p99 | 0.14ms |
| mean | 0.10ms |
| stdev | 0.01ms |
| min | 0.09ms |
| max | 0.14ms |
| total | 2.03ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.09ms | 0.09ms | -0.0023ms | -2.46% |
| p50 | 0.10ms | 0.10ms | -0.0018ms | -1.78% |
| p95 | 0.12ms | 0.14ms | -0.02ms | -16.64% |
| p99 | 0.14ms | 0.15ms | -0.0077ms | -5.27% |
| mean | 0.10ms | 0.11ms | -0.0039ms | -3.71% |
| min | 0.09ms | 0.09ms | -0.0010ms | -1.15% |
| max | 0.14ms | 0.15ms | -0.0039ms | -2.62% |
| total | 2.03ms | 2.11ms | -0.08ms | -3.71% |

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
| stdev | 0.0031ms |
| min | 0.02ms |
| max | 0.03ms |
| total | 0.45ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.02ms | 0.02ms | -0.0031ms | -13.42% |
| p50 | 0.02ms | 0.02ms | -0.0034ms | -13.88% |
| p95 | 0.03ms | 0.03ms | -0.0015ms | -5.20% |
| p99 | 0.03ms | 0.03ms | -0.0028ms | -8.83% |
| mean | 0.02ms | 0.03ms | -0.0028ms | -11.25% |
| min | 0.02ms | 0.02ms | -0.0020ms | -9.13% |
| max | 0.03ms | 0.03ms | -0.0032ms | -9.66% |
| total | 0.45ms | 0.50ms | -0.06ms | -11.25% |

### handler_error_handling (5 throw + catch)

# Perf Report — handler_error_handling (5 throw + catch).serial

| metric | value |
|---|---|
| iterations | 20 |
| warmup | 3 |
| p10 | 0.03ms |
| p50 | 0.03ms |
| p95 | 0.04ms |
| p99 | 0.04ms |
| mean | 0.03ms |
| stdev | 0.0027ms |
| min | 0.03ms |
| max | 0.04ms |
| total | 0.64ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.03ms | 0.03ms | -0.00029ms | -0.95% |
| p50 | 0.03ms | 0.03ms | -0.00027ms | -0.88% |
| p95 | 0.04ms | 0.03ms | +0.0040ms | +12.09% |
| p99 | 0.04ms | 0.04ms | +0.0033ms | +9.19% |
| mean | 0.03ms | 0.03ms | +0.00058ms | +1.85% |
| min | 0.03ms | 0.03ms | 0.00ms | 0.00% |
| max | 0.04ms | 0.04ms | +0.0031ms | +8.54% |
| total | 0.64ms | 0.62ms | +0.01ms | +1.85% |

