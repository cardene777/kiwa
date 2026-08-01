# Perf Suite — go-lib

Threshold source: [docs/quality/perf-thresholds.md](../../quality/perf-thresholds)

測定系の分解能 = 0.00021ms (何もしない関数を同じ経路で呼んだ時の p10)。 回帰判定の絶対下限は既定でこの 2 倍 = 0.00042ms、 op ごとの実効値は下表の「下限」 列。

## Serial (concurrency = 1)

| op | p10 (実測) | p95 (上限判定) | cap | 下限 | gate | regression |
|---|---|---|---|---|---|---|
| invokeGinHandler | 0.00042ms | 0.0043ms | 5ms | 0.00036ms | PASS | stable — gate 無効 (regressionGate=false) |
| invokeEchoHandler | 0.00050ms | 0.0077ms | 5ms | 0.00037ms | PASS | stable (換算後 p10 -4% (閾値未満)、 p95 +231% (裾は実行間の振れ幅と区別できないため判定には使わない)) — gate 無効 (regressionGate=false) |
| invokeFiberHandler | 0.00058ms | 0.0045ms | 5ms | 0.00036ms | PASS | stable (換算後 p10 +2% (閾値未満)、 p95 +67% (裾は実行間の振れ幅と区別できないため判定には使わない)) — gate 無効 (regressionGate=false) |
| captureChiRoute | 0.00083ms | 0.01ms | 5ms | 0.00037ms | PASS | stable (換算後 p10 +4% (閾値未満)、 p95 +134% (裾は実行間の振れ幅と区別できないため判定には使わない)) — gate 無効 (regressionGate=false) |

## 実行内正規化 (回帰判定はこの比で行う)

回帰判定は実測値そのものではなく、 同じ実行の中で 1 呼出ずつ交互に測った基準 op との比を読む。 実行と実行の間で機械の状態が変わっても、 その差が分子と分母で相殺される。 「換算後 p10」 は今回の比を baseline を測った時の基準 p10 で ms に戻した値で、 baseline の実測 p10 と直接比べられる。


