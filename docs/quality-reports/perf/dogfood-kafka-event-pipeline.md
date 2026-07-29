# Perf Suite — dogfood-kafka-event-pipeline

Threshold source: [docs/quality/perf-thresholds.md](../../quality/perf-thresholds)

測定系の分解能 = 0.00017ms (何もしない関数を同じ経路で呼んだ時の p10)。 回帰判定の絶対下限は既定でこの 2 倍 = 0.00033ms、 op ごとの実効値は下表の「下限」 列。

## Serial (concurrency = 1)

| op | p10 (回帰判定) | p95 (上限判定) | cap | 下限 | gate | regression |
|---|---|---|---|---|---|---|
| driveProducer | 0.0065ms | 0.02ms | 80ms | 0.00033ms | PASS | stable — gate 無効 (regressionGate=false) |
| driveConsumerGroup | 0.02ms | 0.12ms | 150ms | 0.00033ms | PASS | stable (p10 +9% (閾値未満)、 p95 +341% (裾は実行間の振れ幅と区別できないため判定には使わない)) — gate 無効 (regressionGate=false) |
| driveTransaction | 0.0092ms | 0.02ms | 80ms | 0.00033ms | PASS | stable (p10 -4% (閾値未満)、 p95 +74% (裾は実行間の振れ幅と区別できないため判定には使わない)) — gate 無効 (regressionGate=false) |
| driveDlq | 0.02ms | 0.03ms | 80ms | 0.00033ms | PASS | stable — gate 無効 (regressionGate=false) |

## Concurrent p95 (concurrency = 10, 50 iter each)

| op | p95 | cap | gate |
|---|---|---|---|
| driveProducer | 0.36ms | 160ms | PASS |
| driveConsumerGroup | 0.75ms | 300ms | PASS |
| driveTransaction | 0.26ms | 160ms | PASS |
| driveDlq | 0.41ms | 160ms | PASS |

## Memory retention (200 iter, arrayBuffers axis is the gate; heap is informational)

| op | heapUsed Δ | arrayBuffers Δ | cap | gc exposed | verdict |
|---|---|---|---|---|---|
| driveProducer | 1496 B | 0 B | 102400 B | yes | PASS |
| driveConsumerGroup | -6952 B | 0 B | 102400 B | yes | PASS |
| driveTransaction | 1784 B | 0 B | 102400 B | yes | PASS |
| driveDlq | -8208 B | 0 B | 102400 B | yes | PASS |

## Detailed serial reports

### driveProducer

# Perf Report — driveProducer.serial

| metric | value |
|---|---|
| iterations | 200 |
| warmup | 5 |
| p10 | 0.0065ms |
| p50 | 0.0069ms |
| p95 | 0.02ms |
| p99 | 0.04ms |
| mean | 0.0091ms |
| stdev | 0.0085ms |
| min | 0.0061ms |
| max | 0.09ms |
| total | 1.83ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.0065ms | 0.0057ms | +0.00083ms | +14.72% |
| p50 | 0.0069ms | 0.0063ms | +0.00067ms | +10.67% |
| p95 | 0.02ms | 0.02ms | +0.0018ms | +9.22% |
| p99 | 0.04ms | 0.06ms | -0.01ms | -21.35% |
| mean | 0.0091ms | 0.0090ms | +0.00011ms | +1.26% |
| min | 0.0061ms | 0.0049ms | +0.0013ms | +25.64% |
| max | 0.09ms | 0.12ms | -0.03ms | -22.00% |
| total | 1.83ms | 1.80ms | +0.02ms | +1.26% |

### driveConsumerGroup

# Perf Report — driveConsumerGroup.serial

| metric | value |
|---|---|
| iterations | 200 |
| warmup | 5 |
| p10 | 0.02ms |
| p50 | 0.02ms |
| p95 | 0.12ms |
| p99 | 0.25ms |
| mean | 0.04ms |
| stdev | 0.05ms |
| min | 0.01ms |
| max | 0.47ms |
| total | 7.28ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.02ms | 0.01ms | +0.0013ms | +8.92% |
| p50 | 0.02ms | 0.02ms | +0.0023ms | +14.47% |
| p95 | 0.12ms | 0.03ms | +0.09ms | +340.86% |
| p99 | 0.25ms | 0.05ms | +0.20ms | +433.65% |
| mean | 0.04ms | 0.02ms | +0.02ms | +97.90% |
| min | 0.01ms | 0.01ms | -0.00021ms | -1.53% |
| max | 0.47ms | 0.13ms | +0.34ms | +251.66% |
| total | 7.28ms | 3.68ms | +3.60ms | +97.90% |

### driveTransaction

# Perf Report — driveTransaction.serial

| metric | value |
|---|---|
| iterations | 200 |
| warmup | 5 |
| p10 | 0.0092ms |
| p50 | 0.0095ms |
| p95 | 0.02ms |
| p99 | 0.09ms |
| mean | 0.01ms |
| stdev | 0.02ms |
| min | 0.0089ms |
| max | 0.20ms |
| total | 2.54ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.0092ms | 0.0096ms | -0.00042ms | -4.33% |
| p50 | 0.0095ms | 0.0099ms | -0.00040ms | -4.01% |
| p95 | 0.02ms | 0.01ms | +0.01ms | +73.72% |
| p99 | 0.09ms | 0.03ms | +0.06ms | +238.98% |
| mean | 0.01ms | 0.01ms | +0.0020ms | +19.10% |
| min | 0.0089ms | 0.0095ms | -0.00067ms | -6.98% |
| max | 0.20ms | 0.04ms | +0.16ms | +444.64% |
| total | 2.54ms | 2.14ms | +0.41ms | +19.10% |

### driveDlq

# Perf Report — driveDlq.serial

| metric | value |
|---|---|
| iterations | 200 |
| warmup | 5 |
| p10 | 0.02ms |
| p50 | 0.02ms |
| p95 | 0.03ms |
| p99 | 0.07ms |
| mean | 0.02ms |
| stdev | 0.01ms |
| min | 0.02ms |
| max | 0.15ms |
| total | 3.91ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.02ms | 0.02ms | -0.00058ms | -3.45% |
| p50 | 0.02ms | 0.02ms | -0.00089ms | -5.02% |
| p95 | 0.03ms | 0.03ms | +0.00095ms | +3.39% |
| p99 | 0.07ms | 0.04ms | +0.03ms | +89.47% |
| mean | 0.02ms | 0.02ms | +0.00015ms | +0.76% |
| min | 0.02ms | 0.02ms | -0.0010ms | -6.06% |
| max | 0.15ms | 0.05ms | +0.10ms | +205.22% |
| total | 3.91ms | 3.88ms | +0.03ms | +0.76% |

