# Perf Suite — dogfood-postgres-cdc-outbox-app

Threshold source: [docs/quality/perf-thresholds.md](../../quality/perf-thresholds)

測定系の分解能 = 0.00017ms (何もしない関数を同じ経路で呼んだ時の p10)。 回帰判定の絶対下限は既定でこの 2 倍 = 0.00033ms、 op ごとの実効値は下表の「下限」 列。

## Serial (concurrency = 1)

| op | p10 (回帰判定) | p95 (上限判定) | cap | 下限 | gate | regression |
|---|---|---|---|---|---|---|
| driveOutbox | 0.0026ms | 0.0099ms | 80ms | 0.00033ms | PASS | stable — gate 無効 (regressionGate=false) |
| driveCdcPickup | 0.0024ms | 0.01ms | 100ms | 0.00033ms | PASS | stable (p10 -8% (閾値未満)、 p95 +58% (裾は実行間の振れ幅と区別できないため判定には使わない)) — gate 無効 (regressionGate=false) |
| driveReplication | 0.0017ms | 0.0047ms | 80ms | 0.00033ms | PASS | stable — gate 無効 (regressionGate=false) |
| driveAtLeastOnce | 0.0022ms | 0.0042ms | 100ms | 0.00033ms | PASS | stable — gate 無効 (regressionGate=false) |

## Concurrent p95 (concurrency = 10, 50 iter each)

| op | p95 | cap | gate |
|---|---|---|---|
| driveOutbox | 0.08ms | 160ms | PASS |
| driveCdcPickup | 0.06ms | 200ms | PASS |
| driveReplication | 0.03ms | 160ms | PASS |
| driveAtLeastOnce | 0.04ms | 200ms | PASS |

## Memory retention (200 iter, arrayBuffers axis is the gate; heap is informational)

| op | heapUsed Δ | arrayBuffers Δ | cap | gc exposed | verdict |
|---|---|---|---|---|---|
| driveOutbox | -2184 B | 0 B | 102400 B | yes | PASS |
| driveCdcPickup | -271416 B | 0 B | 102400 B | yes | PASS |
| driveReplication | 3560 B | 0 B | 102400 B | yes | PASS |
| driveAtLeastOnce | 312 B | 0 B | 102400 B | yes | PASS |

## Detailed serial reports

### driveOutbox

# Perf Report — driveOutbox.serial

| metric | value |
|---|---|
| iterations | 200 |
| warmup | 5 |
| p10 | 0.0026ms |
| p50 | 0.0036ms |
| p95 | 0.0099ms |
| p99 | 0.03ms |
| mean | 0.0047ms |
| stdev | 0.0055ms |
| min | 0.0025ms |
| max | 0.05ms |
| total | 0.95ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.0026ms | 0.0026ms | -0.000041ms | -1.56% |
| p50 | 0.0036ms | 0.0034ms | +0.00023ms | +6.74% |
| p95 | 0.0099ms | 0.01ms | -0.0026ms | -20.70% |
| p99 | 0.03ms | 0.03ms | -0.0016ms | -5.30% |
| mean | 0.0047ms | 0.0047ms | +0.000043ms | +0.91% |
| min | 0.0025ms | 0.0025ms | 0.00ms | 0.00% |
| max | 0.05ms | 0.06ms | -0.0023ms | -4.19% |
| total | 0.95ms | 0.94ms | +0.0085ms | +0.91% |

### driveCdcPickup

# Perf Report — driveCdcPickup.serial

| metric | value |
|---|---|
| iterations | 200 |
| warmup | 5 |
| p10 | 0.0024ms |
| p50 | 0.0025ms |
| p95 | 0.01ms |
| p99 | 0.04ms |
| mean | 0.0047ms |
| stdev | 0.01ms |
| min | 0.0022ms |
| max | 0.15ms |
| total | 0.93ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.0024ms | 0.0026ms | -0.00021ms | -8.05% |
| p50 | 0.0025ms | 0.0032ms | -0.00071ms | -21.82% |
| p95 | 0.01ms | 0.0083ms | +0.0048ms | +58.18% |
| p99 | 0.04ms | 0.02ms | +0.02ms | +84.67% |
| mean | 0.0047ms | 0.0037ms | +0.00094ms | +25.20% |
| min | 0.0022ms | 0.0024ms | -0.00017ms | -6.91% |
| max | 0.15ms | 0.02ms | +0.13ms | +511.53% |
| total | 0.93ms | 0.75ms | +0.19ms | +25.20% |

### driveReplication

# Perf Report — driveReplication.serial

| metric | value |
|---|---|
| iterations | 200 |
| warmup | 5 |
| p10 | 0.0017ms |
| p50 | 0.0018ms |
| p95 | 0.0047ms |
| p99 | 0.02ms |
| mean | 0.0024ms |
| stdev | 0.0027ms |
| min | 0.0017ms |
| max | 0.02ms |
| total | 0.48ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.0017ms | 0.0017ms | +0.000041ms | +2.46% |
| p50 | 0.0018ms | 0.0018ms | +0.000041ms | +2.34% |
| p95 | 0.0047ms | 0.0053ms | -0.00063ms | -11.78% |
| p99 | 0.02ms | 0.02ms | +0.00083ms | +4.70% |
| mean | 0.0024ms | 0.0025ms | -0.000097ms | -3.88% |
| min | 0.0017ms | 0.0016ms | +0.000041ms | +2.52% |
| max | 0.02ms | 0.02ms | +0.00021ms | +1.06% |
| total | 0.48ms | 0.50ms | -0.02ms | -3.88% |

### driveAtLeastOnce

# Perf Report — driveAtLeastOnce.serial

| metric | value |
|---|---|
| iterations | 200 |
| warmup | 5 |
| p10 | 0.0022ms |
| p50 | 0.0023ms |
| p95 | 0.0042ms |
| p99 | 0.01ms |
| mean | 0.0028ms |
| stdev | 0.0022ms |
| min | 0.0021ms |
| max | 0.03ms |
| total | 0.55ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.0022ms | 0.0023ms | -0.000084ms | -3.66% |
| p50 | 0.0023ms | 0.0028ms | -0.00046ms | -16.44% |
| p95 | 0.0042ms | 0.0043ms | -0.000059ms | -1.36% |
| p99 | 0.01ms | 0.01ms | -0.0031ms | -23.68% |
| mean | 0.0028ms | 0.0031ms | -0.00033ms | -10.72% |
| min | 0.0021ms | 0.0022ms | -0.000083ms | -3.76% |
| max | 0.03ms | 0.03ms | +0.0018ms | +7.04% |
| total | 0.55ms | 0.62ms | -0.07ms | -10.72% |

