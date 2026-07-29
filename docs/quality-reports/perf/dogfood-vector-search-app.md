# Perf Suite — dogfood-vector-search-app

Threshold source: [docs/quality/perf-thresholds.md](../../quality/perf-thresholds)

測定系の分解能 = 0.00017ms (何もしない関数を同じ経路で呼んだ時の p10)。 回帰判定の絶対下限は既定でこの 2 倍 = 0.00033ms、 op ごとの実効値は下表の「下限」 列。

## Serial (concurrency = 1)

| op | p10 (回帰判定) | p95 (上限判定) | cap | 下限 | gate | regression |
|---|---|---|---|---|---|---|
| driveIndexBuild | 0.0016ms | 0.0080ms | 80ms | 0.00033ms | PASS | stable (p10 +6% (閾値未満)、 p95 +25% (裾は実行間の振れ幅と区別できないため判定には使わない)) — gate 無効 (regressionGate=false) |
| driveSemanticSearch | 0.0024ms | 0.0062ms | 100ms | 0.00033ms | PASS | stable — gate 無効 (regressionGate=false) |
| driveHybridSearch | 0.0026ms | 0.0081ms | 100ms | 0.00033ms | PASS | stable (p10 +9% (閾値未満)、 p95 +27% (裾は実行間の振れ幅と区別できないため判定には使わない)) — gate 無効 (regressionGate=false) |
| driveCacheHitRate | 0.0024ms | 0.02ms | 100ms | 0.00033ms | PASS | stable (p10 +2% (閾値未満)、 p95 +239% (裾は実行間の振れ幅と区別できないため判定には使わない)) — gate 無効 (regressionGate=false) |

## Concurrent p95 (concurrency = 10, 50 iter each)

| op | p95 | cap | gate |
|---|---|---|---|
| driveIndexBuild | 0.04ms | 160ms | PASS |
| driveSemanticSearch | 0.03ms | 200ms | PASS |
| driveHybridSearch | 0.04ms | 200ms | PASS |
| driveCacheHitRate | 0.10ms | 200ms | PASS |

## Memory retention (200 iter, arrayBuffers axis is the gate; heap is informational)

| op | heapUsed Δ | arrayBuffers Δ | cap | gc exposed | verdict |
|---|---|---|---|---|---|
| driveIndexBuild | -26664 B | 0 B | 102400 B | yes | PASS |
| driveSemanticSearch | -136 B | 0 B | 102400 B | yes | PASS |
| driveHybridSearch | -2624 B | 0 B | 102400 B | yes | PASS |
| driveCacheHitRate | 600 B | 0 B | 102400 B | yes | PASS |

## Detailed serial reports

### driveIndexBuild

# Perf Report — driveIndexBuild.serial

| metric | value |
|---|---|
| iterations | 200 |
| warmup | 5 |
| p10 | 0.0016ms |
| p50 | 0.0017ms |
| p95 | 0.0080ms |
| p99 | 0.02ms |
| mean | 0.0029ms |
| stdev | 0.0060ms |
| min | 0.0015ms |
| max | 0.08ms |
| total | 0.57ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.0016ms | 0.0015ms | +0.000083ms | +5.53% |
| p50 | 0.0017ms | 0.0017ms | +0.000041ms | +2.46% |
| p95 | 0.0080ms | 0.0064ms | +0.0016ms | +25.11% |
| p99 | 0.02ms | 0.02ms | -0.0024ms | -12.71% |
| mean | 0.0029ms | 0.0026ms | +0.00028ms | +10.83% |
| min | 0.0015ms | 0.0015ms | 0.00ms | 0.00% |
| max | 0.08ms | 0.03ms | +0.05ms | +203.00% |
| total | 0.57ms | 0.52ms | +0.06ms | +10.83% |

### driveSemanticSearch

# Perf Report — driveSemanticSearch.serial

| metric | value |
|---|---|
| iterations | 200 |
| warmup | 5 |
| p10 | 0.0024ms |
| p50 | 0.0025ms |
| p95 | 0.0062ms |
| p99 | 0.01ms |
| mean | 0.0031ms |
| stdev | 0.0025ms |
| min | 0.0023ms |
| max | 0.02ms |
| total | 0.62ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.0024ms | 0.0022ms | +0.00013ms | +5.56% |
| p50 | 0.0025ms | 0.0024ms | +0.00013ms | +5.26% |
| p95 | 0.0062ms | 0.0067ms | -0.00052ms | -7.76% |
| p99 | 0.01ms | 0.01ms | +0.0012ms | +8.87% |
| mean | 0.0031ms | 0.0029ms | +0.00016ms | +5.53% |
| min | 0.0023ms | 0.0022ms | +0.000083ms | +3.76% |
| max | 0.02ms | 0.02ms | +0.0062ms | +36.98% |
| total | 0.62ms | 0.59ms | +0.03ms | +5.53% |

### driveHybridSearch

# Perf Report — driveHybridSearch.serial

| metric | value |
|---|---|
| iterations | 200 |
| warmup | 5 |
| p10 | 0.0026ms |
| p50 | 0.0027ms |
| p95 | 0.0081ms |
| p99 | 0.02ms |
| mean | 0.0040ms |
| stdev | 0.0068ms |
| min | 0.0026ms |
| max | 0.09ms |
| total | 0.79ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.0026ms | 0.0024ms | +0.00021ms | +8.61% |
| p50 | 0.0027ms | 0.0025ms | +0.00021ms | +8.23% |
| p95 | 0.0081ms | 0.0064ms | +0.0017ms | +26.96% |
| p99 | 0.02ms | 0.01ms | +0.0049ms | +35.75% |
| mean | 0.0040ms | 0.0031ms | +0.00084ms | +26.86% |
| min | 0.0026ms | 0.0024ms | +0.00021ms | +8.76% |
| max | 0.09ms | 0.02ms | +0.07ms | +387.19% |
| total | 0.79ms | 0.62ms | +0.17ms | +26.86% |

### driveCacheHitRate

# Perf Report — driveCacheHitRate.serial

| metric | value |
|---|---|
| iterations | 200 |
| warmup | 5 |
| p10 | 0.0024ms |
| p50 | 0.0026ms |
| p95 | 0.02ms |
| p99 | 0.04ms |
| mean | 0.0060ms |
| stdev | 0.02ms |
| min | 0.0024ms |
| max | 0.28ms |
| total | 1.20ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.0024ms | 0.0024ms | +0.000042ms | +1.77% |
| p50 | 0.0026ms | 0.0025ms | +0.00012ms | +5.09% |
| p95 | 0.02ms | 0.0049ms | +0.01ms | +238.76% |
| p99 | 0.04ms | 0.01ms | +0.02ms | +154.19% |
| mean | 0.0060ms | 0.0032ms | +0.0028ms | +89.30% |
| min | 0.0024ms | 0.0023ms | +0.000042ms | +1.80% |
| max | 0.28ms | 0.02ms | +0.26ms | +1331.41% |
| total | 1.20ms | 0.64ms | +0.57ms | +89.30% |

