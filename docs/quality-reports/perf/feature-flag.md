# Perf Suite — feature-flag

Threshold source: [docs/quality/perf-thresholds.md](../../quality/perf-thresholds)

測定系の分解能 = 0.00021ms (何もしない関数を同じ経路で呼んだ時の p10)。 回帰判定の絶対下限は既定でこの 2 倍 = 0.00042ms、 op ごとの実効値は下表の「下限」 列。

## Serial (concurrency = 1)

| op | p10 (実測) | p95 (上限判定) | cap | 下限 | gate | regression |
|---|---|---|---|---|---|---|
| evaluateFlag | 0.00046ms | 0.0026ms | 5ms | 0.00036ms | PASS | stable — gate 無効 (regressionGate=false) |
| evaluateAllFlags | 0.0010ms | 0.0050ms | 5ms | 0.00036ms | PASS | stable (換算後 p10 -1% (閾値未満)、 p95 +119% (裾は実行間の振れ幅と区別できないため判定には使わない)) — gate 無効 (regressionGate=false) |
| registerRule | 0.00021ms | 0.0033ms | 5ms | 0.00035ms | PASS | stable (検知には +0.00035ms (baseline 比 +213%) 以上の悪化が必要) — gate 無効 (regressionGate=false) |

## 実行内正規化 (回帰判定はこの比で行う)

回帰判定は実測値そのものではなく、 同じ実行の中で 1 呼出ずつ交互に測った基準 op との比を読む。 実行と実行の間で機械の状態が変わっても、 その差が分子と分母で相殺される。 「換算後 p10」 は今回の比を baseline を測った時の基準 p10 で ms に戻した値で、 baseline の実測 p10 と直接比べられる。


「実行間のばらつき」 は baseline が持つ過去の比が、 baseline 自身の比からどれだけ離れたかの最大値。 その op が実装を変えずに測るだけでどれだけ動くかを表す。 判定はこの幅の 2 倍と相対閾値の大きい方を超えた差だけを有意として扱う (#1739)。 履歴が 3 件に満たない op では推定できないため n/a になり、 相対閾値だけで判定する。

| op | 基準 op | 基準 p10 | 基準 p95 | 実測 p10 | 比 | baseline の比 | 実行間のばらつき | 実効閾値 | 換算後 p10 | baseline p10 |
|---|---|---|---|---|---|---|---|---|---|---|
| evaluateFlag | cpu | 0.09ms | 0.10ms | 0.00046ms | 0.005 | 0.005 | n/a | 20.0% | 0.00040ms | 0.00038ms |
| evaluateAllFlags | cpu | 0.09ms | 0.12ms | 0.0010ms | 0.011 | 0.011 | n/a | 20.0% | 0.00090ms | 0.00092ms |
| registerRule | cpu | 0.09ms | 0.12ms | 0.00021ms | 0.002 | 0.002 | n/a | 20.0% | 0.00018ms | 0.00017ms |

## Concurrent p95 (concurrency = 10, 50 iter each)

| op | p95 | cap | gate |
|---|---|---|---|
| evaluateFlag | 0.02ms | 10ms | PASS |
| evaluateAllFlags | 0.02ms | 10ms | PASS |
| registerRule | 0.00ms | 10ms | PASS |

## Memory retention (200 iter, arrayBuffers axis is the gate; heap is informational)

| op | heapUsed Δ | arrayBuffers Δ | cap | gc exposed | 呼出 (空回し + 反復) | verdict |
|---|---|---|---|---|---|---|
| evaluateFlag | 20232 B | -49453 B | 102400 B | yes | 220 (20 + 200) | PASS |
| evaluateAllFlags | 87048 B | 0 B | 102400 B | yes | 220 (20 + 200) | PASS |
| registerRule | 8208 B | 0 B | 102400 B | yes | 220 (20 + 200) | PASS |

## Detailed serial reports

### evaluateFlag

# Perf Report — evaluateFlag.serial

| metric | value |
|---|---|
| iterations | 200 |
| warmup | 5 |
| p10 | 0.00046ms |
| p50 | 0.00046ms |
| p95 | 0.0026ms |
| p99 | 0.02ms |
| mean | 0.0011ms |
| stdev | 0.0025ms |
| min | 0.00038ms |
| max | 0.02ms |
| total | 0.22ms |

## Baseline diff

current は baseline を測った時の機械の速さへ換算済み (倍率 0.870)。 回帰判定が読む量と同じ。 実測値は上表。

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.00040ms | 0.00038ms | +0.000024ms | +6.27% |
| p50 | 0.00040ms | 0.00046ms | -0.000060ms | -12.99% |
| p95 | 0.0023ms | 0.0046ms | -0.0023ms | -50.65% |
| p99 | 0.01ms | 0.02ms | -0.0013ms | -8.59% |
| mean | 0.00096ms | 0.0012ms | -0.00024ms | -20.00% |
| min | 0.00033ms | 0.00038ms | -0.000049ms | -12.99% |
| max | 0.02ms | 0.02ms | -0.0064ms | -28.79% |
| total | 0.19ms | 0.24ms | -0.05ms | -20.00% |

### evaluateAllFlags

# Perf Report — evaluateAllFlags.serial

| metric | value |
|---|---|
| iterations | 200 |
| warmup | 5 |
| p10 | 0.0010ms |
| p50 | 0.0011ms |
| p95 | 0.0050ms |
| p99 | 0.02ms |
| mean | 0.0019ms |
| stdev | 0.0026ms |
| min | 0.0010ms |
| max | 0.02ms |
| total | 0.38ms |

## Baseline diff

current は baseline を測った時の機械の速さへ換算済み (倍率 0.869)。 回帰判定が読む量と同じ。 実測値は上表。

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.00090ms | 0.00092ms | -0.000013ms | -1.39% |
| p50 | 0.00094ms | 0.0010ms | -0.000058ms | -5.84% |
| p95 | 0.0043ms | 0.0020ms | +0.0024ms | +119.05% |
| p99 | 0.01ms | 0.0061ms | +0.0079ms | +128.98% |
| mean | 0.0017ms | 0.0014ms | +0.00029ms | +21.18% |
| min | 0.00087ms | 0.00088ms | -0.0000064ms | -0.73% |
| max | 0.02ms | 0.04ms | -0.02ms | -54.58% |
| total | 0.33ms | 0.28ms | +0.06ms | +21.18% |

### registerRule

# Perf Report — registerRule.serial

| metric | value |
|---|---|
| iterations | 200 |
| warmup | 5 |
| p10 | 0.00021ms |
| p50 | 0.00025ms |
| p95 | 0.0033ms |
| p99 | 0.0088ms |
| mean | 0.00078ms |
| stdev | 0.0021ms |
| min | 0.00017ms |
| max | 0.02ms |
| total | 0.16ms |

## Baseline diff

current は baseline を測った時の機械の速さへ換算済み (倍率 0.850)。 回帰判定が読む量と同じ。 実測値は上表。

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.00018ms | 0.00017ms | +0.000011ms | +6.45% |
| p50 | 0.00021ms | 0.00021ms | +0.0000044ms | +2.11% |
| p95 | 0.0028ms | 0.0024ms | +0.00042ms | +17.69% |
| p99 | 0.0075ms | 0.0058ms | +0.0016ms | +28.20% |
| mean | 0.00066ms | 0.00053ms | +0.00013ms | +25.06% |
| min | 0.00014ms | 0.00017ms | -0.000025ms | -15.05% |
| max | 0.02ms | 0.02ms | -0.00082ms | -4.18% |
| total | 0.13ms | 0.11ms | +0.03ms | +25.06% |

