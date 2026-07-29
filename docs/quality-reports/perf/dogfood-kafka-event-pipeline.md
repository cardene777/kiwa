# Perf Suite — dogfood-kafka-event-pipeline

Threshold source: [docs/quality/perf-thresholds.md](../../quality/perf-thresholds)

測定系の分解能 = 0.00017ms (何もしない関数を同じ経路で呼んだ時の p10)。 回帰判定の絶対下限は既定でこの 2 倍 = 0.00033ms、 op ごとの実効値は下表の「下限」 列。

## Serial (concurrency = 1)

| op | p10 (回帰判定) | p95 (上限判定) | cap | 下限 | gate | regression |
|---|---|---|---|---|---|---|
| driveProducer | 0.0049ms | 0.01ms | 80ms | 0.00033ms | PASS | stable — gate 無効 (regressionGate=false) |
| driveConsumerGroup | 0.01ms | 0.03ms | 150ms | 0.00033ms | PASS | stable — gate 無効 (regressionGate=false) |
| driveTransaction | 0.0085ms | 0.01ms | 80ms | 0.00033ms | PASS | stable — gate 無効 (regressionGate=false) |
| driveDlq | 0.01ms | 0.03ms | 80ms | 0.00033ms | PASS | stable — gate 無効 (regressionGate=false) |

## Concurrent p95 (concurrency = 10, 50 iter each)

| op | p95 | cap | gate |
|---|---|---|---|
| driveProducer | 0.10ms | 160ms | PASS |
| driveConsumerGroup | 0.17ms | 300ms | PASS |
| driveTransaction | 0.12ms | 160ms | PASS |
| driveDlq | 0.18ms | 160ms | PASS |

## Memory retention (200 iter, arrayBuffers axis is the gate; heap is informational)

| op | heapUsed Δ | arrayBuffers Δ | cap | gc exposed | verdict |
|---|---|---|---|---|---|
| driveProducer | 1512 B | 0 B | 102400 B | yes | PASS |
| driveConsumerGroup | -7416 B | 0 B | 102400 B | yes | PASS |
| driveTransaction | 2040 B | 0 B | 102400 B | yes | PASS |
| driveDlq | -6752 B | 0 B | 102400 B | yes | PASS |

## Detailed serial reports

### driveProducer

# Perf Report — driveProducer.serial

| metric | value |
|---|---|
| iterations | 200 |
| warmup | 5 |
| p10 | 0.0049ms |
| p50 | 0.0060ms |
| p95 | 0.01ms |
| p99 | 0.03ms |
| mean | 0.0071ms |
| stdev | 0.0055ms |
| min | 0.0047ms |
| max | 0.06ms |
| total | 1.43ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.0049ms | 0.0057ms | -0.00075ms | -13.29% |
| p50 | 0.0060ms | 0.0063ms | -0.00025ms | -4.00% |
| p95 | 0.01ms | 0.02ms | -0.0075ms | -37.42% |
| p99 | 0.03ms | 0.06ms | -0.03ms | -46.50% |
| mean | 0.0071ms | 0.0090ms | -0.0019ms | -20.95% |
| min | 0.0047ms | 0.0049ms | -0.00021ms | -4.29% |
| max | 0.06ms | 0.12ms | -0.06ms | -53.59% |
| total | 1.43ms | 1.80ms | -0.38ms | -20.95% |

### driveConsumerGroup

# Perf Report — driveConsumerGroup.serial

| metric | value |
|---|---|
| iterations | 200 |
| warmup | 5 |
| p10 | 0.01ms |
| p50 | 0.02ms |
| p95 | 0.03ms |
| p99 | 0.04ms |
| mean | 0.02ms |
| stdev | 0.01ms |
| min | 0.01ms |
| max | 0.14ms |
| total | 3.49ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.01ms | 0.01ms | -0.0012ms | -8.15% |
| p50 | 0.02ms | 0.02ms | -0.00069ms | -4.34% |
| p95 | 0.03ms | 0.03ms | +0.00014ms | +0.52% |
| p99 | 0.04ms | 0.05ms | -0.0042ms | -9.08% |
| mean | 0.02ms | 0.02ms | -0.00094ms | -5.09% |
| min | 0.01ms | 0.01ms | -0.0012ms | -8.89% |
| max | 0.14ms | 0.13ms | +0.0030ms | +2.20% |
| total | 3.49ms | 3.68ms | -0.19ms | -5.09% |

### driveTransaction

# Perf Report — driveTransaction.serial

| metric | value |
|---|---|
| iterations | 200 |
| warmup | 5 |
| p10 | 0.0085ms |
| p50 | 0.0088ms |
| p95 | 0.01ms |
| p99 | 0.03ms |
| mean | 0.0096ms |
| stdev | 0.0033ms |
| min | 0.0083ms |
| max | 0.03ms |
| total | 1.92ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.0085ms | 0.0096ms | -0.0011ms | -11.69% |
| p50 | 0.0088ms | 0.0099ms | -0.0011ms | -10.97% |
| p95 | 0.01ms | 0.01ms | -0.00097ms | -6.86% |
| p99 | 0.03ms | 0.03ms | +0.00068ms | +2.55% |
| mean | 0.0096ms | 0.01ms | -0.0011ms | -10.16% |
| min | 0.0083ms | 0.0095ms | -0.0012ms | -12.66% |
| max | 0.03ms | 0.04ms | -0.0028ms | -7.91% |
| total | 1.92ms | 2.14ms | -0.22ms | -10.16% |

### driveDlq

# Perf Report — driveDlq.serial

| metric | value |
|---|---|
| iterations | 200 |
| warmup | 5 |
| p10 | 0.01ms |
| p50 | 0.01ms |
| p95 | 0.03ms |
| p99 | 0.03ms |
| mean | 0.02ms |
| stdev | 0.01ms |
| min | 0.01ms |
| max | 0.15ms |
| total | 3.38ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.01ms | 0.02ms | -0.0024ms | -14.32% |
| p50 | 0.01ms | 0.02ms | -0.0028ms | -15.79% |
| p95 | 0.03ms | 0.03ms | -0.0021ms | -7.59% |
| p99 | 0.03ms | 0.04ms | -0.0035ms | -9.35% |
| mean | 0.02ms | 0.02ms | -0.0025ms | -12.95% |
| min | 0.01ms | 0.02ms | -0.0022ms | -13.39% |
| max | 0.15ms | 0.05ms | +0.10ms | +205.13% |
| total | 3.38ms | 3.88ms | -0.50ms | -12.95% |