「実行間のばらつき」 は baseline が持つ過去の比が、 baseline 自身の比からどれだけ離れたかの最大値。 その op が実装を変えずに測るだけでどれだけ動くかを表す。 判定はこの幅の 2 倍と相対閾値の大きい方を超えた差だけを有意として扱う (#1739)。 履歴が 3 件に満たない op では推定できないため n/a になり、 相対閾値だけで判定する。

| op | 基準 op | 基準 p10 | 基準 p95 | 実測 p10 | 比 | baseline の比 | 実行間のばらつき | 実効閾値 | 換算後 p10 | baseline p10 |
|---|---|---|---|---|---|---|---|---|---|---|
| invokeGinHandler | cpu | 0.09ms | 0.14ms | 0.00042ms | 0.004 | 0.005 | n/a | 20.0% | 0.00036ms | 0.00038ms |
| invokeEchoHandler | cpu | 0.09ms | 0.12ms | 0.00050ms | 0.005 | 0.006 | n/a | 20.0% | 0.00044ms | 0.00046ms |
| invokeFiberHandler | cpu | 0.09ms | 0.10ms | 0.00058ms | 0.006 | 0.006 | n/a | 20.0% | 0.00051ms | 0.00050ms |
| captureChiRoute | cpu | 0.09ms | 0.22ms | 0.00083ms | 0.009 | 0.009 | n/a | 20.0% | 0.00074ms | 0.00071ms |

## Concurrent p95 (concurrency = 10, 50 iter each)

| op | p95 | cap | gate |
|---|---|---|---|
| invokeGinHandler | 0.18ms | 10ms | PASS |
| invokeEchoHandler | 0.01ms | 10ms | PASS |
| invokeFiberHandler | 0.02ms | 10ms | PASS |
| captureChiRoute | 0.02ms | 10ms | PASS |

## Memory retention (200 iter, arrayBuffers axis is the gate; heap is informational)

| op | heapUsed Δ | arrayBuffers Δ | cap | gc exposed | 呼出 (空回し + 反復) | verdict |
|---|---|---|---|---|---|---|
| invokeGinHandler | -17328 B | 0 B | 102400 B | yes | 220 (20 + 200) | PASS |
| invokeEchoHandler | -30720 B | 0 B | 102400 B | yes | 220 (20 + 200) | PASS |
| invokeFiberHandler | -1512 B | 0 B | 102400 B | yes | 220 (20 + 200) | PASS |
| captureChiRoute | -288 B | 0 B | 102400 B | yes | 220 (20 + 200) | PASS |

## Detailed serial reports

### invokeGinHandler

# Perf Report — invokeGinHandler.serial

| metric | value |
|---|---|
| iterations | 200 |
| warmup | 5 |
| p10 | 0.00042ms |
| p50 | 0.00050ms |
| p95 | 0.0043ms |
| p99 | 0.01ms |
| mean | 0.0012ms |
| stdev | 0.0022ms |
| min | 0.00038ms |
| max | 0.02ms |
| total | 0.23ms |

## Baseline diff

current は baseline を測った時の機械の速さへ換算済み (倍率 0.861)。 回帰判定が読む量と同じ。 実測値は上表。

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.00036ms | 0.00038ms | -0.000016ms | -4.28% |
| p50 | 0.00043ms | 0.00042ms | +0.000014ms | +3.34% |
| p95 | 0.0037ms | 0.0034ms | +0.00028ms | +8.17% |
| p99 | 0.01ms | 0.0088ms | +0.0024ms | +27.81% |
| mean | 0.0010ms | 0.00091ms | +0.000093ms | +10.25% |
| min | 0.00032ms | 0.00033ms | -0.000010ms | -3.06% |
| max | 0.01ms | 0.01ms | +0.0044ms | +41.64% |
| total | 0.20ms | 0.18ms | +0.02ms | +10.25% |

### invokeEchoHandler

# Perf Report — invokeEchoHandler.serial

| metric | value |
|---|---|
| iterations | 200 |
| warmup | 5 |
| p10 | 0.00050ms |
| p50 | 0.00054ms |
| p95 | 0.0077ms |
| p99 | 0.01ms |
| mean | 0.0014ms |
| stdev | 0.0037ms |
| min | 0.00046ms |
| max | 0.04ms |
| total | 0.29ms |

## Baseline diff

current は baseline を測った時の機械の速さへ換算済み (倍率 0.882)。 回帰判定が読む量と同じ。 実測値は上表。

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.00044ms | 0.00046ms | -0.000017ms | -3.76% |
| p50 | 0.00048ms | 0.00050ms | -0.000022ms | -4.44% |
| p95 | 0.0068ms | 0.0020ms | +0.0047ms | +231.13% |
| p99 | 0.01ms | 0.0079ms | +0.0051ms | +64.21% |
| mean | 0.0013ms | 0.00082ms | +0.00046ms | +55.91% |
| min | 0.00040ms | 0.00038ms | +0.000029ms | +7.67% |
| max | 0.03ms | 0.01ms | +0.02ms | +137.78% |
| total | 0.26ms | 0.16ms | +0.09ms | +55.91% |

### invokeFiberHandler

# Perf Report — invokeFiberHandler.serial

| metric | value |
|---|---|
| iterations | 200 |
| warmup | 5 |
| p10 | 0.00058ms |
| p50 | 0.00063ms |
| p95 | 0.0045ms |
| p99 | 0.01ms |
| mean | 0.0014ms |
| stdev | 0.0032ms |
| min | 0.00054ms |
| max | 0.03ms |
| total | 0.28ms |

## Baseline diff

current は baseline を測った時の機械の速さへ換算済み (倍率 0.871)。 回帰判定が読む量と同じ。 実測値は上表。

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.00051ms | 0.00050ms | +0.0000075ms | +1.50% |
| p50 | 0.00054ms | 0.00054ms | +0.0000021ms | +0.38% |
| p95 | 0.0040ms | 0.0024ms | +0.0016ms | +66.55% |
| p99 | 0.01ms | 0.01ms | -0.0027ms | -18.54% |
| mean | 0.0012ms | 0.0010ms | +0.00018ms | +17.57% |
| min | 0.00047ms | 0.00046ms | +0.000013ms | +2.83% |
| max | 0.03ms | 0.02ms | +0.0064ms | +31.65% |
| total | 0.24ms | 0.20ms | +0.04ms | +17.57% |

### captureChiRoute

# Perf Report — captureChiRoute.serial

| metric | value |
|---|---|
| iterations | 200 |
| warmup | 5 |
| p10 | 0.00083ms |
| p50 | 0.00088ms |
| p95 | 0.01ms |
| p99 | 0.04ms |
| mean | 0.0029ms |
| stdev | 0.0056ms |
| min | 0.00079ms |
| max | 0.04ms |
| total | 0.59ms |

## Baseline diff

current は baseline を測った時の機械の速さへ換算済み (倍率 0.884)。 回帰判定が読む量と同じ。 実測値は上表。

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.00074ms | 0.00071ms | +0.000028ms | +3.99% |
| p50 | 0.00077ms | 0.00075ms | +0.000023ms | +3.12% |
| p95 | 0.01ms | 0.0045ms | +0.0061ms | +134.03% |
| p99 | 0.03ms | 0.01ms | +0.02ms | +130.01% |
| mean | 0.0026ms | 0.0014ms | +0.0012ms | +81.38% |
| min | 0.00070ms | 0.00071ms | -0.0000080ms | -1.13% |
| max | 0.03ms | 0.02ms | +0.01ms | +43.67% |
| total | 0.52ms | 0.29ms | +0.23ms | +81.38% |

