# Perf Suite — vector

Threshold source: [docs/quality/perf-thresholds.md](../../quality/perf-thresholds)

測定系の分解能 = 0.00017ms (何もしない関数を同じ経路で呼んだ時の p10)。 回帰判定の絶対下限は既定でこの 2 倍 = 0.00033ms、 op ごとの実効値は下表の「下限」 列。

## Serial (concurrency = 1)

| op | p10 (回帰判定) | p95 (上限判定) | cap | 下限 | gate | regression |
|---|---|---|---|---|---|---|
| upsertOne | 0.00083ms | 0.0022ms | 5ms | 0.00033ms | PASS | stable — gate 無効 (regressionGate=false) |
| queryNearestTop5 | 0.0040ms | 0.01ms | 5ms | 0.00033ms | PASS | stable — gate 無効 (regressionGate=false) |
| fetchById | 0.00025ms | 0.00034ms | 5ms | 0.00033ms | PASS | stable (検知には +0.00033ms (baseline 比 +133%) 以上の悪化が必要) — gate 無効 (regressionGate=false) |

## Concurrent p95 (concurrency = 10, 50 iter each)

| op | p95 | cap | gate |
|---|---|---|---|
| upsertOne | 0.02ms | 10ms | PASS |
| queryNearestTop5 | 0.05ms | 10ms | PASS |
| fetchById | 0.00ms | 10ms | PASS |

## Memory retention (200 iter, arrayBuffers axis is the gate; heap is informational)

| op | heapUsed Δ | arrayBuffers Δ | cap | gc exposed | verdict |
|---|---|---|---|---|---|
| upsertOne | -10152 B | 0 B | 102400 B | yes | PASS |
| queryNearestTop5 | 2672 B | 0 B | 102400 B | yes | PASS |
| fetchById | 6112 B | 0 B | 102400 B | yes | PASS |

## Detailed serial reports

### upsertOne

# Perf Report — upsertOne.serial

| metric | value |
|---|---|
| iterations | 200 |
| warmup | 5 |
| p10 | 0.00083ms |
| p50 | 0.00092ms |
| p95 | 0.0022ms |
| p99 | 0.0067ms |
| mean | 0.0012ms |
| stdev | 0.00095ms |
| min | 0.00079ms |
| max | 0.0094ms |
| total | 0.23ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.00083ms | 0.00079ms | +0.000042ms | +5.30% |
| p50 | 0.00092ms | 0.00088ms | +0.000042ms | +4.80% |
| p95 | 0.0022ms | 0.0020ms | +0.00022ms | +10.98% |
| p99 | 0.0067ms | 0.0052ms | +0.0015ms | +28.92% |
| mean | 0.0012ms | 0.0010ms | +0.00014ms | +13.13% |
| min | 0.00079ms | 0.00075ms | +0.000042ms | +5.60% |
| max | 0.0094ms | 0.0072ms | +0.0022ms | +30.63% |
| total | 0.23ms | 0.21ms | +0.03ms | +13.13% |

### queryNearestTop5

# Perf Report — queryNearestTop5.serial

| metric | value |
|---|---|
| iterations | 200 |
| warmup | 5 |
| p10 | 0.0040ms |
| p50 | 0.0077ms |
| p95 | 0.01ms |
| p99 | 0.03ms |
| mean | 0.0073ms |
| stdev | 0.0036ms |
| min | 0.0040ms |
| max | 0.03ms |
| total | 1.46ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.0040ms | 0.0040ms | +0.000084ms | +2.12% |
| p50 | 0.0077ms | 0.0064ms | +0.0013ms | +20.91% |
| p95 | 0.01ms | 0.01ms | -0.00084ms | -6.86% |
| p99 | 0.03ms | 0.02ms | +0.0077ms | +40.21% |
| mean | 0.0073ms | 0.0064ms | +0.00086ms | +13.32% |
| min | 0.0040ms | 0.0039ms | +0.000084ms | +2.15% |
| max | 0.03ms | 0.02ms | +0.0049ms | +20.89% |
| total | 1.46ms | 1.29ms | +0.17ms | +13.32% |

### fetchById

# Perf Report — fetchById.serial

| metric | value |
|---|---|
| iterations | 200 |
| warmup | 5 |
| p10 | 0.00025ms |
| p50 | 0.00025ms |
| p95 | 0.00034ms |
| p99 | 0.0015ms |
| mean | 0.00033ms |
| stdev | 0.00055ms |
| min | 0.00025ms |
| max | 0.0077ms |
| total | 0.07ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.00025ms | 0.00025ms | 0.00ms | 0.00% |
| p50 | 0.00025ms | 0.00058ms | -0.00033ms | -57.16% |
| p95 | 0.00034ms | 0.00080ms | -0.00046ms | -58.01% |
| p99 | 0.0015ms | 0.0064ms | -0.0049ms | -76.52% |
| mean | 0.00033ms | 0.00078ms | -0.00045ms | -57.44% |
| min | 0.00025ms | 0.00021ms | +0.000042ms | +20.19% |
| max | 0.0077ms | 0.04ms | -0.03ms | -79.12% |
| total | 0.07ms | 0.16ms | -0.09ms | -57.44% |

