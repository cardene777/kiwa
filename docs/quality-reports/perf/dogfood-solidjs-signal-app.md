# Perf Suite — dogfood-solidjs-signal-app

Threshold source: [docs/quality/perf-thresholds.md](../../quality/perf-thresholds)

測定系の分解能 = 0.00017ms (何もしない関数を同じ経路で呼んだ時の p10)。 回帰判定の絶対下限は既定でこの 2 倍 = 0.00033ms、 op ごとの実効値は下表の「下限」 列。

## Serial (concurrency = 1)

| op | p10 (回帰判定) | p95 (上限判定) | cap | 下限 | gate | regression |
|---|---|---|---|---|---|---|
| driveCounter | 0.010ms | 0.02ms | 50ms | 0.00033ms | PASS | stable — gate 無効 (regressionGate=false) |
| driveTodos | 0.01ms | 0.02ms | 80ms | 0.00033ms | PASS | stable — gate 無効 (regressionGate=false) |
| driveResource | 0.0045ms | 0.01ms | 100ms | 0.00033ms | PASS | stable — gate 無効 (regressionGate=false) |
| driveSuspense | 1.16ms | 1.40ms | 150ms | 0.00033ms | PASS | stable — gate 無効 (regressionGate=false) |

## Concurrent p95 (concurrency = 10, 50 iter each)

| op | p95 | cap | gate |
|---|---|---|---|
| driveCounter | 0.14ms | 100ms | PASS |
| driveTodos | 0.28ms | 160ms | PASS |
| driveResource | 0.06ms | 200ms | PASS |
| driveSuspense | 1.27ms | 300ms | PASS |

## Memory retention (200 iter, arrayBuffers axis is the gate; heap is informational)

| op | heapUsed Δ | arrayBuffers Δ | cap | gc exposed | verdict |
|---|---|---|---|---|---|
| driveCounter | -2416 B | 0 B | 102400 B | yes | PASS |
| driveTodos | 6280 B | 0 B | 102400 B | yes | PASS |
| driveResource | 384 B | 0 B | 102400 B | yes | PASS |
| driveSuspense | 22744 B | 0 B | 102400 B | yes | PASS |

## Detailed serial reports

### driveCounter

# Perf Report — driveCounter.serial

| metric | value |
|---|---|
| iterations | 200 |
| warmup | 5 |
| p10 | 0.010ms |
| p50 | 0.01ms |
| p95 | 0.02ms |
| p99 | 0.04ms |
| mean | 0.01ms |
| stdev | 0.01ms |
| min | 0.0088ms |
| max | 0.21ms |
| total | 2.87ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.010ms | 0.01ms | -0.00075ms | -6.96% |
| p50 | 0.01ms | 0.01ms | -0.00031ms | -2.59% |
| p95 | 0.02ms | 0.02ms | +0.00048ms | +2.08% |
| p99 | 0.04ms | 0.04ms | -0.0036ms | -9.01% |
| mean | 0.01ms | 0.02ms | -0.00092ms | -6.02% |
| min | 0.0088ms | 0.0089ms | -0.000084ms | -0.95% |
| max | 0.21ms | 0.35ms | -0.14ms | -40.99% |
| total | 2.87ms | 3.06ms | -0.18ms | -6.02% |

### driveTodos

# Perf Report — driveTodos.serial

| metric | value |
|---|---|
| iterations | 200 |
| warmup | 5 |
| p10 | 0.01ms |
| p50 | 0.02ms |
| p95 | 0.02ms |
| p99 | 0.03ms |
| mean | 0.02ms |
| stdev | 0.01ms |
| min | 0.01ms |
| max | 0.16ms |
| total | 3.38ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.01ms | 0.01ms | -0.00072ms | -4.86% |
| p50 | 0.02ms | 0.02ms | -0.0014ms | -8.29% |
| p95 | 0.02ms | 0.03ms | -0.0043ms | -14.76% |
| p99 | 0.03ms | 0.07ms | -0.04ms | -55.16% |
| mean | 0.02ms | 0.02ms | -0.0021ms | -10.92% |
| min | 0.01ms | 0.01ms | -0.00058ms | -4.13% |
| max | 0.16ms | 0.15ms | +0.02ms | +12.66% |
| total | 3.38ms | 3.80ms | -0.41ms | -10.92% |

### driveResource

# Perf Report — driveResource.serial

| metric | value |
|---|---|
| iterations | 200 |
| warmup | 5 |
| p10 | 0.0045ms |
| p50 | 0.0047ms |
| p95 | 0.01ms |
| p99 | 0.02ms |
| mean | 0.0054ms |
| stdev | 0.0030ms |
| min | 0.0043ms |
| max | 0.03ms |
| total | 1.09ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.0045ms | 0.0043ms | +0.00017ms | +3.85% |
| p50 | 0.0047ms | 0.0045ms | +0.00021ms | +4.69% |
| p95 | 0.01ms | 0.01ms | +0.00041ms | +3.89% |
| p99 | 0.02ms | 0.02ms | -0.00032ms | -1.78% |
| mean | 0.0054ms | 0.0052ms | +0.00025ms | +4.81% |
| min | 0.0043ms | 0.0042ms | +0.00012ms | +2.95% |
| max | 0.03ms | 0.03ms | +0.0048ms | +16.06% |
| total | 1.09ms | 1.04ms | +0.05ms | +4.81% |

### driveSuspense

# Perf Report — driveSuspense.serial

| metric | value |
|---|---|
| iterations | 200 |
| warmup | 5 |
| p10 | 1.16ms |
| p50 | 1.18ms |
| p95 | 1.40ms |
| p99 | 1.55ms |
| mean | 1.18ms |
| stdev | 0.20ms |
| min | 0.04ms |
| max | 1.91ms |
| total | 236.29ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 1.16ms | 1.15ms | +0.0047ms | +0.41% |
| p50 | 1.18ms | 1.16ms | +0.02ms | +1.80% |
| p95 | 1.40ms | 1.20ms | +0.19ms | +16.04% |
| p99 | 1.55ms | 1.24ms | +0.30ms | +24.34% |
| mean | 1.18ms | 1.15ms | +0.04ms | +3.12% |
| min | 0.04ms | 0.03ms | +0.0067ms | +22.18% |
| max | 1.91ms | 1.40ms | +0.51ms | +36.38% |
| total | 236.29ms | 229.13ms | +7.16ms | +3.12% |

