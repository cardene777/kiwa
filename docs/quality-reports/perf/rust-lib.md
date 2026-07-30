# Perf Suite — rust-lib

Threshold source: [docs/quality/perf-thresholds.md](../../quality/perf-thresholds)

測定系の分解能 = 0.00017ms (何もしない関数を同じ経路で呼んだ時の p10)。 回帰判定の絶対下限は既定でこの 2 倍 = 0.00033ms、 op ごとの実効値は下表の「下限」 列。

## Serial (concurrency = 1)

| op | p10 (実測) | p95 (上限判定) | cap | 下限 | gate | regression |
|---|---|---|---|---|---|---|
| invokeAxumHandler | 0.00046ms | 0.0036ms | 5ms | 0.00033ms | PASS | stable — gate 無効 (regressionGate=false) |
| invokeActixHandler | 0.00046ms | 0.0022ms | 5ms | 0.00033ms | PASS | stable — gate 無効 (regressionGate=false) |
| captureTowerMiddleware | 0.00058ms | 0.0044ms | 5ms | 0.00032ms | PASS | stable (換算後 p10 -3% (閾値未満)、 p95 +31% (裾は実行間の振れ幅と区別できないため判定には使わない)) — gate 無効 (regressionGate=false) |
| invokeRocketRoute | 0.00050ms | 0.0031ms | 5ms | 0.00033ms | PASS | stable (換算後 p10 -1% (閾値未満)、 p95 +43% (裾は実行間の振れ幅と区別できないため判定には使わない)) — gate 無効 (regressionGate=false) |

## 実行内正規化 (回帰判定はこの比で行う)

回帰判定は実測値そのものではなく、 同じ実行の中で 1 呼出ずつ交互に測った基準 op との比を読む。 実行と実行の間で機械の状態が変わっても、 その差が分子と分母で相殺される。 「換算後 p10」 は今回の比を baseline を測った時の基準 p10 で ms に戻した値で、 baseline の実測 p10 と直接比べられる。

| op | 基準 op | 基準 p10 | 基準 p95 | 実測 p10 | 比 | baseline の比 | 換算後 p10 | baseline p10 |
|---|---|---|---|---|---|---|---|---|
| invokeAxumHandler | cpu | 0.08ms | 0.09ms | 0.00046ms | 0.006 | 0.006 | 0.00045ms | 0.00046ms |
| invokeActixHandler | cpu | 0.08ms | 0.09ms | 0.00046ms | 0.006 | 0.006 | 0.00046ms | 0.00050ms |
| captureTowerMiddleware | cpu | 0.08ms | 0.11ms | 0.00058ms | 0.007 | 0.007 | 0.00056ms | 0.00058ms |
| invokeRocketRoute | cpu | 0.08ms | 0.09ms | 0.00050ms | 0.006 | 0.006 | 0.00049ms | 0.00050ms |

## Concurrent p95 (concurrency = 10, 50 iter each)

| op | p95 | cap | gate |
|---|---|---|---|
| invokeAxumHandler | 0.02ms | 10ms | PASS |
| invokeActixHandler | 0.01ms | 10ms | PASS |
| captureTowerMiddleware | 0.02ms | 10ms | PASS |
| invokeRocketRoute | 0.02ms | 10ms | PASS |

## Memory retention (200 iter, arrayBuffers axis is the gate; heap is informational)

| op | heapUsed Δ | arrayBuffers Δ | cap | gc exposed | verdict |
|---|---|---|---|---|---|
| invokeAxumHandler | -9856 B | 0 B | 102400 B | yes | PASS |
| invokeActixHandler | 1856 B | 0 B | 102400 B | yes | PASS |
| captureTowerMiddleware | 1648 B | 0 B | 102400 B | yes | PASS |
| invokeRocketRoute | 5136 B | 0 B | 102400 B | yes | PASS |

## Detailed serial reports

### invokeAxumHandler

# Perf Report — invokeAxumHandler.serial

| metric | value |
|---|---|
| iterations | 200 |
| warmup | 5 |
| p10 | 0.00046ms |
| p50 | 0.00050ms |
| p95 | 0.0036ms |
| p99 | 0.01ms |
| mean | 0.0012ms |
| stdev | 0.0025ms |
| min | 0.00042ms |
| max | 0.02ms |
| total | 0.24ms |

## Baseline diff

