# Perf Suite — rust-lib

Threshold source: [docs/quality/perf-thresholds.md](../../quality/perf-thresholds)

測定系の分解能 = 0.00042ms (何もしない関数を同じ経路で呼んだ時の p10)。 回帰判定の絶対下限は既定でこの 2 倍 = 0.00083ms、 op ごとの実効値は下表の「下限」 列。

## Serial (concurrency = 1)

| op | p10 (実測) | p95 (上限判定) | cap | 下限 | gate | regression |
|---|---|---|---|---|---|---|
| invokeAxumHandler | 0.00054ms | 0.0097ms | 5ms | 0.00069ms | PASS | stable (検知には +0.00069ms (baseline 比 +152%) 以上の悪化が必要) — gate 無効 (regressionGate=false) |
| invokeActixHandler | 0.00058ms | 0.0071ms | 5ms | 0.00069ms | PASS | stable (検知には +0.00069ms (baseline 比 +139%) 以上の悪化が必要) — gate 無効 (regressionGate=false) |
| captureTowerMiddleware | 0.00067ms | 0.0021ms | 5ms | 0.00068ms | PASS | stable (検知には +0.00068ms (baseline 比 +117%) 以上の悪化が必要) — gate 無効 (regressionGate=false) |
| invokeRocketRoute | 0.00058ms | 0.01ms | 5ms | 0.00069ms | PASS | stable (検知には +0.00069ms (baseline 比 +139%) 以上の悪化が必要) — gate 無効 (regressionGate=false) |

## 実行内正規化 (回帰判定はこの比で行う)

回帰判定は実測値そのものではなく、 同じ実行の中で 1 呼出ずつ交互に測った基準 op との比を読む。 実行と実行の間で機械の状態が変わっても、 その差が分子と分母で相殺される。 「換算後 p10」 は今回の比を baseline を測った時の基準 p10 で ms に戻した値で、 baseline の実測 p10 と直接比べられる。


