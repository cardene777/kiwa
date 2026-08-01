# Perf Suite — edge-app-scenario

Threshold source: [docs/quality/perf-thresholds.md](../../quality/perf-thresholds)

測定系の分解能 = 0.00029ms (何もしない関数を同じ経路で呼んだ時の p10)。 回帰判定の絶対下限は既定でこの 2 倍 = 0.00058ms、 op ごとの実効値は下表の「下限」 列。

## Serial (concurrency = 1)

| op | p10 (実測) | p95 (上限判定) | cap | 下限 | gate | regression |
|---|---|---|---|---|---|---|
| edge_fetch_workflow (10 invokeEdgeHandler) | 0.10ms | 0.13ms | 100ms | 0.00051ms | PASS | stable — gate 無効 (regressionGate=false) |
| kv_bound_batch (5 invokeEdgeHandler with KV read) | 0.02ms | 0.06ms | 100ms | 0.00051ms | PASS | stable (換算後 p10 +4% (閾値未満)、 p95 +126% (裾は実行間の振れ幅と区別できないため判定には使わない)) — gate 無効 (regressionGate=false) |
| handler_error_handling (5 throw + catch) | 0.03ms | 0.09ms | 100ms | 0.00050ms | PASS | stable — gate 無効 (regressionGate=false) |

## 実行内正規化 (回帰判定はこの比で行う)

回帰判定は実測値そのものではなく、 同じ実行の中で 1 呼出ずつ交互に測った基準 op との比を読む。 実行と実行の間で機械の状態が変わっても、 その差が分子と分母で相殺される。 「換算後 p10」 は今回の比を baseline を測った時の基準 p10 で ms に戻した値で、 baseline の実測 p10 と直接比べられる。


