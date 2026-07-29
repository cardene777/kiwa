# Perf Suite — dogfood-hono-workers-rpc

Threshold source: [docs/quality/perf-thresholds.md](../../quality/perf-thresholds)

測定系の分解能 = 0.00017ms (何もしない関数を同じ経路で呼んだ時の p10)。 回帰判定の絶対下限は既定でこの 2 倍 = 0.00033ms、 op ごとの実効値は下表の「下限」 列。

## Serial (concurrency = 1)

| op | p10 (回帰判定) | p95 (上限判定) | cap | 下限 | gate | regression |
|---|---|---|---|---|---|---|
| driveRoute | 0.02ms | 0.04ms | 80ms | 0.00033ms | PASS | stable — gate 無効 (regressionGate=false) |
| driveKv | 0.02ms | 0.03ms | 80ms | 0.00033ms | PASS | stable — gate 無効 (regressionGate=false) |
| driveD1 | 0.01ms | 0.02ms | 80ms | 0.00033ms | PASS | stable — gate 無効 (regressionGate=false) |
| driveR2 | 0.01ms | 0.02ms | 100ms | 0.00033ms | PASS | stable — gate 無効 (regressionGate=false) |
| driveExecutionCtx | 0.0080ms | 0.0093ms | 50ms | 0.00033ms | PASS | stable — gate 無効 (regressionGate=false) |

## Concurrent p95 (concurrency = 10, 50 iter each)

| op | p95 | cap | gate |
|---|---|---|---|
| driveRoute | 0.92ms | 160ms | PASS |
| driveKv | 0.23ms | 160ms | PASS |
| driveD1 | 0.23ms | 160ms | PASS |
| driveR2 | 0.17ms | 200ms | PASS |
| driveExecutionCtx | 0.10ms | 100ms | PASS |

## Memory retention (200 iter, arrayBuffers axis is the gate; heap is informational)

| op | heapUsed Δ | arrayBuffers Δ | cap | gc exposed | verdict |
|---|---|---|---|---|---|
| driveRoute | -1896 B | 0 B | 102400 B | yes | PASS |
| driveKv | -51080 B | 0 B | 102400 B | yes | PASS |
| driveD1 | 392 B | 0 B | 102400 B | yes | PASS |
| driveR2 | 6952 B | 0 B | 102400 B | yes | PASS |
| driveExecutionCtx | 160 B | 0 B | 102400 B | yes | PASS |

## Detailed serial reports

### driveRoute

# Perf Report — driveRoute.serial

| metric | value |
|---|---|
| iterations | 200 |
| warmup | 5 |
| p10 | 0.02ms |
| p50 | 0.02ms |
| p95 | 0.04ms |
| p99 | 0.06ms |
| mean | 0.03ms |
| stdev | 0.04ms |
| min | 0.02ms |
| max | 0.64ms |
| total | 5.50ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.02ms | 0.02ms | -0.00047ms | -2.35% |
| p50 | 0.02ms | 0.02ms | -0.00094ms | -4.11% |
| p95 | 0.04ms | 0.04ms | -0.0045ms | -10.69% |
| p99 | 0.06ms | 0.06ms | -0.0021ms | -3.42% |
| mean | 0.03ms | 0.03ms | -0.0017ms | -5.81% |
| min | 0.02ms | 0.02ms | -0.0016ms | -8.71% |
| max | 0.64ms | 0.78ms | -0.14ms | -18.36% |
| total | 5.50ms | 5.84ms | -0.34ms | -5.81% |

### driveKv

# Perf Report — driveKv.serial

