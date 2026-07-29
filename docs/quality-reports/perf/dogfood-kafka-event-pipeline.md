# Perf Suite — dogfood-kafka-event-pipeline

Threshold source: [docs/quality/perf-thresholds.md](../../quality/perf-thresholds)

測定系の分解能 = 0.00017ms (何もしない関数を同じ経路で呼んだ時の p10)。 回帰判定の絶対下限は既定でこの 2 倍 = 0.00033ms、 op ごとの実効値は下表の「下限」 列。

## Serial (concurrency = 1)

| op | p10 (実測) | p95 (上限判定) | cap | 下限 | gate | regression |
|---|---|---|---|---|---|---|
| driveProducer | 0.0061ms | 0.03ms | 80ms | 0.00034ms | PASS | stable (p10 +5% (閾値未満)、 p95 +65% (裾は実行間の振れ幅と区別できないため判定には使わない)) — gate 無効 (regressionGate=false) |
| driveConsumerGroup | 0.01ms | 0.06ms | 150ms | 0.00033ms | PASS | stable (p10 +1% (閾値未満)、 p95 +55% (裾は実行間の振れ幅と区別できないため判定には使わない)) — gate 無効 (regressionGate=false) |
| driveTransaction | 0.0089ms | 0.07ms | 80ms | 0.00034ms | PASS | stable (p10 +1% (閾値未満)、 p95 +124% (裾は実行間の振れ幅と区別できないため判定には使わない)) — gate 無効 (regressionGate=false) |
| driveDlq | 0.01ms | 0.04ms | 80ms | 0.00034ms | PASS | stable (p10 -0% (閾値未満)、 p95 +30% (裾は実行間の振れ幅と区別できないため判定には使わない)) — gate 無効 (regressionGate=false) |

## 実行内正規化 (回帰判定はこの比で行う)

回帰判定は実測値そのものではなく、 同じ実行の中で 1 呼出ずつ交互に測った基準 op との比を読む。 実行と実行の間で機械の状態が変わっても、 その差が分子と分母で相殺される。 「換算後 p10」 は今回の比を baseline を測った時の基準 p10 で ms に戻した値で、 baseline の実測 p10 と直接比べられる。

| op | 基準 op | 基準 p10 | 実測 p10 | 比 | baseline の比 | 換算後 p10 | baseline p10 |
|---|---|---|---|---|---|---|---|
| driveProducer | cpu | 0.08ms | 0.0061ms | 0.075 | 0.072 | 0.0062ms | 0.0060ms |
| driveConsumerGroup | cpu | 0.08ms | 0.01ms | 0.168 | 0.166 | 0.01ms | 0.01ms |
| driveTransaction | cpu | 0.08ms | 0.0089ms | 0.110 | 0.108 | 0.0091ms | 0.0090ms |
| driveDlq | cpu | 0.08ms | 0.01ms | 0.184 | 0.185 | 0.02ms | 0.02ms |

## Concurrent p95 (concurrency = 10, 50 iter each)

| op | p95 | cap | gate |
|---|---|---|---|
| driveProducer | 0.18ms | 160ms | PASS |
| driveConsumerGroup | 0.29ms | 300ms | PASS |
| driveTransaction | 0.11ms | 160ms | PASS |
| driveDlq | 0.21ms | 160ms | PASS |

## Memory retention (200 iter, arrayBuffers axis is the gate; heap is informational)

| op | heapUsed Δ | arrayBuffers Δ | cap | gc exposed | verdict |
|---|---|---|---|---|---|
| driveProducer | 1496 B | 0 B | 102400 B | yes | PASS |
| driveConsumerGroup | -6624 B | 0 B | 102400 B | yes | PASS |
| driveTransaction | 1592 B | 0 B | 102400 B | yes | PASS |
| driveDlq | -6768 B | 0 B | 102400 B | yes | PASS |

## Detailed serial reports

### driveProducer

# Perf Report — driveProducer.serial

