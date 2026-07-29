# Perf Suite — dogfood-postgres-cdc-outbox-app

Threshold source: [docs/quality/perf-thresholds.md](../../quality/perf-thresholds)

測定系の分解能 = 0.00017ms (何もしない関数を同じ経路で呼んだ時の p10)。 回帰判定の絶対下限は既定でこの 2 倍 = 0.00033ms、 op ごとの実効値は下表の「下限」 列。

## Serial (concurrency = 1)

| op | p10 (回帰判定) | p95 (上限判定) | cap | 下限 | gate | regression |
|---|---|---|---|---|---|---|
| driveOutbox | 0.0027ms | 0.01ms | 80ms | 0.00033ms | PASS | stable — gate 無効 (regressionGate=false) |
| driveCdcPickup | 0.0025ms | 0.01ms | 100ms | 0.00033ms | PASS | stable (p10 -3% (閾値未満)、 p95 +34% (裾は実行間の振れ幅と区別できないため判定には使わない)) — gate 無効 (regressionGate=false) |
| driveReplication | 0.0017ms | 0.0032ms | 80ms | 0.00033ms | PASS | stable — gate 無効 (regressionGate=false) |
| driveAtLeastOnce | 0.0022ms | 0.0042ms | 100ms | 0.00033ms | PASS | stable — gate 無効 (regressionGate=false) |

## Concurrent p95 (concurrency = 10, 50 iter each)

| op | p95 | cap | gate |
|---|---|---|---|
| driveOutbox | 0.10ms | 160ms | PASS |
| driveCdcPickup | 0.09ms | 200ms | PASS |
| driveReplication | 0.04ms | 160ms | PASS |
| driveAtLeastOnce | 0.03ms | 200ms | PASS |

## Memory retention (200 iter, arrayBuffers axis is the gate; heap is informational)

| op | heapUsed Δ | arrayBuffers Δ | cap | gc exposed | verdict |
|---|---|---|---|---|---|
| driveOutbox | 3264 B | 0 B | 102400 B | yes | PASS |
| driveCdcPickup | 560 B | 0 B | 102400 B | yes | PASS |
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
| p50 | 0.0037ms |
| p95 | 0.01ms |
| p99 | 0.05ms |
| mean | 0.0055ms |
| stdev | 0.0094ms |
| min | 0.0025ms |
| max | 0.10ms |
| total | 1.11ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.0027ms | 0.0026ms | +0.000041ms | +1.56% |
| p50 | 0.0037ms | 0.0034ms | +0.00031ms | +9.22% |
| p95 | 0.01ms | 0.01ms | -0.00078ms | -6.18% |
| p99 | 0.05ms | 0.03ms | +0.02ms | +65.42% |
| mean | 0.0055ms | 0.0047ms | +0.00085ms | +18.17% |
| min | 0.0025ms | 0.0025ms | -0.000042ms | -1.68% |
| max | 0.10ms | 0.06ms | +0.04ms | +71.39% |
| total | 1.11ms | 0.94ms | +0.17ms | +18.17% |

### driveCdcPickup

# Perf Report — driveCdcPickup.serial

| metric | value |
|---|---|
| iterations | 200 |
| warmup | 5 |
| p10 | 0.0025ms |
| p50 | 0.0026ms |
| p95 | 0.01ms |
| p99 | 0.02ms |
| mean | 0.0043ms |
| stdev | 0.01ms |
| min | 0.0023ms |
| max | 0.15ms |
| total | 0.86ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.0025ms | 0.0026ms | -0.000083ms | -3.21% |
| p50 | 0.0026ms | 0.0032ms | -0.00062ms | -19.23% |
| p95 | 0.01ms | 0.0083ms | +0.0028ms | +33.74% |
| p99 | 0.02ms | 0.02ms | +0.0029ms | +14.40% |
| mean | 0.0043ms | 0.0037ms | +0.00057ms | +15.29% |
| min | 0.0023ms | 0.0024ms | -0.00013ms | -5.21% |
| max | 0.15ms | 0.02ms | +0.13ms | +519.21% |
| total | 0.86ms | 0.75ms | +0.11ms | +15.29% |

### driveReplication

# Perf Report — driveReplication.serial

| metric | value |
|---|---|
| iterations | 200 |
| warmup | 5 |
| p10 | 0.0017ms |
| p50 | 0.0021ms |
| p95 | 0.0032ms |
| p99 | 0.02ms |
| mean | 0.0025ms |
| stdev | 0.0027ms |
| min | 0.0016ms |
| max | 0.02ms |
| total | 0.50ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.0017ms | 0.0017ms | 0.00ms | 0.00% |
| p50 | 0.0021ms | 0.0018ms | +0.00031ms | +17.86% |
| p95 | 0.0032ms | 0.0053ms | -0.0021ms | -40.32% |
| p99 | 0.02ms | 0.02ms | -0.00029ms | -1.68% |
| mean | 0.0025ms | 0.0025ms | -0.000013ms | -0.51% |
| min | 0.0016ms | 0.0016ms | 0.00ms | 0.00% |
| max | 0.02ms | 0.02ms | +0.00033ms | +1.69% |
| total | 0.50ms | 0.50ms | -0.0025ms | -0.51% |

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
| mean | 0.0027ms |
| stdev | 0.0022ms |
| min | 0.0022ms |
| max | 0.03ms |
| total | 0.55ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.0022ms | 0.0023ms | -0.000084ms | -3.66% |
| p50 | 0.0023ms | 0.0028ms | -0.00050ms | -17.91% |
| p95 | 0.0042ms | 0.0043ms | -0.00012ms | -2.73% |
| p99 | 0.01ms | 0.01ms | -0.0018ms | -13.55% |
| mean | 0.0027ms | 0.0031ms | -0.00036ms | -11.64% |
| min | 0.0022ms | 0.0022ms | -0.000042ms | -1.90% |
| max | 0.03ms | 0.03ms | +0.0018ms | +7.04% |
| total | 0.55ms | 0.62ms | -0.07ms | -11.64% |

