# Perf Suite — dogfood-solidjs-signal-app

Threshold source: [docs/quality/perf-thresholds.md](../../quality/perf-thresholds)

測定系の分解能 = 0.00017ms (何もしない関数を同じ経路で呼んだ時の p10)。 回帰判定の絶対下限は既定でこの 2 倍 = 0.00033ms、 op ごとの実効値は下表の「下限」 列。

## Serial (concurrency = 1)

| op | p10 (回帰判定) | p95 (上限判定) | cap | 下限 | gate | regression |
|---|---|---|---|---|---|---|
| driveCounter | 0.01ms | 0.02ms | 50ms | 0.00033ms | PASS | stable — gate 無効 (regressionGate=false) |
| driveTodos | 0.01ms | 0.02ms | 80ms | 0.00033ms | PASS | stable — gate 無効 (regressionGate=false) |
| driveResource | 0.0043ms | 0.01ms | 100ms | 0.00033ms | PASS | stable — gate 無効 (regressionGate=false) |
| driveSuspense | 1.15ms | 1.21ms | 150ms | 0.00033ms | PASS | stable — gate 無効 (regressionGate=false) |

## Concurrent p95 (concurrency = 10, 50 iter each)

| op | p95 | cap | gate |
|---|---|---|---|
| driveCounter | 0.17ms | 100ms | PASS |
| driveTodos | 0.29ms | 160ms | PASS |
| driveResource | 0.05ms | 200ms | PASS |
| driveSuspense | 1.28ms | 300ms | PASS |

## Memory retention (200 iter, arrayBuffers axis is the gate; heap is informational)

| op | heapUsed Δ | arrayBuffers Δ | cap | gc exposed | verdict |
|---|---|---|---|---|---|
| driveCounter | -2752 B | 0 B | 102400 B | yes | PASS |
| driveTodos | 7064 B | 0 B | 102400 B | yes | PASS |
| driveResource | 2776 B | 0 B | 102400 B | yes | PASS |
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
| p99 | 0.03ms |
| mean | 0.01ms |
| stdev | 0.01ms |
| min | 0.0088ms |
| max | 0.17ms |
| total | 2.83ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.01ms | 0.01ms | -0.00055ms | -5.09% |
| p50 | 0.01ms | 0.01ms | -0.000022ms | -0.18% |
| p95 | 0.02ms | 0.02ms | -0.0013ms | -5.43% |
| p99 | 0.03ms | 0.04ms | -0.0073ms | -18.43% |
| mean | 0.01ms | 0.02ms | -0.0011ms | -7.32% |
| min | 0.0088ms | 0.0089ms | -0.000042ms | -0.47% |
| max | 0.17ms | 0.35ms | -0.18ms | -50.57% |
| total | 2.83ms | 3.06ms | -0.22ms | -7.32% |

### driveTodos

# Perf Report — driveTodos.serial

| metric | value |
|---|---|
| iterations | 200 |
| warmup | 5 |
| p10 | 0.01ms |
| p50 | 0.01ms |
| p95 | 0.02ms |
| p99 | 0.03ms |
| mean | 0.02ms |
| stdev | 0.0071ms |
| min | 0.01ms |
| max | 0.10ms |
| total | 3.26ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.01ms | 0.01ms | -0.00075ms | -5.08% |
| p50 | 0.01ms | 0.02ms | -0.0020ms | -12.06% |
| p95 | 0.02ms | 0.03ms | -0.0053ms | -18.08% |
| p99 | 0.03ms | 0.07ms | -0.04ms | -51.73% |
| mean | 0.02ms | 0.02ms | -0.0027ms | -14.22% |
| min | 0.01ms | 0.01ms | -0.00042ms | -2.95% |
| max | 0.10ms | 0.15ms | -0.04ms | -29.01% |
| total | 3.26ms | 3.80ms | -0.54ms | -14.22% |

### driveResource

# Perf Report — driveResource.serial

| metric | value |
|---|---|
| iterations | 200 |
| warmup | 5 |
| p10 | 0.0043ms |
| p50 | 0.0044ms |
| p95 | 0.01ms |
| p99 | 0.02ms |
| mean | 0.0052ms |
| stdev | 0.0029ms |
| min | 0.0041ms |
| max | 0.03ms |
| total | 1.03ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.0043ms | 0.0043ms | -0.000083ms | -1.92% |
| p50 | 0.0044ms | 0.0045ms | -0.000083ms | -1.86% |
| p95 | 0.01ms | 0.01ms | +0.00032ms | +3.00% |
| p99 | 0.02ms | 0.02ms | -0.0013ms | -7.08% |
| mean | 0.0052ms | 0.0052ms | -0.000025ms | -0.48% |
| min | 0.0041ms | 0.0042ms | -0.00013ms | -2.99% |
| max | 0.03ms | 0.03ms | +0.0028ms | +9.41% |
| total | 1.03ms | 1.04ms | -0.0050ms | -0.48% |

### driveSuspense

# Perf Report — driveSuspense.serial

| metric | value |
|---|---|
| iterations | 200 |
| warmup | 5 |
| p10 | 1.15ms |
| p50 | 1.16ms |
| p95 | 1.21ms |
| p99 | 1.23ms |
| mean | 1.13ms |
| stdev | 0.20ms |
| min | 0.02ms |
| max | 1.32ms |
| total | 226.71ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 1.15ms | 1.15ms | +0.0023ms | +0.20% |
| p50 | 1.16ms | 1.16ms | +0.00023ms | +0.02% |
| p95 | 1.21ms | 1.20ms | +0.0034ms | +0.28% |
| p99 | 1.23ms | 1.24ms | -0.0096ms | -0.77% |
| mean | 1.13ms | 1.15ms | -0.01ms | -1.06% |
| min | 0.02ms | 0.03ms | -0.0083ms | -27.41% |
| max | 1.32ms | 1.40ms | -0.08ms | -5.49% |
| total | 226.71ms | 229.13ms | -2.42ms | -1.06% |

