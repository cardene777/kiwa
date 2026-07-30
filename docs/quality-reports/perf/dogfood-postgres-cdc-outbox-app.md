# Perf Suite — dogfood-postgres-cdc-outbox-app

Threshold source: [docs/quality/perf-thresholds.md](../../quality/perf-thresholds)

測定系の分解能 = 0.00017ms (何もしない関数を同じ経路で呼んだ時の p10)。 回帰判定の絶対下限は既定でこの 2 倍 = 0.00033ms、 op ごとの実効値は下表の「下限」 列。

## Serial (concurrency = 1)

| op | p10 (実測) | p95 (上限判定) | cap | 下限 | gate | regression |
|---|---|---|---|---|---|---|
| driveOutbox | 0.0028ms | 0.01ms | 80ms | 0.00030ms | PASS | stable — gate 無効 (regressionGate=false) |
| driveCdcPickup | 0.0025ms | 0.02ms | 100ms | 0.00030ms | PASS | stable (換算後 p10 -1% (閾値未満)、 p95 +108% (裾は実行間の振れ幅と区別できないため判定には使わない)) — gate 無効 (regressionGate=false) |
| driveReplication | 0.0018ms | 0.02ms | 80ms | 0.00031ms | PASS | stable (換算後 p10 -3% (閾値未満)、 p95 +80% (裾は実行間の振れ幅と区別できないため判定には使わない)) — gate 無効 (regressionGate=false) |
| driveAtLeastOnce | 0.0022ms | 0.07ms | 100ms | 0.00030ms | PASS | stable (換算後 p10 +3% (閾値未満)、 p95 +1038% (裾は実行間の振れ幅と区別できないため判定には使わない)) — gate 無効 (regressionGate=false) |

## 実行内正規化 (回帰判定はこの比で行う)

回帰判定は実測値そのものではなく、 同じ実行の中で 1 呼出ずつ交互に測った基準 op との比を読む。 実行と実行の間で機械の状態が変わっても、 その差が分子と分母で相殺される。 「換算後 p10」 は今回の比を baseline を測った時の基準 p10 で ms に戻した値で、 baseline の実測 p10 と直接比べられる。

| op | 基準 op | 基準 p10 | 基準 p95 | 実測 p10 | 比 | baseline の比 | 換算後 p10 | baseline p10 |
|---|---|---|---|---|---|---|---|---|
| driveOutbox | cpu | 0.09ms | 0.09ms | 0.0028ms | 0.031 | 0.030 | 0.0025ms | 0.0025ms |
| driveCdcPickup | cpu | 0.09ms | 0.09ms | 0.0025ms | 0.029 | 0.029 | 0.0023ms | 0.0023ms |
| driveReplication | cpu | 0.09ms | 0.09ms | 0.0018ms | 0.019 | 0.020 | 0.0016ms | 0.0017ms |
| driveAtLeastOnce | cpu | 0.09ms | 1.28ms | 0.0022ms | 0.025 | 0.025 | 0.0021ms | 0.0020ms |

## Concurrent p95 (concurrency = 10, 50 iter each)

| op | p95 | cap | gate |
|---|---|---|---|
| driveOutbox | 0.14ms | 160ms | PASS |
| driveCdcPickup | 5.31ms | 200ms | PASS |
| driveReplication | 3.79ms | 160ms | PASS |
| driveAtLeastOnce | 0.03ms | 200ms | PASS |

## Memory retention (200 iter, arrayBuffers axis is the gate; heap is informational)

| op | heapUsed Δ | arrayBuffers Δ | cap | gc exposed | verdict |
|---|---|---|---|---|---|
| driveOutbox | 800 B | 0 B | 102400 B | yes | PASS |
| driveCdcPickup | 560 B | 0 B | 102400 B | yes | PASS |
| driveReplication | 744 B | 0 B | 102400 B | yes | PASS |
| driveAtLeastOnce | 624 B | 0 B | 102400 B | yes | PASS |

## Detailed serial reports

### driveOutbox

# Perf Report — driveOutbox.serial

| metric | value |
|---|---|
| iterations | 200 |
| warmup | 5 |
| p10 | 0.0028ms |
| p50 | 0.0040ms |
| p95 | 0.01ms |
| p99 | 0.03ms |
| mean | 0.0054ms |
| stdev | 0.0065ms |
| min | 0.0026ms |
| max | 0.06ms |
| total | 1.08ms |

## Baseline diff

