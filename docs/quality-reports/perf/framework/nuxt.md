# Perf Suite — nuxt

Threshold source: [docs/quality/perf-thresholds.md](../../../quality/perf-thresholds)

測定系の分解能 = 0.00017ms (何もしない関数を同じ経路で呼んだ時の p10)。 回帰判定の絶対下限は既定でこの 2 倍 = 0.00033ms、 op ごとの実効値は下表の「下限」 列。

## Serial (concurrency = 1)

| op | p10 (実測) | p95 (上限判定) | cap | 下限 | gate | regression |
|---|---|---|---|---|---|---|
| invokeEventHandler | 0.0010ms | 0.02ms | 5ms | 0.00030ms | PASS | stable (換算後 p10 +9% (閾値未満)、 p95 +292% (裾は実行間の振れ幅と区別できないため判定には使わない)) — gate 無効 (regressionGate=false) |
| invokeRouteMiddleware | 0.00058ms | 0.0038ms | 5ms | 0.00031ms | PASS | stable (換算後 p10 +1% (閾値未満)、 p95 +64% (裾は実行間の振れ幅と区別できないため判定には使わない)) — gate 無効 (regressionGate=false) |

## 実行内正規化 (回帰判定はこの比で行う)

回帰判定は実測値そのものではなく、 同じ実行の中で 1 呼出ずつ交互に測った基準 op との比を読む。 実行と実行の間で機械の状態が変わっても、 その差が分子と分母で相殺される。 「換算後 p10」 は今回の比を baseline を測った時の基準 p10 で ms に戻した値で、 baseline の実測 p10 と直接比べられる。


「実行間のばらつき」 は baseline が持つ過去の比が、 baseline 自身の比からどれだけ離れたかの最大値。 その op が実装を変えずに測るだけでどれだけ動くかを表す。 判定はこの幅の 2 倍と相対閾値の大きい方を超えた差だけを有意として扱う (#1739)。 履歴が 3 件に満たない op では推定できないため n/a になり、 相対閾値だけで判定する。

| op | 基準 op | 基準 p10 | 基準 p95 | 実測 p10 | 比 | baseline の比 | 実行間のばらつき | 実効閾値 | 換算後 p10 | baseline p10 |
|---|---|---|---|---|---|---|---|---|---|---|
| invokeEventHandler | cpu | 0.09ms | 0.18ms | 0.0010ms | 0.012 | 0.011 | n/a | 20.0% | 0.00095ms | 0.00088ms |
| invokeRouteMiddleware | cpu | 0.09ms | 0.10ms | 0.00058ms | 0.007 | 0.007 | n/a | 20.0% | 0.00055ms | 0.00054ms |

## Concurrent p95 (concurrency = 10, 50 iter each)

| op | p95 | cap | gate |
|---|---|---|---|
| invokeEventHandler | 0.03ms | 10ms | PASS |
| invokeRouteMiddleware | 0.05ms | 10ms | PASS |

## Memory retention (200 iter, arrayBuffers axis is the gate; heap is informational)

| op | heapUsed Δ | arrayBuffers Δ | cap | gc exposed | 呼出 (空回し + 反復) | verdict |
|---|---|---|---|---|---|---|
| invokeEventHandler | -19328 B | 0 B | 102400 B | yes | 220 (20 + 200) | PASS |
| invokeRouteMiddleware | -216 B | 0 B | 102400 B | yes | 220 (20 + 200) | PASS |

## Detailed serial reports

### invokeEventHandler

# Perf Report — invokeEventHandler.serial

| metric | value |
|---|---|
| iterations | 200 |
| warmup | 5 |
| p10 | 0.0010ms |
| p50 | 0.0013ms |
| p95 | 0.02ms |
| p99 | 0.06ms |
| mean | 0.0051ms |
| stdev | 0.02ms |
| min | 0.00096ms |
| max | 0.18ms |
| total | 1.02ms |

## Baseline diff

current は baseline を測った時の機械の速さへ換算済み (倍率 0.916)。 回帰判定が読む量と同じ。 実測値は上表。

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.00095ms | 0.00088ms | +0.000078ms | +8.93% |
| p50 | 0.0012ms | 0.00092ms | +0.00027ms | +29.00% |
| p95 | 0.02ms | 0.0044ms | +0.01ms | +291.96% |
| p99 | 0.06ms | 0.02ms | +0.04ms | +253.09% |
| mean | 0.0046ms | 0.0016ms | +0.0030ms | +190.04% |
| min | 0.00088ms | 0.00083ms | +0.000044ms | +5.30% |
| max | 0.16ms | 0.02ms | +0.14ms | +635.27% |
| total | 0.93ms | 0.32ms | +0.61ms | +190.04% |

### invokeRouteMiddleware

# Perf Report — invokeRouteMiddleware.serial

| metric | value |
|---|---|
| iterations | 200 |
| warmup | 5 |
| p10 | 0.00058ms |
| p50 | 0.00063ms |
| p95 | 0.0038ms |
| p99 | 0.01ms |
| mean | 0.0012ms |
| stdev | 0.0026ms |
| min | 0.00054ms |
| max | 0.03ms |
| total | 0.25ms |

## Baseline diff

current は baseline を測った時の機械の速さへ換算済み (倍率 0.940)。 回帰判定が読む量と同じ。 実測値は上表。

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.00055ms | 0.00054ms | +0.0000069ms | +1.27% |
| p50 | 0.00059ms | 0.00058ms | +0.0000044ms | +0.75% |
| p95 | 0.0036ms | 0.0022ms | +0.0014ms | +63.61% |
| p99 | 0.01ms | 0.0073ms | +0.0027ms | +36.76% |
| mean | 0.0012ms | 0.00087ms | +0.00029ms | +33.04% |
| min | 0.00051ms | 0.00050ms | +0.0000084ms | +1.68% |
| max | 0.03ms | 0.0081ms | +0.02ms | +229.65% |
| total | 0.23ms | 0.17ms | +0.06ms | +33.04% |

