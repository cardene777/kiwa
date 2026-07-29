# Perf Suite — dogfood-kafka-event-pipeline

Threshold source: [docs/quality/perf-thresholds.md](../../quality/perf-thresholds)

測定系の分解能 = 0.00021ms (何もしない関数を同じ経路で呼んだ時の p10)。 回帰判定の絶対下限は既定でこの 2 倍 = 0.00042ms、 op ごとの実効値は下表の「下限」 列。

## Serial (concurrency = 1)

| op | p10 (回帰判定) | p95 (上限判定) | cap | 下限 | gate | regression |
|---|---|---|---|---|---|---|
| driveProducer | 0.0061ms | 0.01ms | 80ms | 0.00042ms | PASS | stable — gate 無効 (regressionGate=false) |
| driveConsumerGroup | 0.01ms | 0.03ms | 150ms | 0.00042ms | PASS | stable — gate 無効 (regressionGate=false) |
| driveTransaction | 0.0092ms | 0.02ms | 80ms | 0.00042ms | PASS | stable — gate 無効 (regressionGate=false) |
| driveDlq | 0.02ms | 0.03ms | 80ms | 0.00042ms | PASS | stable — gate 無効 (regressionGate=false) |

## Concurrent p95 (concurrency = 10, 50 iter each)

| op | p95 | cap | gate |
|---|---|---|---|
| driveProducer | 0.10ms | 160ms | PASS |
| driveConsumerGroup | 0.23ms | 300ms | PASS |
| driveTransaction | 0.11ms | 160ms | PASS |
| driveDlq | 0.37ms | 160ms | PASS |

## Memory retention (200 iter, arrayBuffers axis is the gate; heap is informational)

| op | heapUsed Δ | arrayBuffers Δ | cap | gc exposed | verdict |
|---|---|---|---|---|---|
| driveProducer | 1688 B | 0 B | 102400 B | yes | PASS |
| driveConsumerGroup | -6992 B | 0 B | 102400 B | yes | PASS |
| driveTransaction | 2928 B | 0 B | 102400 B | yes | PASS |
| driveDlq | -7824 B | 0 B | 102400 B | yes | PASS |

## Detailed serial reports

### driveProducer

# Perf Report — driveProducer.serial

| metric | value |
|---|---|
| iterations | 200 |
| warmup | 5 |
| p10 | 0.0061ms |
| p50 | 0.0065ms |
| p95 | 0.01ms |
| p99 | 0.03ms |
| mean | 0.0077ms |
| stdev | 0.0046ms |
| min | 0.0057ms |
| max | 0.04ms |
| total | 1.55ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.0061ms | 0.0057ms | +0.00046ms | +8.10% |
| p50 | 0.0065ms | 0.0063ms | +0.00021ms | +3.34% |
| p95 | 0.01ms | 0.02ms | -0.0050ms | -25.04% |
| p99 | 0.03ms | 0.06ms | -0.03ms | -45.15% |
| mean | 0.0077ms | 0.0090ms | -0.0013ms | -14.28% |
| min | 0.0057ms | 0.0049ms | +0.00079ms | +16.25% |
| max | 0.04ms | 0.12ms | -0.08ms | -64.01% |
| total | 1.55ms | 1.80ms | -0.26ms | -14.28% |

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
| stdev | 0.0085ms |
| min | 0.01ms |
| max | 0.12ms |
| total | 3.44ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.01ms | 0.01ms | -0.00079ms | -5.50% |
| p50 | 0.02ms | 0.02ms | +0.00017ms | +1.05% |
| p95 | 0.03ms | 0.03ms | -0.0019ms | -6.97% |
| p99 | 0.04ms | 0.05ms | -0.0057ms | -12.35% |
| mean | 0.02ms | 0.02ms | -0.0012ms | -6.46% |
| min | 0.01ms | 0.01ms | -0.00050ms | -3.68% |
| max | 0.12ms | 0.13ms | -0.01ms | -8.72% |
| total | 3.44ms | 3.68ms | -0.24ms | -6.46% |

### driveTransaction

# Perf Report — driveTransaction.serial

| metric | value |
|---|---|
| iterations | 200 |
| warmup | 5 |
| p10 | 0.0092ms |
| p50 | 0.0095ms |
| p95 | 0.02ms |
| p99 | 0.03ms |
| mean | 0.01ms |
| stdev | 0.01ms |
| min | 0.0090ms |
| max | 0.14ms |
| total | 2.22ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.0092ms | 0.0096ms | -0.00038ms | -3.90% |
| p50 | 0.0095ms | 0.0099ms | -0.00038ms | -3.80% |
| p95 | 0.02ms | 0.01ms | +0.0028ms | +19.82% |
| p99 | 0.03ms | 0.03ms | +0.0024ms | +8.96% |
| mean | 0.01ms | 0.01ms | +0.00040ms | +3.74% |
| min | 0.0090ms | 0.0095ms | -0.00050ms | -5.23% |
| max | 0.14ms | 0.04ms | +0.11ms | +301.16% |
| total | 2.22ms | 2.14ms | +0.08ms | +3.74% |

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
| stdev | 0.0085ms |
| min | 0.02ms |
| max | 0.12ms |
| total | 3.53ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.02ms | 0.02ms | -0.0015ms | -8.89% |
| p50 | 0.02ms | 0.02ms | -0.0021ms | -11.58% |
| p95 | 0.03ms | 0.03ms | -0.0019ms | -6.98% |
| p99 | 0.04ms | 0.04ms | +0.00057ms | +1.51% |
| mean | 0.02ms | 0.02ms | -0.0018ms | -9.17% |
| min | 0.02ms | 0.02ms | -0.0014ms | -8.59% |
| max | 0.12ms | 0.05ms | +0.07ms | +148.50% |
| total | 3.53ms | 3.88ms | -0.36ms | -9.17% |

