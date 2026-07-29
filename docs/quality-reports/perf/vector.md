# Perf Suite — vector

Threshold source: [docs/quality/perf-thresholds.md](../../quality/perf-thresholds)

測定系の分解能 = 0.00017ms (何もしない関数を同じ経路で呼んだ時の p10)。 回帰判定の絶対下限は既定でこの 2 倍 = 0.00033ms、 op ごとの実効値は下表の「下限」 列。

## Serial (concurrency = 1)

| op | p10 (回帰判定) | p95 (上限判定) | cap | 下限 | gate | regression |
|---|---|---|---|---|---|---|
| upsertOne | 0.00079ms | 0.0014ms | 5ms | 0.00033ms | PASS | stable — gate 無効 (regressionGate=false) |
| queryNearestTop5 | 0.0037ms | 0.01ms | 5ms | 0.00033ms | PASS | stable — gate 無効 (regressionGate=false) |
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
| upsertOne | -8744 B | 0 B | 102400 B | yes | PASS |
| queryNearestTop5 | -16464 B | 0 B | 102400 B | yes | PASS |
| fetchById | -416 B | 0 B | 102400 B | yes | PASS |

## Detailed serial reports

### upsertOne

# Perf Report — upsertOne.serial

| metric | value |
|---|---|
| iterations | 200 |
| warmup | 5 |
| p10 | 0.00079ms |
| p50 | 0.00083ms |
| p95 | 0.0014ms |
| p99 | 0.0056ms |
| mean | 0.0011ms |
| stdev | 0.0022ms |
| min | 0.00075ms |
| max | 0.03ms |
| total | 0.23ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.00079ms | 0.00079ms | -0.0000010ms | -0.13% |
| p50 | 0.00083ms | 0.00088ms | -0.000041ms | -4.69% |
| p95 | 0.0014ms | 0.0020ms | -0.00054ms | -27.54% |
| p99 | 0.0056ms | 0.0052ms | +0.00042ms | +8.07% |
| mean | 0.0011ms | 0.0010ms | +0.000090ms | +8.66% |
| min | 0.00075ms | 0.00075ms | 0.00ms | 0.00% |
| max | 0.03ms | 0.0072ms | +0.02ms | +322.51% |
| total | 0.23ms | 0.21ms | +0.02ms | +8.66% |

### queryNearestTop5

# Perf Report — queryNearestTop5.serial

| metric | value |
|---|---|
| iterations | 200 |
| warmup | 5 |
| p10 | 0.0037ms |
| p50 | 0.0059ms |
| p95 | 0.01ms |
| p99 | 0.02ms |
| mean | 0.0067ms |
| stdev | 0.0084ms |
| min | 0.0036ms |
| max | 0.12ms |
| total | 1.34ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.0037ms | 0.0040ms | -0.00029ms | -7.38% |
| p50 | 0.0059ms | 0.0064ms | -0.00050ms | -7.84% |
| p95 | 0.01ms | 0.01ms | -0.000061ms | -0.49% |
| p99 | 0.02ms | 0.02ms | +0.00098ms | +5.09% |
| mean | 0.0067ms | 0.0064ms | +0.00025ms | +3.93% |
| min | 0.0036ms | 0.0039ms | -0.00033ms | -8.50% |
| max | 0.12ms | 0.02ms | +0.09ms | +403.20% |
| total | 1.34ms | 1.29ms | +0.05ms | +3.93% |

### fetchById

# Perf Report — fetchById.serial

| metric | value |
|---|---|
| iterations | 200 |
| warmup | 5 |
| p10 | 0.00021ms |
| p50 | 0.00025ms |
| p95 | 0.00033ms |
| p99 | 0.0017ms |
| mean | 0.00032ms |
| stdev | 0.00054ms |
| min | 0.00021ms |
| max | 0.0075ms |
| total | 0.06ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.00021ms | 0.00025ms | -0.000041ms | -16.40% |
| p50 | 0.00025ms | 0.00058ms | -0.00033ms | -57.16% |
| p95 | 0.00033ms | 0.00080ms | -0.00047ms | -58.39% |
| p99 | 0.0017ms | 0.0064ms | -0.0047ms | -73.94% |
| mean | 0.00032ms | 0.00078ms | -0.00046ms | -59.09% |
| min | 0.00021ms | 0.00021ms | 0.00ms | 0.00% |
| max | 0.0075ms | 0.04ms | -0.03ms | -79.57% |
| total | 0.06ms | 0.16ms | -0.09ms | -59.09% |

