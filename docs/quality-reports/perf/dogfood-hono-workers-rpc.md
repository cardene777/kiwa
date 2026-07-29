# Perf Suite — dogfood-hono-workers-rpc

Threshold source: [docs/quality/perf-thresholds.md](../../quality/perf-thresholds)

測定系の分解能 = 0.00017ms (何もしない関数を同じ経路で呼んだ時の p10)。 回帰判定の絶対下限は既定でこの 2 倍 = 0.00033ms、 op ごとの実効値は下表の「下限」 列。

## Serial (concurrency = 1)

| op | p10 (回帰判定) | p95 (上限判定) | cap | 下限 | gate | regression |
|---|---|---|---|---|---|---|
| driveRoute | 0.02ms | 0.04ms | 80ms | 0.00033ms | PASS | stable — gate 無効 (regressionGate=false) |
| driveKv | 0.02ms | 0.03ms | 80ms | 0.00033ms | PASS | stable — gate 無効 (regressionGate=false) |
| driveD1 | 0.01ms | 0.03ms | 80ms | 0.00033ms | PASS | stable (p10 -3% (閾値未満)、 p95 +43% (裾は実行間の振れ幅と区別できないため判定には使わない)) — gate 無効 (regressionGate=false) |
| driveR2 | 0.01ms | 0.02ms | 100ms | 0.00033ms | PASS | stable — gate 無効 (regressionGate=false) |
| driveExecutionCtx | 0.0080ms | 0.0090ms | 50ms | 0.00033ms | PASS | stable — gate 無効 (regressionGate=false) |

## Concurrent p95 (concurrency = 10, 50 iter each)

| op | p95 | cap | gate |
|---|---|---|---|
| driveRoute | 0.87ms | 160ms | PASS |
| driveKv | 0.33ms | 160ms | PASS |
| driveD1 | 0.20ms | 160ms | PASS |
| driveR2 | 0.17ms | 200ms | PASS |
| driveExecutionCtx | 0.10ms | 100ms | PASS |

## Memory retention (200 iter, arrayBuffers axis is the gate; heap is informational)

| op | heapUsed Δ | arrayBuffers Δ | cap | gc exposed | verdict |
|---|---|---|---|---|---|
| driveRoute | -2424 B | 0 B | 102400 B | yes | PASS |
| driveKv | -51080 B | 0 B | 102400 B | yes | PASS |
| driveD1 | 1632 B | 0 B | 102400 B | yes | PASS |
| driveR2 | -784 B | 0 B | 102400 B | yes | PASS |
| driveExecutionCtx | -8592 B | 0 B | 102400 B | yes | PASS |

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
| max | 0.41ms |
| total | 5.13ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.02ms | 0.02ms | -0.00083ms | -4.19% |
| p50 | 0.02ms | 0.02ms | -0.00094ms | -4.11% |
| p95 | 0.04ms | 0.04ms | -0.0050ms | -11.87% |
| p99 | 0.06ms | 0.06ms | -0.0071ms | -11.38% |
| mean | 0.03ms | 0.03ms | -0.0036ms | -12.19% |
| min | 0.02ms | 0.02ms | -0.0020ms | -10.94% |
| max | 0.41ms | 0.78ms | -0.38ms | -48.35% |
| total | 5.13ms | 5.84ms | -0.71ms | -12.19% |

### driveKv

# Perf Report — driveKv.serial

| metric | value |
|---|---|
| iterations | 200 |
| warmup | 5 |
| p10 | 0.02ms |
| p50 | 0.02ms |
| p95 | 0.03ms |
| p99 | 0.05ms |
| mean | 0.02ms |
| stdev | 0.0068ms |
| min | 0.02ms |
| max | 0.08ms |
| total | 3.89ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.02ms | 0.02ms | -0.00041ms | -2.38% |
| p50 | 0.02ms | 0.02ms | -0.0015ms | -7.85% |
| p95 | 0.03ms | 0.04ms | -0.02ms | -38.61% |
| p99 | 0.05ms | 0.05ms | -0.0038ms | -7.52% |
| mean | 0.02ms | 0.02ms | -0.0035ms | -15.12% |
| min | 0.02ms | 0.02ms | -0.000041ms | -0.25% |
| max | 0.08ms | 0.07ms | +0.0097ms | +14.10% |
| total | 3.89ms | 4.58ms | -0.69ms | -15.12% |

### driveD1

# Perf Report — driveD1.serial

| metric | value |
|---|---|
| iterations | 200 |
| warmup | 5 |
| p10 | 0.01ms |
| p50 | 0.01ms |
| p95 | 0.03ms |
| p99 | 0.09ms |
| mean | 0.02ms |
| stdev | 0.01ms |
| min | 0.01ms |
| max | 0.13ms |
| total | 3.32ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.01ms | 0.01ms | -0.00033ms | -2.59% |
| p50 | 0.01ms | 0.01ms | -0.00042ms | -3.05% |
| p95 | 0.03ms | 0.02ms | +0.0085ms | +43.35% |
| p99 | 0.09ms | 0.03ms | +0.07ms | +261.34% |
| mean | 0.02ms | 0.01ms | +0.0024ms | +16.54% |
| min | 0.01ms | 0.01ms | -0.00033ms | -2.64% |
| max | 0.13ms | 0.05ms | +0.09ms | +197.51% |
| total | 3.32ms | 2.85ms | +0.47ms | +16.54% |

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
| mean | 0.01ms |
| stdev | 0.0028ms |
| min | 0.01ms |
| max | 0.04ms |
| total | 2.91ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.01ms | 0.01ms | -0.00070ms | -4.92% |
| p50 | 0.01ms | 0.02ms | -0.0016ms | -10.11% |
| p95 | 0.02ms | 0.02ms | -0.0023ms | -12.82% |
| p99 | 0.03ms | 0.03ms | -0.0060ms | -17.67% |
| mean | 0.01ms | 0.02ms | -0.0013ms | -8.44% |
| min | 0.01ms | 0.01ms | -0.00042ms | -3.01% |
| max | 0.04ms | 0.04ms | -0.00046ms | -1.25% |
| total | 2.91ms | 3.18ms | -0.27ms | -8.44% |

### driveExecutionCtx

# Perf Report — driveExecutionCtx.serial

| metric | value |
|---|---|
| iterations | 200 |
| warmup | 5 |
| p10 | 0.0080ms |
| p50 | 0.0082ms |
| p95 | 0.0090ms |
| p99 | 0.01ms |
| mean | 0.0085ms |
| stdev | 0.0011ms |
| min | 0.0079ms |
| max | 0.02ms |
| total | 1.69ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.0080ms | 0.0081ms | -0.000088ms | -1.08% |
| p50 | 0.0082ms | 0.0090ms | -0.00075ms | -8.37% |
| p95 | 0.0090ms | 0.01ms | -0.0010ms | -10.38% |
| p99 | 0.01ms | 0.01ms | -0.00034ms | -2.36% |
| mean | 0.0085ms | 0.0090ms | -0.00054ms | -5.95% |
| min | 0.0079ms | 0.0079ms | -0.000041ms | -0.52% |
| max | 0.02ms | 0.02ms | +0.0019ms | +11.28% |
| total | 1.69ms | 1.80ms | -0.11ms | -5.95% |

