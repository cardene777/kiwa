# Perf Suite — dogfood-hono-workers-rpc

Threshold source: [docs/quality/perf-thresholds.md](../../quality/perf-thresholds)

測定系の分解能 = 0.00017ms (何もしない関数を同じ経路で呼んだ時の p10)。 回帰判定の絶対下限は既定でこの 2 倍 = 0.00033ms、 op ごとの実効値は下表の「下限」 列。

## Serial (concurrency = 1)

| op | p10 (回帰判定) | p95 (上限判定) | cap | 下限 | gate | regression |
|---|---|---|---|---|---|---|
| driveRoute | 0.02ms | 0.06ms | 80ms | 0.00033ms | PASS | stable (p10 +12% (閾値未満)、 p95 +48% (裾は実行間の振れ幅と区別できないため判定には使わない)) — gate 無効 (regressionGate=false) |
| driveKv | 0.02ms | 0.06ms | 80ms | 0.00033ms | PASS | stable (p10 +3% (閾値未満)、 p95 +36% (裾は実行間の振れ幅と区別できないため判定には使わない)) — gate 無効 (regressionGate=false) |
| driveD1 | 0.01ms | 0.02ms | 80ms | 0.00033ms | PASS | stable — gate 無効 (regressionGate=false) |
| driveR2 | 0.02ms | 0.05ms | 100ms | 0.00033ms | PASS | stable (p10 +11% (閾値未満)、 p95 +158% (裾は実行間の振れ幅と区別できないため判定には使わない)) — gate 無効 (regressionGate=false) |
| driveExecutionCtx | 0.0085ms | 0.0098ms | 50ms | 0.00033ms | PASS | stable — gate 無効 (regressionGate=false) |

## Concurrent p95 (concurrency = 10, 50 iter each)

| op | p95 | cap | gate |
|---|---|---|---|
| driveRoute | 1.14ms | 160ms | PASS |
| driveKv | 0.79ms | 160ms | PASS |
| driveD1 | 0.22ms | 160ms | PASS |
| driveR2 | 0.70ms | 200ms | PASS |
| driveExecutionCtx | 0.22ms | 100ms | PASS |

## Memory retention (200 iter, arrayBuffers axis is the gate; heap is informational)

| op | heapUsed Δ | arrayBuffers Δ | cap | gc exposed | verdict |
|---|---|---|---|---|---|
| driveRoute | -2424 B | 0 B | 102400 B | yes | PASS |
| driveKv | -50784 B | 0 B | 102400 B | yes | PASS |
| driveD1 | 1704 B | 0 B | 102400 B | yes | PASS |
| driveR2 | -3016 B | 0 B | 102400 B | yes | PASS |
| driveExecutionCtx | 1424 B | 0 B | 102400 B | yes | PASS |

## Detailed serial reports

### driveRoute

# Perf Report — driveRoute.serial

| metric | value |
|---|---|
| iterations | 200 |
| warmup | 5 |
| p10 | 0.02ms |
| p50 | 0.03ms |
| p95 | 0.06ms |
| p99 | 0.19ms |
| mean | 0.04ms |
| stdev | 0.05ms |
| min | 0.02ms |
| max | 0.62ms |
| total | 7.06ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.02ms | 0.02ms | +0.0024ms | +11.93% |
| p50 | 0.03ms | 0.02ms | +0.0028ms | +12.07% |
| p95 | 0.06ms | 0.04ms | +0.02ms | +48.16% |
| p99 | 0.19ms | 0.06ms | +0.13ms | +209.92% |
| mean | 0.04ms | 0.03ms | +0.0061ms | +20.93% |
| min | 0.02ms | 0.02ms | +0.0016ms | +8.71% |
| max | 0.62ms | 0.78ms | -0.16ms | -20.90% |
| total | 7.06ms | 5.84ms | +1.22ms | +20.93% |

### driveKv

# Perf Report — driveKv.serial

