# Perf Suite — dogfood-vector-search-app

Threshold source: [docs/quality/perf-thresholds.md](../../quality/perf-thresholds)

測定系の分解能 = 0.00017ms (何もしない関数を同じ経路で呼んだ時の p10)。 回帰判定の絶対下限は既定でこの 2 倍 = 0.00033ms、 op ごとの実効値は下表の「下限」 列。

## Serial (concurrency = 1)

| op | p10 (回帰判定) | p95 (上限判定) | cap | 下限 | gate | regression |
|---|---|---|---|---|---|---|
| driveIndexBuild | 0.0015ms | 0.0069ms | 80ms | 0.00033ms | PASS | stable — gate 無効 (regressionGate=false) |
| driveSemanticSearch | 0.0022ms | 0.0063ms | 100ms | 0.00033ms | PASS | stable — gate 無効 (regressionGate=false) |
| driveHybridSearch | 0.0024ms | 0.0074ms | 100ms | 0.00033ms | PASS | stable — gate 無効 (regressionGate=false) |
| driveCacheHitRate | 0.0023ms | 0.0059ms | 100ms | 0.00033ms | PASS | stable (p10 -2% (閾値未満)、 p95 +21% (裾は実行間の振れ幅と区別できないため判定には使わない)) — gate 無効 (regressionGate=false) |

## Concurrent p95 (concurrency = 10, 50 iter each)

| op | p95 | cap | gate |
|---|---|---|---|
| driveIndexBuild | 0.04ms | 160ms | PASS |
| driveSemanticSearch | 0.04ms | 200ms | PASS |
| driveHybridSearch | 0.04ms | 200ms | PASS |
| driveCacheHitRate | 0.04ms | 200ms | PASS |

## Memory retention (200 iter, arrayBuffers axis is the gate; heap is informational)

| op | heapUsed Δ | arrayBuffers Δ | cap | gc exposed | verdict |
|---|---|---|---|---|---|
| driveIndexBuild | -3608 B | 0 B | 102400 B | yes | PASS |
| driveSemanticSearch | 624 B | 0 B | 102400 B | yes | PASS |
| driveHybridSearch | -760 B | 0 B | 102400 B | yes | PASS |
| driveCacheHitRate | -424 B | 0 B | 102400 B | yes | PASS |

## Detailed serial reports

### driveIndexBuild

# Perf Report — driveIndexBuild.serial

| metric | value |
|---|---|
| iterations | 200 |
| warmup | 5 |
| p10 | 0.0015ms |
| p50 | 0.0016ms |
| p95 | 0.0069ms |
| p99 | 0.02ms |
| mean | 0.0025ms |
| stdev | 0.0031ms |
| min | 0.0014ms |
| max | 0.03ms |
| total | 0.50ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.0015ms | 0.0015ms | 0.00ms | 0.00% |
| p50 | 0.0016ms | 0.0017ms | -0.000084ms | -5.04% |
| p95 | 0.0069ms | 0.0064ms | +0.00049ms | +7.66% |
| p99 | 0.02ms | 0.02ms | -0.0018ms | -9.24% |
| mean | 0.0025ms | 0.0026ms | -0.000079ms | -3.06% |
| min | 0.0014ms | 0.0015ms | -0.000083ms | -5.53% |
| max | 0.03ms | 0.03ms | -0.000083ms | -0.31% |
| total | 0.50ms | 0.52ms | -0.02ms | -3.06% |

### driveSemanticSearch

# Perf Report — driveSemanticSearch.serial

| metric | value |
|---|---|
| iterations | 200 |
| warmup | 5 |
| p10 | 0.0022ms |
| p50 | 0.0023ms |
| p95 | 0.0063ms |
| p99 | 0.04ms |
| mean | 0.0038ms |
| stdev | 0.0082ms |
| min | 0.0022ms |
| max | 0.09ms |
| total | 0.76ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.0022ms | 0.0022ms | 0.00ms | 0.00% |
| p50 | 0.0023ms | 0.0024ms | -0.000041ms | -1.73% |
| p95 | 0.0063ms | 0.0067ms | -0.00039ms | -5.89% |
| p99 | 0.04ms | 0.01ms | +0.03ms | +208.30% |
| mean | 0.0038ms | 0.0029ms | +0.00085ms | +28.69% |
| min | 0.0022ms | 0.0022ms | -0.000041ms | -1.86% |
| max | 0.09ms | 0.02ms | +0.07ms | +431.03% |
| total | 0.76ms | 0.59ms | +0.17ms | +28.69% |

### driveHybridSearch

# Perf Report — driveHybridSearch.serial

| metric | value |
|---|---|
| iterations | 200 |
| warmup | 5 |
| p10 | 0.0024ms |
| p50 | 0.0025ms |
| p95 | 0.0074ms |
| p99 | 0.02ms |
| mean | 0.0037ms |
| stdev | 0.0064ms |
| min | 0.0023ms |
| max | 0.09ms |
| total | 0.73ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.0024ms | 0.0024ms | -0.000042ms | -1.74% |
| p50 | 0.0025ms | 0.0025ms | -0.000041ms | -1.61% |
| p95 | 0.0074ms | 0.0064ms | +0.00096ms | +15.05% |
| p99 | 0.02ms | 0.01ms | +0.0027ms | +19.95% |
| mean | 0.0037ms | 0.0031ms | +0.00054ms | +17.47% |
| min | 0.0023ms | 0.0024ms | -0.000083ms | -3.49% |
| max | 0.09ms | 0.02ms | +0.07ms | +350.67% |
| total | 0.73ms | 0.62ms | +0.11ms | +17.47% |

### driveCacheHitRate

# Perf Report — driveCacheHitRate.serial

| metric | value |
|---|---|
| iterations | 200 |
| warmup | 5 |
| p10 | 0.0023ms |
| p50 | 0.0024ms |
| p95 | 0.0059ms |
| p99 | 0.02ms |
| mean | 0.0035ms |
| stdev | 0.0063ms |
| min | 0.0023ms |
| max | 0.09ms |
| total | 0.71ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.0023ms | 0.0024ms | -0.000042ms | -1.77% |
| p50 | 0.0024ms | 0.0025ms | -0.000083ms | -3.38% |
| p95 | 0.0059ms | 0.0049ms | +0.0010ms | +20.80% |
| p99 | 0.02ms | 0.01ms | +0.0057ms | +40.65% |
| mean | 0.0035ms | 0.0032ms | +0.00036ms | +11.34% |
| min | 0.0023ms | 0.0023ms | -0.000042ms | -1.80% |
| max | 0.09ms | 0.02ms | +0.07ms | +336.75% |
| total | 0.71ms | 0.64ms | +0.07ms | +11.34% |

