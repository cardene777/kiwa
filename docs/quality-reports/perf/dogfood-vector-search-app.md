# Perf Suite — dogfood-vector-search-app

Threshold source: [docs/quality/perf-thresholds.md](../../quality/perf-thresholds)

測定系の分解能 = 0.00017ms (何もしない関数を同じ経路で呼んだ時の p10)。 回帰判定の絶対下限は既定でこの 2 倍 = 0.00033ms、 op ごとの実効値は下表の「下限」 列。

## Serial (concurrency = 1)

| op | p10 (実測) | p95 (上限判定) | cap | 下限 | gate | regression |
|---|---|---|---|---|---|---|
| driveIndexBuild | 0.0015ms | 0.01ms | 80ms | 0.00032ms | PASS | stable — gate 無効 (regressionGate=false) |
| driveSemanticSearch | 0.0018ms | 0.01ms | 100ms | 0.00031ms | PASS | stable (換算後 p10 +3% (閾値未満)、 p95 +39% (裾は実行間の振れ幅と区別できないため判定には使わない)) — gate 無効 (regressionGate=false) |
| driveHybridSearch | 0.0025ms | 0.0094ms | 100ms | 0.00032ms | PASS | stable (換算後 p10 -1% (閾値未満)、 p95 +54% (裾は実行間の振れ幅と区別できないため判定には使わない)) — gate 無効 (regressionGate=false) |
| driveCacheHitRate | 0.0025ms | 0.0044ms | 100ms | 0.00031ms | PASS | stable — gate 無効 (regressionGate=false) |

## 実行内正規化 (回帰判定はこの比で行う)

回帰判定は実測値そのものではなく、 同じ実行の中で 1 呼出ずつ交互に測った基準 op との比を読む。 実行と実行の間で機械の状態が変わっても、 その差が分子と分母で相殺される。 「換算後 p10」 は今回の比を baseline を測った時の基準 p10 で ms に戻した値で、 baseline の実測 p10 と直接比べられる。

| op | 基準 op | 基準 p10 | 基準 p95 | 実測 p10 | 比 | baseline の比 | 換算後 p10 | baseline p10 |
|---|---|---|---|---|---|---|---|---|
| driveIndexBuild | cpu | 0.08ms | 0.09ms | 0.0015ms | 0.018 | 0.019 | 0.0015ms | 0.0015ms |
| driveSemanticSearch | cpu | 0.08ms | 0.10ms | 0.0018ms | 0.022 | 0.021 | 0.0017ms | 0.0017ms |
| driveHybridSearch | cpu | 0.08ms | 0.09ms | 0.0025ms | 0.030 | 0.030 | 0.0024ms | 0.0024ms |
| driveCacheHitRate | cpu | 0.09ms | 0.09ms | 0.0025ms | 0.029 | 0.029 | 0.0024ms | 0.0024ms |

## Concurrent p95 (concurrency = 10, 50 iter each)

| op | p95 | cap | gate |
|---|---|---|---|
| driveIndexBuild | 0.05ms | 160ms | PASS |
| driveSemanticSearch | 0.21ms | 200ms | PASS |
| driveHybridSearch | 0.13ms | 200ms | PASS |
| driveCacheHitRate | 0.04ms | 200ms | PASS |

## Memory retention (200 iter, arrayBuffers axis is the gate; heap is informational)

| op | heapUsed Δ | arrayBuffers Δ | cap | gc exposed | verdict |
|---|---|---|---|---|---|
| driveIndexBuild | 4184 B | 0 B | 102400 B | yes | PASS |
| driveSemanticSearch | 560 B | 0 B | 102400 B | yes | PASS |
| driveHybridSearch | -3080 B | 0 B | 102400 B | yes | PASS |
| driveCacheHitRate | -456 B | 0 B | 102400 B | yes | PASS |

## Detailed serial reports

### driveIndexBuild

# Perf Report — driveIndexBuild.serial

| metric | value |
|---|---|
| iterations | 200 |
| warmup | 5 |
| p10 | 0.0015ms |
| p50 | 0.0018ms |
| p95 | 0.01ms |
| p99 | 0.03ms |
| mean | 0.0035ms |
| stdev | 0.0053ms |
| min | 0.0015ms |
| max | 0.04ms |
| total | 0.70ms |

## Baseline diff

