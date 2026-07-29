# Perf Suite — vector

Threshold source: [docs/quality/perf-thresholds.md](../../quality/perf-thresholds)

測定系の分解能 = 0.00017ms (何もしない関数を同じ経路で呼んだ時の p10)。 回帰判定の絶対下限は既定でこの 2 倍 = 0.00033ms、 op ごとの実効値は下表の「下限」 列。

## Serial (concurrency = 1)

| op | p10 (回帰判定) | p95 (上限判定) | cap | 下限 | gate | regression |
|---|---|---|---|---|---|---|
| upsertOne | 0.00079ms | 0.0014ms | 5ms | 0.00033ms | PASS | stable — gate 無効 (regressionGate=false) |
| queryNearestTop5 | 0.0042ms | 0.01ms | 5ms | 0.00033ms | PASS | stable — gate 無効 (regressionGate=false) |
| fetchById | 0.00029ms | 0.00042ms | 5ms | 0.00033ms | PASS | stable (検知には +0.00033ms (baseline 比 +133%) 以上の悪化が必要) — gate 無効 (regressionGate=false) |

## Concurrent p95 (concurrency = 10, 50 iter each)

| op | p95 | cap | gate |
|---|---|---|---|
| upsertOne | 0.02ms | 10ms | PASS |
| queryNearestTop5 | 0.05ms | 10ms | PASS |
| fetchById | 0.01ms | 10ms | PASS |

## Memory retention (200 iter, arrayBuffers axis is the gate; heap is informational)

| op | heapUsed Δ | arrayBuffers Δ | cap | gc exposed | verdict |
|---|---|---|---|---|---|
| upsertOne | -13448 B | 0 B | 102400 B | yes | PASS |
| queryNearestTop5 | 1744 B | 0 B | 102400 B | yes | PASS |
| fetchById | 440 B | 0 B | 102400 B | yes | PASS |

## Detailed serial reports

### upsertOne

# Perf Report — upsertOne.serial

| metric | value |
|---|---|
| iterations | 200 |
| warmup | 5 |
| p10 | 0.00079ms |
| p50 | 0.00079ms |
| p95 | 0.0014ms |
| p99 | 0.0053ms |
| mean | 0.00096ms |
| stdev | 0.00070ms |
| min | 0.00075ms |
| max | 0.0070ms |
| total | 0.19ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.00079ms | 0.00079ms | -0.0000051ms | -0.64% |
| p50 | 0.00079ms | 0.00088ms | -0.000083ms | -9.49% |
| p95 | 0.0014ms | 0.0020ms | -0.00052ms | -26.69% |
| p99 | 0.0053ms | 0.0052ms | +0.00016ms | +3.09% |
| mean | 0.00096ms | 0.0010ms | -0.000080ms | -7.66% |
| min | 0.00075ms | 0.00075ms | 0.00ms | 0.00% |
| max | 0.0070ms | 0.0072ms | -0.00017ms | -2.32% |
| total | 0.19ms | 0.21ms | -0.02ms | -7.66% |

### queryNearestTop5

# Perf Report — queryNearestTop5.serial

| metric | value |
|---|---|
| iterations | 200 |
| warmup | 5 |
| p10 | 0.0042ms |
| p50 | 0.0080ms |
| p95 | 0.01ms |
| p99 | 0.02ms |
| mean | 0.0069ms |
| stdev | 0.0040ms |
| min | 0.0041ms |
| max | 0.04ms |
| total | 1.39ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.0042ms | 0.0040ms | +0.00021ms | +5.26% |
| p50 | 0.0080ms | 0.0064ms | +0.0017ms | +26.15% |
| p95 | 0.01ms | 0.01ms | +0.00043ms | +3.49% |
| p99 | 0.02ms | 0.02ms | +0.0016ms | +8.45% |
| mean | 0.0069ms | 0.0064ms | +0.00051ms | +7.90% |
| min | 0.0041ms | 0.0039ms | +0.00021ms | +5.34% |
| max | 0.04ms | 0.02ms | +0.02ms | +69.46% |
| total | 1.39ms | 1.29ms | +0.10ms | +7.90% |

### fetchById

# Perf Report — fetchById.serial

| metric | value |
|---|---|
| iterations | 200 |
| warmup | 5 |
| p10 | 0.00029ms |
| p50 | 0.00029ms |
| p95 | 0.00042ms |
| p99 | 0.0013ms |
| mean | 0.00036ms |
| stdev | 0.00054ms |
| min | 0.00025ms |
| max | 0.0077ms |
| total | 0.07ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.00029ms | 0.00025ms | +0.000041ms | +16.40% |
| p50 | 0.00029ms | 0.00058ms | -0.00029ms | -49.96% |
| p95 | 0.00042ms | 0.00080ms | -0.00038ms | -48.02% |
| p99 | 0.0013ms | 0.0064ms | -0.0051ms | -79.14% |
| mean | 0.00036ms | 0.00078ms | -0.00041ms | -53.20% |
| min | 0.00025ms | 0.00021ms | +0.000042ms | +20.19% |
| max | 0.0077ms | 0.04ms | -0.03ms | -79.00% |
| total | 0.07ms | 0.16ms | -0.08ms | -53.20% |

