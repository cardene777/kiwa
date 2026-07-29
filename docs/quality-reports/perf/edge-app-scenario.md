# Perf Suite — edge-app-scenario

Threshold source: [docs/quality/perf-thresholds.md](../../quality/perf-thresholds)

測定系の分解能 = 0.00025ms (何もしない関数を同じ経路で呼んだ時の p10)。 回帰判定の絶対下限は既定でこの 2 倍 = 0.00049ms、 op ごとの実効値は下表の「下限」 列。

## Serial (concurrency = 1)

| op | p10 (実測) | p95 (上限判定) | cap | 下限 | gate | regression |
|---|---|---|---|---|---|---|
| edge_fetch_workflow (10 invokeEdgeHandler) | 0.09ms | 0.11ms | 100ms | 0.00051ms | PASS | stable — gate 無効 (regressionGate=false) |
| kv_bound_batch (5 invokeEdgeHandler with KV read) | 0.02ms | 0.03ms | 100ms | 0.00049ms | PASS | stable (p10 +2% (閾値未満)、 p95 +24% (裾は実行間の振れ幅と区別できないため判定には使わない)) — gate 無効 (regressionGate=false) |
| handler_error_handling (5 throw + catch) | 0.03ms | 0.03ms | 100ms | 0.00054ms | PASS | stable — gate 無効 (regressionGate=false) |

## 実行内正規化 (回帰判定はこの比で行う)

回帰判定は実測値そのものではなく、 同じ実行の中で 1 呼出ずつ交互に測った基準 op との比を読む。 実行と実行の間で機械の状態が変わっても、 その差が分子と分母で相殺される。 「換算後 p10」 は今回の比を baseline を測った時の基準 p10 で ms に戻した値で、 baseline の実測 p10 と直接比べられる。

| op | 基準 op | 基準 p10 | 実測 p10 | 比 | baseline の比 | 換算後 p10 | baseline p10 |
|---|---|---|---|---|---|---|---|
| edge_fetch_workflow (10 invokeEdgeHandler) | cpu | 0.08ms | 0.09ms | 1.108 | 1.131 | 0.09ms | 0.09ms |
| kv_bound_batch (5 invokeEdgeHandler with KV read) | cpu | 0.08ms | 0.02ms | 0.246 | 0.242 | 0.02ms | 0.02ms |
| handler_error_handling (5 throw + catch) | cpu | 0.08ms | 0.03ms | 0.365 | 0.355 | 0.03ms | 0.03ms |

## Concurrent p95 (concurrency = 4, 5 iter each)

| op | p95 | cap | gate |
|---|---|---|---|
| edge_fetch_workflow (10 invokeEdgeHandler) | 0.37ms | 200ms | PASS |
| kv_bound_batch (5 invokeEdgeHandler with KV read) | 0.09ms | 200ms | PASS |
| handler_error_handling (5 throw + catch) | 0.14ms | 200ms | PASS |

## Memory retention (20 iter, arrayBuffers axis is the gate; heap is informational)

| op | heapUsed Δ | arrayBuffers Δ | cap | gc exposed | verdict |
|---|---|---|---|---|---|
| edge_fetch_workflow (10 invokeEdgeHandler) | -192408 B | 0 B | 102400 B | yes | PASS |
| kv_bound_batch (5 invokeEdgeHandler with KV read) | -92176 B | 0 B | 102400 B | yes | PASS |
| handler_error_handling (5 throw + catch) | 200 B | 0 B | 102400 B | yes | PASS |

## Detailed serial reports

### edge_fetch_workflow (10 invokeEdgeHandler)

# Perf Report — edge_fetch_workflow (10 invokeEdgeHandler).serial

| metric | value |
|---|---|
| iterations | 20 |
| warmup | 3 |
| p10 | 0.09ms |
| p50 | 0.10ms |
| p95 | 0.11ms |
| p99 | 0.11ms |
| mean | 0.10ms |
| stdev | 0.0094ms |
| min | 0.09ms |
| max | 0.11ms |
| total | 2.00ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.09ms | 0.09ms | -0.0047ms | -5.02% |
| p50 | 0.10ms | 0.11ms | -0.0069ms | -6.49% |
| p95 | 0.11ms | 0.27ms | -0.15ms | -57.55% |
| p99 | 0.11ms | 0.37ms | -0.26ms | -69.03% |
| mean | 0.10ms | 0.13ms | -0.03ms | -20.52% |
| min | 0.09ms | 0.09ms | +0.0014ms | +1.61% |
| max | 0.11ms | 0.40ms | -0.28ms | -70.98% |
| total | 2.00ms | 2.52ms | -0.52ms | -20.52% |

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
| stdev | 0.0038ms |
| min | 0.02ms |
| max | 0.03ms |
| total | 0.48ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.02ms | 0.02ms | +0.00031ms | +1.61% |
| p50 | 0.02ms | 0.02ms | +0.0034ms | +16.80% |
| p95 | 0.03ms | 0.02ms | +0.0058ms | +23.51% |
| p99 | 0.03ms | 0.03ms | +0.0047ms | +17.47% |
| mean | 0.02ms | 0.02ms | +0.0031ms | +14.79% |
| min | 0.02ms | 0.02ms | +0.00017ms | +0.87% |
| max | 0.03ms | 0.03ms | +0.0045ms | +16.12% |
| total | 0.48ms | 0.42ms | +0.06ms | +14.79% |

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
| stdev | 0.0013ms |
| min | 0.03ms |
| max | 0.04ms |
| total | 0.61ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.03ms | 0.03ms | -0.0022ms | -6.92% |
| p50 | 0.03ms | 0.03ms | -0.0020ms | -6.23% |
| p95 | 0.03ms | 0.03ms | -0.0026ms | -7.59% |
| p99 | 0.03ms | 0.03ms | -0.000092ms | -0.26% |
| mean | 0.03ms | 0.03ms | -0.0019ms | -5.88% |
| min | 0.03ms | 0.03ms | -0.0025ms | -7.75% |
| max | 0.04ms | 0.03ms | +0.00054ms | +1.56% |
| total | 0.61ms | 0.65ms | -0.04ms | -5.88% |

