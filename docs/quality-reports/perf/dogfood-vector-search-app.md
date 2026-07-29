# Perf Suite — dogfood-vector-search-app

Threshold source: [docs/quality/perf-thresholds.md](../../quality/perf-thresholds)

測定系の分解能 = 0.00017ms (何もしない関数を同じ経路で呼んだ時の p10)。 回帰判定の絶対下限は既定でこの 2 倍 = 0.00033ms、 op ごとの実効値は下表の「下限」 列。

## Serial (concurrency = 1)

| op | p10 (実測) | p95 (上限判定) | cap | 下限 | gate | regression |
|---|---|---|---|---|---|---|
| driveIndexBuild | 0.0015ms | 0.0090ms | 80ms | 0.00036ms | PASS | stable — gate 無効 (regressionGate=false) |
| driveSemanticSearch | 0.0017ms | 0.0037ms | 100ms | 0.00036ms | PASS | stable — gate 無効 (regressionGate=false) |
| driveHybridSearch | 0.0025ms | 0.01ms | 100ms | 0.00036ms | PASS | stable — gate 無効 (regressionGate=false) |
| driveCacheHitRate | 0.0024ms | 0.0047ms | 100ms | 0.00036ms | PASS | stable — gate 無効 (regressionGate=false) |

## 実行内正規化 (回帰判定はこの比で行う)

回帰判定は実測値そのものではなく、 同じ実行の中で 1 呼出ずつ交互に測った基準 op との比を読む。 実行と実行の間で機械の状態が変わっても、 その差が分子と分母で相殺される。 「換算後 p10」 は今回の比を baseline を測った時の基準 p10 で ms に戻した値で、 baseline の実測 p10 と直接比べられる。

| op | 基準 op | 基準 p10 | 実測 p10 | 比 | baseline の比 | 換算後 p10 | baseline p10 |
|---|---|---|---|---|---|---|---|
| driveIndexBuild | cpu | 0.08ms | 0.0015ms | 0.018 | 0.018 | 0.0016ms | 0.0016ms |
| driveSemanticSearch | cpu | 0.08ms | 0.0017ms | 0.021 | 0.023 | 0.0018ms | 0.0020ms |
| driveHybridSearch | cpu | 0.08ms | 0.0025ms | 0.031 | 0.030 | 0.0028ms | 0.0027ms |
| driveCacheHitRate | cpu | 0.08ms | 0.0024ms | 0.029 | 0.030 | 0.0025ms | 0.0027ms |

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
| driveIndexBuild | -12992 B | 0 B | 102400 B | yes | PASS |
| driveSemanticSearch | -104 B | 0 B | 102400 B | yes | PASS |
| driveHybridSearch | -648 B | 0 B | 102400 B | yes | PASS |
| driveCacheHitRate | -3024 B | 0 B | 102400 B | yes | PASS |

## Detailed serial reports

### driveIndexBuild

# Perf Report — driveIndexBuild.serial

| metric | value |
|---|---|
| iterations | 200 |
| warmup | 5 |
| p10 | 0.0015ms |
| p50 | 0.0016ms |
| p95 | 0.0090ms |
| p99 | 0.02ms |
| mean | 0.0028ms |
| stdev | 0.0041ms |
| min | 0.0014ms |
| max | 0.03ms |
| total | 0.56ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.0015ms | 0.0016ms | -0.00012ms | -7.69% |
| p50 | 0.0016ms | 0.0021ms | -0.00050ms | -23.53% |
| p95 | 0.0090ms | 0.01ms | -0.0014ms | -13.71% |
| p99 | 0.02ms | 0.03ms | -0.0044ms | -16.85% |
| mean | 0.0028ms | 0.0034ms | -0.00062ms | -18.10% |
| min | 0.0014ms | 0.0015ms | -0.00012ms | -8.05% |
| max | 0.03ms | 0.03ms | -0.0010ms | -3.13% |
| total | 0.56ms | 0.69ms | -0.12ms | -18.10% |

### driveSemanticSearch

# Perf Report — driveSemanticSearch.serial

| metric | value |
|---|---|
| iterations | 200 |
| warmup | 5 |
| p10 | 0.0017ms |
| p50 | 0.0024ms |
| p95 | 0.0037ms |
| p99 | 0.01ms |
| mean | 0.0028ms |
| stdev | 0.0024ms |
| min | 0.0017ms |
| max | 0.02ms |
| total | 0.55ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.0017ms | 0.0020ms | -0.00029ms | -14.60% |
| p50 | 0.0024ms | 0.0027ms | -0.00033ms | -12.30% |
| p95 | 0.0037ms | 0.02ms | -0.01ms | -75.61% |
| p99 | 0.01ms | 0.06ms | -0.04ms | -74.32% |
| mean | 0.0028ms | 0.0066ms | -0.0038ms | -57.92% |
| min | 0.0017ms | 0.0018ms | -0.00017ms | -9.16% |
| max | 0.02ms | 0.40ms | -0.38ms | -95.23% |
| total | 0.55ms | 1.31ms | -0.76ms | -57.92% |

### driveHybridSearch

# Perf Report — driveHybridSearch.serial

| metric | value |
|---|---|
| iterations | 200 |
| warmup | 5 |
| p10 | 0.0025ms |
| p50 | 0.0027ms |
| p95 | 0.01ms |
| p99 | 0.04ms |
| mean | 0.0044ms |
| stdev | 0.0068ms |
| min | 0.0024ms |
| max | 0.07ms |
| total | 0.88ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.0025ms | 0.0027ms | -0.00013ms | -4.69% |
| p50 | 0.0027ms | 0.0028ms | -0.00013ms | -4.41% |
| p95 | 0.01ms | 0.02ms | -0.0066ms | -37.03% |
| p99 | 0.04ms | 0.06ms | -0.02ms | -37.17% |
| mean | 0.0044ms | 0.0075ms | -0.0031ms | -41.49% |
| min | 0.0024ms | 0.0026ms | -0.00021ms | -8.05% |
| max | 0.07ms | 0.47ms | -0.41ms | -86.20% |
| total | 0.88ms | 1.50ms | -0.62ms | -41.49% |

### driveCacheHitRate

# Perf Report — driveCacheHitRate.serial

| metric | value |
|---|---|
| iterations | 200 |
| warmup | 5 |
| p10 | 0.0024ms |
| p50 | 0.0025ms |
| p95 | 0.0047ms |
| p99 | 0.02ms |
| mean | 0.0032ms |
| stdev | 0.0027ms |
| min | 0.0023ms |
| max | 0.03ms |
| total | 0.64ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.0024ms | 0.0027ms | -0.00029ms | -10.92% |
| p50 | 0.0025ms | 0.0028ms | -0.00029ms | -10.31% |
| p95 | 0.0047ms | 0.02ms | -0.01ms | -68.80% |
| p99 | 0.02ms | 0.04ms | -0.03ms | -61.79% |
| mean | 0.0032ms | 0.0053ms | -0.0021ms | -39.39% |
| min | 0.0023ms | 0.0026ms | -0.00029ms | -11.27% |
| max | 0.03ms | 0.10ms | -0.07ms | -72.65% |
| total | 0.64ms | 1.05ms | -0.42ms | -39.39% |

