# Perf Suite — migration

Threshold source: [docs/quality/perf-thresholds.md](../../quality/perf-thresholds)

測定系の分解能 = 0.00017ms (何もしない関数を同じ経路で呼んだ時の p10)。 回帰判定の絶対下限は既定でこの 2 倍 = 0.00033ms、 op ごとの実効値は下表の「下限」 列。

## Serial (concurrency = 1)

| op | p10 (回帰判定) | p95 (上限判定) | cap | 下限 | gate | regression |
|---|---|---|---|---|---|---|
| runUp | 0.00054ms | 0.00067ms | 5ms | 0.00033ms | PASS | stable — gate 無効 (regressionGate=false) |
| diffSchema | 0.00096ms | 0.0016ms | 5ms | 0.00033ms | PASS | improved — gate 無効 (regressionGate=false) |
| clientCreate | 0.00017ms | 0.00025ms | 5ms | 0.00033ms | PASS | stable (検知には +0.00033ms (baseline 比 +201%) 以上の悪化が必要) — gate 無効 (regressionGate=false) |

## Concurrent p95 (concurrency = 10, 50 iter each)

| op | p95 | cap | gate |
|---|---|---|---|
| runUp | 0.02ms | 10ms | PASS |
| diffSchema | 0.02ms | 10ms | PASS |
| clientCreate | 0.00ms | 10ms | PASS |

## Memory retention (200 iter, arrayBuffers axis is the gate; heap is informational)

| op | heapUsed Δ | arrayBuffers Δ | cap | gc exposed | verdict |
|---|---|---|---|---|---|
| runUp | -220160 B | 0 B | 102400 B | yes | PASS |
| diffSchema | 616 B | 0 B | 102400 B | yes | PASS |
| clientCreate | 2384 B | 0 B | 102400 B | yes | PASS |

## Detailed serial reports

### runUp

# Perf Report — runUp.serial

| metric | value |
|---|---|
| iterations | 200 |
| warmup | 5 |
| p10 | 0.00054ms |
| p50 | 0.00054ms |
| p95 | 0.00067ms |
| p99 | 0.0068ms |
| mean | 0.00070ms |
| stdev | 0.00087ms |
| min | 0.00046ms |
| max | 0.0076ms |
| total | 0.14ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.00054ms | 0.00050ms | +0.000041ms | +8.20% |
| p50 | 0.00054ms | 0.00054ms | 0.00ms | 0.00% |
| p95 | 0.00067ms | 0.0022ms | -0.0015ms | -69.07% |
| p99 | 0.0068ms | 0.0068ms | +0.000034ms | +0.51% |
| mean | 0.00070ms | 0.00078ms | -0.000084ms | -10.78% |
| min | 0.00046ms | 0.00042ms | +0.000041ms | +9.83% |
| max | 0.0076ms | 0.0084ms | -0.00075ms | -8.96% |
| total | 0.14ms | 0.16ms | -0.02ms | -10.78% |

### diffSchema

# Perf Report — diffSchema.serial

| metric | value |
|---|---|
| iterations | 200 |
| warmup | 5 |
| p10 | 0.00096ms |
| p50 | 0.0010ms |
| p95 | 0.0016ms |
| p99 | 0.0051ms |
| mean | 0.0017ms |
| stdev | 0.0067ms |
| min | 0.00092ms |
| max | 0.10ms |
| total | 0.33ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.00096ms | 0.0013ms | -0.00038ms | -28.13% |
| p50 | 0.0010ms | 0.0013ms | -0.00033ms | -25.04% |
| p95 | 0.0016ms | 0.0026ms | -0.0010ms | -39.38% |
| p99 | 0.0051ms | 0.01ms | -0.0077ms | -60.34% |
| mean | 0.0017ms | 0.0048ms | -0.0032ms | -65.56% |
| min | 0.00092ms | 0.0013ms | -0.00038ms | -29.05% |
| max | 0.10ms | 0.61ms | -0.52ms | -84.55% |
| total | 0.33ms | 0.97ms | -0.63ms | -65.56% |

### clientCreate

# Perf Report — clientCreate.serial

| metric | value |
|---|---|
| iterations | 200 |
| warmup | 5 |
| p10 | 0.00017ms |
| p50 | 0.00021ms |
| p95 | 0.00025ms |
| p99 | 0.0014ms |
| mean | 0.00026ms |
| stdev | 0.00053ms |
| min | 0.00017ms |
| max | 0.0067ms |
| total | 0.05ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.00017ms | 0.00017ms | 0.00ms | 0.00% |
| p50 | 0.00021ms | 0.00021ms | 0.00ms | 0.00% |
| p95 | 0.00025ms | 0.00029ms | -0.000041ms | -14.10% |
| p99 | 0.0014ms | 0.0016ms | -0.00029ms | -17.80% |
| mean | 0.00026ms | 0.00029ms | -0.000037ms | -12.45% |
| min | 0.00017ms | 0.00017ms | 0.00ms | 0.00% |
| max | 0.0067ms | 0.01ms | -0.0039ms | -37.01% |
| total | 0.05ms | 0.06ms | -0.0073ms | -12.45% |

