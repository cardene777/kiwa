# Perf Suite — fresh-app-scenario

Threshold source: [docs/quality/perf-thresholds.md](../../quality/perf-thresholds)

測定系の分解能 = 0.00029ms (何もしない関数を同じ経路で呼んだ時の p10)。 回帰判定の絶対下限は既定でこの 2 倍 = 0.00058ms、 op ごとの実効値は下表の「下限」 列。

## Serial (concurrency = 1)

| op | p10 (実測) | p95 (上限判定) | cap | 下限 | gate | regression |
|---|---|---|---|---|---|---|
| handler_workflow (10 invokeFreshHandler GET+POST mix) | 0.14ms | 0.29ms | 100ms | 0.00049ms | PASS | stable (換算後 p10 -1% (閾値未満)、 p95 +55% (裾は実行間の振れ幅と区別できないため判定には使わない)) — gate 無効 (regressionGate=false) |
| island_mount_batch (5 mountIsland with different props) | 0.01ms | 0.01ms | 100ms | 0.00053ms | PASS | stable — gate 無効 (regressionGate=false) |
| handler_error_handling (5 throw + catch) | 0.05ms | 0.07ms | 100ms | 0.00051ms | PASS | stable — gate 無効 (regressionGate=false) |

## 実行内正規化 (回帰判定はこの比で行う)

回帰判定は実測値そのものではなく、 同じ実行の中で 1 呼出ずつ交互に測った基準 op との比を読む。 実行と実行の間で機械の状態が変わっても、 その差が分子と分母で相殺される。 「換算後 p10」 は今回の比を baseline を測った時の基準 p10 で ms に戻した値で、 baseline の実測 p10 と直接比べられる。


