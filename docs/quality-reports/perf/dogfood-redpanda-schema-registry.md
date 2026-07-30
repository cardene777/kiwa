# Perf Suite — dogfood-redpanda-schema-registry

Threshold source: [docs/quality/perf-thresholds.md](../../quality/perf-thresholds)

測定系の分解能 = 0.00017ms (何もしない関数を同じ経路で呼んだ時の p10)。 回帰判定の絶対下限は既定でこの 2 倍 = 0.00033ms、 op ごとの実効値は下表の「下限」 列。

## Serial (concurrency = 1)

| op | p10 (実測) | p95 (上限判定) | cap | 下限 | gate | regression |
|---|---|---|---|---|---|---|
| driveRegister | 0.0078ms | 0.04ms | 80ms | 0.00031ms | PASS | stable (換算後 p10 +7% (閾値未満)、 p95 +73% (裾は実行間の振れ幅と区別できないため判定には使わない)) — gate 無効 (regressionGate=false) |
| driveEvolution | 0.01ms | 0.08ms | 80ms | 0.00030ms | PASS | stable (換算後 p10 +2% (閾値未満)、 p95 +331% (裾は実行間の振れ幅と区別できないため判定には使わない)) — gate 無効 (regressionGate=false) |
| driveCompatibilityModes | 0.0094ms | 0.07ms | 80ms | 0.00030ms | PASS | stable (換算後 p10 +1% (閾値未満)、 p95 +363% (裾は実行間の振れ幅と区別できないため判定には使わない)) — gate 無効 (regressionGate=false) |
| drivePublish | 0.01ms | 0.02ms | 80ms | 0.00031ms | PASS | stable — gate 無効 (regressionGate=false) |

## 実行内正規化 (回帰判定はこの比で行う)

回帰判定は実測値そのものではなく、 同じ実行の中で 1 呼出ずつ交互に測った基準 op との比を読む。 実行と実行の間で機械の状態が変わっても、 その差が分子と分母で相殺される。 「換算後 p10」 は今回の比を baseline を測った時の基準 p10 で ms に戻した値で、 baseline の実測 p10 と直接比べられる。

| op | 基準 op | 基準 p10 | 基準 p95 | 実測 p10 | 比 | baseline の比 | 換算後 p10 | baseline p10 |
|---|---|---|---|---|---|---|---|---|
| driveRegister | cpu | 0.09ms | 0.10ms | 0.0078ms | 0.091 | 0.085 | 0.0073ms | 0.0068ms |
| driveEvolution | cpu | 0.09ms | 0.13ms | 0.01ms | 0.128 | 0.126 | 0.01ms | 0.01ms |
| driveCompatibilityModes | cpu | 0.09ms | 0.35ms | 0.0094ms | 0.105 | 0.105 | 0.0086ms | 0.0085ms |
| drivePublish | cpu | 0.09ms | 0.09ms | 0.01ms | 0.155 | 0.159 | 0.01ms | 0.01ms |

## Concurrent p95 (concurrency = 10, 50 iter each)

| op | p95 | cap | gate |
|---|---|---|---|
| driveRegister | 0.52ms | 160ms | PASS |
| driveEvolution | 0.82ms | 160ms | PASS |
| driveCompatibilityModes | 0.10ms | 160ms | PASS |
| drivePublish | 0.15ms | 160ms | PASS |

## Memory retention (200 iter, arrayBuffers axis is the gate; heap is informational)

| op | heapUsed Δ | arrayBuffers Δ | cap | gc exposed | verdict |
|---|---|---|---|---|---|
| driveRegister | 4456 B | 0 B | 102400 B | yes | PASS |
| driveEvolution | -10512 B | 0 B | 102400 B | yes | PASS |
| driveCompatibilityModes | 3288 B | 0 B | 102400 B | yes | PASS |
| drivePublish | 520 B | 0 B | 102400 B | yes | PASS |

## Detailed serial reports

### driveRegister

# Perf Report — driveRegister.serial

| metric | value |
|---|---|
| iterations | 200 |
| warmup | 5 |
| p10 | 0.0078ms |
| p50 | 0.0083ms |
| p95 | 0.04ms |
| p99 | 1.42ms |
| mean | 0.05ms |
| stdev | 0.35ms |
| min | 0.0075ms |
| max | 4.43ms |
| total | 10.66ms |

## Baseline diff

