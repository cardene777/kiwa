# Perf Suite — dogfood-solidjs-signal-app

Threshold source: [docs/quality/perf-thresholds.md](../../quality/perf-thresholds)

測定系の分解能 = 0.00017ms (何もしない関数を同じ経路で呼んだ時の p10)。 回帰判定の絶対下限は既定でこの 2 倍 = 0.00033ms、 op ごとの実効値は下表の「下限」 列。

## Serial (concurrency = 1)

| op | p10 (回帰判定) | p95 (上限判定) | cap | 下限 | gate | regression |
|---|---|---|---|---|---|---|
| driveCounter | 0.01ms | 0.03ms | 50ms | 0.00033ms | PASS | stable — gate 無効 (regressionGate=false) |
| driveTodos | 0.01ms | 0.03ms | 80ms | 0.00033ms | PASS | stable — gate 無効 (regressionGate=false) |
| driveResource | 0.0035ms | 0.01ms | 100ms | 0.00033ms | PASS | stable — gate 無効 (regressionGate=false) |
| driveSuspense | 1.16ms | 1.22ms | 150ms | 0.00033ms | PASS | stable — gate 無効 (regressionGate=false) |

## Concurrent p95 (concurrency = 10, 50 iter each)

| op | p95 | cap | gate |
|---|---|---|---|
| driveCounter | 0.15ms | 100ms | PASS |
| driveTodos | 0.33ms | 160ms | PASS |
| driveResource | 0.14ms | 200ms | PASS |
| driveSuspense | 1.27ms | 300ms | PASS |

## Memory retention (200 iter, arrayBuffers axis is the gate; heap is informational)

| op | heapUsed Δ | arrayBuffers Δ | cap | gc exposed | verdict |
|---|---|---|---|---|---|
| driveCounter | -2784 B | 0 B | 102400 B | yes | PASS |
| driveTodos | 6664 B | 0 B | 102400 B | yes | PASS |
| driveResource | 2264 B | 0 B | 102400 B | yes | PASS |
| driveSuspense | 1552 B | 0 B | 102400 B | yes | PASS |

## Detailed serial reports

### driveCounter

# Perf Report — driveCounter.serial

| metric | value |
|---|---|
| iterations | 200 |
| warmup | 5 |
| p10 | 0.01ms |
| p50 | 0.01ms |
| p95 | 0.03ms |
| p99 | 0.05ms |
| mean | 0.02ms |
| stdev | 0.02ms |
| min | 0.0089ms |
| max | 0.21ms |
| total | 3.07ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.01ms | 0.01ms | -0.00034ms | -3.15% |
| p50 | 0.01ms | 0.01ms | +0.000020ms | +0.17% |
| p95 | 0.03ms | 0.02ms | +0.0036ms | +15.41% |
| p99 | 0.05ms | 0.04ms | +0.01ms | +37.56% |
| mean | 0.02ms | 0.02ms | +0.000062ms | +0.41% |
| min | 0.0089ms | 0.0089ms | +0.000042ms | +0.47% |
| max | 0.21ms | 0.35ms | -0.14ms | -39.37% |
| total | 3.07ms | 3.06ms | +0.01ms | +0.41% |

### driveTodos

# Perf Report — driveTodos.serial

| metric | value |
|---|---|
| iterations | 200 |
| warmup | 5 |
| p10 | 0.01ms |
| p50 | 0.02ms |
| p95 | 0.03ms |
| p99 | 0.04ms |
| mean | 0.02ms |
| stdev | 0.0097ms |
| min | 0.01ms |
| max | 0.13ms |
| total | 3.50ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.01ms | 0.01ms | -0.00025ms | -1.69% |
| p50 | 0.02ms | 0.02ms | -0.0015ms | -8.79% |
| p95 | 0.03ms | 0.03ms | -0.0013ms | -4.55% |
| p99 | 0.04ms | 0.07ms | -0.03ms | -38.16% |
| mean | 0.02ms | 0.02ms | -0.0015ms | -7.98% |
| min | 0.01ms | 0.01ms | +0.000083ms | +0.59% |
| max | 0.13ms | 0.15ms | -0.02ms | -12.29% |
| total | 3.50ms | 3.80ms | -0.30ms | -7.98% |

### driveResource

# Perf Report — driveResource.serial

| metric | value |
|---|---|
| iterations | 200 |
| warmup | 5 |
| p10 | 0.0035ms |
| p50 | 0.0044ms |
| p95 | 0.01ms |
| p99 | 0.02ms |
| mean | 0.0056ms |
| stdev | 0.0076ms |
| min | 0.0031ms |
| max | 0.10ms |
| total | 1.12ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.0035ms | 0.0043ms | -0.00084ms | -19.32% |
| p50 | 0.0044ms | 0.0045ms | -0.000041ms | -0.92% |
| p95 | 0.01ms | 0.01ms | +0.00056ms | +5.29% |
| p99 | 0.02ms | 0.02ms | +0.0013ms | +7.12% |
| mean | 0.0056ms | 0.0052ms | +0.00043ms | +8.35% |
| min | 0.0031ms | 0.0042ms | -0.0011ms | -25.75% |
| max | 0.10ms | 0.03ms | +0.07ms | +241.40% |
| total | 1.12ms | 1.04ms | +0.09ms | +8.35% |

### driveSuspense

# Perf Report — driveSuspense.serial

| metric | value |
|---|---|
| iterations | 200 |
| warmup | 5 |
| p10 | 1.16ms |
| p50 | 1.18ms |
| p95 | 1.22ms |
| p99 | 1.25ms |
| mean | 1.15ms |
| stdev | 0.18ms |
| min | 0.03ms |
| max | 1.39ms |
| total | 229.94ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 1.16ms | 1.15ms | +0.0055ms | +0.47% |
| p50 | 1.18ms | 1.16ms | +0.01ms | +1.04% |
| p95 | 1.22ms | 1.20ms | +0.02ms | +1.29% |
| p99 | 1.25ms | 1.24ms | +0.0060ms | +0.48% |
| mean | 1.15ms | 1.15ms | +0.0041ms | +0.35% |
| min | 0.03ms | 0.03ms | -0.0027ms | -8.82% |
| max | 1.39ms | 1.40ms | -0.01ms | -0.81% |
| total | 229.94ms | 229.13ms | +0.81ms | +0.35% |