| metric | value |
|---|---|
| iterations | 200 |
| warmup | 5 |
| p10 | 0.02ms |
| p50 | 0.02ms |
| p95 | 0.06ms |
| p99 | 0.15ms |
| mean | 0.03ms |
| stdev | 0.03ms |
| min | 0.02ms |
| max | 0.31ms |
| total | 5.45ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.02ms | 0.02ms | +0.00055ms | +3.15% |
| p50 | 0.02ms | 0.02ms | -0.00025ms | -1.31% |
| p95 | 0.06ms | 0.04ms | +0.02ms | +35.97% |
| p99 | 0.15ms | 0.05ms | +0.10ms | +200.76% |
| mean | 0.03ms | 0.02ms | +0.0043ms | +18.92% |
| min | 0.02ms | 0.02ms | +0.00075ms | +4.51% |
| max | 0.31ms | 0.07ms | +0.24ms | +345.88% |
| total | 5.45ms | 4.58ms | +0.87ms | +18.92% |

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
| stdev | 0.0028ms |
| min | 0.01ms |
| max | 0.03ms |
| total | 2.85ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.01ms | 0.01ms | +0.000083ms | +0.64% |
| p50 | 0.01ms | 0.01ms | -0.000042ms | -0.31% |
| p95 | 0.02ms | 0.02ms | +0.00052ms | +2.67% |
| p99 | 0.03ms | 0.03ms | +0.00042ms | +1.63% |
| mean | 0.01ms | 0.01ms | -1.8e-7ms | -0.00% |
| min | 0.01ms | 0.01ms | 0.00ms | 0.00% |
| max | 0.03ms | 0.05ms | -0.01ms | -25.23% |
| total | 2.85ms | 2.85ms | -0.000035ms | -0.00% |

### driveR2

# Perf Report — driveR2.serial

| metric | value |
|---|---|
| iterations | 200 |
| warmup | 5 |
| p10 | 0.02ms |
| p50 | 0.02ms |
| p95 | 0.05ms |
| p99 | 0.08ms |
| mean | 0.02ms |
| stdev | 0.02ms |
| min | 0.01ms |
| max | 0.25ms |
| total | 4.59ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.02ms | 0.01ms | +0.0015ms | +10.71% |
| p50 | 0.02ms | 0.02ms | +0.0030ms | +19.40% |
| p95 | 0.05ms | 0.02ms | +0.03ms | +157.56% |
| p99 | 0.08ms | 0.03ms | +0.05ms | +142.01% |
| mean | 0.02ms | 0.02ms | +0.0071ms | +44.49% |
| min | 0.01ms | 0.01ms | +0.00088ms | +6.33% |
| max | 0.25ms | 0.04ms | +0.22ms | +591.95% |
| total | 4.59ms | 3.18ms | +1.41ms | +44.49% |

### driveExecutionCtx

# Perf Report — driveExecutionCtx.serial

| metric | value |
|---|---|
| iterations | 200 |
| warmup | 5 |
| p10 | 0.0085ms |
| p50 | 0.0088ms |
| p95 | 0.0098ms |
| p99 | 0.02ms |
| mean | 0.0091ms |
| stdev | 0.0014ms |
| min | 0.0084ms |
| max | 0.02ms |
| total | 1.81ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.0085ms | 0.0081ms | +0.00042ms | +5.12% |
| p50 | 0.0088ms | 0.0090ms | -0.00021ms | -2.32% |
| p95 | 0.0098ms | 0.01ms | -0.00024ms | -2.44% |
| p99 | 0.02ms | 0.01ms | +0.0013ms | +8.98% |
| mean | 0.0091ms | 0.0090ms | +0.000056ms | +0.62% |
| min | 0.0084ms | 0.0079ms | +0.00050ms | +6.32% |
| max | 0.02ms | 0.02ms | +0.0047ms | +27.45% |
| total | 1.81ms | 1.80ms | +0.01ms | +0.62% |

