# Perf Suite — vector

Threshold source: [docs/quality/perf-thresholds.md](../../quality/perf-thresholds)

測定系の分解能 = 0.00017ms (何もしない関数を同じ経路で呼んだ時の p10)。 回帰判定の絶対下限は既定でこの 2 倍 = 0.00033ms、 op ごとの実効値は下表の「下限」 列。

## Serial (concurrency = 1)

| op | p10 (回帰判定) | p95 (上限判定) | cap | 下限 | gate | regression |
|---|---|---|---|---|---|---|
| upsertOne | 0.00075ms | 0.0023ms | 5ms | 0.00033ms | PASS | stable — gate 無効 (regressionGate=false) |
| queryNearestTop5 | 0.0036ms | 0.01ms | 5ms | 0.00033ms | PASS | stable — gate 無効 (regressionGate=false) |
| fetchById | 0.00021ms | 0.00033ms | 5ms | 0.00033ms | PASS | stable (検知には +0.00033ms (baseline 比 +133%) 以上の悪化が必要) — gate 無効 (regressionGate=false) |

## Concurrent p95 (concurrency = 10, 50 iter each)

| op | p95 | cap | gate |
|---|---|---|---|
| upsertOne | 0.02ms | 10ms | PASS |
| queryNearestTop5 | 0.04ms | 10ms | PASS |
| fetchById | 0.00ms | 10ms | PASS |

## Memory retention (200 iter, arrayBuffers axis is the gate; heap is informational)

| op | heapUsed Δ | arrayBuffers Δ | cap | gc exposed | verdict |
|---|---|---|---|---|---|
| upsertOne | -11616 B | 0 B | 102400 B | yes | PASS |
| queryNearestTop5 | -15336 B | 0 B | 102400 B | yes | PASS |
| fetchById | 2456 B | 0 B | 102400 B | yes | PASS |

## Detailed serial reports

### upsertOne

# Perf Report — upsertOne.serial

| metric | value |
|---|---|
| iterations | 200 |
| warmup | 5 |
| p10 | 0.00075ms |
| p50 | 0.00079ms |
| p95 | 0.0023ms |
| p99 | 0.0050ms |
| mean | 0.0011ms |
| stdev | 0.00071ms |
| min | 0.00071ms |
| max | 0.0058ms |
| total | 0.22ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.00075ms | 0.00079ms | -0.000042ms | -5.30% |
| p50 | 0.00079ms | 0.00088ms | -0.000083ms | -9.49% |
| p95 | 0.0023ms | 0.0020ms | +0.00029ms | +15.00% |
| p99 | 0.0050ms | 0.0052ms | -0.00021ms | -4.07% |
| mean | 0.0011ms | 0.0010ms | +0.000046ms | +4.41% |
| min | 0.00071ms | 0.00075ms | -0.000042ms | -5.60% |
| max | 0.0058ms | 0.0072ms | -0.0014ms | -19.66% |
| total | 0.22ms | 0.21ms | +0.0092ms | +4.41% |

### queryNearestTop5

# Perf Report — queryNearestTop5.serial

| metric | value |
|---|---|
| iterations | 200 |
| warmup | 5 |
| p10 | 0.0036ms |
| p50 | 0.0059ms |
| p95 | 0.01ms |
| p99 | 0.02ms |
| mean | 0.0058ms |
| stdev | 0.0026ms |
| min | 0.0035ms |
| max | 0.02ms |
| total | 1.16ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.0036ms | 0.0040ms | -0.00037ms | -9.47% |
| p50 | 0.0059ms | 0.0064ms | -0.00050ms | -7.84% |
| p95 | 0.01ms | 0.01ms | -0.0020ms | -16.14% |
| p99 | 0.02ms | 0.02ms | -0.0030ms | -15.79% |
| mean | 0.0058ms | 0.0064ms | -0.00062ms | -9.62% |
| min | 0.0035ms | 0.0039ms | -0.00042ms | -10.62% |
| max | 0.02ms | 0.02ms | -0.0016ms | -6.79% |
| total | 1.16ms | 1.29ms | -0.12ms | -9.62% |

### fetchById

# Perf Report — fetchById.serial

| metric | value |
|---|---|
| iterations | 200 |
| warmup | 5 |
| p10 | 0.00021ms |
| p50 | 0.00025ms |
| p95 | 0.00033ms |
| p99 | 0.0011ms |
| mean | 0.00029ms |
| stdev | 0.00046ms |
| min | 0.00021ms |
| max | 0.0066ms |
| total | 0.06ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.00021ms | 0.00025ms | -0.000042ms | -16.80% |
| p50 | 0.00025ms | 0.00058ms | -0.00033ms | -57.16% |
| p95 | 0.00033ms | 0.00080ms | -0.00047ms | -58.27% |
| p99 | 0.0011ms | 0.0064ms | -0.0053ms | -83.07% |
| mean | 0.00029ms | 0.00078ms | -0.00048ms | -62.28% |
| min | 0.00021ms | 0.00021ms | 0.00ms | 0.00% |
| max | 0.0066ms | 0.04ms | -0.03ms | -81.95% |
| total | 0.06ms | 0.16ms | -0.10ms | -62.28% |

