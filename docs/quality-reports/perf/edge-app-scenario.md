# Perf Suite — edge-app-scenario

Threshold source: [docs/quality/perf-thresholds.md](../../quality/perf-thresholds)

測定系の分解能 = 0.00025ms (何もしない関数を同じ経路で呼んだ時の p10)。 回帰判定の絶対下限は既定でこの 2 倍 = 0.00049ms、 op ごとの実効値は下表の「下限」 列。

## Serial (concurrency = 1)

| op | p10 (回帰判定) | p95 (上限判定) | cap | 下限 | gate | regression |
|---|---|---|---|---|---|---|
| edge_fetch_workflow (10 invokeEdgeHandler) | 0.09ms | 0.13ms | 100ms | 0.00049ms | PASS | stable — gate 無効 (regressionGate=false) |
| kv_bound_batch (5 invokeEdgeHandler with KV read) | 0.02ms | 0.03ms | 100ms | 0.00049ms | PASS | stable — gate 無効 (regressionGate=false) |
| handler_error_handling (5 throw + catch) | 0.03ms | 0.03ms | 100ms | 0.00049ms | PASS | stable — gate 無効 (regressionGate=false) |

## Concurrent p95 (concurrency = 4, 5 iter each)

| op | p95 | cap | gate |
|---|---|---|---|
| edge_fetch_workflow (10 invokeEdgeHandler) | 0.44ms | 200ms | PASS |
| kv_bound_batch (5 invokeEdgeHandler with KV read) | 0.09ms | 200ms | PASS |
| handler_error_handling (5 throw + catch) | 0.12ms | 200ms | PASS |

## Memory retention (20 iter, arrayBuffers axis is the gate; heap is informational)

| op | heapUsed Δ | arrayBuffers Δ | cap | gc exposed | verdict |
|---|---|---|---|---|---|
| edge_fetch_workflow (10 invokeEdgeHandler) | 114560 B | 0 B | 102400 B | yes | PASS |
| kv_bound_batch (5 invokeEdgeHandler with KV read) | -91704 B | 0 B | 102400 B | yes | PASS |
| handler_error_handling (5 throw + catch) | -392 B | 0 B | 102400 B | yes | PASS |

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
| mean | 0.11ms |
| stdev | 0.02ms |
| min | 0.09ms |
| max | 0.18ms |
| total | 2.14ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.09ms | 0.09ms | -0.00051ms | -0.55% |
| p50 | 0.10ms | 0.10ms | +0.0020ms | +1.97% |
| p95 | 0.13ms | 0.14ms | -0.0095ms | -6.90% |
| p99 | 0.17ms | 0.15ms | +0.02ms | +14.50% |
| mean | 0.11ms | 0.11ms | +0.0013ms | +1.27% |
| min | 0.09ms | 0.09ms | -0.0023ms | -2.48% |
| max | 0.18ms | 0.15ms | +0.03ms | +19.50% |
| total | 2.14ms | 2.11ms | +0.03ms | +1.27% |

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
| stdev | 0.0033ms |
| min | 0.02ms |
| max | 0.03ms |
| total | 0.44ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.02ms | 0.02ms | -0.0041ms | -17.48% |
| p50 | 0.02ms | 0.02ms | -0.0036ms | -15.00% |
| p95 | 0.03ms | 0.03ms | -0.0018ms | -5.99% |
| p99 | 0.03ms | 0.03ms | -0.0022ms | -6.91% |
| mean | 0.02ms | 0.03ms | -0.0033ms | -13.00% |
| min | 0.02ms | 0.02ms | -0.0028ms | -12.93% |
| max | 0.03ms | 0.03ms | -0.0023ms | -7.11% |
| total | 0.44ms | 0.50ms | -0.07ms | -13.00% |

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
| stdev | 0.0019ms |
| min | 0.03ms |
| max | 0.04ms |
| total | 0.63ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.03ms | 0.03ms | -0.0014ms | -4.61% |
| p50 | 0.03ms | 0.03ms | +0.00048ms | +1.55% |
| p95 | 0.03ms | 0.03ms | +0.0018ms | +5.30% |
| p99 | 0.04ms | 0.04ms | -0.00075ms | -2.09% |
| mean | 0.03ms | 0.03ms | +0.00028ms | +0.89% |
| min | 0.03ms | 0.03ms | -0.0016ms | -5.28% |
| max | 0.04ms | 0.04ms | -0.0014ms | -3.76% |
| total | 0.63ms | 0.62ms | +0.0055ms | +0.89% |

