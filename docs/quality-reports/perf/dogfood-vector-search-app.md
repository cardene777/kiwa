# Perf Suite — dogfood-vector-search-app

Threshold source: [docs/quality/perf-thresholds.md](../../quality/perf-thresholds)

測定系の分解能 = 0.00017ms (何もしない関数を同じ経路で呼んだ時の p10)。 回帰判定の絶対下限は既定でこの 2 倍 = 0.00033ms、 op ごとの実効値は下表の「下限」 列。

## Serial (concurrency = 1)

| op | p10 (回帰判定) | p95 (上限判定) | cap | 下限 | gate | regression |
|---|---|---|---|---|---|---|
| driveIndexBuild | 0.0016ms | 0.0068ms | 80ms | 0.00033ms | PASS | stable — gate 無効 (regressionGate=false) |
| driveSemanticSearch | 0.0024ms | 0.0067ms | 100ms | 0.00033ms | PASS | stable — gate 無効 (regressionGate=false) |
| driveHybridSearch | 0.0026ms | 0.0075ms | 100ms | 0.00033ms | PASS | stable — gate 無効 (regressionGate=false) |
| driveCacheHitRate | 0.0038ms | 0.0096ms | 100ms | 0.00033ms | PASS | regressed — gate 無効 (regressionGate=false) |

## Concurrent p95 (concurrency = 10, 50 iter each)

| op | p95 | cap | gate |
|---|---|---|---|
| driveIndexBuild | 0.04ms | 160ms | PASS |
| driveSemanticSearch | 0.04ms | 200ms | PASS |
| driveHybridSearch | 0.04ms | 200ms | PASS |
| driveCacheHitRate | 0.13ms | 200ms | PASS |

## Memory retention (200 iter, arrayBuffers axis is the gate; heap is informational)

| op | heapUsed Δ | arrayBuffers Δ | cap | gc exposed | verdict |
|---|---|---|---|---|---|
| driveIndexBuild | -3328 B | 0 B | 102400 B | yes | PASS |
| driveSemanticSearch | 528 B | 0 B | 102400 B | yes | PASS |
| driveHybridSearch | -704 B | 0 B | 102400 B | yes | PASS |
| driveCacheHitRate | 744 B | 0 B | 102400 B | yes | PASS |

## Detailed serial reports

### driveIndexBuild

# Perf Report — driveIndexBuild.serial

| metric | value |
|---|---|
| iterations | 200 |
| warmup | 5 |
| p10 | 0.0016ms |
| p50 | 0.0022ms |
| p95 | 0.0068ms |
| p99 | 0.02ms |
| mean | 0.0030ms |
| stdev | 0.0038ms |
| min | 0.0015ms |
| max | 0.03ms |
| total | 0.59ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.0016ms | 0.0015ms | +0.000084ms | +5.59% |
| p50 | 0.0022ms | 0.0017ms | +0.00054ms | +32.45% |
| p95 | 0.0068ms | 0.0064ms | +0.00046ms | +7.24% |
| p99 | 0.02ms | 0.02ms | +0.0038ms | +19.61% |
| mean | 0.0030ms | 0.0026ms | +0.00036ms | +13.95% |
| min | 0.0015ms | 0.0015ms | 0.00ms | 0.00% |
| max | 0.03ms | 0.03ms | +0.0023ms | +8.53% |
| total | 0.59ms | 0.52ms | +0.07ms | +13.95% |

### driveSemanticSearch

# Perf Report — driveSemanticSearch.serial

| metric | value |
|---|---|
| iterations | 200 |
| warmup | 5 |
| p10 | 0.0024ms |
| p50 | 0.0026ms |
| p95 | 0.0067ms |
| p99 | 0.01ms |
| mean | 0.0033ms |
| stdev | 0.0021ms |
| min | 0.0023ms |
| max | 0.02ms |
| total | 0.66ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.0024ms | 0.0022ms | +0.00013ms | +5.56% |
| p50 | 0.0026ms | 0.0024ms | +0.00021ms | +8.78% |
| p95 | 0.0067ms | 0.0067ms | +0.0000027ms | +0.04% |
| p99 | 0.01ms | 0.01ms | +0.00022ms | +1.61% |
| mean | 0.0033ms | 0.0029ms | +0.00033ms | +11.15% |
| min | 0.0023ms | 0.0022ms | +0.000084ms | +3.80% |
| max | 0.02ms | 0.02ms | -0.00025ms | -1.48% |
| total | 0.66ms | 0.59ms | +0.07ms | +11.15% |

### driveHybridSearch

# Perf Report — driveHybridSearch.serial

| metric | value |
|---|---|
| iterations | 200 |
| warmup | 5 |
| p10 | 0.0026ms |
| p50 | 0.0027ms |
| p95 | 0.0075ms |
| p99 | 0.02ms |
| mean | 0.0040ms |
| stdev | 0.0088ms |
| min | 0.0025ms |
| max | 0.12ms |
| total | 0.81ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.0026ms | 0.0024ms | +0.00021ms | +8.61% |
| p50 | 0.0027ms | 0.0025ms | +0.00017ms | +6.61% |
| p95 | 0.0075ms | 0.0064ms | +0.0011ms | +16.76% |
| p99 | 0.02ms | 0.01ms | +0.0037ms | +27.50% |
| mean | 0.0040ms | 0.0031ms | +0.00091ms | +29.22% |
| min | 0.0025ms | 0.0024ms | +0.00017ms | +6.99% |
| max | 0.12ms | 0.02ms | +0.10ms | +538.72% |
| total | 0.81ms | 0.62ms | +0.18ms | +29.22% |

### driveCacheHitRate

# Perf Report — driveCacheHitRate.serial

| metric | value |
|---|---|
| iterations | 200 |
| warmup | 5 |
| p10 | 0.0038ms |
| p50 | 0.0048ms |
| p95 | 0.0096ms |
| p99 | 0.02ms |
| mean | 0.0061ms |
| stdev | 0.01ms |
| min | 0.0027ms |
| max | 0.19ms |
| total | 1.22ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.0038ms | 0.0024ms | +0.0015ms | +61.39% |
| p50 | 0.0048ms | 0.0025ms | +0.0023ms | +94.96% |
| p95 | 0.0096ms | 0.0049ms | +0.0047ms | +96.55% |
| p99 | 0.02ms | 0.01ms | +0.0020ms | +13.85% |
| mean | 0.0061ms | 0.0032ms | +0.0029ms | +91.85% |
| min | 0.0027ms | 0.0023ms | +0.00042ms | +17.87% |
| max | 0.19ms | 0.02ms | +0.17ms | +879.06% |
| total | 1.22ms | 0.64ms | +0.58ms | +91.85% |

