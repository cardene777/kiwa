# Perf Suite — dogfood-kafka-event-pipeline

Threshold source: [docs/quality/perf-thresholds.md](../../quality/perf-thresholds)

測定系の分解能 = 0.00017ms (何もしない関数を同じ経路で呼んだ時の p10)。 回帰判定の絶対下限は既定でこの 2 倍 = 0.00033ms、 op ごとの実効値は下表の「下限」 列。

## Serial (concurrency = 1)

| op | p10 (回帰判定) | p95 (上限判定) | cap | 下限 | gate | regression |
|---|---|---|---|---|---|---|
| driveProducer | 0.0055ms | 0.01ms | 80ms | 0.00033ms | PASS | stable — gate 無効 (regressionGate=false) |
| driveConsumerGroup | 0.01ms | 0.02ms | 150ms | 0.00033ms | PASS | stable — gate 無効 (regressionGate=false) |
| driveTransaction | 0.01ms | 0.04ms | 80ms | 0.00033ms | PASS | stable (p10 +4% (閾値未満)、 p95 +173% (裾は実行間の振れ幅と区別できないため判定には使わない)) — gate 無効 (regressionGate=false) |
| driveDlq | 0.02ms | 0.03ms | 80ms | 0.00033ms | PASS | stable — gate 無効 (regressionGate=false) |

## Concurrent p95 (concurrency = 10, 50 iter each)

| op | p95 | cap | gate |
|---|---|---|---|
| driveProducer | 0.10ms | 160ms | PASS |
| driveConsumerGroup | 0.43ms | 300ms | PASS |
| driveTransaction | 22.74ms | 160ms | PASS |
| driveDlq | 0.50ms | 160ms | PASS |

## Memory retention (200 iter, arrayBuffers axis is the gate; heap is informational)

| op | heapUsed Δ | arrayBuffers Δ | cap | gc exposed | verdict |
|---|---|---|---|---|---|
| driveProducer | 2176 B | 0 B | 102400 B | yes | PASS |
| driveConsumerGroup | -6992 B | 0 B | 102400 B | yes | PASS |
| driveTransaction | 2536 B | 0 B | 102400 B | yes | PASS |
| driveDlq | -7752 B | 0 B | 102400 B | yes | PASS |

## Detailed serial reports

### driveProducer

# Perf Report — driveProducer.serial

| metric | value |
|---|---|
| iterations | 200 |
| warmup | 5 |
| p10 | 0.0055ms |
| p50 | 0.0061ms |
| p95 | 0.01ms |
| p99 | 0.03ms |
| mean | 0.0071ms |
| stdev | 0.0044ms |
| min | 0.0048ms |
| max | 0.04ms |
| total | 1.42ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.0055ms | 0.0057ms | -0.00013ms | -2.26% |
| p50 | 0.0061ms | 0.0063ms | -0.00019ms | -3.00% |
| p95 | 0.01ms | 0.02ms | -0.0076ms | -38.18% |
| p99 | 0.03ms | 0.06ms | -0.03ms | -46.66% |
| mean | 0.0071ms | 0.0090ms | -0.0019ms | -21.40% |
| min | 0.0048ms | 0.0049ms | -0.000084ms | -1.72% |
| max | 0.04ms | 0.12ms | -0.08ms | -65.27% |
| total | 1.42ms | 1.80ms | -0.39ms | -21.40% |

### driveConsumerGroup

# Perf Report — driveConsumerGroup.serial

| metric | value |
|---|---|
| iterations | 200 |
| warmup | 5 |
| p10 | 0.01ms |
| p50 | 0.02ms |
| p95 | 0.02ms |
| p99 | 0.04ms |
| mean | 0.02ms |
| stdev | 0.01ms |
| min | 0.01ms |
| max | 0.17ms |
| total | 3.56ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.01ms | 0.01ms | +0.00017ms | +1.15% |
| p50 | 0.02ms | 0.02ms | -0.00025ms | -1.58% |
| p95 | 0.02ms | 0.03ms | -0.0043ms | -16.03% |
| p99 | 0.04ms | 0.05ms | -0.0033ms | -7.17% |
| mean | 0.02ms | 0.02ms | -0.00059ms | -3.19% |
| min | 0.01ms | 0.01ms | +0.00029ms | +2.15% |
| max | 0.17ms | 0.13ms | +0.03ms | +24.61% |
| total | 3.56ms | 3.68ms | -0.12ms | -3.19% |

### driveTransaction

# Perf Report — driveTransaction.serial

| metric | value |
|---|---|
| iterations | 200 |
| warmup | 5 |
| p10 | 0.01ms |
| p50 | 0.01ms |
| p95 | 0.04ms |
| p99 | 5.97ms |
| mean | 0.15ms |
| stdev | 1.01ms |
| min | 0.0098ms |
| max | 11.14ms |
| total | 29.31ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.01ms | 0.0096ms | +0.00042ms | +4.33% |
| p50 | 0.01ms | 0.0099ms | +0.00063ms | +6.33% |
| p95 | 0.04ms | 0.01ms | +0.02ms | +173.25% |
| p99 | 5.97ms | 0.03ms | +5.95ms | +22289.83% |
| mean | 0.15ms | 0.01ms | +0.14ms | +1271.81% |
| min | 0.0098ms | 0.0095ms | +0.00025ms | +2.62% |
| max | 11.14ms | 0.04ms | +11.10ms | +30984.07% |
| total | 29.31ms | 2.14ms | +27.17ms | +1271.81% |

### driveDlq

# Perf Report — driveDlq.serial

| metric | value |
|---|---|
| iterations | 200 |
| warmup | 5 |
| p10 | 0.02ms |
| p50 | 0.02ms |
| p95 | 0.03ms |
| p99 | 0.04ms |
| mean | 0.02ms |
| stdev | 0.0088ms |
| min | 0.02ms |
| max | 0.13ms |
| total | 3.78ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.02ms | 0.02ms | -0.00038ms | -2.22% |
| p50 | 0.02ms | 0.02ms | -0.00087ms | -4.91% |
| p95 | 0.03ms | 0.03ms | -0.00086ms | -3.07% |
| p99 | 0.04ms | 0.04ms | +0.0040ms | +10.62% |
| mean | 0.02ms | 0.02ms | -0.00052ms | -2.70% |
| min | 0.02ms | 0.02ms | -0.00038ms | -2.27% |
| max | 0.13ms | 0.05ms | +0.08ms | +157.06% |
| total | 3.78ms | 3.88ms | -0.10ms | -2.70% |

