# Perf Suite — dogfood-solidjs-signal-app

Threshold source: [docs/quality/perf-thresholds.md](../../quality/perf-thresholds)

測定系の分解能 = 0.00017ms (何もしない関数を同じ経路で呼んだ時の p10)。 回帰判定の絶対下限は既定でこの 2 倍 = 0.00033ms、 op ごとの実効値は下表の「下限」 列。

## Serial (concurrency = 1)

| op | p10 (回帰判定) | p95 (上限判定) | cap | 下限 | gate | regression |
|---|---|---|---|---|---|---|
| driveCounter | 0.01ms | 0.02ms | 50ms | 0.00033ms | PASS | stable — gate 無効 (regressionGate=false) |
| driveTodos | 0.01ms | 0.03ms | 80ms | 0.00033ms | PASS | stable — gate 無効 (regressionGate=false) |
| driveResource | 0.0044ms | 0.01ms | 100ms | 0.00033ms | PASS | stable — gate 無効 (regressionGate=false) |
| driveSuspense | 1.28ms | 2.21ms | 150ms | 0.00033ms | PASS | stable (p10 +11% (閾値未満)、 p95 +84% (裾は実行間の振れ幅と区別できないため判定には使わない)) — gate 無効 (regressionGate=false) |

## Concurrent p95 (concurrency = 10, 50 iter each)

| op | p95 | cap | gate |
|---|---|---|---|
| driveCounter | 0.20ms | 100ms | PASS |
| driveTodos | 0.22ms | 160ms | PASS |
| driveResource | 0.06ms | 200ms | PASS |
| driveSuspense | 2.47ms | 300ms | PASS |

## Memory retention (200 iter, arrayBuffers axis is the gate; heap is informational)

| op | heapUsed Δ | arrayBuffers Δ | cap | gc exposed | verdict |
|---|---|---|---|---|---|
| driveCounter | -1928 B | 0 B | 102400 B | yes | PASS |
| driveTodos | 6248 B | 0 B | 102400 B | yes | PASS |
| driveResource | 2696 B | 0 B | 102400 B | yes | PASS |
| driveSuspense | 1424 B | 0 B | 102400 B | yes | PASS |

## Detailed serial reports

### driveCounter

# Perf Report — driveCounter.serial

| metric | value |
|---|---|
| iterations | 200 |
| warmup | 5 |
| p10 | 0.01ms |
| p50 | 0.01ms |
| p95 | 0.02ms |
| p99 | 0.04ms |
| mean | 0.01ms |
| stdev | 0.01ms |
| min | 0.0088ms |
| max | 0.20ms |
| total | 2.93ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.01ms | 0.01ms | -0.00046ms | -4.28% |
| p50 | 0.01ms | 0.01ms | -0.00038ms | -3.10% |
| p95 | 0.02ms | 0.02ms | +0.0012ms | +5.11% |
| p99 | 0.04ms | 0.04ms | +0.0044ms | +11.14% |
| mean | 0.01ms | 0.02ms | -0.00065ms | -4.27% |
| min | 0.0088ms | 0.0089ms | -0.000083ms | -0.94% |
| max | 0.20ms | 0.35ms | -0.16ms | -44.56% |
| total | 2.93ms | 3.06ms | -0.13ms | -4.27% |

### driveTodos

# Perf Report — driveTodos.serial

| metric | value |
|---|---|
| iterations | 200 |
| warmup | 5 |
| p10 | 0.01ms |
| p50 | 0.01ms |
| p95 | 0.03ms |
| p99 | 0.03ms |
| mean | 0.02ms |
| stdev | 0.01ms |
| min | 0.01ms |
| max | 0.16ms |
| total | 3.39ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.01ms | 0.01ms | -0.00063ms | -4.27% |
| p50 | 0.01ms | 0.02ms | -0.0018ms | -10.80% |
| p95 | 0.03ms | 0.03ms | -0.0031ms | -10.77% |
| p99 | 0.03ms | 0.07ms | -0.04ms | -55.97% |
| mean | 0.02ms | 0.02ms | -0.0021ms | -10.90% |
| min | 0.01ms | 0.01ms | -0.00046ms | -3.25% |
| max | 0.16ms | 0.15ms | +0.01ms | +9.83% |
| total | 3.39ms | 3.80ms | -0.41ms | -10.90% |

### driveResource

# Perf Report — driveResource.serial

| metric | value |
|---|---|
| iterations | 200 |
| warmup | 5 |
| p10 | 0.0044ms |
| p50 | 0.0045ms |
| p95 | 0.01ms |
| p99 | 0.02ms |
| mean | 0.0053ms |
| stdev | 0.0028ms |
| min | 0.0043ms |
| max | 0.03ms |
| total | 1.05ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.0044ms | 0.0043ms | +0.000042ms | +0.97% |
| p50 | 0.0045ms | 0.0045ms | +0.000063ms | +1.40% |
| p95 | 0.01ms | 0.01ms | -0.00010ms | -0.94% |
| p99 | 0.02ms | 0.02ms | -0.0015ms | -8.49% |
| mean | 0.0053ms | 0.0052ms | +0.000070ms | +1.35% |
| min | 0.0043ms | 0.0042ms | +0.000041ms | +0.97% |
| max | 0.03ms | 0.03ms | +0.00092ms | +3.04% |
| total | 1.05ms | 1.04ms | +0.01ms | +1.35% |

### driveSuspense

# Perf Report — driveSuspense.serial

| metric | value |
|---|---|
| iterations | 200 |
| warmup | 5 |
| p10 | 1.28ms |
| p50 | 1.30ms |
| p95 | 2.21ms |
| p99 | 3.24ms |
| mean | 1.39ms |
| stdev | 0.45ms |
| min | 0.03ms |
| max | 3.49ms |
| total | 277.91ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 1.28ms | 1.15ms | +0.13ms | +10.90% |
| p50 | 1.30ms | 1.16ms | +0.14ms | +11.97% |
| p95 | 2.21ms | 1.20ms | +1.01ms | +83.99% |
| p99 | 3.24ms | 1.24ms | +2.00ms | +160.67% |
| mean | 1.39ms | 1.15ms | +0.24ms | +21.29% |
| min | 0.03ms | 0.03ms | +0.0020ms | +6.75% |
| max | 3.49ms | 1.40ms | +2.09ms | +149.38% |
| total | 277.91ms | 229.13ms | +48.78ms | +21.29% |

