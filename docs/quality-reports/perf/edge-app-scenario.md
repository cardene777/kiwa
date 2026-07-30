# Perf Suite — edge-app-scenario

Threshold source: [docs/quality/perf-thresholds.md](../../quality/perf-thresholds)

測定系の分解能 = 0.00025ms (何もしない関数を同じ経路で呼んだ時の p10)。 回帰判定の絶対下限は既定でこの 2 倍 = 0.00050ms、 op ごとの実効値は下表の「下限」 列。

## Serial (concurrency = 1)

| op | p10 (実測) | p95 (上限判定) | cap | 下限 | gate | regression |
|---|---|---|---|---|---|---|
| edge_fetch_workflow (10 invokeEdgeHandler) | 0.09ms | 0.15ms | 100ms | 0.00050ms | PASS | stable (換算後 p10 +3% (閾値未満)、 p95 +24% (裾は実行間の振れ幅と区別できないため判定には使わない)) — gate 無効 (regressionGate=false) |
| kv_bound_batch (5 invokeEdgeHandler with KV read) | 0.02ms | 0.03ms | 100ms | 0.00051ms | PASS | stable (換算後 p10 +3% (閾値未満)、 p95 +22% (裾は実行間の振れ幅と区別できないため判定には使わない)) — gate 無効 (regressionGate=false) |
| handler_error_handling (5 throw + catch) | 0.03ms | 0.04ms | 100ms | 0.00049ms | PASS | stable — gate 無効 (regressionGate=false) |

## 実行内正規化 (回帰判定はこの比で行う)

回帰判定は実測値そのものではなく、 同じ実行の中で 1 呼出ずつ交互に測った基準 op との比を読む。 実行と実行の間で機械の状態が変わっても、 その差が分子と分母で相殺される。 「換算後 p10」 は今回の比を baseline を測った時の基準 p10 で ms に戻した値で、 baseline の実測 p10 と直接比べられる。

| op | 基準 op | 基準 p10 | 基準 p95 | 実測 p10 | 比 | baseline の比 | 換算後 p10 | baseline p10 |
|---|---|---|---|---|---|---|---|---|
| edge_fetch_workflow (10 invokeEdgeHandler) | cpu | 0.08ms | 0.17ms | 0.09ms | 1.120 | 1.091 | 0.09ms | 0.09ms |
| kv_bound_batch (5 invokeEdgeHandler with KV read) | cpu | 0.08ms | 0.08ms | 0.02ms | 0.250 | 0.243 | 0.02ms | 0.02ms |
| handler_error_handling (5 throw + catch) | cpu | 0.08ms | 0.08ms | 0.03ms | 0.402 | 0.363 | 0.03ms | 0.03ms |

## Concurrent p95 (concurrency = 4, 5 iter each)

| op | p95 | cap | gate |
|---|---|---|---|
| edge_fetch_workflow (10 invokeEdgeHandler) | 0.61ms | 200ms | PASS |
| kv_bound_batch (5 invokeEdgeHandler with KV read) | 0.10ms | 200ms | PASS |
| handler_error_handling (5 throw + catch) | 0.15ms | 200ms | PASS |

## Memory retention (20 iter, arrayBuffers axis is the gate; heap is informational)

| op | heapUsed Δ | arrayBuffers Δ | cap | gc exposed | verdict |
|---|---|---|---|---|---|
| edge_fetch_workflow (10 invokeEdgeHandler) | 81328 B | -10419 B | 102400 B | yes | PASS |
| kv_bound_batch (5 invokeEdgeHandler with KV read) | -96952 B | 152 B | 102400 B | yes | PASS |
| handler_error_handling (5 throw + catch) | 744 B | 0 B | 102400 B | yes | PASS |

## Detailed serial reports

### edge_fetch_workflow (10 invokeEdgeHandler)

# Perf Report — edge_fetch_workflow (10 invokeEdgeHandler).serial

| metric | value |
|---|---|
| iterations | 20 |
| warmup | 3 |
| p10 | 0.09ms |
| p50 | 0.11ms |
| p95 | 0.15ms |
| p99 | 0.16ms |
| mean | 0.11ms |
| stdev | 0.02ms |
| min | 0.09ms |
| max | 0.16ms |
| total | 2.26ms |

## Baseline diff

current は baseline を測った時の機械の速さへ換算済み (倍率 1.009)。 回帰判定が読む量と同じ。 実測値は上表。

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.09ms | 0.09ms | +0.0025ms | +2.69% |
| p50 | 0.11ms | 0.10ms | +0.0099ms | +9.57% |
| p95 | 0.15ms | 0.12ms | +0.03ms | +24.36% |
| p99 | 0.16ms | 0.12ms | +0.04ms | +29.63% |
| mean | 0.11ms | 0.10ms | +0.0098ms | +9.38% |
| min | 0.09ms | 0.08ms | +0.0071ms | +8.67% |
| max | 0.16ms | 0.12ms | +0.04ms | +30.92% |
| total | 2.28ms | 2.09ms | +0.20ms | +9.38% |

### kv_bound_batch (5 invokeEdgeHandler with KV read)

# Perf Report — kv_bound_batch (5 invokeEdgeHandler with KV read).serial

| metric | value |
|---|---|
| iterations | 20 |
| warmup | 3 |
| p10 | 0.02ms |
| p50 | 0.03ms |
| p95 | 0.03ms |
| p99 | 0.04ms |
| mean | 0.02ms |
| stdev | 0.0043ms |
| min | 0.02ms |
| max | 0.04ms |
| total | 0.49ms |

## Baseline diff

current は baseline を測った時の機械の速さへ換算済み (倍率 1.026)。 回帰判定が読む量と同じ。 実測値は上表。

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.02ms | 0.02ms | +0.00058ms | +2.87% |
| p50 | 0.03ms | 0.02ms | +0.0049ms | +23.10% |
| p95 | 0.03ms | 0.02ms | +0.0054ms | +22.39% |
| p99 | 0.04ms | 0.03ms | +0.0071ms | +23.98% |
| mean | 0.03ms | 0.02ms | +0.0034ms | +15.79% |
| min | 0.02ms | 0.02ms | +0.00057ms | +2.85% |
| max | 0.04ms | 0.03ms | +0.0075ms | +24.29% |
| total | 0.50ms | 0.43ms | +0.07ms | +15.79% |

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
| stdev | 0.0015ms |
| min | 0.03ms |
| max | 0.04ms |
| total | 0.68ms |

## Baseline diff

current は baseline を測った時の機械の速さへ換算済み (倍率 0.989)。 回帰判定が読む量と同じ。 実測値は上表。

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.03ms | 0.03ms | +0.0031ms | +10.64% |
| p50 | 0.03ms | 0.03ms | +0.0032ms | +10.67% |
| p95 | 0.04ms | 0.08ms | -0.04ms | -54.86% |
| p99 | 0.04ms | 0.13ms | -0.09ms | -70.62% |
| mean | 0.03ms | 0.04ms | -0.0054ms | -13.93% |
| min | 0.03ms | 0.03ms | +0.0028ms | +9.79% |
| max | 0.04ms | 0.14ms | -0.10ms | -72.81% |
| total | 0.67ms | 0.78ms | -0.11ms | -13.93% |

