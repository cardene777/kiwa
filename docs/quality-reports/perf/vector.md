# Perf Suite — vector

Threshold source: [docs/quality/perf-thresholds.md](../../quality/perf-thresholds)

測定系の分解能 = 0.00017ms (何もしない関数を同じ経路で呼んだ時の p10)。 回帰判定の絶対下限は既定でこの 2 倍 = 0.00033ms、 op ごとの実効値は下表の「下限」 列。

## Serial (concurrency = 1)

| op | p10 (回帰判定) | p95 (上限判定) | cap | 下限 | gate | regression |
|---|---|---|---|---|---|---|
| upsertOne | 0.00079ms | 0.0016ms | 5ms | 0.00033ms | PASS | stable — gate 無効 (regressionGate=false) |
| queryNearestTop5 | 0.0036ms | 0.01ms | 5ms | 0.00033ms | PASS | stable — gate 無効 (regressionGate=false) |
| fetchById | 0.00021ms | 0.00033ms | 5ms | 0.00033ms | PASS | stable (検知には +0.00033ms (baseline 比 +133%) 以上の悪化が必要) — gate 無効 (regressionGate=false) |

## Concurrent p95 (concurrency = 10, 50 iter each)

| op | p95 | cap | gate |
|---|---|---|---|
| upsertOne | 0.02ms | 10ms | PASS |
| queryNearestTop5 | 0.05ms | 10ms | PASS |
| fetchById | 0.02ms | 10ms | PASS |

## Memory retention (200 iter, arrayBuffers axis is the gate; heap is informational)

| op | heapUsed Δ | arrayBuffers Δ | cap | gc exposed | verdict |
|---|---|---|---|---|---|
| upsertOne | -17704 B | 0 B | 102400 B | yes | PASS |
| queryNearestTop5 | -15648 B | 0 B | 102400 B | yes | PASS |
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
| p95 | 0.0016ms |
| p99 | 0.0058ms |
| mean | 0.0010ms |
| stdev | 0.00086ms |
| min | 0.00075ms |
| max | 0.0070ms |
| total | 0.20ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.00079ms | 0.00079ms | -0.0000010ms | -0.13% |
| p50 | 0.00083ms | 0.00088ms | -0.000042ms | -4.80% |
| p95 | 0.0016ms | 0.0020ms | -0.00041ms | -20.69% |
| p99 | 0.0058ms | 0.0052ms | +0.00062ms | +11.95% |
| mean | 0.0010ms | 0.0010ms | -0.000024ms | -2.30% |
| min | 0.00075ms | 0.00075ms | 0.00ms | 0.00% |
| max | 0.0070ms | 0.0072ms | -0.00021ms | -2.90% |
| total | 0.20ms | 0.21ms | -0.0048ms | -2.30% |

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
| mean | 0.0061ms |
| stdev | 0.0030ms |
| min | 0.0036ms |
| max | 0.02ms |
| total | 1.21ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.0036ms | 0.0040ms | -0.00033ms | -8.41% |
| p50 | 0.0059ms | 0.0064ms | -0.00046ms | -7.18% |
| p95 | 0.01ms | 0.01ms | -0.00095ms | -7.74% |
| p99 | 0.02ms | 0.02ms | -0.00063ms | -3.26% |
| mean | 0.0061ms | 0.0064ms | -0.00038ms | -5.85% |
| min | 0.0036ms | 0.0039ms | -0.00033ms | -8.50% |
| max | 0.02ms | 0.02ms | +0.00046ms | +1.96% |
| total | 1.21ms | 1.29ms | -0.08ms | -5.85% |

### fetchById

# Perf Report — fetchById.serial

| metric | value |
|---|---|
| iterations | 200 |
| warmup | 5 |
| p10 | 0.00021ms |
| p50 | 0.00025ms |
| p95 | 0.00033ms |
| p99 | 0.0016ms |
| mean | 0.00031ms |
| stdev | 0.00047ms |
| min | 0.00021ms |
| max | 0.0065ms |
| total | 0.06ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.00021ms | 0.00025ms | -0.000041ms | -16.40% |
| p50 | 0.00025ms | 0.00058ms | -0.00033ms | -57.16% |
| p95 | 0.00033ms | 0.00080ms | -0.00047ms | -58.27% |
| p99 | 0.0016ms | 0.0064ms | -0.0048ms | -75.27% |
| mean | 0.00031ms | 0.00078ms | -0.00047ms | -59.97% |
| min | 0.00021ms | 0.00021ms | 0.00ms | 0.00% |
| max | 0.0065ms | 0.04ms | -0.03ms | -82.29% |
| total | 0.06ms | 0.16ms | -0.09ms | -59.97% |