| metric | value |
|---|---|
| iterations | 200 |
| warmup | 5 |
| p10 | 0.02ms |
| p50 | 0.02ms |
| p95 | 0.03ms |
| p99 | 0.04ms |
| mean | 0.02ms |
| stdev | 0.01ms |
| min | 0.02ms |
| max | 0.17ms |
| total | 3.96ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.02ms | 0.02ms | -0.00012ms | -0.70% |
| p50 | 0.02ms | 0.02ms | -0.0011ms | -5.78% |
| p95 | 0.03ms | 0.04ms | -0.02ms | -41.28% |
| p99 | 0.04ms | 0.05ms | -0.01ms | -20.01% |
| mean | 0.02ms | 0.02ms | -0.0031ms | -13.69% |
| min | 0.02ms | 0.02ms | +0.000084ms | +0.50% |
| max | 0.17ms | 0.07ms | +0.11ms | +154.24% |
| total | 3.96ms | 4.58ms | -0.63ms | -13.69% |

### driveD1

# Perf Report — driveD1.serial

| metric | value |
|---|---|
| iterations | 200 |
| warmup | 5 |
| p10 | 0.01ms |
| p50 | 0.01ms |
| p95 | 0.02ms |
| p99 | 0.03ms |
| mean | 0.01ms |
| stdev | 0.0026ms |
| min | 0.01ms |
| max | 0.03ms |
| total | 2.71ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.01ms | 0.01ms | -0.00058ms | -4.52% |
| p50 | 0.01ms | 0.01ms | -0.00063ms | -4.59% |
| p95 | 0.02ms | 0.02ms | -0.0022ms | -11.04% |
| p99 | 0.03ms | 0.03ms | +0.00075ms | +2.88% |
| mean | 0.01ms | 0.01ms | -0.00069ms | -4.87% |
| min | 0.01ms | 0.01ms | -0.00058ms | -4.62% |
| max | 0.03ms | 0.05ms | -0.01ms | -28.27% |
| total | 2.71ms | 2.85ms | -0.14ms | -4.87% |

### driveR2

# Perf Report — driveR2.serial

| metric | value |
|---|---|
| iterations | 200 |
| warmup | 5 |
| p10 | 0.01ms |
| p50 | 0.01ms |
| p95 | 0.02ms |
| p99 | 0.03ms |
| mean | 0.02ms |
| stdev | 0.0033ms |
| min | 0.01ms |
| max | 0.04ms |
| total | 3.13ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.01ms | 0.01ms | -0.00058ms | -4.08% |
| p50 | 0.01ms | 0.02ms | -0.00065ms | -4.18% |
| p95 | 0.02ms | 0.02ms | +0.00064ms | +3.55% |
| p99 | 0.03ms | 0.03ms | +0.00059ms | +1.74% |
| mean | 0.02ms | 0.02ms | -0.00023ms | -1.43% |
| min | 0.01ms | 0.01ms | -0.00054ms | -3.92% |
| max | 0.04ms | 0.04ms | +0.0011ms | +2.95% |
| total | 3.13ms | 3.18ms | -0.05ms | -1.43% |

### driveExecutionCtx

# Perf Report — driveExecutionCtx.serial

| metric | value |
|---|---|
| iterations | 200 |
| warmup | 5 |
| p10 | 0.0080ms |
| p50 | 0.0082ms |
| p95 | 0.0093ms |
| p99 | 0.01ms |
| mean | 0.0085ms |
| stdev | 0.0014ms |
| min | 0.0078ms |
| max | 0.02ms |
| total | 1.71ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.0080ms | 0.0081ms | -0.00017ms | -2.04% |
| p50 | 0.0082ms | 0.0090ms | -0.00075ms | -8.37% |
| p95 | 0.0093ms | 0.01ms | -0.00073ms | -7.23% |
| p99 | 0.01ms | 0.01ms | +0.00032ms | +2.24% |
| mean | 0.0085ms | 0.0090ms | -0.00046ms | -5.08% |
| min | 0.0078ms | 0.0079ms | -0.000083ms | -1.05% |
| max | 0.02ms | 0.02ms | +0.0016ms | +9.31% |
| total | 1.71ms | 1.80ms | -0.09ms | -5.08% |

