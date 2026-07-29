# Perf Suite — vector

Threshold source: [docs/quality/perf-thresholds.md](../../quality/perf-thresholds)

測定系の分解能 = 0.00017ms (何もしない関数を同じ経路で呼んだ時の p10)。 回帰判定の絶対下限は既定でこの 2 倍 = 0.00033ms、 op ごとの実効値は下表の「下限」 列。

## Serial (concurrency = 1)

| op | p10 (回帰判定) | p95 (上限判定) | cap | 下限 | gate | regression |
|---|---|---|---|---|---|---|
| upsertOne | 0.00083ms | 0.0018ms | 5ms | 0.00033ms | PASS | stable — gate 無効 (regressionGate=false) |
| queryNearestTop5 | 0.0037ms | 0.01ms | 5ms | 0.00033ms | PASS | stable — gate 無効 (regressionGate=false) |
| fetchById | 0.00025ms | 0.00038ms | 5ms | 0.00033ms | PASS | stable (検知には +0.00033ms (baseline 比 +133%) 以上の悪化が必要) — gate 無効 (regressionGate=false) |

## Concurrent p95 (concurrency = 10, 50 iter each)

| op | p95 | cap | gate |
|---|---|---|---|
| upsertOne | 0.02ms | 10ms | PASS |
| queryNearestTop5 | 0.05ms | 10ms | PASS |
| fetchById | 0.00ms | 10ms | PASS |

## Memory retention (200 iter, arrayBuffers axis is the gate; heap is informational)

| op | heapUsed Δ | arrayBuffers Δ | cap | gc exposed | verdict |
|---|---|---|---|---|---|
| upsertOne | -8704 B | 0 B | 102400 B | yes | PASS |
| queryNearestTop5 | -15952 B | 0 B | 102400 B | yes | PASS |
| fetchById | 712 B | 0 B | 102400 B | yes | PASS |

## Detailed serial reports

### upsertOne

# Perf Report — upsertOne.serial

| metric | value |
|---|---|
| iterations | 200 |
| warmup | 5 |
| p10 | 0.00083ms |
| p50 | 0.00088ms |
| p95 | 0.0018ms |
| p99 | 0.0057ms |
| mean | 0.0010ms |
| stdev | 0.00079ms |
| min | 0.00075ms |
| max | 0.0084ms |
| total | 0.21ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.00083ms | 0.00079ms | +0.000041ms | +5.18% |
| p50 | 0.00088ms | 0.00088ms | 0.00ms | 0.00% |
| p95 | 0.0018ms | 0.0020ms | -0.00021ms | -10.61% |
| p99 | 0.0057ms | 0.0052ms | +0.00054ms | +10.38% |
| mean | 0.0010ms | 0.0010ms | -0.0000050ms | -0.48% |
| min | 0.00075ms | 0.00075ms | 0.00ms | 0.00% |
| max | 0.0084ms | 0.0072ms | +0.0012ms | +16.17% |
| total | 0.21ms | 0.21ms | -0.00099ms | -0.48% |

### queryNearestTop5

# Perf Report — queryNearestTop5.serial

| metric | value |
|---|---|
| iterations | 200 |
| warmup | 5 |
| p10 | 0.0037ms |
| p50 | 0.0072ms |
| p95 | 0.01ms |
| p99 | 0.02ms |
| mean | 0.0065ms |
| stdev | 0.0040ms |
| min | 0.0037ms |
| max | 0.03ms |
| total | 1.30ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.0037ms | 0.0040ms | -0.00025ms | -6.32% |
| p50 | 0.0072ms | 0.0064ms | +0.00083ms | +13.07% |
| p95 | 0.01ms | 0.01ms | +0.0010ms | +8.33% |
| p99 | 0.02ms | 0.02ms | +0.0052ms | +27.23% |
| mean | 0.0065ms | 0.0064ms | +0.000078ms | +1.22% |
| min | 0.0037ms | 0.0039ms | -0.00025ms | -6.38% |
| max | 0.03ms | 0.02ms | +0.0069ms | +29.64% |
| total | 1.30ms | 1.29ms | +0.02ms | +1.22% |

### fetchById

# Perf Report — fetchById.serial

| metric | value |
|---|---|
| iterations | 200 |
| warmup | 5 |
| p10 | 0.00025ms |
| p50 | 0.00025ms |
| p95 | 0.00038ms |
| p99 | 0.0013ms |
| mean | 0.00031ms |
| stdev | 0.00046ms |
| min | 0.00021ms |
| max | 0.0066ms |
| total | 0.06ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.00025ms | 0.00025ms | 0.00ms | 0.00% |
| p50 | 0.00025ms | 0.00058ms | -0.00033ms | -57.16% |
| p95 | 0.00038ms | 0.00080ms | -0.00043ms | -53.14% |
| p99 | 0.0013ms | 0.0064ms | -0.0051ms | -80.46% |
| mean | 0.00031ms | 0.00078ms | -0.00047ms | -60.51% |
| min | 0.00021ms | 0.00021ms | 0.00ms | 0.00% |
| max | 0.0066ms | 0.04ms | -0.03ms | -82.06% |
| total | 0.06ms | 0.16ms | -0.09ms | -60.51% |

