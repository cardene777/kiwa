# Perf Suite — dogfood-kafka-event-pipeline

Threshold source: [docs/quality/perf-thresholds.md](../../quality/perf-thresholds)

測定系の分解能 = 0.00042ms (何もしない関数を同じ経路で呼んだ時の p10)。 回帰判定の絶対下限は既定でこの 2 倍 = 0.00083ms、 op ごとの実効値は下表の「下限」 列。

## Serial (concurrency = 1)

| op | p10 (実測) | p95 (上限判定) | cap | 下限 | gate | regression |
|---|---|---|---|---|---|---|
| driveProducer | 0.0069ms | 0.05ms | 80ms | 0.00076ms | PASS | stable (換算後 p10 +1% (閾値未満)、 p95 +89% (裾は実行間の振れ幅と区別できないため判定には使わない)) — gate 無効 (regressionGate=false) |
| driveConsumerGroup | 0.01ms | 0.03ms | 150ms | 0.00076ms | PASS | stable — gate 無効 (regressionGate=false) |
| driveTransaction | 0.0097ms | 0.04ms | 80ms | 0.00075ms | PASS | stable (換算後 p10 +0% (閾値未満)、 p95 +41% (裾は実行間の振れ幅と区別できないため判定には使わない)) — gate 無効 (regressionGate=false) |
| driveDlq | 0.02ms | 0.06ms | 80ms | 0.00076ms | PASS | stable (換算後 p10 -1% (閾値未満)、 p95 +87% (裾は実行間の振れ幅と区別できないため判定には使わない)) — gate 無効 (regressionGate=false) |

## 実行内正規化 (回帰判定はこの比で行う)

回帰判定は実測値そのものではなく、 同じ実行の中で 1 呼出ずつ交互に測った基準 op との比を読む。 実行と実行の間で機械の状態が変わっても、 その差が分子と分母で相殺される。 「換算後 p10」 は今回の比を baseline を測った時の基準 p10 で ms に戻した値で、 baseline の実測 p10 と直接比べられる。

| op | 基準 op | 基準 p10 | 基準 p95 | 実測 p10 | 比 | baseline の比 | 換算後 p10 | baseline p10 |
|---|---|---|---|---|---|---|---|---|
| driveProducer | cpu | 0.09ms | 0.16ms | 0.0069ms | 0.076 | 0.076 | 0.0063ms | 0.0062ms |
| driveConsumerGroup | cpu | 0.09ms | 0.10ms | 0.01ms | 0.161 | 0.173 | 0.01ms | 0.01ms |
| driveTransaction | cpu | 0.09ms | 0.09ms | 0.0097ms | 0.108 | 0.108 | 0.0088ms | 0.0088ms |
| driveDlq | cpu | 0.09ms | 0.10ms | 0.02ms | 0.181 | 0.184 | 0.01ms | 0.01ms |

## Concurrent p95 (concurrency = 10, 50 iter each)

| op | p95 | cap | gate |
|---|---|---|---|
| driveProducer | 0.16ms | 160ms | PASS |
| driveConsumerGroup | 0.33ms | 300ms | PASS |
| driveTransaction | 0.17ms | 160ms | PASS |
| driveDlq | 1.11ms | 160ms | PASS |

## Memory retention (200 iter, arrayBuffers axis is the gate; heap is informational)

| op | heapUsed Δ | arrayBuffers Δ | cap | gc exposed | verdict |
|---|---|---|---|---|---|
| driveProducer | 1736 B | 0 B | 102400 B | yes | PASS |
| driveConsumerGroup | -5768 B | 0 B | 102400 B | yes | PASS |
| driveTransaction | 984 B | 0 B | 102400 B | yes | PASS |
| driveDlq | -6696 B | 0 B | 102400 B | yes | PASS |

## Detailed serial reports

### driveProducer

# Perf Report — driveProducer.serial

| metric | value |
|---|---|
| iterations | 200 |
| warmup | 5 |
| p10 | 0.0069ms |
| p50 | 0.0079ms |
| p95 | 0.05ms |
| p99 | 0.10ms |
| mean | 0.02ms |
| stdev | 0.02ms |
| min | 0.0057ms |
| max | 0.19ms |
| total | 3.37ms |

## Baseline diff

