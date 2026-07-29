# Perf Suite — dogfood-postgres-cdc-outbox-app

Threshold source: [docs/quality/perf-thresholds.md](../../quality/perf-thresholds)

測定系の分解能 = 0.00017ms (何もしない関数を同じ経路で呼んだ時の p10)。 回帰判定の絶対下限は既定でこの 2 倍 = 0.00033ms、 op ごとの実効値は下表の「下限」 列。

## Serial (concurrency = 1)

| op | p10 (実測) | p95 (上限判定) | cap | 下限 | gate | regression |
|---|---|---|---|---|---|---|
| driveOutbox | 0.0025ms | 0.01ms | 80ms | 0.00033ms | PASS | stable — gate 無効 (regressionGate=false) |
| driveCdcPickup | 0.0023ms | 0.01ms | 100ms | 0.00033ms | PASS | stable (p10 +7% (閾値未満)、 p95 +103% (裾は実行間の振れ幅と区別できないため判定には使わない)) — gate 無効 (regressionGate=false) |
| driveReplication | 0.0016ms | 0.0047ms | 80ms | 0.00034ms | PASS | stable — gate 無効 (regressionGate=false) |
| driveAtLeastOnce | 0.0020ms | 0.0054ms | 100ms | 0.00034ms | PASS | stable — gate 無効 (regressionGate=false) |

## 実行内正規化 (回帰判定はこの比で行う)

回帰判定は実測値そのものではなく、 同じ実行の中で 1 呼出ずつ交互に測った基準 op との比を読む。 実行と実行の間で機械の状態が変わっても、 その差が分子と分母で相殺される。 「換算後 p10」 は今回の比を baseline を測った時の基準 p10 で ms に戻した値で、 baseline の実測 p10 と直接比べられる。

| op | 基準 op | 基準 p10 | 実測 p10 | 比 | baseline の比 | 換算後 p10 | baseline p10 |
|---|---|---|---|---|---|---|---|
| driveOutbox | cpu | 0.08ms | 0.0025ms | 0.031 | 0.031 | 0.0025ms | 0.0025ms |
| driveCdcPickup | cpu | 0.08ms | 0.0023ms | 0.029 | 0.027 | 0.0023ms | 0.0022ms |
| driveReplication | cpu | 0.08ms | 0.0016ms | 0.020 | 0.020 | 0.0017ms | 0.0016ms |
| driveAtLeastOnce | cpu | 0.08ms | 0.0020ms | 0.024 | 0.025 | 0.0020ms | 0.0020ms |

## Concurrent p95 (concurrency = 10, 50 iter each)

| op | p95 | cap | gate |
|---|---|---|---|
| driveOutbox | 0.08ms | 160ms | PASS |
| driveCdcPickup | 0.06ms | 200ms | PASS |
| driveReplication | 0.03ms | 160ms | PASS |
| driveAtLeastOnce | 0.03ms | 200ms | PASS |

## Memory retention (200 iter, arrayBuffers axis is the gate; heap is informational)

| op | heapUsed Δ | arrayBuffers Δ | cap | gc exposed | verdict |
|---|---|---|---|---|---|
| driveOutbox | -24536 B | 0 B | 102400 B | yes | PASS |
| driveCdcPickup | 1864 B | 0 B | 102400 B | yes | PASS |
| driveReplication | 520 B | 0 B | 102400 B | yes | PASS |
| driveAtLeastOnce | 648 B | 0 B | 102400 B | yes | PASS |

## Detailed serial reports

### driveOutbox

# Perf Report — driveOutbox.serial

