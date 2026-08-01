# Perf Suite — expo

Threshold source: [docs/quality/perf-thresholds.md](../../quality/perf-thresholds)

測定系の分解能 = 0.00017ms (何もしない関数を同じ経路で呼んだ時の p10)。 回帰判定の絶対下限は既定でこの 2 倍 = 0.00033ms、 op ごとの実効値は下表の「下限」 列。

## Serial (concurrency = 1)

| op | p10 (実測) | p95 (上限判定) | cap | 下限 | gate | regression |
|---|---|---|---|---|---|---|
| createExpoTestEnv | 0.00096ms | 0.01ms | 5ms | 0.00030ms | PASS | stable (換算後 p10 +2% (閾値未満)、 p95 +45% (裾は実行間の振れ幅と区別できないため判定には使わない)) — gate 無効 (regressionGate=false) |
| routerPushCycle | 0.00058ms | 0.0010ms | 5ms | 0.00029ms | PASS | stable — gate 無効 (regressionGate=false) |
| notificationDispatch | 0.00050ms | 0.0016ms | 5ms | 0.00029ms | PASS | stable — gate 無効 (regressionGate=false) |

## 実行内正規化 (回帰判定はこの比で行う)

回帰判定は実測値そのものではなく、 同じ実行の中で 1 呼出ずつ交互に測った基準 op との比を読む。 実行と実行の間で機械の状態が変わっても、 その差が分子と分母で相殺される。 「換算後 p10」 は今回の比を baseline を測った時の基準 p10 で ms に戻した値で、 baseline の実測 p10 と直接比べられる。


「実行間のばらつき」 は baseline が持つ過去の比が、 baseline 自身の比からどれだけ離れたかの最大値。 その op が実装を変えずに測るだけでどれだけ動くかを表す。 判定はこの幅の 2 倍と相対閾値の大きい方を超えた差だけを有意として扱う (#1739)。 履歴が 3 件に満たない op では推定できないため n/a になり、 相対閾値だけで判定する。

| op | 基準 op | 基準 p10 | 基準 p95 | 実測 p10 | 比 | baseline の比 | 実行間のばらつき | 実効閾値 | 換算後 p10 | baseline p10 |
|---|---|---|---|---|---|---|---|---|---|---|
| createExpoTestEnv | cpu | 0.09ms | 0.14ms | 0.00096ms | 0.011 | 0.010 | n/a | 20.0% | 0.00085ms | 0.00083ms |
| routerPushCycle | cpu | 0.09ms | 0.09ms | 0.00058ms | 0.006 | 0.006 | n/a | 20.0% | 0.00051ms | 0.00050ms |
| notificationDispatch | cpu | 0.09ms | 0.09ms | 0.00050ms | 0.005 | 0.006 | n/a | 20.0% | 0.00044ms | 0.00046ms |

## Concurrent p95 (concurrency = 10, 50 iter each)

| op | p95 | cap | gate |
|---|---|---|---|
| createExpoTestEnv | 0.04ms | 10ms | PASS |
| routerPushCycle | 0.02ms | 10ms | PASS |
| notificationDispatch | 0.02ms | 10ms | PASS |

## Memory retention (200 iter, arrayBuffers axis is the gate; heap is informational)

| op | heapUsed Δ | arrayBuffers Δ | cap | gc exposed | 呼出 (空回し + 反復) | verdict |
|---|---|---|---|---|---|---|
| createExpoTestEnv | -2480 B | -47822 B | 102400 B | yes | 220 (20 + 200) | PASS |
| routerPushCycle | 648 B | 0 B | 102400 B | yes | 220 (20 + 200) | PASS |
| notificationDispatch | -15376 B | 0 B | 102400 B | yes | 220 (20 + 200) | PASS |

## Detailed serial reports

### createExpoTestEnv

# Perf Report — createExpoTestEnv.serial

| metric | value |
|---|---|
| iterations | 200 |
| warmup | 5 |
| p10 | 0.00096ms |
| p50 | 0.0011ms |
| p95 | 0.01ms |
| p99 | 0.03ms |
| mean | 0.0028ms |
| stdev | 0.0053ms |
| min | 0.00092ms |
| max | 0.04ms |
| total | 0.55ms |

## Baseline diff

current は baseline を測った時の機械の速さへ換算済み (倍率 0.888)。 回帰判定が読む量と同じ。 実測値は上表。

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.00085ms | 0.00083ms | +0.000018ms | +2.17% |
| p50 | 0.00096ms | 0.0010ms | -0.000038ms | -3.79% |
| p95 | 0.01ms | 0.0077ms | +0.0035ms | +45.02% |
| p99 | 0.02ms | 0.02ms | +0.0034ms | +16.67% |
| mean | 0.0025ms | 0.0023ms | +0.00018ms | +7.84% |
| min | 0.00081ms | 0.00079ms | +0.000023ms | +2.88% |
| max | 0.04ms | 0.03ms | +0.0036ms | +10.96% |
| total | 0.49ms | 0.46ms | +0.04ms | +7.84% |

### routerPushCycle

# Perf Report — routerPushCycle.serial

| metric | value |
|---|---|
| iterations | 200 |
| warmup | 5 |
| p10 | 0.00058ms |
| p50 | 0.00058ms |
| p95 | 0.0010ms |
| p99 | 0.0028ms |
| mean | 0.00073ms |
| stdev | 0.00071ms |
| min | 0.00054ms |
| max | 0.0075ms |
| total | 0.15ms |

## Baseline diff

current は baseline を測った時の機械の速さへ換算済み (倍率 0.880)。 回帰判定が読む量と同じ。 実測値は上表。

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.00051ms | 0.00050ms | +0.000013ms | +2.60% |
| p50 | 0.00051ms | 0.00054ms | -0.000028ms | -5.18% |
| p95 | 0.00092ms | 0.0015ms | -0.00055ms | -37.48% |
| p99 | 0.0025ms | 0.0060ms | -0.0035ms | -58.51% |
| mean | 0.00064ms | 0.00084ms | -0.00021ms | -24.34% |
| min | 0.00048ms | 0.00046ms | +0.000018ms | +3.94% |
| max | 0.0066ms | 0.02ms | -0.01ms | -65.64% |
| total | 0.13ms | 0.17ms | -0.04ms | -24.34% |

### notificationDispatch

# Perf Report — notificationDispatch.serial

| metric | value |
|---|---|
| iterations | 200 |
| warmup | 5 |
| p10 | 0.00050ms |
| p50 | 0.00050ms |
| p95 | 0.0016ms |
| p99 | 0.01ms |
| mean | 0.00093ms |
| stdev | 0.0025ms |
| min | 0.00046ms |
| max | 0.03ms |
| total | 0.19ms |

## Baseline diff

current は baseline を測った時の機械の速さへ換算済み (倍率 0.879)。 回帰判定が読む量と同じ。 実測値は上表。

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.00044ms | 0.00046ms | -0.000018ms | -4.04% |
| p50 | 0.00044ms | 0.00050ms | -0.000060ms | -12.10% |
| p95 | 0.0014ms | 0.0036ms | -0.0022ms | -60.89% |
| p99 | 0.01ms | 0.01ms | -0.0023ms | -18.25% |
| mean | 0.00081ms | 0.0011ms | -0.00031ms | -27.28% |
| min | 0.00040ms | 0.00042ms | -0.000013ms | -3.22% |
| max | 0.02ms | 0.03ms | -0.0060ms | -19.43% |
| total | 0.16ms | 0.22ms | -0.06ms | -27.28% |