「実行間のばらつき」 は baseline が持つ過去の比が、 baseline 自身の比からどれだけ離れたかの最大値。 その op が実装を変えずに測るだけでどれだけ動くかを表す。 判定はこの幅の 2 倍と相対閾値の大きい方を超えた差だけを有意として扱う (#1739)。 履歴が 3 件に満たない op では推定できないため n/a になり、 相対閾値だけで判定する。

| op | 基準 op | 基準 p10 | 基準 p95 | 実測 p10 | 比 | baseline の比 | 実行間のばらつき | 実効閾値 | 換算後 p10 | baseline p10 |
|---|---|---|---|---|---|---|---|---|---|---|
| invokeAxumHandler | cpu | 0.10ms | 0.16ms | 0.00054ms | 0.006 | 0.006 | n/a | 20.0% | 0.00045ms | 0.00046ms |
| invokeActixHandler | cpu | 0.10ms | 0.17ms | 0.00058ms | 0.006 | 0.006 | n/a | 20.0% | 0.00048ms | 0.00050ms |
| captureTowerMiddleware | cpu | 0.10ms | 0.10ms | 0.00067ms | 0.007 | 0.007 | n/a | 20.0% | 0.00055ms | 0.00058ms |
| invokeRocketRoute | cpu | 0.10ms | 0.14ms | 0.00058ms | 0.006 | 0.006 | n/a | 20.0% | 0.00049ms | 0.00050ms |

## Concurrent p95 (concurrency = 10, 50 iter each)

| op | p95 | cap | gate |
|---|---|---|---|
| invokeAxumHandler | 0.02ms | 10ms | PASS |
| invokeActixHandler | 0.03ms | 10ms | PASS |
| captureTowerMiddleware | 0.14ms | 10ms | PASS |
| invokeRocketRoute | 0.01ms | 10ms | PASS |

## Memory retention (200 iter, arrayBuffers axis is the gate; heap is informational)

| op | heapUsed Δ | arrayBuffers Δ | cap | gc exposed | 呼出 (空回し + 反復) | verdict |
|---|---|---|---|---|---|---|
| invokeAxumHandler | -6424 B | 0 B | 102400 B | yes | 220 (20 + 200) | PASS |
| invokeActixHandler | 6344 B | 0 B | 102400 B | yes | 220 (20 + 200) | PASS |
| captureTowerMiddleware | 648 B | 0 B | 102400 B | yes | 220 (20 + 200) | PASS |
| invokeRocketRoute | 5856 B | 0 B | 102400 B | yes | 220 (20 + 200) | PASS |

## Detailed serial reports

### invokeAxumHandler

# Perf Report — invokeAxumHandler.serial

| metric | value |
|---|---|
| iterations | 200 |
| warmup | 5 |
| p10 | 0.00054ms |
| p50 | 0.00063ms |
| p95 | 0.0097ms |
| p99 | 0.02ms |
| mean | 0.0019ms |
| stdev | 0.0037ms |
| min | 0.00050ms |
| max | 0.03ms |
| total | 0.39ms |

## Baseline diff

current は baseline を測った時の機械の速さへ換算済み (倍率 0.834)。 回帰判定が読む量と同じ。 実測値は上表。

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.00045ms | 0.00046ms | -0.0000066ms | -1.45% |
| p50 | 0.00052ms | 0.00050ms | +0.000021ms | +4.29% |
| p95 | 0.0081ms | 0.0039ms | +0.0042ms | +106.07% |
| p99 | 0.01ms | 0.01ms | +0.0032ms | +30.37% |
| mean | 0.0016ms | 0.0012ms | +0.00045ms | +38.38% |
| min | 0.00042ms | 0.00042ms | +1.7e-7ms | +0.04% |
| max | 0.02ms | 0.01ms | +0.0093ms | +68.92% |
| total | 0.32ms | 0.23ms | +0.09ms | +38.38% |

### invokeActixHandler

# Perf Report — invokeActixHandler.serial

| metric | value |
|---|---|
| iterations | 200 |
| warmup | 5 |
| p10 | 0.00058ms |
| p50 | 0.00063ms |
| p95 | 0.0071ms |
| p99 | 0.01ms |
| mean | 0.0018ms |
| stdev | 0.0027ms |
| min | 0.00054ms |
| max | 0.02ms |
| total | 0.36ms |

## Baseline diff

current は baseline を測った時の機械の速さへ換算済み (倍率 0.829)。 回帰判定が読む量と同じ。 実測値は上表。

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.00048ms | 0.00050ms | -0.000012ms | -2.51% |
| p50 | 0.00052ms | 0.00050ms | +0.000018ms | +3.65% |
| p95 | 0.0059ms | 0.0020ms | +0.0039ms | +197.66% |
| p99 | 0.01ms | 0.0091ms | +0.0026ms | +28.94% |
| mean | 0.0015ms | 0.00083ms | +0.00068ms | +82.65% |
| min | 0.00045ms | 0.00046ms | -0.0000094ms | -2.05% |
| max | 0.01ms | 0.02ms | -0.0037ms | -20.25% |
| total | 0.30ms | 0.17ms | +0.14ms | +82.65% |

### captureTowerMiddleware

# Perf Report — captureTowerMiddleware.serial

| metric | value |
|---|---|
| iterations | 200 |
| warmup | 5 |
| p10 | 0.00067ms |
| p50 | 0.00071ms |
| p95 | 0.0021ms |
| p99 | 0.0073ms |
| mean | 0.0010ms |
| stdev | 0.0017ms |
| min | 0.00063ms |
| max | 0.02ms |
| total | 0.20ms |

## Baseline diff

current は baseline を測った時の機械の速さへ換算済み (倍率 0.821)。 回帰判定が読む量と同じ。 実測値は上表。

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.00055ms | 0.00058ms | -0.000036ms | -6.20% |
| p50 | 0.00058ms | 0.00063ms | -0.000044ms | -6.99% |
| p95 | 0.0018ms | 0.0032ms | -0.0015ms | -45.54% |
| p99 | 0.0060ms | 0.01ms | -0.0049ms | -45.10% |
| mean | 0.00083ms | 0.0010ms | -0.00020ms | -19.48% |
| min | 0.00051ms | 0.00054ms | -0.000028ms | -5.14% |
| max | 0.01ms | 0.01ms | +0.0011ms | +8.86% |
| total | 0.17ms | 0.21ms | -0.04ms | -19.48% |

### invokeRocketRoute

# Perf Report — invokeRocketRoute.serial

| metric | value |
|---|---|
| iterations | 200 |
| warmup | 5 |
| p10 | 0.00058ms |
| p50 | 0.00067ms |
| p95 | 0.01ms |
| p99 | 0.02ms |
| mean | 0.0022ms |
| stdev | 0.0043ms |
| min | 0.00054ms |
| max | 0.04ms |
| total | 0.44ms |

## Baseline diff

current は baseline を測った時の機械の速さへ換算済み (倍率 0.833)。 回帰判定が読む量と同じ。 実測値は上表。

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.00049ms | 0.00050ms | -0.000013ms | -2.69% |
| p50 | 0.00056ms | 0.00054ms | +0.000015ms | +2.73% |
| p95 | 0.0086ms | 0.0021ms | +0.0065ms | +301.44% |
| p99 | 0.01ms | 0.0061ms | +0.0073ms | +120.68% |
| mean | 0.0018ms | 0.00081ms | +0.0010ms | +125.83% |
| min | 0.00045ms | 0.00046ms | -0.0000064ms | -1.39% |
| max | 0.04ms | 0.01ms | +0.02ms | +161.10% |
| total | 0.37ms | 0.16ms | +0.20ms | +125.83% |

