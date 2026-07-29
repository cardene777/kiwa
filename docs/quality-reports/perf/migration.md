# Perf Suite — migration

Threshold source: [docs/quality/perf-thresholds.md](../../quality/perf-thresholds)

測定系の分解能 = 0.00017ms (何もしない関数を同じ経路で呼んだ時の p10)。 回帰判定の絶対下限は既定でこの 2 倍 = 0.00033ms、 op ごとの実効値は下表の「下限」 列。

## Serial (concurrency = 1)

| op | p10 (回帰判定) | p95 (上限判定) | cap | 下限 | gate | regression |
|---|---|---|---|---|---|---|
| runUp | 0.00046ms | 0.0017ms | 5ms | 0.00033ms | PASS | stable — gate 無効 (regressionGate=false) |
| diffSchema | 0.0010ms | 0.0015ms | 5ms | 0.00033ms | PASS | improved — gate 無効 (regressionGate=false) |
| clientCreate | 0.00017ms | 0.00029ms | 5ms | 0.00033ms | PASS | stable (検知には +0.00033ms (baseline 比 +200%) 以上の悪化が必要) — gate 無効 (regressionGate=false) |

## Concurrent p95 (concurrency = 10, 50 iter each)

| op | p95 | cap | gate |
|---|---|---|---|
| runUp | 0.02ms | 10ms | PASS |
| diffSchema | 0.02ms | 10ms | PASS |
| clientCreate | 0.00ms | 10ms | PASS |

## Memory retention (200 iter, arrayBuffers axis is the gate; heap is informational)

| op | heapUsed Δ | arrayBuffers Δ | cap | gc exposed | verdict |
|---|---|---|---|---|---|
| runUp | -193072 B | 0 B | 102400 B | yes | PASS |
| diffSchema | -248 B | 0 B | 102400 B | yes | PASS |
| clientCreate | 1728 B | 0 B | 102400 B | yes | PASS |

## Detailed serial reports

### runUp

# Perf Report — runUp.serial

| metric | value |
|---|---|
| iterations | 200 |
| warmup | 5 |
| p10 | 0.00046ms |
| p50 | 0.00050ms |
| p95 | 0.0017ms |
| p99 | 0.0071ms |
| mean | 0.00082ms |
| stdev | 0.0011ms |
| min | 0.00042ms |
| max | 0.0094ms |
| total | 0.16ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.00046ms | 0.00050ms | -0.000042ms | -8.40% |
| p50 | 0.00050ms | 0.00054ms | -0.000042ms | -7.75% |
| p95 | 0.0017ms | 0.0022ms | -0.00045ms | -20.91% |
| p99 | 0.0071ms | 0.0068ms | +0.00029ms | +4.21% |
| mean | 0.00082ms | 0.00078ms | +0.000037ms | +4.74% |
| min | 0.00042ms | 0.00042ms | -0.0000010ms | -0.24% |
| max | 0.0094ms | 0.0084ms | +0.0010ms | +11.94% |
| total | 0.16ms | 0.16ms | +0.0074ms | +4.74% |

### diffSchema

# Perf Report — diffSchema.serial

| metric | value |
|---|---|
| iterations | 200 |
| warmup | 5 |
| p10 | 0.0010ms |
| p50 | 0.0010ms |
| p95 | 0.0015ms |
| p99 | 0.0058ms |
| mean | 0.0012ms |
| stdev | 0.00068ms |
| min | 0.00096ms |
| max | 0.0072ms |
| total | 0.24ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.0010ms | 0.0013ms | -0.00033ms | -24.98% |
| p50 | 0.0010ms | 0.0013ms | -0.00029ms | -21.96% |
| p95 | 0.0015ms | 0.0026ms | -0.0011ms | -42.86% |
| p99 | 0.0058ms | 0.01ms | -0.0070ms | -55.00% |
| mean | 0.0012ms | 0.0048ms | -0.0036ms | -74.97% |
| min | 0.00096ms | 0.0013ms | -0.00033ms | -25.79% |
| max | 0.0072ms | 0.61ms | -0.61ms | -98.83% |
| total | 0.24ms | 0.97ms | -0.73ms | -74.97% |

### clientCreate

# Perf Report — clientCreate.serial

| metric | value |
|---|---|
| iterations | 200 |
| warmup | 5 |
| p10 | 0.00017ms |
| p50 | 0.00017ms |
| p95 | 0.00029ms |
| p99 | 0.0017ms |
| mean | 0.00026ms |
| stdev | 0.00054ms |
| min | 0.00017ms |
| max | 0.0069ms |
| total | 0.05ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.00017ms | 0.00017ms | 0.00ms | 0.00% |
| p50 | 0.00017ms | 0.00021ms | -0.000041ms | -19.71% |
| p95 | 0.00029ms | 0.00029ms | 0.00ms | 0.00% |
| p99 | 0.0017ms | 0.0016ms | +0.000075ms | +4.54% |
| mean | 0.00026ms | 0.00029ms | -0.000036ms | -12.17% |
| min | 0.00017ms | 0.00017ms | 0.00ms | 0.00% |
| max | 0.0069ms | 0.01ms | -0.0037ms | -35.04% |
| total | 0.05ms | 0.06ms | -0.0072ms | -12.17% |

