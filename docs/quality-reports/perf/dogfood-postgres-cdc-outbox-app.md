# Perf Suite — dogfood-postgres-cdc-outbox-app

Threshold source: [docs/quality/perf-thresholds.md](../../quality/perf-thresholds)

測定系の分解能 = 0.00017ms (何もしない関数を同じ経路で呼んだ時の p10)。 回帰判定の絶対下限は既定でこの 2 倍 = 0.00033ms、 op ごとの実効値は下表の「下限」 列。

## Serial (concurrency = 1)

| op | p10 (回帰判定) | p95 (上限判定) | cap | 下限 | gate | regression |
|---|---|---|---|---|---|---|
| driveOutbox | 0.0026ms | 0.01ms | 80ms | 0.00033ms | PASS | stable — gate 無効 (regressionGate=false) |
| driveCdcPickup | 0.0022ms | 0.0082ms | 100ms | 0.00033ms | PASS | stable — gate 無効 (regressionGate=false) |
| driveReplication | 0.0016ms | 0.0048ms | 80ms | 0.00033ms | PASS | stable — gate 無効 (regressionGate=false) |
| driveAtLeastOnce | 0.0020ms | 0.0031ms | 100ms | 0.00033ms | PASS | stable — gate 無効 (regressionGate=false) |

## Concurrent p95 (concurrency = 10, 50 iter each)

| op | p95 | cap | gate |
|---|---|---|---|
| driveOutbox | 0.08ms | 160ms | PASS |
| driveCdcPickup | 0.04ms | 200ms | PASS |
| driveReplication | 0.03ms | 160ms | PASS |
| driveAtLeastOnce | 0.09ms | 200ms | PASS |

## Memory retention (200 iter, arrayBuffers axis is the gate; heap is informational)

| op | heapUsed Δ | arrayBuffers Δ | cap | gc exposed | verdict |
|---|---|---|---|---|---|
| driveOutbox | -10920 B | 0 B | 102400 B | yes | PASS |
| driveCdcPickup | 2072 B | 0 B | 102400 B | yes | PASS |
| driveReplication | 256648 B | 0 B | 102400 B | yes | PASS |
| driveAtLeastOnce | 8824 B | 0 B | 102400 B | yes | PASS |

## Detailed serial reports

### driveOutbox

# Perf Report — driveOutbox.serial

| metric | value |
|---|---|
| iterations | 200 |
| warmup | 5 |
| p10 | 0.0026ms |
| p50 | 0.0036ms |
| p95 | 0.01ms |
| p99 | 0.03ms |
| mean | 0.0048ms |
| stdev | 0.0058ms |
| min | 0.0025ms |
| max | 0.06ms |
| total | 0.95ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.0026ms | 0.0026ms | 0.00ms | 0.00% |
| p50 | 0.0036ms | 0.0034ms | +0.00019ms | +5.54% |
| p95 | 0.01ms | 0.01ms | -0.0019ms | -15.36% |
| p99 | 0.03ms | 0.03ms | -0.000030ms | -0.10% |
| mean | 0.0048ms | 0.0047ms | +0.000075ms | +1.60% |
| min | 0.0025ms | 0.0025ms | 0.00ms | 0.00% |
| max | 0.06ms | 0.06ms | +0.00046ms | +0.82% |
| total | 0.95ms | 0.94ms | +0.01ms | +1.60% |

### driveCdcPickup

# Perf Report — driveCdcPickup.serial

| metric | value |
|---|---|
| iterations | 200 |
| warmup | 5 |
| p10 | 0.0022ms |
| p50 | 0.0023ms |
| p95 | 0.0082ms |
| p99 | 0.02ms |
| mean | 0.0038ms |
| stdev | 0.01ms |
| min | 0.0021ms |
| max | 0.14ms |
| total | 0.77ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.0022ms | 0.0026ms | -0.00037ms | -14.52% |
| p50 | 0.0023ms | 0.0032ms | -0.00092ms | -28.22% |
| p95 | 0.0082ms | 0.0083ms | -0.00015ms | -1.79% |
| p99 | 0.02ms | 0.02ms | +0.0019ms | +9.20% |
| mean | 0.0038ms | 0.0037ms | +0.00010ms | +2.68% |
| min | 0.0021ms | 0.0024ms | -0.00029ms | -12.08% |
| max | 0.14ms | 0.02ms | +0.12ms | +468.29% |
| total | 0.77ms | 0.75ms | +0.02ms | +2.68% |

### driveReplication

# Perf Report — driveReplication.serial

| metric | value |
|---|---|
| iterations | 200 |
| warmup | 5 |
| p10 | 0.0016ms |
| p50 | 0.0017ms |
| p95 | 0.0048ms |
| p99 | 0.02ms |
| mean | 0.0023ms |
| stdev | 0.0026ms |
| min | 0.0016ms |
| max | 0.02ms |
| total | 0.47ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.0016ms | 0.0017ms | -0.000042ms | -2.52% |
| p50 | 0.0017ms | 0.0018ms | -0.000083ms | -4.74% |
| p95 | 0.0048ms | 0.0053ms | -0.00053ms | -9.91% |
| p99 | 0.02ms | 0.02ms | -0.0010ms | -5.91% |
| mean | 0.0023ms | 0.0025ms | -0.00017ms | -6.98% |
| min | 0.0016ms | 0.0016ms | -0.000042ms | -2.58% |
| max | 0.02ms | 0.02ms | -0.00046ms | -2.31% |
| total | 0.47ms | 0.50ms | -0.03ms | -6.98% |

### driveAtLeastOnce

# Perf Report — driveAtLeastOnce.serial

| metric | value |
|---|---|
| iterations | 200 |
| warmup | 5 |
| p10 | 0.0020ms |
| p50 | 0.0021ms |
| p95 | 0.0031ms |
| p99 | 0.0092ms |
| mean | 0.0025ms |
| stdev | 0.0019ms |
| min | 0.0020ms |
| max | 0.02ms |
| total | 0.50ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.0020ms | 0.0023ms | -0.00029ms | -12.74% |
| p50 | 0.0021ms | 0.0028ms | -0.00067ms | -23.89% |
| p95 | 0.0031ms | 0.0043ms | -0.0012ms | -27.67% |
| p99 | 0.0092ms | 0.01ms | -0.0040ms | -30.07% |
| mean | 0.0025ms | 0.0031ms | -0.00059ms | -18.99% |
| min | 0.0020ms | 0.0022ms | -0.00025ms | -11.32% |
| max | 0.02ms | 0.03ms | -0.00058ms | -2.29% |
| total | 0.50ms | 0.62ms | -0.12ms | -18.99% |

