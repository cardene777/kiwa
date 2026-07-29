# Perf Suite — dogfood-postgres-cdc-outbox-app

Threshold source: [docs/quality/perf-thresholds.md](../../quality/perf-thresholds)

測定系の分解能 = 0.00017ms (何もしない関数を同じ経路で呼んだ時の p10)。 回帰判定の絶対下限は既定でこの 2 倍 = 0.00033ms、 op ごとの実効値は下表の「下限」 列。

## Serial (concurrency = 1)

| op | p10 (回帰判定) | p95 (上限判定) | cap | 下限 | gate | regression |
|---|---|---|---|---|---|---|
| driveOutbox | 0.0025ms | 0.01ms | 80ms | 0.00033ms | PASS | stable — gate 無効 (regressionGate=false) |
| driveCdcPickup | 0.0023ms | 0.0064ms | 100ms | 0.00033ms | PASS | stable — gate 無効 (regressionGate=false) |
| driveReplication | 0.0018ms | 0.0052ms | 80ms | 0.00033ms | PASS | stable — gate 無効 (regressionGate=false) |
| driveAtLeastOnce | 0.0020ms | 0.0036ms | 100ms | 0.00033ms | PASS | stable — gate 無効 (regressionGate=false) |

## Concurrent p95 (concurrency = 10, 50 iter each)

| op | p95 | cap | gate |
|---|---|---|---|
| driveOutbox | 0.08ms | 160ms | PASS |
| driveCdcPickup | 0.04ms | 200ms | PASS |
| driveReplication | 0.03ms | 160ms | PASS |
| driveAtLeastOnce | 0.04ms | 200ms | PASS |

## Memory retention (200 iter, arrayBuffers axis is the gate; heap is informational)

| op | heapUsed Δ | arrayBuffers Δ | cap | gc exposed | verdict |
|---|---|---|---|---|---|
| driveOutbox | -35480 B | 0 B | 102400 B | yes | PASS |
| driveCdcPickup | 1864 B | 0 B | 102400 B | yes | PASS |
| driveReplication | 1536 B | 0 B | 102400 B | yes | PASS |
| driveAtLeastOnce | 712 B | 0 B | 102400 B | yes | PASS |

## Detailed serial reports

### driveOutbox

# Perf Report — driveOutbox.serial

| metric | value |
|---|---|
| iterations | 200 |
| warmup | 5 |
| p10 | 0.0025ms |
| p50 | 0.0034ms |
| p95 | 0.01ms |
| p99 | 0.03ms |
| mean | 0.0046ms |
| stdev | 0.0056ms |
| min | 0.0024ms |
| max | 0.05ms |
| total | 0.91ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.0025ms | 0.0026ms | -0.000083ms | -3.16% |
| p50 | 0.0034ms | 0.0034ms | +0.000021ms | +0.62% |
| p95 | 0.01ms | 0.01ms | -0.0018ms | -14.16% |
| p99 | 0.03ms | 0.03ms | -0.0015ms | -4.93% |
| mean | 0.0046ms | 0.0047ms | -0.00014ms | -3.01% |
| min | 0.0024ms | 0.0025ms | -0.000084ms | -3.36% |
| max | 0.05ms | 0.06ms | -0.00083ms | -1.50% |
| total | 0.91ms | 0.94ms | -0.03ms | -3.01% |

### driveCdcPickup

# Perf Report — driveCdcPickup.serial

| metric | value |
|---|---|
| iterations | 200 |
| warmup | 5 |
| p10 | 0.0023ms |
| p50 | 0.0024ms |
| p95 | 0.0064ms |
| p99 | 0.02ms |
| mean | 0.0031ms |
| stdev | 0.0029ms |
| min | 0.0022ms |
| max | 0.02ms |
| total | 0.63ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.0023ms | 0.0026ms | -0.00029ms | -11.27% |
| p50 | 0.0024ms | 0.0032ms | -0.00083ms | -25.66% |
| p95 | 0.0064ms | 0.0083ms | -0.0019ms | -22.79% |
| p99 | 0.02ms | 0.02ms | -0.00037ms | -1.84% |
| mean | 0.0031ms | 0.0037ms | -0.00059ms | -15.73% |
| min | 0.0022ms | 0.0024ms | -0.00021ms | -8.65% |
| max | 0.02ms | 0.02ms | -0.00092ms | -3.67% |
| total | 0.63ms | 0.75ms | -0.12ms | -15.73% |

### driveReplication

# Perf Report — driveReplication.serial

| metric | value |
|---|---|
| iterations | 200 |
| warmup | 5 |
| p10 | 0.0018ms |
| p50 | 0.0019ms |
| p95 | 0.0052ms |
| p99 | 0.02ms |
| mean | 0.0025ms |
| stdev | 0.0027ms |
| min | 0.0017ms |
| max | 0.02ms |
| total | 0.50ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.0018ms | 0.0017ms | +0.000083ms | +4.98% |
| p50 | 0.0019ms | 0.0018ms | +0.00012ms | +7.14% |
| p95 | 0.0052ms | 0.0053ms | -0.00011ms | -2.12% |
| p99 | 0.02ms | 0.02ms | +0.00078ms | +4.46% |
| mean | 0.0025ms | 0.0025ms | +0.000019ms | +0.74% |
| min | 0.0017ms | 0.0016ms | +0.000083ms | +5.11% |
| max | 0.02ms | 0.02ms | -0.00029ms | -1.47% |
| total | 0.50ms | 0.50ms | +0.0037ms | +0.74% |

### driveAtLeastOnce

# Perf Report — driveAtLeastOnce.serial

| metric | value |
|---|---|
| iterations | 200 |
| warmup | 5 |
| p10 | 0.0020ms |
| p50 | 0.0022ms |
| p95 | 0.0036ms |
| p99 | 0.0089ms |
| mean | 0.0025ms |
| stdev | 0.0018ms |
| min | 0.0020ms |
| max | 0.02ms |
| total | 0.50ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.0020ms | 0.0023ms | -0.00025ms | -10.90% |
| p50 | 0.0022ms | 0.0028ms | -0.00063ms | -22.42% |
| p95 | 0.0036ms | 0.0043ms | -0.00067ms | -15.50% |
| p99 | 0.0089ms | 0.01ms | -0.0043ms | -32.89% |
| mean | 0.0025ms | 0.0031ms | -0.00058ms | -18.80% |
| min | 0.0020ms | 0.0022ms | -0.00021ms | -9.42% |
| max | 0.02ms | 0.03ms | -0.0025ms | -9.82% |
| total | 0.50ms | 0.62ms | -0.12ms | -18.80% |

