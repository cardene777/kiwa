# Perf Suite — macos-app

Threshold source: [docs/quality/perf-thresholds.md](../../quality/perf-thresholds)

測定系の分解能 = 0.00017ms (何もしない関数を同じ経路で呼んだ時の p10)。 回帰判定の絶対下限は既定でこの 2 倍 = 0.00033ms、 op ごとの実効値は下表の「下限」 列。

## Serial (concurrency = 1)

| op | p10 (実測) | p95 (上限判定) | cap | 下限 | gate | regression |
|---|---|---|---|---|---|---|
| createMacAppEnv | 0.00046ms | 0.0018ms | 5ms | 0.00031ms | PASS | stable — gate 無効 (regressionGate=false) |
| simulateUserInteraction | 0.00050ms | 0.0014ms | 5ms | 0.00029ms | PASS | stable — gate 無効 (regressionGate=false) |
| captureAccessibilityTree | 0.00063ms | 0.0031ms | 5ms | 0.00029ms | PASS | stable (換算後 p10 -5% (閾値未満)、 p95 +48% (裾は実行間の振れ幅と区別できないため判定には使わない)) — gate 無効 (regressionGate=false) |
| mockScreencap | 0.0010ms | 0.02ms | 5ms | 0.00029ms | PASS | stable (換算後 p10 +3% (閾値未満)、 p95 +266% (裾は実行間の振れ幅と区別できないため判定には使わない)) — gate 無効 (regressionGate=false) |
| emitUserNotification | 0.00038ms | 0.01ms | 5ms | 0.00030ms | PASS | stable (換算後 p10 +2% (閾値未満)、 p95 +444% (裾は実行間の振れ幅と区別できないため判定には使わない)) — gate 無効 (regressionGate=false) |

## 実行内正規化 (回帰判定はこの比で行う)

回帰判定は実測値そのものではなく、 同じ実行の中で 1 呼出ずつ交互に測った基準 op との比を読む。 実行と実行の間で機械の状態が変わっても、 その差が分子と分母で相殺される。 「換算後 p10」 は今回の比を baseline を測った時の基準 p10 で ms に戻した値で、 baseline の実測 p10 と直接比べられる。


