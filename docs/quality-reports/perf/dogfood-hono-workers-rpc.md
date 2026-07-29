# Perf Suite — dogfood-hono-workers-rpc

Threshold source: [docs/quality/perf-thresholds.md](../../quality/perf-thresholds)

測定系の分解能 = 0.00017ms (何もしない関数を同じ経路で呼んだ時の p10)。 回帰判定の絶対下限は既定でこの 2 倍 = 0.00033ms、 op ごとの実効値は下表の「下限」 列。

## Serial (concurrency = 1)

| op | p10 (回帰判定) | p95 (上限判定) | cap | 下限 | gate | regression |
|---|---|---|---|---|---|---|
| driveRoute | 0.02ms | 0.05ms | 80ms | 0.00033ms | PASS | stable — gate 無効 (regressionGate=false) |
| driveKv | 0.02ms | 0.04ms | 80ms | 0.00033ms | PASS | stable — gate 無効 (regressionGate=false) |
| driveD1 | 0.01ms | 0.02ms | 80ms | 0.00033ms | PASS | stable — gate 無効 (regressionGate=false) |
| driveR2 | 0.01ms | 0.03ms | 100ms | 0.00033ms | PASS | stable (p10 -3% (閾値未満)、 p95 +66% (裾は実行間の振れ幅と区別できないため判定には使わない)) — gate 無効 (regressionGate=false) |
| driveExecutionCtx | 0.0078ms | 0.0093ms | 50ms | 0.00033ms | PASS | stable — gate 無効 (regressionGate=false) |

## Concurrent p95 (concurrency = 10, 50 iter each)

| op | p95 | cap | gate |
|---|---|---|---|
| driveRoute | 0.82ms | 160ms | PASS |
| driveKv | 0.25ms | 160ms | PASS |
| driveD1 | 0.25ms | 160ms | PASS |
| driveR2 | 0.18ms | 200ms | PASS |
| driveExecutionCtx | 0.10ms | 100ms | PASS |

## Memory retention (200 iter, arrayBuffers axis is the gate; heap is informational)

| op | heapUsed Δ | arrayBuffers Δ | cap | gc exposed | verdict |
|---|---|---|---|---|---|
| driveRoute | -2424 B | 0 B | 102400 B | yes | PASS |
| driveKv | -51080 B | 0 B | 102400 B | yes | PASS |
| driveD1 | 1632 B | 0 B | 102400 B | yes | PASS |
| driveR2 | 1568 B | 0 B | 102400 B | yes | PASS |
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
| p95 | 0.05ms |
| p99 | 0.09ms |
| mean | 0.03ms |
| stdev | 0.06ms |
| min | 0.02ms |
| max | 0.85ms |
| total | 6.09ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.02ms | 0.02ms | -0.00021ms | -1.07% |
| p50 | 0.02ms | 0.02ms | +0.00052ms | +2.29% |
| p95 | 0.05ms | 0.04ms | +0.0043ms | +10.13% |
| p99 | 0.09ms | 0.06ms | +0.03ms | +45.18% |
| mean | 0.03ms | 0.03ms | +0.0012ms | +4.24% |
| min | 0.02ms | 0.02ms | -0.00046ms | -2.45% |
| max | 0.85ms | 0.78ms | +0.07ms | +9.02% |
| total | 6.09ms | 5.84ms | +0.25ms | +4.24% |

### driveKv

# Perf Report — driveKv.serial

| metric | value |
|---|---|
| iterations | 200 |
| warmup | 5 |
| p10 | 0.02ms |
| p50 | 0.02ms |
| p95 | 0.04ms |
| p99 | 0.07ms |
| mean | 0.02ms |
| stdev | 0.02ms |
| min | 0.02ms |
| max | 0.21ms |
| total | 4.81ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.02ms | 0.02ms | +0.00029ms | +1.66% |
| p50 | 0.02ms | 0.02ms | +0.0023ms | +11.78% |
| p95 | 0.04ms | 0.04ms | -0.0074ms | -17.27% |
| p99 | 0.07ms | 0.05ms | +0.02ms | +30.61% |
| mean | 0.02ms | 0.02ms | +0.0011ms | +4.88% |
| min | 0.02ms | 0.02ms | -0.000041ms | -0.25% |
| max | 0.21ms | 0.07ms | +0.14ms | +205.39% |
| total | 4.81ms | 4.58ms | +0.22ms | +4.88% |

### driveD1

# Perf Report — driveD1.serial

| metric | value |
|---|---|
| iterations | 200 |
| warmup | 5 |
| p10 | 0.01ms |
| p50 | 0.01ms |
| p95 | 0.02ms |
| p99 | 0.04ms |
| mean | 0.01ms |
| stdev | 0.0098ms |
| min | 0.01ms |
| max | 0.13ms |
| total | 2.93ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.01ms | 0.01ms | -0.00050ms | -3.87% |
| p50 | 0.01ms | 0.01ms | -0.00063ms | -4.59% |
| p95 | 0.02ms | 0.02ms | +0.00023ms | +1.15% |
| p99 | 0.04ms | 0.03ms | +0.01ms | +40.72% |
| mean | 0.01ms | 0.01ms | +0.00040ms | +2.80% |
| min | 0.01ms | 0.01ms | -0.00038ms | -2.97% |
| max | 0.13ms | 0.05ms | +0.08ms | +182.41% |
| total | 2.93ms | 2.85ms | +0.08ms | +2.80% |

### driveR2

# Perf Report — driveR2.serial

| metric | value |
|---|---|
| iterations | 200 |
| warmup | 5 |
| p10 | 0.01ms |
| p50 | 0.02ms |
| p95 | 0.03ms |
| p99 | 0.05ms |
| mean | 0.02ms |
| stdev | 0.01ms |
| min | 0.01ms |
| max | 0.14ms |
| total | 3.72ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.01ms | 0.01ms | -0.00037ms | -2.59% |
| p50 | 0.02ms | 0.02ms | +0.0010ms | +6.60% |
| p95 | 0.03ms | 0.02ms | +0.01ms | +66.07% |
| p99 | 0.05ms | 0.03ms | +0.02ms | +59.14% |
| mean | 0.02ms | 0.02ms | +0.0027ms | +17.17% |
| min | 0.01ms | 0.01ms | -0.00021ms | -1.50% |
| max | 0.14ms | 0.04ms | +0.10ms | +285.70% |
| total | 3.72ms | 3.18ms | +0.55ms | +17.17% |

### driveExecutionCtx

# Perf Report — driveExecutionCtx.serial

| metric | value |
|---|---|
| iterations | 200 |
| warmup | 5 |
| p10 | 0.0078ms |
| p50 | 0.0080ms |
| p95 | 0.0093ms |
| p99 | 0.01ms |
| mean | 0.0083ms |
| stdev | 0.0013ms |
| min | 0.0077ms |
| max | 0.02ms |
| total | 1.67ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.0078ms | 0.0081ms | -0.00033ms | -4.10% |
| p50 | 0.0080ms | 0.0090ms | -0.00096ms | -10.69% |
| p95 | 0.0093ms | 0.01ms | -0.00079ms | -7.83% |
| p99 | 0.01ms | 0.01ms | -0.00041ms | -2.87% |
| mean | 0.0083ms | 0.0090ms | -0.00068ms | -7.52% |
| min | 0.0077ms | 0.0079ms | -0.00025ms | -3.16% |
| max | 0.02ms | 0.02ms | +0.0029ms | +17.16% |
| total | 1.67ms | 1.80ms | -0.14ms | -7.52% |

