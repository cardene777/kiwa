# Perf Suite — dogfood-kafka-event-pipeline

Threshold source: [docs/quality/perf-thresholds.md](../../quality/perf-thresholds)

測定系の分解能 = 0.00017ms (何もしない関数を同じ経路で呼んだ時の p10)。 回帰判定の絶対下限は既定でこの 2 倍 = 0.00033ms、 op ごとの実効値は下表の「下限」 列。

## Serial (concurrency = 1)

| op | p10 (回帰判定) | p95 (上限判定) | cap | 下限 | gate | regression |
|---|---|---|---|---|---|---|
| driveProducer | 0.0052ms | 0.01ms | 80ms | 0.00033ms | PASS | stable — gate 無効 (regressionGate=false) |
| driveConsumerGroup | 0.01ms | 0.02ms | 150ms | 0.00033ms | PASS | stable — gate 無効 (regressionGate=false) |
| driveTransaction | 0.0086ms | 0.02ms | 80ms | 0.00033ms | PASS | stable (p10 -10% (閾値未満)、 p95 +25% (裾は実行間の振れ幅と区別できないため判定には使わない)) — gate 無効 (regressionGate=false) |
| driveDlq | 0.01ms | 0.03ms | 80ms | 0.00033ms | PASS | stable — gate 無効 (regressionGate=false) |

## Concurrent p95 (concurrency = 10, 50 iter each)

| op | p95 | cap | gate |
|---|---|---|---|
| driveProducer | 0.10ms | 160ms | PASS |
| driveConsumerGroup | 0.25ms | 300ms | PASS |
| driveTransaction | 0.11ms | 160ms | PASS |
| driveDlq | 0.17ms | 160ms | PASS |

## Memory retention (200 iter, arrayBuffers axis is the gate; heap is informational)

| op | heapUsed Δ | arrayBuffers Δ | cap | gc exposed | verdict |
|---|---|---|---|---|---|
| driveProducer | 1744 B | 0 B | 102400 B | yes | PASS |
| driveConsumerGroup | -6280 B | 0 B | 102400 B | yes | PASS |
| driveTransaction | 8 B | 0 B | 102400 B | yes | PASS |
| driveDlq | -6752 B | 0 B | 102400 B | yes | PASS |

## Detailed serial reports

### driveProducer

# Perf Report — driveProducer.serial

| metric | value |
|---|---|
| iterations | 200 |
| warmup | 5 |
| p10 | 0.0052ms |
| p50 | 0.0060ms |
| p95 | 0.01ms |
| p99 | 0.03ms |
| mean | 0.0072ms |
| stdev | 0.0044ms |
| min | 0.0048ms |
| max | 0.04ms |
| total | 1.44ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.0052ms | 0.0057ms | -0.00046ms | -8.16% |
| p50 | 0.0060ms | 0.0063ms | -0.00025ms | -4.00% |
| p95 | 0.01ms | 0.02ms | -0.0052ms | -25.88% |
| p99 | 0.03ms | 0.06ms | -0.03ms | -52.10% |
| mean | 0.0072ms | 0.0090ms | -0.0018ms | -20.31% |
| min | 0.0048ms | 0.0049ms | -0.000083ms | -1.70% |
| max | 0.04ms | 0.12ms | -0.08ms | -66.56% |
| total | 1.44ms | 1.80ms | -0.37ms | -20.31% |

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
| max | 0.12ms |
| total | 3.37ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.01ms | 0.01ms | -0.0013ms | -8.70% |
| p50 | 0.02ms | 0.02ms | -0.00058ms | -3.68% |
| p95 | 0.02ms | 0.03ms | -0.0036ms | -13.26% |
| p99 | 0.04ms | 0.05ms | -0.0017ms | -3.70% |
| mean | 0.02ms | 0.02ms | -0.0015ms | -8.29% |
| min | 0.01ms | 0.01ms | -0.0010ms | -7.66% |
| max | 0.12ms | 0.13ms | -0.01ms | -9.93% |
| total | 3.37ms | 3.68ms | -0.30ms | -8.29% |

### driveTransaction

# Perf Report — driveTransaction.serial

| metric | value |
|---|---|
| iterations | 200 |
| warmup | 5 |
| p10 | 0.0086ms |
| p50 | 0.0089ms |
| p95 | 0.02ms |
| p99 | 0.03ms |
| mean | 0.01ms |
| stdev | 0.0082ms |
| min | 0.0085ms |
| max | 0.11ms |
| total | 2.10ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.0086ms | 0.0096ms | -0.0010ms | -10.39% |
| p50 | 0.0089ms | 0.0099ms | -0.00096ms | -9.71% |
| p95 | 0.02ms | 0.01ms | +0.0036ms | +25.27% |
| p99 | 0.03ms | 0.03ms | +0.0067ms | +25.22% |
| mean | 0.01ms | 0.01ms | -0.00018ms | -1.66% |
| min | 0.0085ms | 0.0095ms | -0.0010ms | -10.91% |
| max | 0.11ms | 0.04ms | +0.08ms | +212.32% |
| total | 2.10ms | 2.14ms | -0.04ms | -1.66% |

### driveDlq

# Perf Report — driveDlq.serial

| metric | value |
|---|---|
| iterations | 200 |
| warmup | 5 |
| p10 | 0.01ms |
| p50 | 0.01ms |
| p95 | 0.03ms |
| p99 | 0.04ms |
| mean | 0.02ms |
| stdev | 0.0082ms |
| min | 0.01ms |
| max | 0.09ms |
| total | 3.40ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.01ms | 0.02ms | -0.0026ms | -15.31% |
| p50 | 0.01ms | 0.02ms | -0.0030ms | -16.72% |
| p95 | 0.03ms | 0.03ms | +0.0000030ms | +0.01% |
| p99 | 0.04ms | 0.04ms | +0.0048ms | +12.73% |
| mean | 0.02ms | 0.02ms | -0.0024ms | -12.40% |
| min | 0.01ms | 0.02ms | -0.0025ms | -15.41% |
| max | 0.09ms | 0.05ms | +0.04ms | +81.27% |
| total | 3.40ms | 3.88ms | -0.48ms | -12.40% |

