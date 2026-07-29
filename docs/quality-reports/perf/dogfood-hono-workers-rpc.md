# Perf Suite — dogfood-hono-workers-rpc

Threshold source: [docs/quality/perf-thresholds.md](../../quality/perf-thresholds)

測定系の分解能 = 0.00017ms (何もしない関数を同じ経路で呼んだ時の p10)。 回帰判定の絶対下限は既定でこの 2 倍 = 0.00033ms、 op ごとの実効値は下表の「下限」 列。

## Serial (concurrency = 1)

| op | p10 (回帰判定) | p95 (上限判定) | cap | 下限 | gate | regression |
|---|---|---|---|---|---|---|
| driveRoute | 0.02ms | 0.04ms | 80ms | 0.00033ms | PASS | stable — gate 無効 (regressionGate=false) |
| driveKv | 0.02ms | 0.02ms | 80ms | 0.00033ms | PASS | stable — gate 無効 (regressionGate=false) |
| driveD1 | 0.01ms | 0.02ms | 80ms | 0.00033ms | PASS | stable — gate 無効 (regressionGate=false) |
| driveR2 | 0.01ms | 0.02ms | 100ms | 0.00033ms | PASS | stable — gate 無効 (regressionGate=false) |
| driveExecutionCtx | 0.0077ms | 0.0091ms | 50ms | 0.00033ms | PASS | stable — gate 無効 (regressionGate=false) |

## Concurrent p95 (concurrency = 10, 50 iter each)

| op | p95 | cap | gate |
|---|---|---|---|
| driveRoute | 0.84ms | 160ms | PASS |
| driveKv | 0.25ms | 160ms | PASS |
| driveD1 | 0.18ms | 160ms | PASS |
| driveR2 | 0.20ms | 200ms | PASS |
| driveExecutionCtx | 0.11ms | 100ms | PASS |

## Memory retention (200 iter, arrayBuffers axis is the gate; heap is informational)

| op | heapUsed Δ | arrayBuffers Δ | cap | gc exposed | verdict |
|---|---|---|---|---|---|
| driveRoute | -2376 B | 0 B | 102400 B | yes | PASS |
| driveKv | -51080 B | 0 B | 102400 B | yes | PASS |
| driveD1 | -600 B | 0 B | 102400 B | yes | PASS |
| driveR2 | 6496 B | 0 B | 102400 B | yes | PASS |
| driveExecutionCtx | 272 B | 0 B | 102400 B | yes | PASS |

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
| stdev | 0.03ms |
| min | 0.02ms |
| max | 0.43ms |
| total | 5.19ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.02ms | 0.02ms | -0.0029ms | -14.67% |
| p50 | 0.02ms | 0.02ms | -0.0014ms | -5.94% |
| p95 | 0.04ms | 0.04ms | -0.0042ms | -9.88% |
| p99 | 0.06ms | 0.06ms | -0.0047ms | -7.52% |
| mean | 0.03ms | 0.03ms | -0.0032ms | -11.10% |
| min | 0.02ms | 0.02ms | -0.0024ms | -12.73% |
| max | 0.43ms | 0.78ms | -0.35ms | -45.21% |
| total | 5.19ms | 5.84ms | -0.65ms | -11.10% |

### driveKv

# Perf Report — driveKv.serial

| metric | value |
|---|---|
| iterations | 200 |
| warmup | 5 |
| p10 | 0.02ms |
| p50 | 0.02ms |
| p95 | 0.02ms |
| p99 | 0.04ms |
| mean | 0.02ms |
| stdev | 0.0065ms |
| min | 0.02ms |
| max | 0.10ms |
| total | 3.67ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.02ms | 0.02ms | -0.00087ms | -5.03% |
| p50 | 0.02ms | 0.02ms | -0.0021ms | -10.91% |
| p95 | 0.02ms | 0.04ms | -0.02ms | -45.66% |
| p99 | 0.04ms | 0.05ms | -0.01ms | -29.01% |
| mean | 0.02ms | 0.02ms | -0.0046ms | -19.91% |
| min | 0.02ms | 0.02ms | -0.00054ms | -3.25% |
| max | 0.10ms | 0.07ms | +0.03ms | +44.01% |
| total | 3.67ms | 4.58ms | -0.91ms | -19.91% |

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
| stdev | 0.0025ms |
| min | 0.01ms |
| max | 0.03ms |
| total | 2.73ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.01ms | 0.01ms | -0.00042ms | -3.23% |
| p50 | 0.01ms | 0.01ms | -0.00054ms | -3.98% |
| p95 | 0.02ms | 0.02ms | -0.0016ms | -8.31% |
| p99 | 0.03ms | 0.03ms | -0.00021ms | -0.82% |
| mean | 0.01ms | 0.01ms | -0.00061ms | -4.28% |
| min | 0.01ms | 0.01ms | -0.00042ms | -3.30% |
| max | 0.03ms | 0.05ms | -0.01ms | -30.29% |
| total | 2.73ms | 2.85ms | -0.12ms | -4.28% |

### driveR2

# Perf Report — driveR2.serial

| metric | value |
|---|---|
| iterations | 200 |
| warmup | 5 |
| p10 | 0.01ms |
| p50 | 0.02ms |
| p95 | 0.02ms |
| p99 | 0.03ms |
| mean | 0.02ms |
| stdev | 0.0028ms |
| min | 0.01ms |
| max | 0.03ms |
| total | 3.10ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.01ms | 0.01ms | -0.00074ms | -5.21% |
| p50 | 0.02ms | 0.02ms | -0.00035ms | -2.29% |
| p95 | 0.02ms | 0.02ms | +0.00014ms | +0.77% |
| p99 | 0.03ms | 0.03ms | -0.0063ms | -18.63% |
| mean | 0.02ms | 0.02ms | -0.00042ms | -2.62% |
| min | 0.01ms | 0.01ms | -0.00046ms | -3.31% |
| max | 0.03ms | 0.04ms | -0.0018ms | -4.88% |
| total | 3.10ms | 3.18ms | -0.08ms | -2.62% |

### driveExecutionCtx

# Perf Report — driveExecutionCtx.serial

| metric | value |
|---|---|
| iterations | 200 |
| warmup | 5 |
| p10 | 0.0077ms |
| p50 | 0.0080ms |
| p95 | 0.0091ms |
| p99 | 0.01ms |
| mean | 0.0083ms |
| stdev | 0.0012ms |
| min | 0.0076ms |
| max | 0.02ms |
| total | 1.65ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.0077ms | 0.0081ms | -0.00038ms | -4.62% |
| p50 | 0.0080ms | 0.0090ms | -0.00096ms | -10.69% |
| p95 | 0.0091ms | 0.01ms | -0.00096ms | -9.53% |
| p99 | 0.01ms | 0.01ms | -0.00028ms | -1.92% |
| mean | 0.0083ms | 0.0090ms | -0.00074ms | -8.18% |
| min | 0.0076ms | 0.0079ms | -0.00029ms | -3.68% |
| max | 0.02ms | 0.02ms | +0.0016ms | +9.31% |
| total | 1.65ms | 1.80ms | -0.15ms | -8.18% |