current は baseline を測った時の機械の速さへ換算済み (倍率 0.979)。 回帰判定が読む量と同じ。 実測値は上表。

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.0015ms | 0.0015ms | -0.000073ms | -4.75% |
| p50 | 0.0018ms | 0.0021ms | -0.00027ms | -13.04% |
| p95 | 0.01ms | 0.01ms | +0.0019ms | +17.27% |
| p99 | 0.03ms | 0.02ms | +0.0063ms | +27.13% |
| mean | 0.0034ms | 0.0034ms | +0.0000099ms | +0.29% |
| min | 0.0014ms | 0.0015ms | -0.000031ms | -2.15% |
| max | 0.04ms | 0.03ms | +0.01ms | +44.13% |
| total | 0.68ms | 0.68ms | +0.0020ms | +0.29% |

### driveSemanticSearch

# Perf Report — driveSemanticSearch.serial

| metric | value |
|---|---|
| iterations | 200 |
| warmup | 5 |
| p10 | 0.0018ms |
| p50 | 0.0024ms |
| p95 | 0.01ms |
| p99 | 0.03ms |
| mean | 0.0035ms |
| stdev | 0.0046ms |
| min | 0.0017ms |
| max | 0.04ms |
| total | 0.71ms |

## Baseline diff

current は baseline を測った時の機械の速さへ換算済み (倍率 0.940)。 回帰判定が読む量と同じ。 実測値は上表。

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.0017ms | 0.0017ms | +0.000055ms | +3.31% |
| p50 | 0.0023ms | 0.0022ms | +0.000081ms | +3.67% |
| p95 | 0.0099ms | 0.0072ms | +0.0028ms | +38.68% |
| p99 | 0.03ms | 0.02ms | +0.0092ms | +54.93% |
| mean | 0.0033ms | 0.0031ms | +0.00022ms | +6.97% |
| min | 0.0016ms | 0.0016ms | -0.000020ms | -1.25% |
| max | 0.04ms | 0.04ms | -0.0089ms | -20.25% |
| total | 0.66ms | 0.62ms | +0.04ms | +6.97% |

### driveHybridSearch

# Perf Report — driveHybridSearch.serial

| metric | value |
|---|---|
| iterations | 200 |
| warmup | 5 |
| p10 | 0.0025ms |
| p50 | 0.0028ms |
| p95 | 0.0094ms |
| p99 | 0.02ms |
| mean | 0.0039ms |
| stdev | 0.0043ms |
| min | 0.0024ms |
| max | 0.04ms |
| total | 0.79ms |

## Baseline diff

current は baseline を測った時の機械の速さへ換算済み (倍率 0.956)。 回帰判定が読む量と同じ。 実測値は上表。

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.0024ms | 0.0024ms | -0.000027ms | -1.12% |
| p50 | 0.0027ms | 0.0025ms | +0.00017ms | +6.54% |
| p95 | 0.0090ms | 0.0058ms | +0.0032ms | +54.06% |
| p99 | 0.02ms | 0.02ms | -0.0027ms | -11.35% |
| mean | 0.0038ms | 0.0035ms | +0.00031ms | +8.99% |
| min | 0.0023ms | 0.0023ms | -0.000023ms | -1.00% |
| max | 0.03ms | 0.04ms | -0.0036ms | -9.52% |
| total | 0.75ms | 0.69ms | +0.06ms | +8.99% |

### driveCacheHitRate

# Perf Report — driveCacheHitRate.serial

| metric | value |
|---|---|
| iterations | 200 |
| warmup | 5 |
| p10 | 0.0025ms |
| p50 | 0.0026ms |
| p95 | 0.0044ms |
| p99 | 0.01ms |
| mean | 0.0032ms |
| stdev | 0.0023ms |
| min | 0.0025ms |
| max | 0.02ms |
| total | 0.63ms |

## Baseline diff

current は baseline を測った時の機械の速さへ換算済み (倍率 0.938)。 回帰判定が読む量と同じ。 実測値は上表。

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.0024ms | 0.0024ms | +0.0000094ms | +0.40% |
| p50 | 0.0025ms | 0.0025ms | +0.0000043ms | +0.17% |
| p95 | 0.0041ms | 0.0089ms | -0.0048ms | -54.08% |
| p99 | 0.01ms | 0.02ms | -0.0098ms | -41.13% |
| mean | 0.0030ms | 0.0035ms | -0.00055ms | -15.64% |
| min | 0.0023ms | 0.0023ms | -0.000026ms | -1.13% |
| max | 0.02ms | 0.03ms | -0.0086ms | -29.22% |
| total | 0.59ms | 0.70ms | -0.11ms | -15.64% |

