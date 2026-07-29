# Perf Suite — migration

Threshold source: [docs/quality/perf-thresholds.md](../../quality/perf-thresholds)

測定系の分解能 = 0.00017ms (何もしない関数を同じ経路で呼んだ時の p10)。 回帰判定の絶対下限は既定でこの 2 倍 = 0.00033ms、 op ごとの実効値は下表の「下限」 列。

## Serial (concurrency = 1)

| op | p10 (回帰判定) | p95 (上限判定) | cap | 下限 | gate | regression |
|---|---|---|---|---|---|---|
| runUp | 0.00046ms | 0.0011ms | 5ms | 0.00033ms | PASS | stable — gate 無効 (regressionGate=false) |
| diffSchema | 0.00096ms | 0.0018ms | 5ms | 0.00033ms | PASS | improved — gate 無効 (regressionGate=false) |
| clientCreate | 0.00017ms | 0.00029ms | 5ms | 0.00033ms | PASS | stable (検知には +0.00033ms (baseline 比 +200%) 以上の悪化が必要) — gate 無効 (regressionGate=false) |

## Concurrent p95 (concurrency = 10, 50 iter each)

| op | p95 | cap | gate |
|---|---|---|---|
| runUp | 0.01ms | 10ms | PASS |
| diffSchema | 0.02ms | 10ms | PASS |
| clientCreate | 0.01ms | 10ms | PASS |

## Memory retention (200 iter, arrayBuffers axis is the gate; heap is informational)

| op | heapUsed Δ | arrayBuffers Δ | cap | gc exposed | verdict |
|---|---|---|---|---|---|
| runUp | -226904 B | 0 B | 102400 B | yes | PASS |
| diffSchema | -16296 B | 0 B | 102400 B | yes | PASS |
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
| p95 | 0.0011ms |
| p99 | 0.0062ms |
| mean | 0.00065ms |
| stdev | 0.00082ms |
| min | 0.00046ms |
| max | 0.0072ms |
| total | 0.13ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.00046ms | 0.00050ms | -0.000042ms | -8.40% |
| p50 | 0.00050ms | 0.00054ms | -0.000042ms | -7.75% |
| p95 | 0.0011ms | 0.0022ms | -0.0010ms | -48.06% |
| p99 | 0.0062ms | 0.0068ms | -0.00063ms | -9.33% |
| mean | 0.00065ms | 0.00078ms | -0.00013ms | -16.50% |
| min | 0.00046ms | 0.00042ms | +0.000041ms | +9.83% |
| max | 0.0072ms | 0.0084ms | -0.0012ms | -13.93% |
| total | 0.13ms | 0.16ms | -0.03ms | -16.50% |

### diffSchema

# Perf Report — diffSchema.serial

| metric | value |
|---|---|
| iterations | 200 |
| warmup | 5 |
| p10 | 0.00096ms |
| p50 | 0.0010ms |
| p95 | 0.0018ms |
| p99 | 0.0059ms |
| mean | 0.0017ms |
| stdev | 0.0069ms |
| min | 0.00092ms |
| max | 0.10ms |
| total | 0.34ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.00096ms | 0.0013ms | -0.00038ms | -28.13% |
| p50 | 0.0010ms | 0.0013ms | -0.00033ms | -25.04% |
| p95 | 0.0018ms | 0.0026ms | -0.00082ms | -31.37% |
| p99 | 0.0059ms | 0.01ms | -0.0069ms | -53.99% |
| mean | 0.0017ms | 0.0048ms | -0.0031ms | -64.84% |
| min | 0.00092ms | 0.0013ms | -0.00038ms | -29.05% |
| max | 0.10ms | 0.61ms | -0.52ms | -83.98% |
| total | 0.34ms | 0.97ms | -0.63ms | -64.84% |

### clientCreate

# Perf Report — clientCreate.serial

| metric | value |
|---|---|
| iterations | 200 |
| warmup | 5 |
| p10 | 0.00017ms |
| p50 | 0.00021ms |
| p95 | 0.00029ms |
| p99 | 0.0022ms |
| mean | 0.00027ms |
| stdev | 0.00062ms |
| min | 0.00017ms |
| max | 0.0078ms |
| total | 0.05ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.00017ms | 0.00017ms | 0.00ms | 0.00% |
| p50 | 0.00021ms | 0.00021ms | 0.00ms | 0.00% |
| p95 | 0.00029ms | 0.00029ms | +0.0000030ms | +1.05% |
| p99 | 0.0022ms | 0.0016ms | +0.00057ms | +34.75% |
| mean | 0.00027ms | 0.00029ms | -0.000019ms | -6.50% |
| min | 0.00017ms | 0.00017ms | 0.00ms | 0.00% |
| max | 0.0078ms | 0.01ms | -0.0028ms | -25.99% |
| total | 0.05ms | 0.06ms | -0.0038ms | -6.50% |

