# Perf Suite — vector

Threshold source: [docs/quality/perf-thresholds.md](../../quality/perf-thresholds)

測定系の分解能 = 0.00017ms (何もしない関数を同じ経路で呼んだ時の p10)。 回帰判定の絶対下限は既定でこの 2 倍 = 0.00033ms、 op ごとの実効値は下表の「下限」 列。

## Serial (concurrency = 1)

| op | p10 (回帰判定) | p95 (上限判定) | cap | 下限 | gate | regression |
|---|---|---|---|---|---|---|
| upsertOne | 0.00079ms | 0.0026ms | 5ms | 0.00033ms | PASS | stable (p10 -0% (閾値未満)、 p95 +34% (裾は実行間の振れ幅と区別できないため判定には使わない)) — gate 無効 (regressionGate=false) |
| queryNearestTop5 | 0.0036ms | 0.01ms | 5ms | 0.00033ms | PASS | stable — gate 無効 (regressionGate=false) |
| fetchById | 0.00021ms | 0.00033ms | 5ms | 0.00033ms | PASS | stable (検知には +0.00033ms (baseline 比 +133%) 以上の悪化が必要) — gate 無効 (regressionGate=false) |

## Concurrent p95 (concurrency = 10, 50 iter each)

| op | p95 | cap | gate |
|---|---|---|---|
| upsertOne | 0.02ms | 10ms | PASS |
| queryNearestTop5 | 0.05ms | 10ms | PASS |
| fetchById | 0.01ms | 10ms | PASS |

## Memory retention (200 iter, arrayBuffers axis is the gate; heap is informational)

| op | heapUsed Δ | arrayBuffers Δ | cap | gc exposed | verdict |
|---|---|---|---|---|---|
| upsertOne | -8272 B | 0 B | 102400 B | yes | PASS |
| queryNearestTop5 | -15136 B | 0 B | 102400 B | yes | PASS |
| fetchById | 616 B | 0 B | 102400 B | yes | PASS |

## Detailed serial reports

### upsertOne

# Perf Report — upsertOne.serial

| metric | value |
|---|---|
| iterations | 200 |
| warmup | 5 |
| p10 | 0.00079ms |
| p50 | 0.00083ms |
| p95 | 0.0026ms |
| p99 | 0.0052ms |
| mean | 0.0012ms |
| stdev | 0.0011ms |
| min | 0.00075ms |
| max | 0.01ms |
| total | 0.23ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.00079ms | 0.00079ms | -0.0000010ms | -0.13% |
| p50 | 0.00083ms | 0.00088ms | -0.000042ms | -4.80% |
| p95 | 0.0026ms | 0.0020ms | +0.00066ms | +33.92% |
| p99 | 0.0052ms | 0.0052ms | -0.0000085ms | -0.16% |
| mean | 0.0012ms | 0.0010ms | +0.00014ms | +13.03% |
| min | 0.00075ms | 0.00075ms | 0.00ms | 0.00% |
| max | 0.01ms | 0.0072ms | +0.0036ms | +49.70% |
| total | 0.23ms | 0.21ms | +0.03ms | +13.03% |

### queryNearestTop5

# Perf Report — queryNearestTop5.serial

| metric | value |
|---|---|
| iterations | 200 |
| warmup | 5 |
| p10 | 0.0036ms |
| p50 | 0.0058ms |
| p95 | 0.01ms |
| p99 | 0.03ms |
| mean | 0.0065ms |
| stdev | 0.0077ms |
| min | 0.0036ms |
| max | 0.10ms |
| total | 1.29ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.0036ms | 0.0040ms | -0.00033ms | -8.41% |
| p50 | 0.0058ms | 0.0064ms | -0.00056ms | -8.82% |
| p95 | 0.01ms | 0.01ms | +0.00022ms | +1.80% |
| p99 | 0.03ms | 0.02ms | +0.0066ms | +34.49% |
| mean | 0.0065ms | 0.0064ms | +0.000025ms | +0.38% |
| min | 0.0036ms | 0.0039ms | -0.00029ms | -7.43% |
| max | 0.10ms | 0.02ms | +0.08ms | +336.23% |
| total | 1.29ms | 1.29ms | +0.0049ms | +0.38% |

### fetchById

# Perf Report — fetchById.serial

| metric | value |
|---|---|
| iterations | 200 |
| warmup | 5 |
| p10 | 0.00021ms |
| p50 | 0.00025ms |
| p95 | 0.00033ms |
| p99 | 0.0013ms |
| mean | 0.00030ms |
| stdev | 0.00042ms |
| min | 0.00021ms |
| max | 0.0058ms |
| total | 0.06ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.00021ms | 0.00025ms | -0.000041ms | -16.40% |
| p50 | 0.00025ms | 0.00058ms | -0.00033ms | -57.16% |
| p95 | 0.00033ms | 0.00080ms | -0.00047ms | -58.27% |
| p99 | 0.0013ms | 0.0064ms | -0.0051ms | -80.40% |
| mean | 0.00030ms | 0.00078ms | -0.00047ms | -60.91% |
| min | 0.00021ms | 0.00021ms | 0.00ms | 0.00% |
| max | 0.0058ms | 0.04ms | -0.03ms | -84.11% |
| total | 0.06ms | 0.16ms | -0.09ms | -60.91% |

