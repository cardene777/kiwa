# Perf Suite — dogfood-vector-search-app

Threshold source: [docs/quality/perf-thresholds.md](../../quality/perf-thresholds)

測定系の分解能 = 0.00017ms (何もしない関数を同じ経路で呼んだ時の p10)。 回帰判定の絶対下限は既定でこの 2 倍 = 0.00033ms、 op ごとの実効値は下表の「下限」 列。

## Serial (concurrency = 1)

| op | p10 (回帰判定) | p95 (上限判定) | cap | 下限 | gate | regression |
|---|---|---|---|---|---|---|
| driveIndexBuild | 0.0015ms | 0.01ms | 80ms | 0.00033ms | PASS | stable (p10 +3% (閾値未満)、 p95 +82% (裾は実行間の振れ幅と区別できないため判定には使わない)) — gate 無効 (regressionGate=false) |
| driveSemanticSearch | 0.0028ms | 0.0085ms | 100ms | 0.00033ms | PASS | regressed — gate 無効 (regressionGate=false) |
| driveHybridSearch | 0.0025ms | 0.0076ms | 100ms | 0.00033ms | PASS | stable — gate 無効 (regressionGate=false) |
| driveCacheHitRate | 0.0026ms | 0.0058ms | 100ms | 0.00033ms | PASS | stable — gate 無効 (regressionGate=false) |

## Concurrent p95 (concurrency = 10, 50 iter each)

| op | p95 | cap | gate |
|---|---|---|---|
| driveIndexBuild | 0.05ms | 160ms | PASS |
| driveSemanticSearch | 0.04ms | 200ms | PASS |
| driveHybridSearch | 0.06ms | 200ms | PASS |
| driveCacheHitRate | 0.08ms | 200ms | PASS |

## Memory retention (200 iter, arrayBuffers axis is the gate; heap is informational)

| op | heapUsed Δ | arrayBuffers Δ | cap | gc exposed | verdict |
|---|---|---|---|---|---|
| driveIndexBuild | -3752 B | 0 B | 102400 B | yes | PASS |
| driveSemanticSearch | 528 B | 0 B | 102400 B | yes | PASS |
| driveHybridSearch | 253256 B | 0 B | 102400 B | yes | PASS |
| driveCacheHitRate | 3344 B | 0 B | 102400 B | yes | PASS |

## Detailed serial reports

### driveIndexBuild

# Perf Report — driveIndexBuild.serial

| metric | value |
|---|---|
| iterations | 200 |
| warmup | 5 |
| p10 | 0.0015ms |
| p50 | 0.0020ms |
| p95 | 0.01ms |
| p99 | 0.03ms |
| mean | 0.0034ms |
| stdev | 0.0054ms |
| min | 0.0015ms |
| max | 0.06ms |
| total | 0.68ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.0015ms | 0.0015ms | +0.000041ms | +2.73% |
| p50 | 0.0020ms | 0.0017ms | +0.00031ms | +18.69% |
| p95 | 0.01ms | 0.0064ms | +0.0052ms | +81.97% |
| p99 | 0.03ms | 0.02ms | +0.0069ms | +36.01% |
| mean | 0.0034ms | 0.0026ms | +0.00083ms | +32.16% |
| min | 0.0015ms | 0.0015ms | -0.000042ms | -2.80% |
| max | 0.06ms | 0.03ms | +0.03ms | +128.75% |
| total | 0.68ms | 0.52ms | +0.17ms | +32.16% |

### driveSemanticSearch

# Perf Report — driveSemanticSearch.serial

| metric | value |
|---|---|
| iterations | 200 |
| warmup | 5 |
| p10 | 0.0028ms |
| p50 | 0.0030ms |
| p95 | 0.0085ms |
| p99 | 0.02ms |
| mean | 0.0044ms |
| stdev | 0.0082ms |
| min | 0.0028ms |
| max | 0.10ms |
| total | 0.87ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.0028ms | 0.0022ms | +0.00058ms | +25.91% |
| p50 | 0.0030ms | 0.0024ms | +0.00058ms | +24.59% |
| p95 | 0.0085ms | 0.0067ms | +0.0018ms | +26.79% |
| p99 | 0.02ms | 0.01ms | +0.0080ms | +58.65% |
| mean | 0.0044ms | 0.0029ms | +0.0014ms | +48.09% |
| min | 0.0028ms | 0.0022ms | +0.00058ms | +26.40% |
| max | 0.10ms | 0.02ms | +0.08ms | +493.07% |
| total | 0.87ms | 0.59ms | +0.28ms | +48.09% |

### driveHybridSearch

# Perf Report — driveHybridSearch.serial

| metric | value |
|---|---|
| iterations | 200 |
| warmup | 5 |
| p10 | 0.0025ms |
| p50 | 0.0031ms |
| p95 | 0.0076ms |
| p99 | 0.02ms |
| mean | 0.0040ms |
| stdev | 0.0084ms |
| min | 0.0023ms |
| max | 0.12ms |
| total | 0.80ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.0025ms | 0.0024ms | +0.000042ms | +1.74% |
| p50 | 0.0031ms | 0.0025ms | +0.00052ms | +20.52% |
| p95 | 0.0076ms | 0.0064ms | +0.0012ms | +19.15% |
| p99 | 0.02ms | 0.01ms | +0.0030ms | +21.92% |
| mean | 0.0040ms | 0.0031ms | +0.00088ms | +28.13% |
| min | 0.0023ms | 0.0024ms | -0.000042ms | -1.77% |
| max | 0.12ms | 0.02ms | +0.10ms | +510.89% |
| total | 0.80ms | 0.62ms | +0.18ms | +28.13% |

### driveCacheHitRate

# Perf Report — driveCacheHitRate.serial

| metric | value |
|---|---|
| iterations | 200 |
| warmup | 5 |
| p10 | 0.0026ms |
| p50 | 0.0027ms |
| p95 | 0.0058ms |
| p99 | 0.02ms |
| mean | 0.0038ms |
| stdev | 0.0026ms |
| min | 0.0025ms |
| max | 0.02ms |
| total | 0.76ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.0026ms | 0.0024ms | +0.00021ms | +8.80% |
| p50 | 0.0027ms | 0.0025ms | +0.00025ms | +10.17% |
| p95 | 0.0058ms | 0.0049ms | +0.00095ms | +19.49% |
| p99 | 0.02ms | 0.01ms | +0.0011ms | +7.70% |
| mean | 0.0038ms | 0.0032ms | +0.00061ms | +19.14% |
| min | 0.0025ms | 0.0023ms | +0.00021ms | +8.92% |
| max | 0.02ms | 0.02ms | +0.0053ms | +27.35% |
| total | 0.76ms | 0.64ms | +0.12ms | +19.14% |

