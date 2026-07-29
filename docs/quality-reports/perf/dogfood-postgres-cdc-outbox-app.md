# Perf Suite — dogfood-postgres-cdc-outbox-app

Threshold source: [docs/quality/perf-thresholds.md](../../quality/perf-thresholds)

測定系の分解能 = 0.00017ms (何もしない関数を同じ経路で呼んだ時の p10)。 回帰判定の絶対下限は既定でこの 2 倍 = 0.00033ms、 op ごとの実効値は下表の「下限」 列。

## Serial (concurrency = 1)

| op | p10 (回帰判定) | p95 (上限判定) | cap | 下限 | gate | regression |
|---|---|---|---|---|---|---|
| driveOutbox | 0.0031ms | 0.01ms | 80ms | 0.00033ms | PASS | stable — gate 無効 (regressionGate=false) |
| driveCdcPickup | 0.0023ms | 0.01ms | 100ms | 0.00033ms | PASS | stable (p10 -11% (閾値未満)、 p95 +66% (裾は実行間の振れ幅と区別できないため判定には使わない)) — gate 無効 (regressionGate=false) |
| driveReplication | 0.0019ms | 0.0086ms | 80ms | 0.00033ms | PASS | stable (p10 +12% (閾値未満)、 p95 +61% (裾は実行間の振れ幅と区別できないため判定には使わない)) — gate 無効 (regressionGate=false) |
| driveAtLeastOnce | 0.0024ms | 0.0033ms | 100ms | 0.00033ms | PASS | stable — gate 無効 (regressionGate=false) |

## Concurrent p95 (concurrency = 10, 50 iter each)

| op | p95 | cap | gate |
|---|---|---|---|
| driveOutbox | 0.12ms | 160ms | PASS |
| driveCdcPickup | 0.03ms | 200ms | PASS |
| driveReplication | 0.32ms | 160ms | PASS |
| driveAtLeastOnce | 0.03ms | 200ms | PASS |

## Memory retention (200 iter, arrayBuffers axis is the gate; heap is informational)

| op | heapUsed Δ | arrayBuffers Δ | cap | gc exposed | verdict |
|---|---|---|---|---|---|
| driveOutbox | -3184 B | 0 B | 102400 B | yes | PASS |
| driveCdcPickup | 4560 B | 0 B | 102400 B | yes | PASS |
| driveReplication | 2544 B | 0 B | 102400 B | yes | PASS |
| driveAtLeastOnce | 616 B | 0 B | 102400 B | yes | PASS |

## Detailed serial reports

### driveOutbox

# Perf Report — driveOutbox.serial

| metric | value |
|---|---|
| iterations | 200 |
| warmup | 5 |
| p10 | 0.0031ms |
| p50 | 0.0046ms |
| p95 | 0.01ms |
| p99 | 0.03ms |
| mean | 0.0061ms |
| stdev | 0.0063ms |
| min | 0.0029ms |
| max | 0.06ms |
| total | 1.22ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.0031ms | 0.0026ms | +0.00046ms | +17.45% |
| p50 | 0.0046ms | 0.0034ms | +0.0012ms | +34.98% |
| p95 | 0.01ms | 0.01ms | -0.00043ms | -3.44% |
| p99 | 0.03ms | 0.03ms | +0.0035ms | +11.50% |
| mean | 0.0061ms | 0.0047ms | +0.0014ms | +30.20% |
| min | 0.0029ms | 0.0025ms | +0.00037ms | +15.00% |
| max | 0.06ms | 0.06ms | +0.0044ms | +7.94% |
| total | 1.22ms | 0.94ms | +0.28ms | +30.20% |

### driveCdcPickup

# Perf Report — driveCdcPickup.serial

| metric | value |
|---|---|
| iterations | 200 |
| warmup | 5 |
| p10 | 0.0023ms |
| p50 | 0.0024ms |
| p95 | 0.01ms |
| p99 | 0.05ms |
| mean | 0.0060ms |
| stdev | 0.02ms |
| min | 0.0022ms |
| max | 0.23ms |
| total | 1.20ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.0023ms | 0.0026ms | -0.00029ms | -11.27% |
| p50 | 0.0024ms | 0.0032ms | -0.00083ms | -25.63% |
| p95 | 0.01ms | 0.0083ms | +0.0055ms | +66.20% |
| p99 | 0.05ms | 0.02ms | +0.03ms | +157.87% |
| mean | 0.0060ms | 0.0037ms | +0.0023ms | +60.41% |
| min | 0.0022ms | 0.0024ms | -0.00017ms | -6.91% |
| max | 0.23ms | 0.02ms | +0.20ms | +815.71% |
| total | 1.20ms | 0.75ms | +0.45ms | +60.41% |

### driveReplication

# Perf Report — driveReplication.serial

| metric | value |
|---|---|
| iterations | 200 |
| warmup | 5 |
| p10 | 0.0019ms |
| p50 | 0.0020ms |
| p95 | 0.0086ms |
| p99 | 0.02ms |
| mean | 0.0028ms |
| stdev | 0.0031ms |
| min | 0.0018ms |
| max | 0.02ms |
| total | 0.55ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.0019ms | 0.0017ms | +0.00021ms | +12.48% |
| p50 | 0.0020ms | 0.0018ms | +0.00021ms | +11.89% |
| p95 | 0.0086ms | 0.0053ms | +0.0033ms | +61.24% |
| p99 | 0.02ms | 0.02ms | +0.0028ms | +15.81% |
| mean | 0.0028ms | 0.0025ms | +0.00025ms | +10.13% |
| min | 0.0018ms | 0.0016ms | +0.00017ms | +10.22% |
| max | 0.02ms | 0.02ms | +0.0013ms | +6.53% |
| total | 0.55ms | 0.50ms | +0.05ms | +10.13% |

### driveAtLeastOnce

# Perf Report — driveAtLeastOnce.serial

| metric | value |
|---|---|
| iterations | 200 |
| warmup | 5 |
| p10 | 0.0024ms |
| p50 | 0.0025ms |
| p95 | 0.0033ms |
| p99 | 0.010ms |
| mean | 0.0029ms |
| stdev | 0.0019ms |
| min | 0.0023ms |
| max | 0.02ms |
| total | 0.57ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.0024ms | 0.0023ms | +0.00012ms | +5.41% |
| p50 | 0.0025ms | 0.0028ms | -0.00029ms | -10.46% |
| p95 | 0.0033ms | 0.0043ms | -0.0010ms | -23.20% |
| p99 | 0.010ms | 0.01ms | -0.0032ms | -24.34% |
| mean | 0.0029ms | 0.0031ms | -0.00024ms | -7.62% |
| min | 0.0023ms | 0.0022ms | +0.00013ms | +5.66% |
| max | 0.02ms | 0.03ms | -0.0025ms | -9.98% |
| total | 0.57ms | 0.62ms | -0.05ms | -7.62% |