current は baseline を測った時の機械の速さへ換算済み (倍率 0.913)。 回帰判定が読む量と同じ。 実測値は上表。

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.0063ms | 0.0062ms | +0.000069ms | +1.11% |
| p50 | 0.0072ms | 0.0068ms | +0.00040ms | +5.91% |
| p95 | 0.05ms | 0.02ms | +0.02ms | +89.17% |
| p99 | 0.10ms | 0.05ms | +0.05ms | +98.87% |
| mean | 0.02ms | 0.0095ms | +0.0059ms | +61.73% |
| min | 0.0052ms | 0.0053ms | -0.00012ms | -2.28% |
| max | 0.18ms | 0.08ms | +0.09ms | +109.10% |
| total | 3.07ms | 1.90ms | +1.17ms | +61.73% |

### driveConsumerGroup

# Perf Report — driveConsumerGroup.serial

| metric | value |
|---|---|
| iterations | 200 |
| warmup | 5 |
| p10 | 0.01ms |
| p50 | 0.02ms |
| p95 | 0.03ms |
| p99 | 0.05ms |
| mean | 0.02ms |
| stdev | 0.01ms |
| min | 0.01ms |
| max | 0.17ms |
| total | 3.76ms |

## Baseline diff

current は baseline を測った時の機械の速さへ換算済み (倍率 0.914)。 回帰判定が読む量と同じ。 実測値は上表。

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.01ms | 0.01ms | -0.00096ms | -6.73% |
| p50 | 0.02ms | 0.02ms | -0.00073ms | -4.56% |
| p95 | 0.02ms | 0.04ms | -0.01ms | -33.77% |
| p99 | 0.05ms | 0.09ms | -0.04ms | -46.13% |
| mean | 0.02ms | 0.02ms | -0.0030ms | -14.81% |
| min | 0.01ms | 0.01ms | -0.00056ms | -4.24% |
| max | 0.15ms | 0.22ms | -0.07ms | -31.76% |
| total | 3.44ms | 4.04ms | -0.60ms | -14.81% |

### driveTransaction

# Perf Report — driveTransaction.serial

| metric | value |
|---|---|
| iterations | 200 |
| warmup | 5 |
| p10 | 0.0097ms |
| p50 | 0.01ms |
| p95 | 0.04ms |
| p99 | 0.19ms |
| mean | 0.02ms |
| stdev | 0.04ms |
| min | 0.0095ms |
| max | 0.43ms |
| total | 3.69ms |

## Baseline diff

current は baseline を測った時の機械の速さへ換算済み (倍率 0.902)。 回帰判定が読む量と同じ。 実測値は上表。

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.0088ms | 0.0088ms | +0.000043ms | +0.49% |
| p50 | 0.0093ms | 0.0091ms | +0.00020ms | +2.17% |
| p95 | 0.03ms | 0.02ms | +0.01ms | +41.14% |
| p99 | 0.17ms | 0.06ms | +0.11ms | +202.40% |
| mean | 0.02ms | 0.01ms | +0.0050ms | +43.30% |
| min | 0.0085ms | 0.0085ms | +0.000033ms | +0.39% |
| max | 0.38ms | 0.08ms | +0.31ms | +400.04% |
| total | 3.33ms | 2.32ms | +1.01ms | +43.30% |

### driveDlq

# Perf Report — driveDlq.serial

| metric | value |
|---|---|
| iterations | 200 |
| warmup | 5 |
| p10 | 0.02ms |
| p50 | 0.02ms |
| p95 | 0.06ms |
| p99 | 0.18ms |
| mean | 0.03ms |
| stdev | 0.05ms |
| min | 0.02ms |
| max | 0.63ms |
| total | 5.53ms |

## Baseline diff

current は baseline を測った時の機械の速さへ換算済み (倍率 0.907)。 回帰判定が読む量と同じ。 実測値は上表。

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.01ms | 0.01ms | -0.00022ms | -1.47% |
| p50 | 0.02ms | 0.02ms | -0.000026ms | -0.17% |
| p95 | 0.05ms | 0.03ms | +0.02ms | +86.73% |
| p99 | 0.17ms | 0.05ms | +0.12ms | +251.81% |
| mean | 0.03ms | 0.02ms | +0.0074ms | +42.06% |
| min | 0.01ms | 0.01ms | -0.000017ms | -0.12% |
| max | 0.57ms | 0.11ms | +0.46ms | +403.32% |
| total | 5.02ms | 3.53ms | +1.49ms | +42.06% |

