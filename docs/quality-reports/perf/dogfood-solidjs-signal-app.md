# Perf Suite — dogfood-solidjs-signal-app

Threshold source: [docs/quality/perf-thresholds.md](../../quality/perf-thresholds)

測定系の分解能 = 0.00017ms (何もしない関数を同じ経路で呼んだ時の p10)。 回帰判定の絶対下限は既定でこの 2 倍 = 0.00033ms、 op ごとの実効値は下表の「下限」 列。

## Serial (concurrency = 1)

| op | p10 (回帰判定) | p95 (上限判定) | cap | 下限 | gate | regression |
|---|---|---|---|---|---|---|
| driveCounter | 0.01ms | 0.02ms | 50ms | 0.00033ms | PASS | stable — gate 無効 (regressionGate=false) |
| driveTodos | 0.01ms | 0.03ms | 80ms | 0.00033ms | PASS | stable — gate 無効 (regressionGate=false) |
| driveResource | 0.0042ms | 0.01ms | 100ms | 0.00033ms | PASS | stable — gate 無効 (regressionGate=false) |
| driveSuspense | 1.16ms | 1.21ms | 150ms | 0.00033ms | PASS | stable — gate 無効 (regressionGate=false) |

## Concurrent p95 (concurrency = 10, 50 iter each)

| op | p95 | cap | gate |
|---|---|---|---|
| driveCounter | 0.16ms | 100ms | PASS |
| driveTodos | 0.24ms | 160ms | PASS |
| driveResource | 0.05ms | 200ms | PASS |
| driveSuspense | 1.26ms | 300ms | PASS |

## Memory retention (200 iter, arrayBuffers axis is the gate; heap is informational)

| op | heapUsed Δ | arrayBuffers Δ | cap | gc exposed | verdict |
|---|---|---|---|---|---|
| driveCounter | -2784 B | 0 B | 102400 B | yes | PASS |
| driveTodos | 7192 B | 0 B | 102400 B | yes | PASS |
| driveResource | 2328 B | 0 B | 102400 B | yes | PASS |
| driveSuspense | 1520 B | 0 B | 102400 B | yes | PASS |

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
| mean | 0.02ms |
| stdev | 0.02ms |
| min | 0.0090ms |
| max | 0.25ms |
| total | 3.04ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.01ms | 0.01ms | -0.00055ms | -5.10% |
| p50 | 0.01ms | 0.01ms | -0.00023ms | -1.90% |
| p95 | 0.02ms | 0.02ms | +0.00075ms | +3.20% |
| p99 | 0.04ms | 0.04ms | -0.0038ms | -9.71% |
| mean | 0.02ms | 0.02ms | -0.00011ms | -0.73% |
| min | 0.0090ms | 0.0089ms | +0.000083ms | +0.94% |
| max | 0.25ms | 0.35ms | -0.10ms | -27.59% |
| total | 3.04ms | 3.06ms | -0.02ms | -0.73% |

### driveTodos

# Perf Report — driveTodos.serial

| metric | value |
|---|---|
| iterations | 200 |
| warmup | 5 |
| p10 | 0.01ms |
| p50 | 0.01ms |
| p95 | 0.03ms |
| p99 | 0.05ms |
| mean | 0.02ms |
| stdev | 0.01ms |
| min | 0.01ms |
| max | 0.14ms |
| total | 3.42ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.01ms | 0.01ms | -0.00075ms | -5.08% |
| p50 | 0.01ms | 0.02ms | -0.0019ms | -11.55% |
| p95 | 0.03ms | 0.03ms | -0.0021ms | -7.33% |
| p99 | 0.05ms | 0.07ms | -0.02ms | -28.98% |
| mean | 0.02ms | 0.02ms | -0.0019ms | -10.08% |
| min | 0.01ms | 0.01ms | -0.00029ms | -2.07% |
| max | 0.14ms | 0.15ms | -0.01ms | -7.23% |
| total | 3.42ms | 3.80ms | -0.38ms | -10.08% |

### driveResource

# Perf Report — driveResource.serial

| metric | value |
|---|---|
| iterations | 200 |
| warmup | 5 |
| p10 | 0.0042ms |
| p50 | 0.0043ms |
| p95 | 0.01ms |
| p99 | 0.02ms |
| mean | 0.0051ms |
| stdev | 0.0030ms |
| min | 0.0040ms |
| max | 0.03ms |
| total | 1.02ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.0042ms | 0.0043ms | -0.00017ms | -3.83% |
| p50 | 0.0043ms | 0.0045ms | -0.00013ms | -2.80% |
| p95 | 0.01ms | 0.01ms | +0.00059ms | +5.48% |
| p99 | 0.02ms | 0.02ms | -0.00027ms | -1.55% |
| mean | 0.0051ms | 0.0052ms | -0.000080ms | -1.55% |
| min | 0.0040ms | 0.0042ms | -0.00017ms | -3.97% |
| max | 0.03ms | 0.03ms | +0.00058ms | +1.94% |
| total | 1.02ms | 1.04ms | -0.02ms | -1.55% |

### driveSuspense

# Perf Report — driveSuspense.serial

| metric | value |
|---|---|
| iterations | 200 |
| warmup | 5 |
| p10 | 1.16ms |
| p50 | 1.17ms |
| p95 | 1.21ms |
| p99 | 1.27ms |
| mean | 1.14ms |
| stdev | 0.21ms |
| min | 0.03ms |
| max | 1.28ms |
| total | 227.18ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 1.16ms | 1.15ms | +0.0048ms | +0.42% |
| p50 | 1.17ms | 1.16ms | +0.0077ms | +0.66% |
| p95 | 1.21ms | 1.20ms | +0.0095ms | +0.79% |
| p99 | 1.27ms | 1.24ms | +0.02ms | +1.68% |
| mean | 1.14ms | 1.15ms | -0.0097ms | -0.85% |
| min | 0.03ms | 0.03ms | -0.0029ms | -9.50% |
| max | 1.28ms | 1.40ms | -0.12ms | -8.30% |
| total | 227.18ms | 229.13ms | -1.95ms | -0.85% |