current は baseline を測った時の機械の速さへ換算済み (倍率 0.911)。 回帰判定が読む量と同じ。 実測値は上表。

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.0025ms | 0.0025ms | +0.000081ms | +3.28% |
| p50 | 0.0036ms | 0.0036ms | -4.0e-7ms | -0.01% |
| p95 | 0.01ms | 0.02ms | -0.0026ms | -17.01% |
| p99 | 0.03ms | 0.05ms | -0.02ms | -41.60% |
| mean | 0.0049ms | 0.0058ms | -0.00091ms | -15.60% |
| min | 0.0024ms | 0.0023ms | +0.000021ms | +0.89% |
| max | 0.06ms | 0.11ms | -0.05ms | -48.24% |
| total | 0.98ms | 1.16ms | -0.18ms | -15.60% |

### driveCdcPickup

# Perf Report — driveCdcPickup.serial

| metric | value |
|---|---|
| iterations | 200 |
| warmup | 5 |
| p10 | 0.0025ms |
| p50 | 0.0027ms |
| p95 | 0.02ms |
| p99 | 0.85ms |
| mean | 0.13ms |
| stdev | 1.35ms |
| min | 0.0024ms |
| max | 17.85ms |
| total | 26.63ms |

## Baseline diff

current は baseline を測った時の機械の速さへ換算済み (倍率 0.912)。 回帰判定が読む量と同じ。 実測値は上表。

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.0023ms | 0.0023ms | -0.000016ms | -0.68% |
| p50 | 0.0025ms | 0.0025ms | +0.000048ms | +1.94% |
| p95 | 0.02ms | 0.01ms | +0.01ms | +107.92% |
| p99 | 0.78ms | 0.03ms | +0.75ms | +2819.44% |
| mean | 0.12ms | 0.0038ms | +0.12ms | +3100.43% |
| min | 0.0022ms | 0.0022ms | -0.0000021ms | -0.10% |
| max | 16.27ms | 0.05ms | +16.22ms | +34325.92% |
| total | 24.27ms | 0.76ms | +23.51ms | +3100.43% |

### driveReplication

# Perf Report — driveReplication.serial

| metric | value |
|---|---|
| iterations | 200 |
| warmup | 5 |
| p10 | 0.0018ms |
| p50 | 0.0019ms |
| p95 | 0.02ms |
| p99 | 0.05ms |
| mean | 0.0040ms |
| stdev | 0.0078ms |
| min | 0.0017ms |
| max | 0.05ms |
| total | 0.81ms |

## Baseline diff

current は baseline を測った時の機械の速さへ換算済み (倍率 0.920)。 回帰判定が読む量と同じ。 実測値は上表。

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.0016ms | 0.0017ms | -0.000056ms | -3.34% |
| p50 | 0.0018ms | 0.0018ms | +0.000013ms | +0.74% |
| p95 | 0.02ms | 0.01ms | +0.0081ms | +79.60% |
| p99 | 0.05ms | 0.03ms | +0.02ms | +61.87% |
| mean | 0.0037ms | 0.0032ms | +0.00048ms | +14.91% |
| min | 0.0016ms | 0.0016ms | -0.000053ms | -3.28% |
| max | 0.05ms | 0.06ms | -0.01ms | -17.35% |
| total | 0.74ms | 0.65ms | +0.10ms | +14.91% |

### driveAtLeastOnce

# Perf Report — driveAtLeastOnce.serial

| metric | value |
|---|---|
| iterations | 200 |
| warmup | 5 |
| p10 | 0.0022ms |
| p50 | 0.0026ms |
| p95 | 0.07ms |
| p99 | 0.78ms |
| mean | 0.03ms |
| stdev | 0.14ms |
| min | 0.0022ms |
| max | 1.44ms |
| total | 6.10ms |

## Baseline diff

current は baseline を測った時の機械の速さへ換算済み (倍率 0.916)。 回帰判定が読む量と同じ。 実測値は上表。

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.0021ms | 0.0020ms | +0.000060ms | +3.01% |
| p50 | 0.0024ms | 0.0021ms | +0.00026ms | +12.21% |
| p95 | 0.06ms | 0.0055ms | +0.06ms | +1038.01% |
| p99 | 0.71ms | 0.03ms | +0.69ms | +2652.31% |
| mean | 0.03ms | 0.0031ms | +0.02ms | +797.35% |
| min | 0.0020ms | 0.0019ms | +0.000066ms | +3.46% |
| max | 1.32ms | 0.05ms | +1.27ms | +2668.29% |
| total | 5.58ms | 0.62ms | +4.96ms | +797.35% |

