# Perf Suite — dogfood-postgres-cdc-outbox-app

Threshold source: [docs/quality/perf-thresholds.md](../../quality/perf-thresholds)

測定系の分解能 = 0.00017ms (何もしない関数を同じ経路で呼んだ時の p10)。 回帰判定の絶対下限は既定でこの 2 倍 = 0.00033ms、 op ごとの実効値は下表の「下限」 列。

## Serial (concurrency = 1)

| op | p10 (回帰判定) | p95 (上限判定) | cap | 下限 | gate | regression |
|---|---|---|---|---|---|---|
| driveOutbox | 0.0025ms | 0.0098ms | 80ms | 0.00033ms | PASS | stable — gate 無効 (regressionGate=false) |
| driveCdcPickup | 0.0022ms | 0.0064ms | 100ms | 0.00033ms | PASS | stable — gate 無効 (regressionGate=false) |
| driveReplication | 0.0017ms | 0.0074ms | 80ms | 0.00033ms | PASS | stable (p10 -0% (閾値未満)、 p95 +38% (裾は実行間の振れ幅と区別できないため判定には使わない)) — gate 無効 (regressionGate=false) |
| driveAtLeastOnce | 0.0020ms | 0.0061ms | 100ms | 0.00033ms | PASS | stable (p10 -13% (閾値未満)、 p95 +42% (裾は実行間の振れ幅と区別できないため判定には使わない)) — gate 無効 (regressionGate=false) |

## Concurrent p95 (concurrency = 10, 50 iter each)

| op | p95 | cap | gate |
|---|---|---|---|
| driveOutbox | 0.09ms | 160ms | PASS |
| driveCdcPickup | 0.04ms | 200ms | PASS |
| driveReplication | 0.04ms | 160ms | PASS |
| driveAtLeastOnce | 0.04ms | 200ms | PASS |

## Memory retention (200 iter, arrayBuffers axis is the gate; heap is informational)

| op | heapUsed Δ | arrayBuffers Δ | cap | gc exposed | verdict |
|---|---|---|---|---|---|
| driveOutbox | -471904 B | 0 B | 102400 B | yes | PASS |
| driveCdcPickup | 1912 B | 0 B | 102400 B | yes | PASS |
| driveReplication | 4120 B | 0 B | 102400 B | yes | PASS |
| driveAtLeastOnce | 712 B | 0 B | 102400 B | yes | PASS |

## Detailed serial reports

### driveOutbox

# Perf Report — driveOutbox.serial

| metric | value |
|---|---|
| iterations | 200 |
| warmup | 5 |
| p10 | 0.0025ms |
| p50 | 0.0035ms |
| p95 | 0.0098ms |
| p99 | 0.03ms |
| mean | 0.0046ms |
| stdev | 0.0054ms |
| min | 0.0024ms |
| max | 0.05ms |
| total | 0.93ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.0025ms | 0.0026ms | -0.000083ms | -3.16% |
| p50 | 0.0035ms | 0.0034ms | +0.00010ms | +3.06% |
| p95 | 0.0098ms | 0.01ms | -0.0028ms | -22.16% |
| p99 | 0.03ms | 0.03ms | -0.0021ms | -7.01% |
| mean | 0.0046ms | 0.0047ms | -0.000049ms | -1.04% |
| min | 0.0024ms | 0.0025ms | -0.000083ms | -3.32% |
| max | 0.05ms | 0.06ms | -0.0021ms | -3.74% |
| total | 0.93ms | 0.94ms | -0.0098ms | -1.04% |

### driveCdcPickup

# Perf Report — driveCdcPickup.serial

| metric | value |
|---|---|
| iterations | 200 |
| warmup | 5 |
| p10 | 0.0022ms |
| p50 | 0.0023ms |
| p95 | 0.0064ms |
| p99 | 0.02ms |
| mean | 0.0036ms |
| stdev | 0.0086ms |
| min | 0.0022ms |
| max | 0.12ms |
| total | 0.72ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.0022ms | 0.0026ms | -0.00034ms | -13.05% |
| p50 | 0.0023ms | 0.0032ms | -0.00092ms | -28.22% |
| p95 | 0.0064ms | 0.0083ms | -0.0019ms | -22.46% |
| p99 | 0.02ms | 0.02ms | +0.0019ms | +9.36% |
| mean | 0.0036ms | 0.0037ms | -0.00013ms | -3.58% |
| min | 0.0022ms | 0.0024ms | -0.00025ms | -10.34% |
| max | 0.12ms | 0.02ms | +0.09ms | +374.47% |
| total | 0.72ms | 0.75ms | -0.03ms | -3.58% |

### driveReplication

# Perf Report — driveReplication.serial

| metric | value |
|---|---|
| iterations | 200 |
| warmup | 5 |
| p10 | 0.0017ms |
| p50 | 0.0018ms |
| p95 | 0.0074ms |
| p99 | 0.02ms |
| mean | 0.0033ms |
| stdev | 0.01ms |
| min | 0.0016ms |
| max | 0.14ms |
| total | 0.65ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.0017ms | 0.0017ms | -0.0000010ms | -0.06% |
| p50 | 0.0018ms | 0.0018ms | 0.00ms | 0.00% |
| p95 | 0.0074ms | 0.0053ms | +0.0020ms | +38.10% |
| p99 | 0.02ms | 0.02ms | +0.0022ms | +12.27% |
| mean | 0.0033ms | 0.0025ms | +0.00076ms | +30.38% |
| min | 0.0016ms | 0.0016ms | -0.000041ms | -2.52% |
| max | 0.14ms | 0.02ms | +0.12ms | +609.49% |
| total | 0.65ms | 0.50ms | +0.15ms | +30.38% |

### driveAtLeastOnce

# Perf Report — driveAtLeastOnce.serial

| metric | value |
|---|---|
| iterations | 200 |
| warmup | 5 |
| p10 | 0.0020ms |
| p50 | 0.0020ms |
| p95 | 0.0061ms |
| p99 | 0.03ms |
| mean | 0.0036ms |
| stdev | 0.01ms |
| min | 0.0020ms |
| max | 0.14ms |
| total | 0.71ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.0020ms | 0.0023ms | -0.00029ms | -12.74% |
| p50 | 0.0020ms | 0.0028ms | -0.00075ms | -26.86% |
| p95 | 0.0061ms | 0.0043ms | +0.0018ms | +42.49% |
| p99 | 0.03ms | 0.01ms | +0.02ms | +159.74% |
| mean | 0.0036ms | 0.0031ms | +0.00048ms | +15.58% |
| min | 0.0020ms | 0.0022ms | -0.00025ms | -11.32% |
| max | 0.14ms | 0.03ms | +0.12ms | +455.49% |
| total | 0.71ms | 0.62ms | +0.10ms | +15.58% |

