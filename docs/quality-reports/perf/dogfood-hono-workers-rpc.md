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
| driveExecutionCtx | 0.0079ms | 0.01ms | 50ms | 0.00033ms | PASS | stable — gate 無効 (regressionGate=false) |

## Concurrent p95 (concurrency = 10, 50 iter each)

| op | p95 | cap | gate |
|---|---|---|---|
| driveRoute | 1.01ms | 160ms | PASS |
| driveKv | 0.32ms | 160ms | PASS |
| driveD1 | 0.21ms | 160ms | PASS |
| driveR2 | 0.17ms | 200ms | PASS |
| driveExecutionCtx | 0.10ms | 100ms | PASS |

## Memory retention (200 iter, arrayBuffers axis is the gate; heap is informational)

| op | heapUsed Δ | arrayBuffers Δ | cap | gc exposed | verdict |
|---|---|---|---|---|---|
| driveRoute | 5544 B | 0 B | 102400 B | yes | PASS |
| driveKv | -7040 B | 0 B | 102400 B | yes | PASS |
| driveD1 | 640 B | 0 B | 102400 B | yes | PASS |
| driveR2 | 1680 B | 0 B | 102400 B | yes | PASS |
| driveExecutionCtx | 240 B | 0 B | 102400 B | yes | PASS |

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
| max | 0.59ms |
| total | 5.41ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.02ms | 0.02ms | -0.0010ms | -5.04% |
| p50 | 0.02ms | 0.02ms | -0.00081ms | -3.56% |
| p95 | 0.04ms | 0.04ms | -0.0041ms | -9.71% |
| p99 | 0.06ms | 0.06ms | +0.00092ms | +1.46% |
| mean | 0.03ms | 0.03ms | -0.0021ms | -7.34% |
| min | 0.02ms | 0.02ms | -0.0025ms | -13.62% |
| max | 0.59ms | 0.78ms | -0.20ms | -25.10% |
| total | 5.41ms | 5.84ms | -0.43ms | -7.34% |

### driveKv

# Perf Report — driveKv.serial

| metric | value |
|---|---|
| iterations | 200 |
| warmup | 5 |
| p10 | 0.02ms |
| p50 | 0.02ms |
| p95 | 0.03ms |
| p99 | 0.03ms |
| mean | 0.02ms |
| stdev | 0.0034ms |
| min | 0.02ms |
| max | 0.05ms |
| total | 3.69ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.02ms | 0.02ms | -0.00075ms | -4.33% |
| p50 | 0.02ms | 0.02ms | -0.0018ms | -9.38% |
| p95 | 0.03ms | 0.04ms | -0.02ms | -39.81% |
| p99 | 0.03ms | 0.05ms | -0.02ms | -41.80% |
| mean | 0.02ms | 0.02ms | -0.0045ms | -19.61% |
| min | 0.02ms | 0.02ms | -0.00042ms | -2.50% |
| max | 0.05ms | 0.07ms | -0.02ms | -31.90% |
| total | 3.69ms | 4.58ms | -0.90ms | -19.61% |

### driveD1

# Perf Report — driveD1.serial

| metric | value |
|---|---|
| iterations | 200 |
| warmup | 5 |
| p10 | 0.01ms |
| p50 | 0.01ms |
| p95 | 0.02ms |
| p99 | 0.02ms |
| mean | 0.01ms |
| stdev | 0.0024ms |
| min | 0.01ms |
| max | 0.03ms |
| total | 2.72ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.01ms | 0.01ms | -0.00025ms | -1.94% |
| p50 | 0.01ms | 0.01ms | -0.00058ms | -4.28% |
| p95 | 0.02ms | 0.02ms | -0.0022ms | -11.37% |
| p99 | 0.02ms | 0.03ms | -0.0025ms | -9.67% |
| mean | 0.01ms | 0.01ms | -0.00062ms | -4.37% |
| min | 0.01ms | 0.01ms | -0.00029ms | -2.30% |
| max | 0.03ms | 0.05ms | -0.01ms | -29.56% |
| total | 2.72ms | 2.85ms | -0.12ms | -4.37% |

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
| stdev | 0.0034ms |
| min | 0.01ms |
| max | 0.04ms |
| total | 3.04ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.01ms | 0.01ms | -0.00066ms | -4.63% |
| p50 | 0.01ms | 0.02ms | -0.0013ms | -8.09% |
| p95 | 0.02ms | 0.02ms | +0.0011ms | +6.06% |
| p99 | 0.03ms | 0.03ms | -0.0032ms | -9.53% |
| mean | 0.02ms | 0.02ms | -0.00072ms | -4.50% |
| min | 0.01ms | 0.01ms | -0.00054ms | -3.92% |
| max | 0.04ms | 0.04ms | +0.0058ms | +15.66% |
| total | 3.04ms | 3.18ms | -0.14ms | -4.50% |

### driveExecutionCtx

# Perf Report — driveExecutionCtx.serial

| metric | value |
|---|---|
| iterations | 200 |
| warmup | 5 |
| p10 | 0.0079ms |
| p50 | 0.0082ms |
| p95 | 0.01ms |
| p99 | 0.02ms |
| mean | 0.0088ms |
| stdev | 0.0037ms |
| min | 0.0078ms |
| max | 0.06ms |
| total | 1.77ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.0079ms | 0.0081ms | -0.00021ms | -2.57% |
| p50 | 0.0082ms | 0.0090ms | -0.00079ms | -8.84% |
| p95 | 0.01ms | 0.01ms | +0.00036ms | +3.60% |
| p99 | 0.02ms | 0.01ms | +0.0042ms | +28.96% |
| mean | 0.0088ms | 0.0090ms | -0.00016ms | -1.80% |
| min | 0.0078ms | 0.0079ms | -0.00012ms | -1.57% |
| max | 0.06ms | 0.02ms | +0.04ms | +224.02% |
| total | 1.77ms | 1.80ms | -0.03ms | -1.80% |

