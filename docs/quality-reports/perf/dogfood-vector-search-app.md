# Perf Suite — dogfood-vector-search-app

Threshold source: [docs/quality/perf-thresholds.md](../../quality/perf-thresholds)

測定系の分解能 = 0.00042ms (何もしない関数を同じ経路で呼んだ時の p10)。 回帰判定の絶対下限は既定でこの 2 倍 = 0.00083ms、 op ごとの実効値は下表の「下限」 列。

## Serial (concurrency = 1)

| op | p10 (回帰判定) | p95 (上限判定) | cap | 下限 | gate | regression |
|---|---|---|---|---|---|---|
| driveIndexBuild | 0.0015ms | 0.0082ms | 80ms | 0.00083ms | PASS | stable (p10 +3% (閾値未満)、 p95 +28% (裾は実行間の振れ幅と区別できないため判定には使わない)) — gate 無効 (regressionGate=false) |
| driveSemanticSearch | 0.0022ms | 0.0068ms | 100ms | 0.00083ms | PASS | stable — gate 無効 (regressionGate=false) |
| driveHybridSearch | 0.0028ms | 0.0059ms | 100ms | 0.00083ms | PASS | stable — gate 無効 (regressionGate=false) |
| driveCacheHitRate | 0.0025ms | 0.0059ms | 100ms | 0.00083ms | PASS | stable (p10 +7% (閾値未満)、 p95 +21% (裾は実行間の振れ幅と区別できないため判定には使わない)) — gate 無効 (regressionGate=false) |

## Concurrent p95 (concurrency = 10, 50 iter each)

| op | p95 | cap | gate |
|---|---|---|---|
| driveIndexBuild | 0.04ms | 160ms | PASS |
| driveSemanticSearch | 0.04ms | 200ms | PASS |
| driveHybridSearch | 0.17ms | 200ms | PASS |
| driveCacheHitRate | 0.04ms | 200ms | PASS |

## Memory retention (200 iter, arrayBuffers axis is the gate; heap is informational)

| op | heapUsed Δ | arrayBuffers Δ | cap | gc exposed | verdict |
|---|---|---|---|---|---|
| driveIndexBuild | -13136 B | 0 B | 102400 B | yes | PASS |
| driveSemanticSearch | -8168 B | 0 B | 102400 B | yes | PASS |
| driveHybridSearch | -760 B | 0 B | 102400 B | yes | PASS |
| driveCacheHitRate | -8816 B | 0 B | 102400 B | yes | PASS |

## Detailed serial reports

### driveIndexBuild

# Perf Report — driveIndexBuild.serial

| metric | value |
|---|---|
| iterations | 200 |
| warmup | 5 |
| p10 | 0.0015ms |
| p50 | 0.0021ms |
| p95 | 0.0082ms |
| p99 | 0.02ms |
| mean | 0.0029ms |
| stdev | 0.0033ms |
| min | 0.0015ms |
| max | 0.03ms |
| total | 0.58ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.0015ms | 0.0015ms | +0.000042ms | +2.80% |
| p50 | 0.0021ms | 0.0017ms | +0.00046ms | +27.47% |
| p95 | 0.0082ms | 0.0064ms | +0.0018ms | +28.16% |
| p99 | 0.02ms | 0.02ms | -0.0012ms | -6.43% |
| mean | 0.0029ms | 0.0026ms | +0.00029ms | +11.27% |
| min | 0.0015ms | 0.0015ms | -0.000042ms | -2.80% |
| max | 0.03ms | 0.03ms | +0.0041ms | +15.64% |
| total | 0.58ms | 0.52ms | +0.06ms | +11.27% |

### driveSemanticSearch

# Perf Report — driveSemanticSearch.serial

| metric | value |
|---|---|
| iterations | 200 |
| warmup | 5 |
| p10 | 0.0022ms |
| p50 | 0.0023ms |
| p95 | 0.0068ms |
| p99 | 0.02ms |
| mean | 0.0030ms |
| stdev | 0.0025ms |
| min | 0.0021ms |
| max | 0.02ms |
| total | 0.60ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.0022ms | 0.0022ms | -0.000083ms | -3.69% |
| p50 | 0.0023ms | 0.0024ms | -0.000084ms | -3.54% |
| p95 | 0.0068ms | 0.0067ms | +0.00017ms | +2.48% |
| p99 | 0.02ms | 0.01ms | +0.0026ms | +19.47% |
| mean | 0.0030ms | 0.0029ms | +0.000034ms | +1.16% |
| min | 0.0021ms | 0.0022ms | -0.00012ms | -5.66% |
| max | 0.02ms | 0.02ms | +0.0042ms | +25.07% |
| total | 0.60ms | 0.59ms | +0.0068ms | +1.16% |

### driveHybridSearch

# Perf Report — driveHybridSearch.serial

| metric | value |
|---|---|
| iterations | 200 |
| warmup | 5 |
| p10 | 0.0028ms |
| p50 | 0.0030ms |
| p95 | 0.0059ms |
| p99 | 0.02ms |
| mean | 0.0042ms |
| stdev | 0.0079ms |
| min | 0.0027ms |
| max | 0.11ms |
| total | 0.85ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.0028ms | 0.0024ms | +0.00042ms | +17.21% |
| p50 | 0.0030ms | 0.0025ms | +0.00046ms | +18.06% |
| p95 | 0.0059ms | 0.0064ms | -0.00049ms | -7.67% |
| p99 | 0.02ms | 0.01ms | +0.0054ms | +39.73% |
| mean | 0.0042ms | 0.0031ms | +0.0011ms | +36.16% |
| min | 0.0027ms | 0.0024ms | +0.00037ms | +15.79% |
| max | 0.11ms | 0.02ms | +0.09ms | +470.45% |
| total | 0.85ms | 0.62ms | +0.23ms | +36.16% |

### driveCacheHitRate

# Perf Report — driveCacheHitRate.serial

| metric | value |
|---|---|
| iterations | 200 |
| warmup | 5 |
| p10 | 0.0025ms |
| p50 | 0.0027ms |
| p95 | 0.0059ms |
| p99 | 0.01ms |
| mean | 0.0037ms |
| stdev | 0.0025ms |
| min | 0.0025ms |
| max | 0.03ms |
| total | 0.74ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.0025ms | 0.0024ms | +0.00017ms | +6.99% |
| p50 | 0.0027ms | 0.0025ms | +0.00027ms | +11.05% |
| p95 | 0.0059ms | 0.0049ms | +0.0010ms | +20.61% |
| p99 | 0.01ms | 0.01ms | +0.00079ms | +5.59% |
| mean | 0.0037ms | 0.0032ms | +0.00053ms | +16.68% |
| min | 0.0025ms | 0.0023ms | +0.00013ms | +5.40% |
| max | 0.03ms | 0.02ms | +0.0066ms | +33.97% |
| total | 0.74ms | 0.64ms | +0.11ms | +16.68% |

