# Perf Suite — edge-app-scenario

Threshold source: [docs/quality/perf-thresholds.md](../../quality/perf-thresholds)

測定系の分解能 = 0.00025ms (何もしない関数を同じ経路で呼んだ時の p10)。 回帰判定の絶対下限は既定でこの 2 倍 = 0.00050ms、 op ごとの実効値は下表の「下限」 列。

## Serial (concurrency = 1)

| op | p10 (回帰判定) | p95 (上限判定) | cap | 下限 | gate | regression |
|---|---|---|---|---|---|---|
| edge_fetch_workflow (10 invokeEdgeHandler) | 0.10ms | 0.14ms | 100ms | 0.00050ms | PASS | stable — gate 無効 (regressionGate=false) |
| kv_bound_batch (5 invokeEdgeHandler with KV read) | 0.03ms | 0.04ms | 100ms | 0.00050ms | PASS | regressed — gate 無効 (regressionGate=false) |
| handler_error_handling (5 throw + catch) | 0.04ms | 0.04ms | 100ms | 0.00050ms | PASS | stable (p10 +17% (閾値未満)、 p95 +27% (裾は実行間の振れ幅と区別できないため判定には使わない)) — gate 無効 (regressionGate=false) |

## Concurrent p95 (concurrency = 4, 5 iter each)

| op | p95 | cap | gate |
|---|---|---|---|
| edge_fetch_workflow (10 invokeEdgeHandler) | 0.45ms | 200ms | PASS |
| kv_bound_batch (5 invokeEdgeHandler with KV read) | 0.10ms | 200ms | PASS |
| handler_error_handling (5 throw + catch) | 0.16ms | 200ms | PASS |

## Memory retention (20 iter, arrayBuffers axis is the gate; heap is informational)

| op | heapUsed Δ | arrayBuffers Δ | cap | gc exposed | verdict |
|---|---|---|---|---|---|
| edge_fetch_workflow (10 invokeEdgeHandler) | 23760 B | -10393 B | 102400 B | yes | PASS |
| kv_bound_batch (5 invokeEdgeHandler with KV read) | -91480 B | 120 B | 102400 B | yes | PASS |
| handler_error_handling (5 throw + catch) | 168 B | 0 B | 102400 B | yes | PASS |

## Detailed serial reports

### edge_fetch_workflow (10 invokeEdgeHandler)

# Perf Report — edge_fetch_workflow (10 invokeEdgeHandler).serial

| metric | value |
|---|---|
| iterations | 20 |
| warmup | 3 |
| p10 | 0.10ms |
| p50 | 0.12ms |
| p95 | 0.14ms |
| p99 | 0.18ms |
| mean | 0.12ms |
| stdev | 0.02ms |
| min | 0.09ms |
| max | 0.19ms |
| total | 2.37ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.10ms | 0.09ms | +0.0058ms | +6.27% |
| p50 | 0.12ms | 0.10ms | +0.02ms | +15.85% |
| p95 | 0.14ms | 0.14ms | -0.00030ms | -0.22% |
| p99 | 0.18ms | 0.15ms | +0.04ms | +25.73% |
| mean | 0.12ms | 0.11ms | +0.01ms | +12.25% |
| min | 0.09ms | 0.09ms | +0.0043ms | +4.73% |
| max | 0.19ms | 0.15ms | +0.05ms | +31.78% |
| total | 2.37ms | 2.11ms | +0.26ms | +12.25% |

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
| stdev | 0.0023ms |
| min | 0.03ms |
| max | 0.04ms |
| total | 0.60ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.03ms | 0.02ms | +0.0054ms | +23.10% |
| p50 | 0.03ms | 0.02ms | +0.0049ms | +20.31% |
| p95 | 0.04ms | 0.03ms | +0.0055ms | +18.48% |
| p99 | 0.04ms | 0.03ms | +0.0034ms | +10.67% |
| mean | 0.03ms | 0.03ms | +0.0048ms | +19.06% |
| min | 0.03ms | 0.02ms | +0.0050ms | +22.81% |
| max | 0.04ms | 0.03ms | +0.0029ms | +8.90% |
| total | 0.60ms | 0.50ms | +0.10ms | +19.06% |

### handler_error_handling (5 throw + catch)

# Perf Report — handler_error_handling (5 throw + catch).serial

| metric | value |
|---|---|
| iterations | 20 |
| warmup | 3 |
| p10 | 0.04ms |
| p50 | 0.04ms |
| p95 | 0.04ms |
| p99 | 0.05ms |
| mean | 0.04ms |
| stdev | 0.0035ms |
| min | 0.03ms |
| max | 0.05ms |
| total | 0.75ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.04ms | 0.03ms | +0.0053ms | +17.34% |
| p50 | 0.04ms | 0.03ms | +0.0057ms | +18.53% |
| p95 | 0.04ms | 0.03ms | +0.0091ms | +27.49% |
| p99 | 0.05ms | 0.04ms | +0.01ms | +32.66% |
| mean | 0.04ms | 0.03ms | +0.0061ms | +19.55% |
| min | 0.03ms | 0.03ms | +0.0015ms | +5.14% |
| max | 0.05ms | 0.04ms | +0.01ms | +33.82% |
| total | 0.75ms | 0.62ms | +0.12ms | +19.55% |

