# Perf Suite — dogfood-kafka-event-pipeline

Threshold source: [docs/quality/perf-thresholds.md](../../quality/perf-thresholds)

測定系の分解能 = 0.00017ms (何もしない関数を同じ経路で呼んだ時の p10)。 回帰判定の絶対下限は既定でこの 2 倍 = 0.00033ms、 op ごとの実効値は下表の「下限」 列。

## Serial (concurrency = 1)

| op | p10 (回帰判定) | p95 (上限判定) | cap | 下限 | gate | regression |
|---|---|---|---|---|---|---|
| driveProducer | 0.0053ms | 0.01ms | 80ms | 0.00033ms | PASS | stable — gate 無効 (regressionGate=false) |
| driveConsumerGroup | 0.01ms | 0.02ms | 150ms | 0.00033ms | PASS | stable — gate 無効 (regressionGate=false) |
| driveTransaction | 0.0098ms | 0.02ms | 80ms | 0.00033ms | PASS | stable (p10 +2% (閾値未満)、 p95 +22% (裾は実行間の振れ幅と区別できないため判定には使わない)) — gate 無効 (regressionGate=false) |
| driveDlq | 0.02ms | 0.02ms | 80ms | 0.00033ms | PASS | stable — gate 無効 (regressionGate=false) |

## Concurrent p95 (concurrency = 10, 50 iter each)

| op | p95 | cap | gate |
|---|---|---|---|
| driveProducer | 0.14ms | 160ms | PASS |
| driveConsumerGroup | 0.24ms | 300ms | PASS |
| driveTransaction | 0.16ms | 160ms | PASS |
| driveDlq | 0.21ms | 160ms | PASS |

## Memory retention (200 iter, arrayBuffers axis is the gate; heap is informational)

| op | heapUsed Δ | arrayBuffers Δ | cap | gc exposed | verdict |
|---|---|---|---|---|---|
| driveProducer | 1576 B | 0 B | 102400 B | yes | PASS |
| driveConsumerGroup | -6152 B | 0 B | 102400 B | yes | PASS |
| driveTransaction | 2464 B | 0 B | 102400 B | yes | PASS |
| driveDlq | -6720 B | 0 B | 102400 B | yes | PASS |

## Detailed serial reports

### driveProducer

# Perf Report — driveProducer.serial

| metric | value |
|---|---|
| iterations | 200 |
| warmup | 5 |
| p10 | 0.0053ms |
| p50 | 0.0062ms |
| p95 | 0.01ms |
| p99 | 0.03ms |
| mean | 0.0074ms |
| stdev | 0.0062ms |
| min | 0.0050ms |
| max | 0.07ms |
| total | 1.49ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.0053ms | 0.0057ms | -0.00033ms | -5.88% |
| p50 | 0.0062ms | 0.0063ms | -0.000084ms | -1.34% |
| p95 | 0.01ms | 0.02ms | -0.0054ms | -27.22% |
| p99 | 0.03ms | 0.06ms | -0.03ms | -46.66% |
| mean | 0.0074ms | 0.0090ms | -0.0016ms | -17.44% |
| min | 0.0050ms | 0.0049ms | +0.00013ms | +2.56% |
| max | 0.07ms | 0.12ms | -0.05ms | -40.92% |
| total | 1.49ms | 1.80ms | -0.31ms | -17.44% |

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
| max | 0.14ms |
| total | 3.52ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.01ms | 0.01ms | -0.00092ms | -6.41% |
| p50 | 0.02ms | 0.02ms | -0.00046ms | -2.89% |
| p95 | 0.02ms | 0.03ms | -0.0034ms | -12.68% |
| p99 | 0.04ms | 0.05ms | -0.0032ms | -6.89% |
| mean | 0.02ms | 0.02ms | -0.00080ms | -4.32% |
| min | 0.01ms | 0.01ms | -0.00096ms | -7.05% |
| max | 0.14ms | 0.13ms | +0.0078ms | +5.83% |
| total | 3.52ms | 3.68ms | -0.16ms | -4.32% |

### driveTransaction

# Perf Report — driveTransaction.serial

| metric | value |
|---|---|
| iterations | 200 |
| warmup | 5 |
| p10 | 0.0098ms |
| p50 | 0.01ms |
| p95 | 0.02ms |
| p99 | 0.04ms |
| mean | 0.01ms |
| stdev | 0.01ms |
| min | 0.0095ms |
| max | 0.17ms |
| total | 2.37ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.0098ms | 0.0096ms | +0.00021ms | +2.16% |
| p50 | 0.01ms | 0.0099ms | +0.00021ms | +2.11% |
| p95 | 0.02ms | 0.01ms | +0.0032ms | +22.30% |
| p99 | 0.04ms | 0.03ms | +0.0086ms | +32.15% |
| mean | 0.01ms | 0.01ms | +0.0012ms | +10.92% |
| min | 0.0095ms | 0.0095ms | -0.000041ms | -0.43% |
| max | 0.17ms | 0.04ms | +0.13ms | +368.13% |
| total | 2.37ms | 2.14ms | +0.23ms | +10.92% |

### driveDlq

# Perf Report — driveDlq.serial

| metric | value |
|---|---|
| iterations | 200 |
| warmup | 5 |
| p10 | 0.02ms |
| p50 | 0.02ms |
| p95 | 0.02ms |
| p99 | 0.04ms |
| mean | 0.02ms |
| stdev | 0.01ms |
| min | 0.01ms |
| max | 0.15ms |
| total | 3.44ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.02ms | 0.02ms | -0.0018ms | -10.89% |
| p50 | 0.02ms | 0.02ms | -0.0023ms | -12.75% |
| p95 | 0.02ms | 0.03ms | -0.0060ms | -21.35% |
| p99 | 0.04ms | 0.04ms | -0.0015ms | -3.93% |
| mean | 0.02ms | 0.02ms | -0.0022ms | -11.30% |
| min | 0.01ms | 0.02ms | -0.0020ms | -12.12% |
| max | 0.15ms | 0.05ms | +0.10ms | +204.71% |
| total | 3.44ms | 3.88ms | -0.44ms | -11.30% |

