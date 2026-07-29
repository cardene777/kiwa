# Perf Suite — dogfood-vector-search-app

Threshold source: [docs/quality/perf-thresholds.md](../../quality/perf-thresholds)

測定系の分解能 = 0.00017ms (何もしない関数を同じ経路で呼んだ時の p10)。 回帰判定の絶対下限は既定でこの 2 倍 = 0.00033ms、 op ごとの実効値は下表の「下限」 列。

## Serial (concurrency = 1)

| op | p10 (回帰判定) | p95 (上限判定) | cap | 下限 | gate | regression |
|---|---|---|---|---|---|---|
| driveIndexBuild | 0.0015ms | 0.0056ms | 80ms | 0.00033ms | PASS | stable — gate 無効 (regressionGate=false) |
| driveSemanticSearch | 0.0022ms | 0.0078ms | 100ms | 0.00033ms | PASS | stable — gate 無効 (regressionGate=false) |
| driveHybridSearch | 0.0024ms | 0.0084ms | 100ms | 0.00033ms | PASS | stable (p10 0% (閾値未満)、 p95 +32% (裾は実行間の振れ幅と区別できないため判定には使わない)) — gate 無効 (regressionGate=false) |
| driveCacheHitRate | 0.0024ms | 0.01ms | 100ms | 0.00033ms | PASS | stable (p10 +2% (閾値未満)、 p95 +114% (裾は実行間の振れ幅と区別できないため判定には使わない)) — gate 無効 (regressionGate=false) |

## Concurrent p95 (concurrency = 10, 50 iter each)

| op | p95 | cap | gate |
|---|---|---|---|
| driveIndexBuild | 0.04ms | 160ms | PASS |
| driveSemanticSearch | 0.03ms | 200ms | PASS |
| driveHybridSearch | 0.03ms | 200ms | PASS |
| driveCacheHitRate | 0.04ms | 200ms | PASS |

## Memory retention (200 iter, arrayBuffers axis is the gate; heap is informational)

| op | heapUsed Δ | arrayBuffers Δ | cap | gc exposed | verdict |
|---|---|---|---|---|---|
| driveIndexBuild | -3368 B | 0 B | 102400 B | yes | PASS |
| driveSemanticSearch | 624 B | 0 B | 102400 B | yes | PASS |
| driveHybridSearch | 258728 B | 0 B | 102400 B | yes | PASS |
| driveCacheHitRate | 536 B | 0 B | 102400 B | yes | PASS |

## Detailed serial reports

### driveIndexBuild

# Perf Report — driveIndexBuild.serial

| metric | value |
|---|---|
| iterations | 200 |
| warmup | 5 |
| p10 | 0.0015ms |
| p50 | 0.0015ms |
| p95 | 0.0056ms |
| p99 | 0.02ms |
| mean | 0.0024ms |
| stdev | 0.0027ms |
| min | 0.0014ms |
| max | 0.03ms |
| total | 0.48ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.0015ms | 0.0015ms | -0.000041ms | -2.73% |
| p50 | 0.0015ms | 0.0017ms | -0.00013ms | -7.50% |
| p95 | 0.0056ms | 0.0064ms | -0.00074ms | -11.58% |
| p99 | 0.02ms | 0.02ms | -0.0025ms | -12.96% |
| mean | 0.0024ms | 0.0026ms | -0.00019ms | -7.43% |
| min | 0.0014ms | 0.0015ms | -0.000083ms | -5.53% |
| max | 0.03ms | 0.03ms | -0.0012ms | -4.74% |
| total | 0.48ms | 0.52ms | -0.04ms | -7.43% |

### driveSemanticSearch

# Perf Report — driveSemanticSearch.serial

| metric | value |
|---|---|
| iterations | 200 |
| warmup | 5 |
| p10 | 0.0022ms |
| p50 | 0.0023ms |
| p95 | 0.0078ms |
| p99 | 0.01ms |
| mean | 0.0033ms |
| stdev | 0.0059ms |
| min | 0.0022ms |
| max | 0.08ms |
| total | 0.67ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.0022ms | 0.0022ms | -0.0000041ms | -0.18% |
| p50 | 0.0023ms | 0.0024ms | -0.000042ms | -1.77% |
| p95 | 0.0078ms | 0.0067ms | +0.0012ms | +17.36% |
| p99 | 0.01ms | 0.01ms | +0.0000058ms | +0.04% |
| mean | 0.0033ms | 0.0029ms | +0.00040ms | +13.51% |
| min | 0.0022ms | 0.0022ms | -0.000042ms | -1.90% |
| max | 0.08ms | 0.02ms | +0.06ms | +384.38% |
| total | 0.67ms | 0.59ms | +0.08ms | +13.51% |

### driveHybridSearch

# Perf Report — driveHybridSearch.serial

| metric | value |
|---|---|
| iterations | 200 |
| warmup | 5 |
| p10 | 0.0024ms |
| p50 | 0.0025ms |
| p95 | 0.0084ms |
| p99 | 0.02ms |
| mean | 0.0038ms |
| stdev | 0.0087ms |
| min | 0.0023ms |
| max | 0.12ms |
| total | 0.76ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.0024ms | 0.0024ms | 0.00ms | 0.00% |
| p50 | 0.0025ms | 0.0025ms | -0.000020ms | -0.81% |
| p95 | 0.0084ms | 0.0064ms | +0.0020ms | +31.67% |
| p99 | 0.02ms | 0.01ms | +0.0020ms | +14.86% |
| mean | 0.0038ms | 0.0031ms | +0.00070ms | +22.33% |
| min | 0.0023ms | 0.0024ms | -0.000042ms | -1.77% |
| max | 0.12ms | 0.02ms | +0.10ms | +533.06% |
| total | 0.76ms | 0.62ms | +0.14ms | +22.33% |

### driveCacheHitRate

# Perf Report — driveCacheHitRate.serial

| metric | value |
|---|---|
| iterations | 200 |
| warmup | 5 |
| p10 | 0.0024ms |
| p50 | 0.0025ms |
| p95 | 0.01ms |
| p99 | 0.02ms |
| mean | 0.0040ms |
| stdev | 0.0075ms |
| min | 0.0024ms |
| max | 0.10ms |
| total | 0.80ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.0024ms | 0.0024ms | +0.000041ms | +1.73% |
| p50 | 0.0025ms | 0.0025ms | +0.0000010ms | +0.04% |
| p95 | 0.01ms | 0.0049ms | +0.0056ms | +113.89% |
| p99 | 0.02ms | 0.01ms | +0.0037ms | +26.49% |
| mean | 0.0040ms | 0.0032ms | +0.00083ms | +26.19% |
| min | 0.0024ms | 0.0023ms | +0.000042ms | +1.80% |
| max | 0.10ms | 0.02ms | +0.08ms | +422.65% |
| total | 0.80ms | 0.64ms | +0.17ms | +26.19% |

