# Perf Suite — dogfood-nats-jetstream

Threshold source: [docs/quality/perf-thresholds.md](../../quality/perf-thresholds)

測定系の分解能 = 0.00017ms (何もしない関数を同じ経路で呼んだ時の p10)。 回帰判定の絶対下限は既定でこの 2 倍 = 0.00033ms、 op ごとの実効値は下表の「下限」 列。

## Serial (concurrency = 1)

| op | p10 (実測) | p95 (上限判定) | cap | 下限 | gate | regression |
|---|---|---|---|---|---|---|
| driveJetStream | 0.0073ms | 0.03ms | 80ms | 0.00031ms | PASS | stable — gate 無効 (regressionGate=false) |
| driveKV | 0.0040ms | 0.0085ms | 80ms | 0.00031ms | PASS | stable — gate 無効 (regressionGate=false) |
| driveObject | 0.01ms | 0.05ms | 80ms | 0.00031ms | PASS | stable (換算後 p10 +2% (閾値未満)、 p95 +36% (裾は実行間の振れ幅と区別できないため判定には使わない)) — gate 無効 (regressionGate=false) |
| driveRouting | 0.01ms | 0.03ms | 80ms | 0.00031ms | PASS | stable — gate 無効 (regressionGate=false) |

## 実行内正規化 (回帰判定はこの比で行う)

回帰判定は実測値そのものではなく、 同じ実行の中で 1 呼出ずつ交互に測った基準 op との比を読む。 実行と実行の間で機械の状態が変わっても、 その差が分子と分母で相殺される。 「換算後 p10」 は今回の比を baseline を測った時の基準 p10 で ms に戻した値で、 baseline の実測 p10 と直接比べられる。

| op | 基準 op | 基準 p10 | 基準 p95 | 実測 p10 | 比 | baseline の比 | 換算後 p10 | baseline p10 |
|---|---|---|---|---|---|---|---|---|
| driveJetStream | cpu | 0.09ms | 0.10ms | 0.0073ms | 0.082 | 0.080 | 0.0068ms | 0.0066ms |
| driveKV | cpu | 0.09ms | 0.09ms | 0.0040ms | 0.045 | 0.044 | 0.0037ms | 0.0036ms |
| driveObject | cpu | 0.09ms | 0.12ms | 0.01ms | 0.126 | 0.124 | 0.01ms | 0.01ms |
| driveRouting | cpu | 0.09ms | 0.09ms | 0.01ms | 0.140 | 0.139 | 0.01ms | 0.01ms |

## Concurrent p95 (concurrency = 10, 50 iter each)

| op | p95 | cap | gate |
|---|---|---|---|
| driveJetStream | 0.12ms | 160ms | PASS |
| driveKV | 0.06ms | 160ms | PASS |
| driveObject | 0.39ms | 160ms | PASS |
| driveRouting | 0.27ms | 160ms | PASS |

## Memory retention (200 iter, arrayBuffers axis is the gate; heap is informational)

| op | heapUsed Δ | arrayBuffers Δ | cap | gc exposed | verdict |
|---|---|---|---|---|---|
| driveJetStream | -6040 B | 0 B | 102400 B | yes | PASS |
| driveKV | -3792 B | 0 B | 102400 B | yes | PASS |
| driveObject | -13056 B | -194220 B | 102400 B | yes | PASS |
| driveRouting | 4504 B | 0 B | 102400 B | yes | PASS |

## Detailed serial reports

### driveJetStream

# Perf Report — driveJetStream.serial

| metric | value |
|---|---|
| iterations | 200 |
| warmup | 5 |
| p10 | 0.0073ms |
| p50 | 0.0083ms |
| p95 | 0.03ms |
| p99 | 0.06ms |
| mean | 0.01ms |
| stdev | 0.02ms |
| min | 0.0069ms |
| max | 0.19ms |
| total | 2.42ms |

## Baseline diff