「実行間のばらつき」 は baseline が持つ過去の比が、 baseline 自身の比からどれだけ離れたかの最大値。 その op が実装を変えずに測るだけでどれだけ動くかを表す。 判定はこの幅の 2 倍と相対閾値の大きい方を超えた差だけを有意として扱う (#1739)。 履歴が 3 件に満たない op では推定できないため n/a になり、 相対閾値だけで判定する。

| op | 基準 op | 基準 p10 | 基準 p95 | 実測 p10 | 比 | baseline の比 | 実行間のばらつき | 実効閾値 | 換算後 p10 | baseline p10 |
|---|---|---|---|---|---|---|---|---|---|---|
| createMacAppEnv | cpu | 0.09ms | 0.10ms | 0.00046ms | 0.005 | 0.005 | n/a | 20.0% | 0.00042ms | 0.00042ms |
| simulateUserInteraction | cpu | 0.09ms | 0.09ms | 0.00050ms | 0.005 | 0.006 | n/a | 20.0% | 0.00044ms | 0.00046ms |
| captureAccessibilityTree | cpu | 0.09ms | 0.12ms | 0.00063ms | 0.007 | 0.007 | n/a | 20.0% | 0.00055ms | 0.00058ms |
| mockScreencap | cpu | 0.09ms | 0.15ms | 0.0010ms | 0.011 | 0.011 | n/a | 20.0% | 0.00090ms | 0.00088ms |
| emitUserNotification | cpu | 0.09ms | 0.15ms | 0.00038ms | 0.004 | 0.004 | n/a | 20.0% | 0.00034ms | 0.00033ms |

## Concurrent p95 (concurrency = 10, 50 iter each)

| op | p95 | cap | gate |
|---|---|---|---|
| createMacAppEnv | 0.01ms | 10ms | PASS |
| simulateUserInteraction | 0.01ms | 10ms | PASS |
| captureAccessibilityTree | 0.01ms | 10ms | PASS |
| mockScreencap | 0.05ms | 10ms | PASS |
| emitUserNotification | 0.01ms | 10ms | PASS |

## Memory retention (200 iter, arrayBuffers axis is the gate; heap is informational)

| op | heapUsed Δ | arrayBuffers Δ | cap | gc exposed | 呼出 (空回し + 反復) | verdict |
|---|---|---|---|---|---|---|
| createMacAppEnv | -9160 B | 0 B | 102400 B | yes | 220 (20 + 200) | PASS |
| simulateUserInteraction | 15640 B | 0 B | 102400 B | yes | 220 (20 + 200) | PASS |
| captureAccessibilityTree | 13760 B | 0 B | 102400 B | yes | 220 (20 + 200) | PASS |
| mockScreencap | 744 B | -113240 B | 102400 B | yes | 220 (20 + 200) | PASS |
| emitUserNotification | 32976 B | 0 B | 102400 B | yes | 220 (20 + 200) | PASS |

## Detailed serial reports

### createMacAppEnv

# Perf Report — createMacAppEnv.serial

| metric | value |
|---|---|
| iterations | 200 |
| warmup | 5 |
| p10 | 0.00046ms |
| p50 | 0.00050ms |
| p95 | 0.0018ms |
| p99 | 0.0055ms |
| mean | 0.00078ms |
| stdev | 0.0013ms |
| min | 0.00046ms |
| max | 0.01ms |
| total | 0.16ms |

## Baseline diff

current は baseline を測った時の機械の速さへ換算済み (倍率 0.923)。 回帰判定が読む量と同じ。 実測値は上表。

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.00042ms | 0.00042ms | +0.0000057ms | +1.38% |
| p50 | 0.00046ms | 0.00050ms | -0.000038ms | -7.70% |
| p95 | 0.0016ms | 0.0033ms | -0.0016ms | -49.54% |
| p99 | 0.0051ms | 0.02ms | -0.01ms | -68.12% |
| mean | 0.00072ms | 0.0012ms | -0.00045ms | -38.48% |
| min | 0.00042ms | 0.00038ms | +0.000048ms | +12.73% |
| max | 0.01ms | 0.03ms | -0.01ms | -52.43% |
| total | 0.14ms | 0.24ms | -0.09ms | -38.48% |

### simulateUserInteraction

# Perf Report — simulateUserInteraction.serial

| metric | value |
|---|---|
| iterations | 200 |
| warmup | 5 |
| p10 | 0.00050ms |
| p50 | 0.00054ms |
| p95 | 0.0014ms |
| p99 | 0.0084ms |
| mean | 0.00083ms |
| stdev | 0.0018ms |
| min | 0.00046ms |
| max | 0.02ms |
| total | 0.17ms |

## Baseline diff

current は baseline を測った時の機械の速さへ換算済み (倍率 0.878)。 回帰判定が読む量と同じ。 実測値は上表。

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.00044ms | 0.00046ms | -0.000019ms | -4.15% |
| p50 | 0.00048ms | 0.00048ms | -0.0000036ms | -0.76% |
| p95 | 0.0012ms | 0.0016ms | -0.00035ms | -22.12% |
| p99 | 0.0073ms | 0.0044ms | +0.0030ms | +68.20% |
| mean | 0.00073ms | 0.00075ms | -0.000020ms | -2.65% |
| min | 0.00040ms | 0.00042ms | -0.000014ms | -3.34% |
| max | 0.02ms | 0.02ms | -0.0021ms | -9.97% |
| total | 0.15ms | 0.15ms | -0.0040ms | -2.65% |

### captureAccessibilityTree

# Perf Report — captureAccessibilityTree.serial

| metric | value |
|---|---|
| iterations | 200 |
| warmup | 5 |
| p10 | 0.00063ms |
| p50 | 0.00083ms |
| p95 | 0.0031ms |
| p99 | 0.02ms |
| mean | 0.0015ms |
| stdev | 0.0032ms |
| min | 0.00058ms |
| max | 0.03ms |
| total | 0.30ms |

## Baseline diff

current は baseline を測った時の機械の速さへ換算済み (倍率 0.888)。 回帰判定が読む量と同じ。 実測値は上表。

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.00055ms | 0.00058ms | -0.000029ms | -4.96% |
| p50 | 0.00074ms | 0.00075ms | -0.0000095ms | -1.26% |
| p95 | 0.0027ms | 0.0018ms | +0.00088ms | +47.85% |
| p99 | 0.02ms | 0.0053ms | +0.01ms | +202.15% |
| mean | 0.0013ms | 0.0011ms | +0.00022ms | +19.92% |
| min | 0.00052ms | 0.00050ms | +0.000018ms | +3.53% |
| max | 0.03ms | 0.03ms | +0.00016ms | +0.60% |
| total | 0.26ms | 0.22ms | +0.04ms | +19.92% |

### mockScreencap

# Perf Report — mockScreencap.serial

| metric | value |
|---|---|
| iterations | 200 |
| warmup | 5 |
| p10 | 0.0010ms |
| p50 | 0.0012ms |
| p95 | 0.02ms |
| p99 | 0.03ms |
| mean | 0.0049ms |
| stdev | 0.02ms |
| min | 0.00096ms |
| max | 0.22ms |
| total | 0.97ms |

## Baseline diff

current は baseline を測った時の機械の速さへ換算済み (倍率 0.864)。 回帰判定が読む量と同じ。 実測値は上表。

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.00090ms | 0.00088ms | +0.000024ms | +2.77% |
| p50 | 0.0010ms | 0.00096ms | +0.000068ms | +7.07% |
| p95 | 0.02ms | 0.0042ms | +0.01ms | +266.23% |
| p99 | 0.03ms | 0.0075ms | +0.02ms | +264.66% |
| mean | 0.0042ms | 0.0016ms | +0.0026ms | +158.17% |
| min | 0.00083ms | 0.00083ms | -0.0000055ms | -0.66% |
| max | 0.19ms | 0.02ms | +0.17ms | +822.18% |
| total | 0.84ms | 0.33ms | +0.51ms | +158.17% |

### emitUserNotification

# Perf Report — emitUserNotification.serial

| metric | value |
|---|---|
| iterations | 200 |
| warmup | 5 |
| p10 | 0.00038ms |
| p50 | 0.00050ms |
| p95 | 0.01ms |
| p99 | 0.02ms |
| mean | 0.0036ms |
| stdev | 0.02ms |
| min | 0.00033ms |
| max | 0.28ms |
| total | 0.72ms |

## Baseline diff

current は baseline を測った時の機械の速さへ換算済み (倍率 0.902)。 回帰判定が読む量と同じ。 実測値は上表。

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.00034ms | 0.00033ms | +0.0000051ms | +1.55% |
| p50 | 0.00045ms | 0.00038ms | +0.000076ms | +20.23% |
| p95 | 0.0098ms | 0.0018ms | +0.0080ms | +443.62% |
| p99 | 0.02ms | 0.0091ms | +0.01ms | +134.88% |
| mean | 0.0033ms | 0.00071ms | +0.0026ms | +361.61% |
| min | 0.00030ms | 0.00029ms | +0.0000093ms | +3.19% |
| max | 0.25ms | 0.01ms | +0.24ms | +2036.67% |
| total | 0.65ms | 0.14ms | +0.51ms | +361.61% |