current は baseline を測った時の機械の速さへ換算済み (倍率 0.992)。 回帰判定が読む量と同じ。 実測値は上表。

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.00045ms | 0.00046ms | -0.0000037ms | -0.81% |
| p50 | 0.00050ms | 0.00050ms | -0.0000041ms | -0.81% |
| p95 | 0.0036ms | 0.0039ms | -0.00032ms | -8.05% |
| p99 | 0.01ms | 0.01ms | +0.0017ms | +16.20% |
| mean | 0.0012ms | 0.0012ms | +0.000038ms | +3.23% |
| min | 0.00041ms | 0.00042ms | -0.0000044ms | -1.05% |
| max | 0.02ms | 0.01ms | +0.0054ms | +40.08% |
| total | 0.24ms | 0.23ms | +0.0076ms | +3.23% |

### invokeActixHandler

# Perf Report — invokeActixHandler.serial

| metric | value |
|---|---|
| iterations | 200 |
| warmup | 5 |
| p10 | 0.00046ms |
| p50 | 0.00050ms |
| p95 | 0.0022ms |
| p99 | 0.0059ms |
| mean | 0.00082ms |
| stdev | 0.0013ms |
| min | 0.00046ms |
| max | 0.01ms |
| total | 0.16ms |

## Baseline diff

current は baseline を測った時の機械の速さへ換算済み (倍率 1.006)。 回帰判定が読む量と同じ。 実測値は上表。

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.00046ms | 0.00050ms | -0.000035ms | -7.12% |
| p50 | 0.00050ms | 0.00050ms | +0.0000028ms | +0.56% |
| p95 | 0.0022ms | 0.0020ms | +0.00020ms | +10.01% |
| p99 | 0.0059ms | 0.0091ms | -0.0032ms | -35.13% |
| mean | 0.00082ms | 0.00083ms | -0.0000010ms | -0.13% |
| min | 0.00046ms | 0.00046ms | +0.0000026ms | +0.56% |
| max | 0.01ms | 0.02ms | -0.0053ms | -28.43% |
| total | 0.16ms | 0.17ms | -0.00021ms | -0.13% |

### captureTowerMiddleware

# Perf Report — captureTowerMiddleware.serial

| metric | value |
|---|---|
| iterations | 200 |
| warmup | 5 |
| p10 | 0.00058ms |
| p50 | 0.00063ms |
| p95 | 0.0044ms |
| p99 | 0.01ms |
| mean | 0.0015ms |
| stdev | 0.0053ms |
| min | 0.00054ms |
| max | 0.07ms |
| total | 0.31ms |

## Baseline diff

current は baseline を測った時の機械の速さへ換算済み (倍率 0.967)。 回帰判定が読む量と同じ。 実測値は上表。

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.00056ms | 0.00058ms | -0.000019ms | -3.32% |
| p50 | 0.00060ms | 0.00063ms | -0.000021ms | -3.32% |
| p95 | 0.0042ms | 0.0032ms | +0.0010ms | +31.25% |
| p99 | 0.01ms | 0.01ms | +0.0026ms | +23.91% |
| mean | 0.0015ms | 0.0010ms | +0.00045ms | +43.21% |
| min | 0.00052ms | 0.00054ms | -0.000018ms | -3.32% |
| max | 0.07ms | 0.01ms | +0.06ms | +440.40% |
| total | 0.30ms | 0.21ms | +0.09ms | +43.21% |

### invokeRocketRoute

# Perf Report — invokeRocketRoute.serial

| metric | value |
|---|---|
| iterations | 200 |
| warmup | 5 |
| p10 | 0.00050ms |
| p50 | 0.00054ms |
| p95 | 0.0031ms |
| p99 | 0.0076ms |
| mean | 0.00099ms |
| stdev | 0.0016ms |
| min | 0.00050ms |
| max | 0.01ms |
| total | 0.20ms |

## Baseline diff

current は baseline を測った時の機械の速さへ換算済み (倍率 0.986)。 回帰判定が読む量と同じ。 実測値は上表。

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.00049ms | 0.00050ms | -0.0000068ms | -1.36% |
| p50 | 0.00053ms | 0.00054ms | -0.0000064ms | -1.18% |
| p95 | 0.0031ms | 0.0021ms | +0.00093ms | +43.37% |
| p99 | 0.0075ms | 0.0061ms | +0.0015ms | +24.32% |
| mean | 0.00098ms | 0.00081ms | +0.00017ms | +20.53% |
| min | 0.00049ms | 0.00046ms | +0.000035ms | +7.68% |
| max | 0.01ms | 0.01ms | +0.00014ms | +0.98% |
| total | 0.20ms | 0.16ms | +0.03ms | +20.53% |

