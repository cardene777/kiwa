# Perf Suite — dogfood-vector-search-app

Threshold source: [docs/quality/perf-thresholds.md](../../quality/perf-thresholds)

測定系の分解能 = 0.00017ms (何もしない関数を同じ経路で呼んだ時の p10)。 回帰判定の絶対下限は既定でこの 2 倍 = 0.00033ms、 op ごとの実効値は下表の「下限」 列。

## Serial (concurrency = 1)

| op | p10 (回帰判定) | p95 (上限判定) | cap | 下限 | gate | regression |
|---|---|---|---|---|---|---|
| driveIndexBuild | 0.0017ms | 0.01ms | 80ms | 0.00033ms | PASS | stable (p10 +11% (閾値未満)、 p95 +58% (裾は実行間の振れ幅と区別できないため判定には使わない)) — gate 無効 (regressionGate=false) |
| driveSemanticSearch | 0.0027ms | 0.0055ms | 100ms | 0.00033ms | PASS | stable — gate 無効 (regressionGate=false) |
| driveHybridSearch | 0.0028ms | 0.0053ms | 100ms | 0.00033ms | PASS | stable — gate 無効 (regressionGate=false) |
| driveCacheHitRate | 0.0024ms | 0.0094ms | 100ms | 0.00033ms | PASS | stable (p10 +2% (閾値未満)、 p95 +92% (裾は実行間の振れ幅と区別できないため判定には使わない)) — gate 無効 (regressionGate=false) |

## Concurrent p95 (concurrency = 10, 50 iter each)

| op | p95 | cap | gate |
|---|---|---|---|
| driveIndexBuild | 0.04ms | 160ms | PASS |
| driveSemanticSearch | 0.05ms | 200ms | PASS |
| driveHybridSearch | 0.04ms | 200ms | PASS |
| driveCacheHitRate | 0.05ms | 200ms | PASS |

## Memory retention (200 iter, arrayBuffers axis is the gate; heap is informational)

| op | heapUsed Δ | arrayBuffers Δ | cap | gc exposed | verdict |
|---|---|---|---|---|---|
| driveIndexBuild | -11376 B | 0 B | 102400 B | yes | PASS |
| driveSemanticSearch | -15048 B | 0 B | 102400 B | yes | PASS |
| driveHybridSearch | 2416 B | 0 B | 102400 B | yes | PASS |
| driveCacheHitRate | 600 B | 0 B | 102400 B | yes | PASS |

## Detailed serial reports

### driveIndexBuild

# Perf Report — driveIndexBuild.serial

| metric | value |
|---|---|
| iterations | 200 |
| warmup | 5 |
| p10 | 0.0017ms |
| p50 | 0.0023ms |
| p95 | 0.01ms |
| p99 | 0.02ms |
| mean | 0.0032ms |
| stdev | 0.0033ms |
| min | 0.0015ms |
| max | 0.03ms |
| total | 0.63ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.0017ms | 0.0015ms | +0.00017ms | +11.13% |
| p50 | 0.0023ms | 0.0017ms | +0.00067ms | +39.95% |
| p95 | 0.01ms | 0.0064ms | +0.0037ms | +57.57% |
| p99 | 0.02ms | 0.02ms | +0.0010ms | +5.29% |
| mean | 0.0032ms | 0.0026ms | +0.00057ms | +21.86% |
| min | 0.0015ms | 0.0015ms | +0.000042ms | +2.80% |
| max | 0.03ms | 0.03ms | +0.00054ms | +2.05% |
| total | 0.63ms | 0.52ms | +0.11ms | +21.86% |

### driveSemanticSearch

# Perf Report — driveSemanticSearch.serial

| metric | value |
|---|---|
| iterations | 200 |
| warmup | 5 |
| p10 | 0.0027ms |
| p50 | 0.0034ms |
| p95 | 0.0055ms |
| p99 | 0.01ms |
| mean | 0.0037ms |
| stdev | 0.0017ms |
| min | 0.0025ms |
| max | 0.02ms |
| total | 0.74ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.0027ms | 0.0022ms | +0.00041ms | +18.31% |
| p50 | 0.0034ms | 0.0024ms | +0.0010ms | +43.87% |
| p95 | 0.0055ms | 0.0067ms | -0.0012ms | -17.62% |
| p99 | 0.01ms | 0.01ms | -0.00025ms | -1.85% |
| mean | 0.0037ms | 0.0029ms | +0.00076ms | +25.83% |
| min | 0.0025ms | 0.0022ms | +0.00025ms | +11.32% |
| max | 0.02ms | 0.02ms | +0.0000010ms | +0.01% |
| total | 0.74ms | 0.59ms | +0.15ms | +25.83% |

### driveHybridSearch

# Perf Report — driveHybridSearch.serial

| metric | value |
|---|---|
| iterations | 200 |
| warmup | 5 |
| p10 | 0.0028ms |
| p50 | 0.0034ms |
| p95 | 0.0053ms |
| p99 | 0.02ms |
| mean | 0.0045ms |
| stdev | 0.0093ms |
| min | 0.0027ms |
| max | 0.13ms |
| total | 0.89ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.0028ms | 0.0024ms | +0.00042ms | +17.21% |
| p50 | 0.0034ms | 0.0025ms | +0.00088ms | +34.47% |
| p95 | 0.0053ms | 0.0064ms | -0.0011ms | -17.41% |
| p99 | 0.02ms | 0.01ms | +0.0058ms | +42.87% |
| mean | 0.0045ms | 0.0031ms | +0.0013ms | +42.97% |
| min | 0.0027ms | 0.0024ms | +0.00033ms | +14.02% |
| max | 0.13ms | 0.02ms | +0.11ms | +581.33% |
| total | 0.89ms | 0.62ms | +0.27ms | +42.97% |

### driveCacheHitRate

# Perf Report — driveCacheHitRate.serial

| metric | value |
|---|---|
| iterations | 200 |
| warmup | 5 |
| p10 | 0.0024ms |
| p50 | 0.0025ms |
| p95 | 0.0094ms |
| p99 | 0.02ms |
| mean | 0.0043ms |
| stdev | 0.01ms |
| min | 0.0023ms |
| max | 0.16ms |
| total | 0.86ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.0024ms | 0.0024ms | +0.000042ms | +1.77% |
| p50 | 0.0025ms | 0.0025ms | +0.000084ms | +3.42% |
| p95 | 0.0094ms | 0.0049ms | +0.0045ms | +91.60% |
| p99 | 0.02ms | 0.01ms | +0.0020ms | +14.12% |
| mean | 0.0043ms | 0.0032ms | +0.0011ms | +35.08% |
| min | 0.0023ms | 0.0023ms | 0.00ms | 0.00% |
| max | 0.16ms | 0.02ms | +0.14ms | +710.47% |
| total | 0.86ms | 0.64ms | +0.22ms | +35.08% |

