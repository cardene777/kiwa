# Perf Suite — migration

Threshold source: [docs/quality/perf-thresholds.md](../../quality/perf-thresholds)

測定系の分解能 = 0.00017ms (何もしない関数を同じ経路で呼んだ時の p10)。 回帰判定の絶対下限は既定でこの 2 倍 = 0.00033ms、 op ごとの実効値は下表の「下限」 列。

## Serial (concurrency = 1)

| op | p10 (回帰判定) | p95 (上限判定) | cap | 下限 | gate | regression |
|---|---|---|---|---|---|---|
| runUp | 0.00046ms | 0.00082ms | 5ms | 0.00033ms | PASS | stable — gate 無効 (regressionGate=false) |
| diffSchema | 0.00096ms | 0.0015ms | 5ms | 0.00033ms | PASS | improved — gate 無効 (regressionGate=false) |
| clientCreate | 0.00017ms | 0.00038ms | 5ms | 0.00033ms | PASS | stable (検知には +0.00033ms (baseline 比 +200%) 以上の悪化が必要) — gate 無効 (regressionGate=false) |

## Concurrent p95 (concurrency = 10, 50 iter each)

| op | p95 | cap | gate |
|---|---|---|---|
| runUp | 0.01ms | 10ms | PASS |
| diffSchema | 0.02ms | 10ms | PASS |
| clientCreate | 0.00ms | 10ms | PASS |

## Memory retention (200 iter, arrayBuffers axis is the gate; heap is informational)

| op | heapUsed Δ | arrayBuffers Δ | cap | gc exposed | verdict |
|---|---|---|---|---|---|
| runUp | -224712 B | 0 B | 102400 B | yes | PASS |
| diffSchema | -15008 B | 0 B | 102400 B | yes | PASS |
| clientCreate | 616 B | 0 B | 102400 B | yes | PASS |

## Detailed serial reports

### runUp

# Perf Report — runUp.serial

| metric | value |
|---|---|
| iterations | 200 |
| warmup | 5 |
| p10 | 0.00046ms |
| p50 | 0.00050ms |
| p95 | 0.00082ms |
| p99 | 0.0072ms |
| mean | 0.00077ms |
| stdev | 0.0016ms |
| min | 0.00042ms |
| max | 0.02ms |
| total | 0.15ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.00046ms | 0.00050ms | -0.000042ms | -8.40% |
| p50 | 0.00050ms | 0.00054ms | -0.000042ms | -7.75% |
| p95 | 0.00082ms | 0.0022ms | -0.0014ms | -62.35% |
| p99 | 0.0072ms | 0.0068ms | +0.00038ms | +5.54% |
| mean | 0.00077ms | 0.00078ms | -0.000013ms | -1.62% |
| min | 0.00042ms | 0.00042ms | -0.0000010ms | -0.24% |
| max | 0.02ms | 0.0084ms | +0.01ms | +128.36% |
| total | 0.15ms | 0.16ms | -0.0025ms | -1.62% |

### diffSchema

# Perf Report — diffSchema.serial

| metric | value |
|---|---|
| iterations | 200 |
| warmup | 5 |
| p10 | 0.00096ms |
| p50 | 0.00098ms |
| p95 | 0.0015ms |
| p99 | 0.0051ms |
| mean | 0.0012ms |
| stdev | 0.00071ms |
| min | 0.00092ms |
| max | 0.0078ms |
| total | 0.24ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.00096ms | 0.0013ms | -0.00038ms | -28.13% |
| p50 | 0.00098ms | 0.0013ms | -0.00035ms | -26.57% |
| p95 | 0.0015ms | 0.0026ms | -0.0012ms | -44.30% |
| p99 | 0.0051ms | 0.01ms | -0.0077ms | -60.23% |
| mean | 0.0012ms | 0.0048ms | -0.0037ms | -75.72% |
| min | 0.00092ms | 0.0013ms | -0.00038ms | -29.05% |
| max | 0.0078ms | 0.61ms | -0.61ms | -98.73% |
| total | 0.24ms | 0.97ms | -0.73ms | -75.72% |

### clientCreate

# Perf Report — clientCreate.serial

| metric | value |
|---|---|
| iterations | 200 |
| warmup | 5 |
| p10 | 0.00017ms |
| p50 | 0.00021ms |
| p95 | 0.00038ms |
| p99 | 0.0013ms |
| mean | 0.00025ms |
| stdev | 0.00044ms |
| min | 0.00017ms |
| max | 0.0056ms |
| total | 0.05ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.00017ms | 0.00017ms | 0.00ms | 0.00% |
| p50 | 0.00021ms | 0.00021ms | 0.00ms | 0.00% |
| p95 | 0.00038ms | 0.00029ms | +0.000084ms | +28.84% |
| p99 | 0.0013ms | 0.0016ms | -0.00030ms | -18.22% |
| mean | 0.00025ms | 0.00029ms | -0.000044ms | -14.91% |
| min | 0.00017ms | 0.00017ms | 0.00ms | 0.00% |
| max | 0.0056ms | 0.01ms | -0.0050ms | -46.85% |
| total | 0.05ms | 0.06ms | -0.0088ms | -14.91% |

