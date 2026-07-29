# Perf Suite — edge-app-scenario

Threshold source: [docs/quality/perf-thresholds.md](../../quality/perf-thresholds)

測定系の分解能 = 0.00025ms (何もしない関数を同じ経路で呼んだ時の p10)。 回帰判定の絶対下限は既定でこの 2 倍 = 0.00050ms、 op ごとの実効値は下表の「下限」 列。

## Serial (concurrency = 1)

| op | p10 (回帰判定) | p95 (上限判定) | cap | 下限 | gate | regression |
|---|---|---|---|---|---|---|
| edge_fetch_workflow (10 invokeEdgeHandler) | 0.09ms | 0.12ms | 100ms | 0.00050ms | PASS | stable — gate 無効 (regressionGate=false) |
| kv_bound_batch (5 invokeEdgeHandler with KV read) | 0.02ms | 0.03ms | 100ms | 0.00050ms | PASS | stable — gate 無効 (regressionGate=false) |
| handler_error_handling (5 throw + catch) | 0.03ms | 0.03ms | 100ms | 0.00050ms | PASS | stable — gate 無効 (regressionGate=false) |

## Concurrent p95 (concurrency = 4, 5 iter each)

| op | p95 | cap | gate |
|---|---|---|---|
| edge_fetch_workflow (10 invokeEdgeHandler) | 0.40ms | 200ms | PASS |
| kv_bound_batch (5 invokeEdgeHandler with KV read) | 0.12ms | 200ms | PASS |
| handler_error_handling (5 throw + catch) | 0.13ms | 200ms | PASS |

## Memory retention (20 iter, arrayBuffers axis is the gate; heap is informational)

| op | heapUsed Δ | arrayBuffers Δ | cap | gc exposed | verdict |
|---|---|---|---|---|---|
| edge_fetch_workflow (10 invokeEdgeHandler) | 123832 B | 0 B | 102400 B | yes | PASS |
| kv_bound_batch (5 invokeEdgeHandler with KV read) | 388280 B | 47 B | 102400 B | yes | PASS |
| handler_error_handling (5 throw + catch) | 632 B | 0 B | 102400 B | yes | PASS |

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
| p99 | 0.15ms |
| mean | 0.10ms |
| stdev | 0.02ms |
| min | 0.09ms |
| max | 0.16ms |
| total | 2.08ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.09ms | 0.09ms | -0.0039ms | -4.24% |
| p50 | 0.10ms | 0.10ms | -0.00083ms | -0.84% |
| p95 | 0.12ms | 0.14ms | -0.02ms | -12.05% |
| p99 | 0.15ms | 0.15ms | +0.0054ms | +3.73% |
| mean | 0.10ms | 0.11ms | -0.0016ms | -1.52% |
| min | 0.09ms | 0.09ms | -0.0051ms | -5.65% |
| max | 0.16ms | 0.15ms | +0.01ms | +7.41% |
| total | 2.08ms | 2.11ms | -0.03ms | -1.52% |

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
| stdev | 0.0020ms |
| min | 0.02ms |
| max | 0.03ms |
| total | 0.47ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.02ms | 0.02ms | -0.0011ms | -4.57% |
| p50 | 0.02ms | 0.02ms | -0.0013ms | -5.31% |
| p95 | 0.03ms | 0.03ms | -0.0014ms | -4.65% |
| p99 | 0.03ms | 0.03ms | -0.0027ms | -8.52% |
| mean | 0.02ms | 0.03ms | -0.0015ms | -5.88% |
| min | 0.02ms | 0.02ms | +0.000042ms | +0.19% |
| max | 0.03ms | 0.03ms | -0.0031ms | -9.40% |
| total | 0.47ms | 0.50ms | -0.03ms | -5.88% |

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
| stdev | 0.0015ms |
| min | 0.03ms |
| max | 0.03ms |
| total | 0.59ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.03ms | 0.03ms | -0.0017ms | -5.50% |
| p50 | 0.03ms | 0.03ms | -0.0015ms | -4.80% |
| p95 | 0.03ms | 0.03ms | -0.00053ms | -1.59% |
| p99 | 0.03ms | 0.04ms | -0.0016ms | -4.38% |
| mean | 0.03ms | 0.03ms | -0.0016ms | -5.07% |
| min | 0.03ms | 0.03ms | -0.0016ms | -5.42% |
| max | 0.03ms | 0.04ms | -0.0018ms | -5.01% |
| total | 0.59ms | 0.62ms | -0.03ms | -5.07% |