current は baseline を測った時の機械の速さへ換算済み (倍率 0.922)。 回帰判定が読む量と同じ。 実測値は上表。

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.0068ms | 0.0066ms | +0.00014ms | +2.15% |
| p50 | 0.0076ms | 0.0080ms | -0.00039ms | -4.89% |
| p95 | 0.03ms | 0.04ms | -0.01ms | -35.19% |
| p99 | 0.05ms | 0.09ms | -0.04ms | -39.67% |
| mean | 0.01ms | 0.01ms | -0.0018ms | -13.98% |
| min | 0.0063ms | 0.0054ms | +0.00092ms | +17.05% |
| max | 0.18ms | 0.11ms | +0.07ms | +59.68% |
| total | 2.24ms | 2.60ms | -0.36ms | -13.98% |

### driveKV

# Perf Report — driveKV.serial

| metric | value |
|---|---|
| iterations | 200 |
| warmup | 5 |
| p10 | 0.0040ms |
| p50 | 0.0042ms |
| p95 | 0.0085ms |
| p99 | 0.03ms |
| mean | 0.0055ms |
| stdev | 0.0066ms |
| min | 0.0038ms |
| max | 0.08ms |
| total | 1.10ms |

## Baseline diff

current は baseline を測った時の機械の速さへ換算済み (倍率 0.935)。 回帰判定が読む量と同じ。 実測値は上表。

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.0037ms | 0.0036ms | +0.00011ms | +3.16% |
| p50 | 0.0039ms | 0.0040ms | -0.000063ms | -1.60% |
| p95 | 0.0079ms | 0.0073ms | +0.00069ms | +9.50% |
| p99 | 0.03ms | 0.02ms | +0.0039ms | +17.75% |
| mean | 0.0051ms | 0.0048ms | +0.00037ms | +7.73% |
| min | 0.0036ms | 0.0035ms | +0.000084ms | +2.39% |
| max | 0.07ms | 0.03ms | +0.04ms | +123.47% |
| total | 1.02ms | 0.95ms | +0.07ms | +7.73% |

### driveObject

# Perf Report — driveObject.serial

| metric | value |
|---|---|
| iterations | 200 |
| warmup | 5 |
| p10 | 0.01ms |
| p50 | 0.01ms |
| p95 | 0.05ms |
| p99 | 0.08ms |
| mean | 0.02ms |
| stdev | 0.02ms |
| min | 0.01ms |
| max | 0.23ms |
| total | 3.77ms |

## Baseline diff

current は baseline を測った時の機械の速さへ換算済み (倍率 0.941)。 回帰判定が読む量と同じ。 実測値は上表。

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.01ms | 0.01ms | +0.00017ms | +1.68% |
| p50 | 0.01ms | 0.01ms | +0.00013ms | +1.16% |
| p95 | 0.05ms | 0.03ms | +0.01ms | +36.38% |
| p99 | 0.07ms | 0.05ms | +0.03ms | +56.56% |
| mean | 0.02ms | 0.01ms | +0.0034ms | +23.68% |
| min | 0.01ms | 0.0096ms | +0.00057ms | +5.94% |
| max | 0.22ms | 0.08ms | +0.14ms | +174.97% |
| total | 3.55ms | 2.87ms | +0.68ms | +23.68% |

### driveRouting

# Perf Report — driveRouting.serial

| metric | value |
|---|---|
| iterations | 200 |
| warmup | 5 |
| p10 | 0.01ms |
| p50 | 0.01ms |
| p95 | 0.03ms |
| p99 | 0.13ms |
| mean | 0.02ms |
| stdev | 0.03ms |
| min | 0.01ms |
| max | 0.34ms |
| total | 3.70ms |

## Baseline diff

current は baseline を測った時の機械の速さへ換算済み (倍率 0.916)。 回帰判定が読む量と同じ。 実測値は上表。

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.01ms | 0.01ms | +0.000029ms | +0.26% |
| p50 | 0.01ms | 0.01ms | -0.00018ms | -1.40% |
| p95 | 0.03ms | 0.03ms | -0.0026ms | -9.29% |
| p99 | 0.12ms | 0.05ms | +0.07ms | +151.24% |
| mean | 0.02ms | 0.02ms | +0.0012ms | +7.62% |
| min | 0.01ms | 0.01ms | +0.00023ms | +2.07% |
| max | 0.31ms | 0.19ms | +0.12ms | +61.81% |
| total | 3.39ms | 3.15ms | +0.24ms | +7.62% |