| metric | value |
|---|---|
| iterations | 200 |
| warmup | 5 |
| p10 | 0.0025ms |
| p50 | 0.0037ms |
| p95 | 0.01ms |
| p99 | 0.03ms |
| mean | 0.0055ms |
| stdev | 0.0066ms |
| min | 0.0023ms |
| max | 0.06ms |
| total | 1.10ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.0025ms | 0.0025ms | -0.000038ms | -1.52% |
| p50 | 0.0037ms | 0.0034ms | +0.00025ms | +7.32% |
| p95 | 0.01ms | 0.02ms | -0.0031ms | -19.75% |
| p99 | 0.03ms | 0.04ms | -0.0075ms | -19.74% |
| mean | 0.0055ms | 0.0052ms | +0.00034ms | +6.49% |
| min | 0.0023ms | 0.0023ms | 0.00ms | 0.00% |
| max | 0.06ms | 0.06ms | +0.0029ms | +4.72% |
| total | 1.10ms | 1.03ms | +0.07ms | +6.49% |

### driveCdcPickup

# Perf Report — driveCdcPickup.serial

| metric | value |
|---|---|
| iterations | 200 |
| warmup | 5 |
| p10 | 0.0023ms |
| p50 | 0.0025ms |
| p95 | 0.01ms |
| p99 | 0.04ms |
| mean | 0.0040ms |
| stdev | 0.0059ms |
| min | 0.0022ms |
| max | 0.04ms |
| total | 0.81ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.0023ms | 0.0022ms | +0.00016ms | +7.47% |
| p50 | 0.0025ms | 0.0023ms | +0.00021ms | +9.08% |
| p95 | 0.01ms | 0.0050ms | +0.0052ms | +104.64% |
| p99 | 0.04ms | 0.02ms | +0.02ms | +80.55% |
| mean | 0.0040ms | 0.0031ms | +0.00096ms | +31.13% |
| min | 0.0022ms | 0.0021ms | +0.000083ms | +3.91% |
| max | 0.04ms | 0.03ms | +0.02ms | +65.88% |
| total | 0.81ms | 0.61ms | +0.19ms | +31.13% |

### driveReplication

# Perf Report — driveReplication.serial

| metric | value |
|---|---|
| iterations | 200 |
| warmup | 5 |
| p10 | 0.0016ms |
| p50 | 0.0018ms |
| p95 | 0.0047ms |
| p99 | 0.02ms |
| mean | 0.0030ms |
| stdev | 0.0074ms |
| min | 0.0016ms |
| max | 0.10ms |
| total | 0.60ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.0016ms | 0.0016ms | 0.00ms | 0.00% |
| p50 | 0.0018ms | 0.0017ms | +0.000042ms | +2.46% |
| p95 | 0.0047ms | 0.01ms | -0.0077ms | -62.05% |
| p99 | 0.02ms | 0.02ms | +0.00061ms | +2.94% |
| mean | 0.0030ms | 0.0029ms | +0.00016ms | +5.53% |
| min | 0.0016ms | 0.0016ms | 0.00ms | 0.00% |
| max | 0.10ms | 0.03ms | +0.07ms | +266.67% |
| total | 0.60ms | 0.57ms | +0.03ms | +5.53% |

### driveAtLeastOnce

# Perf Report — driveAtLeastOnce.serial

| metric | value |
|---|---|
| iterations | 200 |
| warmup | 5 |
| p10 | 0.0020ms |
| p50 | 0.0021ms |
| p95 | 0.0054ms |
| p99 | 0.02ms |
| mean | 0.0030ms |
| stdev | 0.0039ms |
| min | 0.0019ms |
| max | 0.03ms |
| total | 0.60ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.0020ms | 0.0020ms | -0.000046ms | -2.30% |
| p50 | 0.0021ms | 0.0022ms | -0.00010ms | -4.78% |
| p95 | 0.0054ms | 0.0055ms | -0.00010ms | -1.87% |
| p99 | 0.02ms | 0.02ms | +0.0014ms | +6.69% |
| mean | 0.0030ms | 0.0029ms | +0.00012ms | +4.18% |
| min | 0.0019ms | 0.0020ms | -0.000083ms | -4.24% |
| max | 0.03ms | 0.03ms | +0.0065ms | +25.57% |
| total | 0.60ms | 0.58ms | +0.02ms | +4.18% |