「実行間のばらつき」 は baseline が持つ過去の比が、 baseline 自身の比からどれだけ離れたかの最大値。 その op が実装を変えずに測るだけでどれだけ動くかを表す。 判定はこの幅の 2 倍と相対閾値の大きい方を超えた差だけを有意として扱う (#1739)。 履歴が 3 件に満たない op では推定できないため n/a になり、 相対閾値だけで判定する。

| op | 基準 op | 基準 p10 | 基準 p95 | 実測 p10 | 比 | baseline の比 | 実行間のばらつき | 実効閾値 | 換算後 p10 | baseline p10 |
|---|---|---|---|---|---|---|---|---|---|---|
| edge_fetch_workflow (10 invokeEdgeHandler) | cpu | 0.09ms | 0.10ms | 0.10ms | 1.085 | 1.091 | n/a | 20.0% | 0.09ms | 0.09ms |
| kv_bound_batch (5 invokeEdgeHandler with KV read) | cpu | 0.09ms | 0.11ms | 0.02ms | 0.252 | 0.243 | n/a | 20.0% | 0.02ms | 0.02ms |
| handler_error_handling (5 throw + catch) | cpu | 0.09ms | 0.10ms | 0.03ms | 0.369 | 0.363 | n/a | 20.0% | 0.03ms | 0.03ms |

## Concurrent p95 (concurrency = 4, 5 iter each)

| op | p95 | cap | gate |
|---|---|---|---|
| edge_fetch_workflow (10 invokeEdgeHandler) | 0.69ms | 200ms | PASS |
| kv_bound_batch (5 invokeEdgeHandler with KV read) | 0.11ms | 200ms | PASS |
| handler_error_handling (5 throw + catch) | 0.27ms | 200ms | PASS |

## Memory retention (20 iter, arrayBuffers axis is the gate; heap is informational)

| op | heapUsed Δ | arrayBuffers Δ | cap | gc exposed | 呼出 (空回し + 反復) | verdict |
|---|---|---|---|---|---|---|
| edge_fetch_workflow (10 invokeEdgeHandler) | 80592 B | -9999 B | 102400 B | yes | 23 (3 + 20) | PASS |
| kv_bound_batch (5 invokeEdgeHandler with KV read) | -85112 B | -236 B | 102400 B | yes | 23 (3 + 20) | PASS |
| handler_error_handling (5 throw + catch) | 744 B | 0 B | 102400 B | yes | 23 (3 + 20) | PASS |

## Detailed serial reports

### edge_fetch_workflow (10 invokeEdgeHandler)

# Perf Report — edge_fetch_workflow (10 invokeEdgeHandler).serial

| metric | value |
|---|---|
| iterations | 20 |
| warmup | 3 |
| p10 | 0.10ms |
| p50 | 0.11ms |
| p95 | 0.13ms |
| p99 | 0.16ms |
| mean | 0.12ms |
| stdev | 0.01ms |
| min | 0.10ms |
| max | 0.16ms |
| total | 2.31ms |

## Baseline diff

current は baseline を測った時の機械の速さへ換算済み (倍率 0.881)。 回帰判定が読む量と同じ。 実測値は上表。

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.09ms | 0.09ms | -0.00045ms | -0.50% |
| p50 | 0.10ms | 0.10ms | -0.0057ms | -5.49% |
| p95 | 0.12ms | 0.12ms | -0.0026ms | -2.17% |
| p99 | 0.14ms | 0.12ms | +0.01ms | +11.77% |
| mean | 0.10ms | 0.10ms | -0.0027ms | -2.56% |
| min | 0.09ms | 0.08ms | +0.0063ms | +7.68% |
| max | 0.14ms | 0.12ms | +0.02ms | +15.20% |
| total | 2.03ms | 2.09ms | -0.05ms | -2.56% |

### kv_bound_batch (5 invokeEdgeHandler with KV read)

# Perf Report — kv_bound_batch (5 invokeEdgeHandler with KV read).serial

| metric | value |
|---|---|
| iterations | 20 |
| warmup | 3 |
| p10 | 0.02ms |
| p50 | 0.03ms |
| p95 | 0.06ms |
| p99 | 0.09ms |
| mean | 0.03ms |
| stdev | 0.02ms |
| min | 0.02ms |
| max | 0.10ms |
| total | 0.63ms |

## Baseline diff

current は baseline を測った時の機械の速さへ換算済み (倍率 0.882)。 回帰判定が読む量と同じ。 実測値は上表。

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.02ms | 0.02ms | +0.00072ms | +3.61% |
| p50 | 0.02ms | 0.02ms | +0.0021ms | +9.78% |
| p95 | 0.05ms | 0.02ms | +0.03ms | +125.72% |
| p99 | 0.08ms | 0.03ms | +0.05ms | +181.01% |
| mean | 0.03ms | 0.02ms | +0.0059ms | +27.28% |
| min | 0.02ms | 0.02ms | +0.00051ms | +2.57% |
| max | 0.09ms | 0.03ms | +0.06ms | +191.67% |
| total | 0.55ms | 0.43ms | +0.12ms | +27.28% |

### handler_error_handling (5 throw + catch)

# Perf Report — handler_error_handling (5 throw + catch).serial

| metric | value |
|---|---|
| iterations | 20 |
| warmup | 3 |
| p10 | 0.03ms |
| p50 | 0.04ms |
| p95 | 0.09ms |
| p99 | 0.13ms |
| mean | 0.04ms |
| stdev | 0.03ms |
| min | 0.03ms |
| max | 0.15ms |
| total | 0.88ms |

## Baseline diff

current は baseline を測った時の機械の速さへ換算済み (倍率 0.863)。 回帰判定が読む量と同じ。 実測値は上表。

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.03ms | 0.03ms | +0.00052ms | +1.79% |
| p50 | 0.03ms | 0.03ms | +0.00032ms | +1.07% |
| p95 | 0.07ms | 0.08ms | -0.0054ms | -6.82% |
| p99 | 0.12ms | 0.13ms | -0.01ms | -11.01% |
| mean | 0.04ms | 0.04ms | -0.0013ms | -3.27% |
| min | 0.03ms | 0.03ms | +0.00043ms | +1.48% |
| max | 0.13ms | 0.14ms | -0.02ms | -11.59% |
| total | 0.76ms | 0.78ms | -0.03ms | -3.27% |