| metric | value |
|---|---|
| iterations | 200 |
| warmup | 5 |
| p10 | 0.0061ms |
| p50 | 0.0066ms |
| p95 | 0.03ms |
| p99 | 0.06ms |
| mean | 0.01ms |
| stdev | 0.01ms |
| min | 0.0058ms |
| max | 0.09ms |
| total | 2.02ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.0061ms | 0.0060ms | +0.00012ms | +2.08% |
| p50 | 0.0066ms | 0.0064ms | +0.00025ms | +3.92% |
| p95 | 0.03ms | 0.02ms | +0.01ms | +61.03% |
| p99 | 0.06ms | 0.03ms | +0.03ms | +93.68% |
| mean | 0.01ms | 0.0082ms | +0.0020ms | +24.14% |
| min | 0.0058ms | 0.0053ms | +0.00050ms | +9.45% |
| max | 0.09ms | 0.08ms | +0.0053ms | +6.26% |
| total | 2.02ms | 1.63ms | +0.39ms | +24.14% |

### driveConsumerGroup

# Perf Report — driveConsumerGroup.serial

| metric | value |
|---|---|
| iterations | 200 |
| warmup | 5 |
| p10 | 0.01ms |
| p50 | 0.02ms |
| p95 | 0.06ms |
| p99 | 0.16ms |
| mean | 0.03ms |
| stdev | 0.05ms |
| min | 0.01ms |
| max | 0.57ms |
| total | 5.45ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.01ms | 0.01ms | +0.000087ms | +0.63% |
| p50 | 0.02ms | 0.02ms | +0.0012ms | +7.14% |
| p95 | 0.06ms | 0.04ms | +0.02ms | +54.09% |
| p99 | 0.16ms | 0.16ms | +0.0019ms | +1.20% |
| mean | 0.03ms | 0.04ms | -0.02ms | -39.08% |
| min | 0.01ms | 0.01ms | -0.00021ms | -1.58% |
| max | 0.57ms | 4.70ms | -4.13ms | -87.96% |
| total | 5.45ms | 8.95ms | -3.50ms | -39.08% |

### driveTransaction

# Perf Report — driveTransaction.serial

| metric | value |
|---|---|
| iterations | 200 |
| warmup | 5 |
| p10 | 0.0089ms |
| p50 | 0.01ms |
| p95 | 0.07ms |
| p99 | 0.11ms |
| mean | 0.02ms |
| stdev | 0.10ms |
| min | 0.0086ms |
| max | 1.44ms |
| total | 4.84ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.0089ms | 0.0090ms | -0.000083ms | -0.92% |
| p50 | 0.01ms | 0.0095ms | +0.00079ms | +8.37% |
| p95 | 0.07ms | 0.03ms | +0.04ms | +118.59% |
| p99 | 0.11ms | 0.10ms | +0.01ms | +13.67% |
| mean | 0.02ms | 0.01ms | +0.01ms | +75.68% |
| min | 0.0086ms | 0.0088ms | -0.00017ms | -1.89% |
| max | 1.44ms | 0.15ms | +1.29ms | +855.62% |
| total | 4.84ms | 2.75ms | +2.08ms | +75.68% |

### driveDlq

# Perf Report — driveDlq.serial

| metric | value |
|---|---|
| iterations | 200 |
| warmup | 5 |
| p10 | 0.01ms |
| p50 | 0.02ms |
| p95 | 0.04ms |
| p99 | 0.17ms |
| mean | 0.03ms |
| stdev | 0.06ms |
| min | 0.01ms |
| max | 0.82ms |
| total | 5.40ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.01ms | 0.02ms | -0.00059ms | -3.83% |
| p50 | 0.02ms | 0.02ms | -0.00048ms | -2.99% |
| p95 | 0.04ms | 0.04ms | +0.0089ms | +25.20% |
| p99 | 0.17ms | 0.07ms | +0.10ms | +132.53% |
| mean | 0.03ms | 0.02ms | +0.0078ms | +40.53% |
| min | 0.01ms | 0.01ms | -0.00050ms | -3.36% |
| max | 0.82ms | 0.09ms | +0.73ms | +808.98% |
| total | 5.40ms | 3.84ms | +1.56ms | +40.53% |

