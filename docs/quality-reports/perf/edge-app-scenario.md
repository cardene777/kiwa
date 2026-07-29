# Perf Suite — edge-app-scenario

Threshold source: [docs/quality/perf-thresholds.md](../../quality/perf-thresholds)

測定系の分解能 = 0.00058ms (何もしない関数を同じ経路で呼んだ時の p10)。 回帰判定の絶対下限は既定でこの 2 倍 = 0.0012ms、 op ごとの実効値は下表の「下限」 列。

## Serial (concurrency = 1)

| op | p10 (回帰判定) | p95 (上限判定) | cap | 下限 | gate | regression |
|---|---|---|---|---|---|---|
| edge_fetch_workflow (10 invokeEdgeHandler) | 0.09ms | 0.16ms | 100ms | 0.0012ms | PASS | stable — gate 無効 (regressionGate=false) |
| kv_bound_batch (5 invokeEdgeHandler with KV read) | 0.03ms | 0.04ms | 100ms | 0.0012ms | PASS | regressed — gate 無効 (regressionGate=false) |
| handler_error_handling (5 throw + catch) | 0.03ms | 0.04ms | 100ms | 0.0012ms | PASS | stable — gate 無効 (regressionGate=false) |

## Concurrent p95 (concurrency = 4, 5 iter each)

| op | p95 | cap | gate |
|---|---|---|---|
| edge_fetch_workflow (10 invokeEdgeHandler) | 0.76ms | 200ms | PASS |
| kv_bound_batch (5 invokeEdgeHandler with KV read) | 0.84ms | 200ms | PASS |
| handler_error_handling (5 throw + catch) | 0.14ms | 200ms | PASS |

## Memory retention (20 iter, arrayBuffers axis is the gate; heap is informational)

| op | heapUsed Δ | arrayBuffers Δ | cap | gc exposed | verdict |
|---|---|---|---|---|---|
| edge_fetch_workflow (10 invokeEdgeHandler) | 75336 B | 792 B | 102400 B | yes | PASS |
| kv_bound_batch (5 invokeEdgeHandler with KV read) | -61576 B | 87 B | 102400 B | yes | PASS |
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
| p95 | 0.16ms |
| p99 | 0.19ms |
| mean | 0.11ms |
| stdev | 0.03ms |
| min | 0.09ms |
| max | 0.20ms |
| total | 2.19ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.09ms | 0.09ms | -0.0025ms | -2.67% |
| p50 | 0.10ms | 0.10ms | +0.0011ms | +1.09% |
| p95 | 0.16ms | 0.14ms | +0.03ms | +18.73% |
| p99 | 0.19ms | 0.15ms | +0.05ms | +31.74% |
| mean | 0.11ms | 0.11ms | +0.0038ms | +3.63% |
| min | 0.09ms | 0.09ms | -0.0020ms | -2.21% |
| max | 0.20ms | 0.15ms | +0.05ms | +34.77% |
| total | 2.19ms | 2.11ms | +0.08ms | +3.63% |

### kv_bound_batch (5 invokeEdgeHandler with KV read)

# Perf Report — kv_bound_batch (5 invokeEdgeHandler with KV read).serial

| metric | value |
|---|---|
| iterations | 20 |
| warmup | 3 |
| p10 | 0.03ms |
| p50 | 0.03ms |
| p95 | 0.04ms |
| p99 | 0.04ms |
| mean | 0.03ms |
| stdev | 0.0020ms |
| min | 0.03ms |
| max | 0.04ms |
| total | 0.65ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.03ms | 0.02ms | +0.0079ms | +33.76% |
| p50 | 0.03ms | 0.02ms | +0.0073ms | +30.16% |
| p95 | 0.04ms | 0.03ms | +0.0070ms | +23.65% |
| p99 | 0.04ms | 0.03ms | +0.0055ms | +17.11% |
| mean | 0.03ms | 0.03ms | +0.0072ms | +28.68% |
| min | 0.03ms | 0.02ms | +0.0091ms | +41.63% |
| max | 0.04ms | 0.03ms | +0.0051ms | +15.63% |
| total | 0.65ms | 0.50ms | +0.14ms | +28.68% |

### handler_error_handling (5 throw + catch)

# Perf Report — handler_error_handling (5 throw + catch).serial

| metric | value |
|---|---|
| iterations | 20 |
| warmup | 3 |
| p10 | 0.03ms |
| p50 | 0.04ms |
| p95 | 0.04ms |
| p99 | 0.04ms |
| mean | 0.04ms |
| stdev | 0.0014ms |
| min | 0.03ms |
| max | 0.04ms |
| total | 0.72ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.03ms | 0.03ms | +0.0041ms | +13.54% |
| p50 | 0.04ms | 0.03ms | +0.0047ms | +15.28% |
| p95 | 0.04ms | 0.03ms | +0.0048ms | +14.44% |
| p99 | 0.04ms | 0.04ms | +0.0033ms | +9.07% |
| mean | 0.04ms | 0.03ms | +0.0046ms | +14.75% |
| min | 0.03ms | 0.03ms | +0.0038ms | +12.78% |
| max | 0.04ms | 0.04ms | +0.0029ms | +7.86% |
| total | 0.72ms | 0.62ms | +0.09ms | +14.75% |