current は baseline を測った時の機械の速さへ換算済み (倍率 0.926)。 回帰判定が読む量と同じ。 実測値は上表。

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.0073ms | 0.0068ms | +0.00047ms | +6.86% |
| p50 | 0.0077ms | 0.0075ms | +0.00026ms | +3.50% |
| p95 | 0.04ms | 0.02ms | +0.02ms | +73.41% |
| p99 | 1.31ms | 0.04ms | +1.27ms | +2977.54% |
| mean | 0.05ms | 0.0098ms | +0.04ms | +404.46% |
| min | 0.0069ms | 0.0064ms | +0.00057ms | +8.98% |
| max | 4.10ms | 0.05ms | +4.04ms | +7365.66% |
| total | 9.87ms | 1.96ms | +7.92ms | +404.46% |

### driveEvolution

# Perf Report — driveEvolution.serial

| metric | value |
|---|---|
| iterations | 200 |
| warmup | 5 |
| p10 | 0.01ms |
| p50 | 0.01ms |
| p95 | 0.08ms |
| p99 | 0.15ms |
| mean | 0.02ms |
| stdev | 0.04ms |
| min | 0.01ms |
| max | 0.46ms |
| total | 4.34ms |

## Baseline diff

current は baseline を測った時の機械の速さへ換算済み (倍率 0.911)。 回帰判定が読む量と同じ。 実測値は上表。

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.01ms | 0.01ms | +0.00019ms | +1.88% |
| p50 | 0.01ms | 0.01ms | +0.00014ms | +1.34% |
| p95 | 0.07ms | 0.02ms | +0.05ms | +330.89% |
| p99 | 0.14ms | 0.03ms | +0.11ms | +401.57% |
| mean | 0.02ms | 0.01ms | +0.0079ms | +66.00% |
| min | 0.010ms | 0.0098ms | +0.00015ms | +1.53% |
| max | 0.42ms | 0.08ms | +0.34ms | +401.66% |
| total | 3.95ms | 2.38ms | +1.57ms | +66.00% |

### driveCompatibilityModes

# Perf Report — driveCompatibilityModes.serial

| metric | value |
|---|---|
| iterations | 200 |
| warmup | 5 |
| p10 | 0.0094ms |
| p50 | 0.0098ms |
| p95 | 0.07ms |
| p99 | 0.32ms |
| mean | 0.04ms |
| stdev | 0.37ms |
| min | 0.0092ms |
| max | 5.24ms |
| total | 9.00ms |

## Baseline diff

current は baseline を測った時の機械の速さへ換算済み (倍率 0.914)。 回帰判定が読む量と同じ。 実測値は上表。

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.0086ms | 0.0085ms | +0.000062ms | +0.73% |
| p50 | 0.0090ms | 0.0089ms | +0.000068ms | +0.76% |
| p95 | 0.06ms | 0.01ms | +0.05ms | +363.47% |
| p99 | 0.29ms | 0.04ms | +0.25ms | +634.04% |
| mean | 0.04ms | 0.01ms | +0.03ms | +307.92% |
| min | 0.0085ms | 0.0083ms | +0.00020ms | +2.45% |
| max | 4.78ms | 0.06ms | +4.73ms | +8079.37% |
| total | 8.22ms | 2.02ms | +6.21ms | +307.92% |

### drivePublish

# Perf Report — drivePublish.serial

| metric | value |
|---|---|
| iterations | 200 |
| warmup | 5 |
| p10 | 0.01ms |
| p50 | 0.01ms |
| p95 | 0.02ms |
| p99 | 0.05ms |
| mean | 0.02ms |
| stdev | 0.01ms |
| min | 0.01ms |
| max | 0.15ms |
| total | 3.28ms |

## Baseline diff

current は baseline を測った時の機械の速さへ換算済み (倍率 0.924)。 回帰判定が読む量と同じ。 実測値は上表。

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.01ms | 0.01ms | -0.00034ms | -2.64% |
| p50 | 0.01ms | 0.01ms | -0.00066ms | -4.83% |
| p95 | 0.02ms | 0.03ms | -0.01ms | -37.10% |
| p99 | 0.05ms | 0.06ms | -0.0073ms | -12.85% |
| mean | 0.02ms | 0.02ms | -0.00072ms | -4.52% |
| min | 0.01ms | 0.01ms | -0.0015ms | -11.54% |
| max | 0.14ms | 0.09ms | +0.05ms | +52.17% |
| total | 3.03ms | 3.17ms | -0.14ms | -4.52% |

