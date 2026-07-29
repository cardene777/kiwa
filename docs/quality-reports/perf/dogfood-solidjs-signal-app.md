# Perf Suite — dogfood-solidjs-signal-app

Threshold source: [docs/quality/perf-thresholds.md](../../quality/perf-thresholds)

測定系の分解能 = 0.00042ms (何もしない関数を同じ経路で呼んだ時の p10)。 回帰判定の絶対下限は既定でこの 2 倍 = 0.00083ms、 op ごとの実効値は下表の「下限」 列。

## Serial (concurrency = 1)

| op | p10 (回帰判定) | p95 (上限判定) | cap | 下限 | gate | regression |
|---|---|---|---|---|---|---|
| driveCounter | 0.01ms | 0.03ms | 50ms | 0.00083ms | PASS | stable — gate 無効 (regressionGate=false) |
| driveTodos | 0.01ms | 0.02ms | 80ms | 0.00083ms | PASS | stable — gate 無効 (regressionGate=false) |
| driveResource | 0.0050ms | 0.0098ms | 100ms | 0.00083ms | PASS | stable — gate 無効 (regressionGate=false) |
| driveSuspense | 1.16ms | 1.97ms | 150ms | 0.00083ms | PASS | stable (p10 +1% (閾値未満)、 p95 +63% (裾は実行間の振れ幅と区別できないため判定には使わない)) — gate 無効 (regressionGate=false) |

## Concurrent p95 (concurrency = 10, 50 iter each)

| op | p95 | cap | gate |
|---|---|---|---|
| driveCounter | 0.23ms | 100ms | PASS |
| driveTodos | 0.30ms | 160ms | PASS |
| driveResource | 0.06ms | 200ms | PASS |
| driveSuspense | 1.31ms | 300ms | PASS |

## Memory retention (200 iter, arrayBuffers axis is the gate; heap is informational)

| op | heapUsed Δ | arrayBuffers Δ | cap | gc exposed | verdict |
|---|---|---|---|---|---|
| driveCounter | -16752 B | 0 B | 102400 B | yes | PASS |
| driveTodos | 7064 B | 0 B | 102400 B | yes | PASS |
| driveResource | 32 B | 0 B | 102400 B | yes | PASS |
| driveSuspense | 22304 B | 0 B | 102400 B | yes | PASS |

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
| p99 | 0.04ms |
| mean | 0.02ms |
| stdev | 0.02ms |
| min | 0.01ms |
| max | 0.32ms |
| total | 3.49ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.01ms | 0.01ms | +0.00099ms | +9.26% |
| p50 | 0.01ms | 0.01ms | +0.0014ms | +11.70% |
| p95 | 0.03ms | 0.02ms | +0.0034ms | +14.53% |
| p99 | 0.04ms | 0.04ms | +0.0052ms | +13.01% |
| mean | 0.02ms | 0.02ms | +0.0022ms | +14.25% |
| min | 0.01ms | 0.0089ms | +0.0016ms | +18.31% |
| max | 0.32ms | 0.35ms | -0.04ms | -10.12% |
| total | 3.49ms | 3.06ms | +0.44ms | +14.25% |

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
| stdev | 0.01ms |
| min | 0.01ms |
| max | 0.20ms |
| total | 3.40ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.01ms | 0.01ms | -0.00046ms | -3.11% |
| p50 | 0.01ms | 0.02ms | -0.0016ms | -9.55% |
| p95 | 0.02ms | 0.03ms | -0.0045ms | -15.54% |
| p99 | 0.03ms | 0.07ms | -0.04ms | -54.12% |
| mean | 0.02ms | 0.02ms | -0.0020ms | -10.41% |
| min | 0.01ms | 0.01ms | -0.00013ms | -0.88% |
| max | 0.20ms | 0.15ms | +0.05ms | +34.52% |
| total | 3.40ms | 3.80ms | -0.40ms | -10.41% |

### driveResource

# Perf Report — driveResource.serial

| metric | value |
|---|---|
| iterations | 200 |
| warmup | 5 |
| p10 | 0.0050ms |
| p50 | 0.0053ms |
| p95 | 0.0098ms |
| p99 | 0.02ms |
| mean | 0.0060ms |
| stdev | 0.0031ms |
| min | 0.0049ms |
| max | 0.04ms |
| total | 1.20ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.0050ms | 0.0043ms | +0.00071ms | +16.36% |
| p50 | 0.0053ms | 0.0045ms | +0.00079ms | +17.77% |
| p95 | 0.0098ms | 0.01ms | -0.00091ms | -8.53% |
| p99 | 0.02ms | 0.02ms | -0.00022ms | -1.26% |
| mean | 0.0060ms | 0.0052ms | +0.00080ms | +15.38% |
| min | 0.0049ms | 0.0042ms | +0.00071ms | +16.80% |
| max | 0.04ms | 0.03ms | +0.0058ms | +19.25% |
| total | 1.20ms | 1.04ms | +0.16ms | +15.38% |

### driveSuspense

# Perf Report — driveSuspense.serial

| metric | value |
|---|---|
| iterations | 200 |
| warmup | 5 |
| p10 | 1.16ms |
| p50 | 1.23ms |
| p95 | 1.97ms |
| p99 | 2.61ms |
| mean | 1.30ms |
| stdev | 0.39ms |
| min | 0.05ms |
| max | 3.44ms |
| total | 259.01ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 1.16ms | 1.15ms | +0.0093ms | +0.81% |
| p50 | 1.23ms | 1.16ms | +0.07ms | +5.74% |
| p95 | 1.97ms | 1.20ms | +0.76ms | +63.49% |
| p99 | 2.61ms | 1.24ms | +1.37ms | +109.69% |
| mean | 1.30ms | 1.15ms | +0.15ms | +13.04% |
| min | 0.05ms | 0.03ms | +0.02ms | +54.27% |
| max | 3.44ms | 1.40ms | +2.04ms | +146.14% |
| total | 259.01ms | 229.13ms | +29.88ms | +13.04% |