「実行間のばらつき」 は baseline が持つ過去の比が、 baseline 自身の比からどれだけ離れたかの最大値。 その op が実装を変えずに測るだけでどれだけ動くかを表す。 判定はこの幅の 2 倍と相対閾値の大きい方を超えた差だけを有意として扱う (#1739)。 履歴が 3 件に満たない op では推定できないため n/a になり、 相対閾値だけで判定する。

| op | 基準 op | 基準 p10 | 基準 p95 | 実測 p10 | 比 | baseline の比 | 実行間のばらつき | 実効閾値 | 換算後 p10 | baseline p10 |
|---|---|---|---|---|---|---|---|---|---|---|
| handler_workflow (10 invokeFreshHandler GET+POST mix) | cpu | 0.10ms | 0.10ms | 0.14ms | 1.453 | 1.474 | n/a | 20.0% | 0.12ms | 0.12ms |
| island_mount_batch (5 mountIsland with different props) | cpu | 0.09ms | 0.10ms | 0.01ms | 0.121 | 0.118 | n/a | 20.0% | 0.01ms | 0.0098ms |
| handler_error_handling (5 throw + catch) | cpu | 0.09ms | 0.10ms | 0.05ms | 0.584 | 0.569 | n/a | 20.0% | 0.05ms | 0.05ms |

## Concurrent p95 (concurrency = 4, 5 iter each)

| op | p95 | cap | gate |
|---|---|---|---|
| handler_workflow (10 invokeFreshHandler GET+POST mix) | 0.84ms | 200ms | PASS |
| island_mount_batch (5 mountIsland with different props) | 0.05ms | 200ms | PASS |
| handler_error_handling (5 throw + catch) | 0.24ms | 200ms | PASS |

## Memory retention (20 iter, arrayBuffers axis is the gate; heap is informational)

| op | heapUsed Δ | arrayBuffers Δ | cap | gc exposed | 呼出 (空回し + 反復) | verdict |
|---|---|---|---|---|---|---|
| handler_workflow (10 invokeFreshHandler GET+POST mix) | 30744 B | -1988 B | 102400 B | yes | 23 (3 + 20) | PASS |
| island_mount_batch (5 mountIsland with different props) | -115520 B | 0 B | 102400 B | yes | 23 (3 + 20) | PASS |
| handler_error_handling (5 throw + catch) | 728 B | 0 B | 102400 B | yes | 23 (3 + 20) | PASS |

## Detailed serial reports

### handler_workflow (10 invokeFreshHandler GET+POST mix)

# Perf Report — handler_workflow (10 invokeFreshHandler GET+POST mix).serial

| metric | value |
|---|---|
| iterations | 20 |
| warmup | 3 |
| p10 | 0.14ms |
| p50 | 0.16ms |
| p95 | 0.29ms |
| p99 | 0.33ms |
| mean | 0.17ms |
| stdev | 0.05ms |
| min | 0.14ms |
| max | 0.34ms |
| total | 3.49ms |

## Baseline diff

current は baseline を測った時の機械の速さへ換算済み (倍率 0.841)。 回帰判定が読む量と同じ。 実測値は上表。

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.12ms | 0.12ms | -0.0018ms | -1.48% |
| p50 | 0.14ms | 0.14ms | +0.000014ms | +0.01% |
| p95 | 0.24ms | 0.16ms | +0.09ms | +55.15% |
| p99 | 0.27ms | 0.16ms | +0.11ms | +70.94% |
| mean | 0.15ms | 0.14ms | +0.0098ms | +7.15% |
| min | 0.11ms | 0.11ms | -0.00034ms | -0.30% |
| max | 0.28ms | 0.16ms | +0.12ms | +74.75% |
| total | 2.94ms | 2.74ms | +0.20ms | +7.15% |

### island_mount_batch (5 mountIsland with different props)

# Perf Report — island_mount_batch (5 mountIsland with different props).serial

| metric | value |
|---|---|
| iterations | 20 |
| warmup | 3 |
| p10 | 0.01ms |
| p50 | 0.01ms |
| p95 | 0.01ms |
| p99 | 0.02ms |
| mean | 0.01ms |
| stdev | 0.0018ms |
| min | 0.01ms |
| max | 0.02ms |
| total | 0.24ms |

## Baseline diff

current は baseline を測った時の機械の速さへ換算済み (倍率 0.902)。 回帰判定が読む量と同じ。 実測値は上表。

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.01ms | 0.0098ms | +0.00019ms | +1.98% |
| p50 | 0.01ms | 0.01ms | +0.000094ms | +0.93% |
| p95 | 0.01ms | 0.01ms | -0.00025ms | -1.95% |
| p99 | 0.02ms | 0.02ms | -0.00029ms | -1.80% |
| mean | 0.01ms | 0.01ms | +0.00015ms | +1.36% |
| min | 0.0099ms | 0.0097ms | +0.00017ms | +1.73% |
| max | 0.02ms | 0.02ms | -0.00031ms | -1.77% |
| total | 0.22ms | 0.21ms | +0.0029ms | +1.36% |

### handler_error_handling (5 throw + catch)

# Perf Report — handler_error_handling (5 throw + catch).serial

| metric | value |
|---|---|
| iterations | 20 |
| warmup | 3 |
| p10 | 0.05ms |
| p50 | 0.06ms |
| p95 | 0.07ms |
| p99 | 0.15ms |
| mean | 0.06ms |
| stdev | 0.03ms |
| min | 0.05ms |
| max | 0.17ms |
| total | 1.23ms |

## Baseline diff

current は baseline を測った時の機械の速さへ換算済み (倍率 0.869)。 回帰判定が読む量と同じ。 実測値は上表。

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.05ms | 0.05ms | +0.0012ms | +2.65% |
| p50 | 0.05ms | 0.05ms | +0.00046ms | +0.96% |
| p95 | 0.06ms | 0.06ms | -0.0025ms | -4.02% |
| p99 | 0.13ms | 0.14ms | -0.0035ms | -2.59% |
| mean | 0.05ms | 0.05ms | +0.000034ms | +0.06% |
| min | 0.05ms | 0.05ms | +0.0016ms | +3.56% |
| max | 0.15ms | 0.16ms | -0.0038ms | -2.45% |
| total | 1.07ms | 1.07ms | +0.00067ms | +0.06% |

