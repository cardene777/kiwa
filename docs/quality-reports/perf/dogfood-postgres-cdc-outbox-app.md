# Perf Suite — dogfood-postgres-cdc-outbox-app

Threshold source: [docs/quality/perf-thresholds.md](../../quality/perf-thresholds)

測定系の分解能 = 0.00017ms (何もしない関数を同じ経路で呼んだ時の p10)。 回帰判定の絶対下限は既定でこの 2 倍 = 0.00033ms、 op ごとの実効値は下表の「下限」 列。

## Serial (concurrency = 1)

| op | p10 (回帰判定) | p95 (上限判定) | cap | 下限 | gate | regression |
|---|---|---|---|---|---|---|
| driveOutbox | 0.0027ms | 0.01ms | 80ms | 0.00033ms | PASS | stable — gate 無効 (regressionGate=false) |
| driveCdcPickup | 0.0023ms | 0.0096ms | 100ms | 0.00033ms | PASS | stable — gate 無効 (regressionGate=false) |
| driveReplication | 0.0017ms | 0.0070ms | 80ms | 0.00033ms | PASS | stable (p10 -0% (閾値未満)、 p95 +31% (裾は実行間の振れ幅と区別できないため判定には使わない)) — gate 無効 (regressionGate=false) |
| driveAtLeastOnce | 0.0022ms | 0.0037ms | 100ms | 0.00033ms | PASS | stable — gate 無効 (regressionGate=false) |

## Concurrent p95 (concurrency = 10, 50 iter each)

| op | p95 | cap | gate |
|---|---|---|---|
| driveOutbox | 0.18ms | 160ms | PASS |
| driveCdcPickup | 0.04ms | 200ms | PASS |
| driveReplication | 0.03ms | 160ms | PASS |
| driveAtLeastOnce | 0.03ms | 200ms | PASS |

## Memory retention (200 iter, arrayBuffers axis is the gate; heap is informational)

| op | heapUsed Δ | arrayBuffers Δ | cap | gc exposed | verdict |
|---|---|---|---|---|---|
| driveOutbox | -9824 B | 0 B | 102400 B | yes | PASS |
| driveCdcPickup | 2120 B | 0 B | 102400 B | yes | PASS |
| driveReplication | 632 B | 0 B | 102400 B | yes | PASS |
| driveAtLeastOnce | 712 B | 0 B | 102400 B | yes | PASS |

## Detailed serial reports

### driveOutbox

# Perf Report — driveOutbox.serial

| metric | value |
|---|---|
| iterations | 200 |
| warmup | 5 |
| p10 | 0.0027ms |
| p50 | 0.0040ms |
| p95 | 0.01ms |
| p99 | 0.03ms |
| mean | 0.0050ms |
| stdev | 0.0057ms |
| min | 0.0025ms |
| max | 0.06ms |
| total | 1.01ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.0027ms | 0.0026ms | +0.00012ms | +4.61% |
| p50 | 0.0040ms | 0.0034ms | +0.00056ms | +16.55% |
| p95 | 0.01ms | 0.01ms | -0.0019ms | -15.15% |
| p99 | 0.03ms | 0.03ms | +0.0013ms | +4.30% |
| mean | 0.0050ms | 0.0047ms | +0.00034ms | +7.22% |
| min | 0.0025ms | 0.0025ms | -0.000042ms | -1.68% |
| max | 0.06ms | 0.06ms | +0.00046ms | +0.83% |
| total | 1.01ms | 0.94ms | +0.07ms | +7.22% |

### driveCdcPickup

# Perf Report — driveCdcPickup.serial

| metric | value |
|---|---|
| iterations | 200 |
| warmup | 5 |
| p10 | 0.0023ms |
| p50 | 0.0024ms |
| p95 | 0.0096ms |
| p99 | 0.02ms |
| mean | 0.0038ms |
| stdev | 0.0091ms |
| min | 0.0022ms |
| max | 0.13ms |
| total | 0.76ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.0023ms | 0.0026ms | -0.00029ms | -11.27% |
| p50 | 0.0024ms | 0.0032ms | -0.00083ms | -25.63% |
| p95 | 0.0096ms | 0.0083ms | +0.0013ms | +15.20% |
| p99 | 0.02ms | 0.02ms | +0.00083ms | +4.10% |
| mean | 0.0038ms | 0.0037ms | +0.000052ms | +1.38% |
| min | 0.0022ms | 0.0024ms | -0.00017ms | -6.91% |
| max | 0.13ms | 0.02ms | +0.10ms | +405.35% |
| total | 0.76ms | 0.75ms | +0.01ms | +1.38% |

### driveReplication

# Perf Report — driveReplication.serial

| metric | value |
|---|---|
| iterations | 200 |
| warmup | 5 |
| p10 | 0.0017ms |
| p50 | 0.0017ms |
| p95 | 0.0070ms |
| p99 | 0.02ms |
| mean | 0.0026ms |
| stdev | 0.0036ms |
| min | 0.0016ms |
| max | 0.02ms |
| total | 0.52ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.0017ms | 0.0017ms | -0.0000010ms | -0.06% |
| p50 | 0.0017ms | 0.0018ms | -0.000042ms | -2.37% |
| p95 | 0.0070ms | 0.0053ms | +0.0017ms | +31.32% |
| p99 | 0.02ms | 0.02ms | +0.0039ms | +22.08% |
| mean | 0.0026ms | 0.0025ms | +0.00011ms | +4.27% |
| min | 0.0016ms | 0.0016ms | -0.000042ms | -2.58% |
| max | 0.02ms | 0.02ms | +0.0041ms | +20.84% |
| total | 0.52ms | 0.50ms | +0.02ms | +4.27% |

### driveAtLeastOnce

# Perf Report — driveAtLeastOnce.serial

| metric | value |
|---|---|
| iterations | 200 |
| warmup | 5 |
| p10 | 0.0022ms |
| p50 | 0.0023ms |
| p95 | 0.0037ms |
| p99 | 0.01ms |
| mean | 0.0028ms |
| stdev | 0.0021ms |
| min | 0.0021ms |
| max | 0.03ms |
| total | 0.55ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.0022ms | 0.0023ms | -0.000083ms | -3.62% |
| p50 | 0.0023ms | 0.0028ms | -0.00046ms | -16.40% |
| p95 | 0.0037ms | 0.0043ms | -0.00064ms | -14.92% |
| p99 | 0.01ms | 0.01ms | -0.0025ms | -19.29% |
| mean | 0.0028ms | 0.0031ms | -0.00034ms | -10.87% |
| min | 0.0021ms | 0.0022ms | -0.000083ms | -3.76% |
| max | 0.03ms | 0.03ms | +0.00050ms | +1.97% |
| total | 0.55ms | 0.62ms | -0.07ms | -10.87% |

