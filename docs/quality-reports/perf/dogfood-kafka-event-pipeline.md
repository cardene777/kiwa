# Perf Suite — dogfood-kafka-event-pipeline

Threshold source: [docs/quality/perf-thresholds.md](../../quality/perf-thresholds)

測定系の分解能 = 0.00017ms (何もしない関数を同じ経路で呼んだ時の p10)。 回帰判定の絶対下限は既定でこの 2 倍 = 0.00033ms、 op ごとの実効値は下表の「下限」 列。

## Serial (concurrency = 1)

| op | p10 (回帰判定) | p95 (上限判定) | cap | 下限 | gate | regression |
|---|---|---|---|---|---|---|
| driveProducer | 0.0059ms | 0.01ms | 80ms | 0.00033ms | PASS | stable — gate 無効 (regressionGate=false) |
| driveConsumerGroup | 0.01ms | 0.03ms | 150ms | 0.00033ms | PASS | stable — gate 無効 (regressionGate=false) |
| driveTransaction | 0.0090ms | 0.02ms | 80ms | 0.00033ms | PASS | stable (p10 -7% (閾値未満)、 p95 +27% (裾は実行間の振れ幅と区別できないため判定には使わない)) — gate 無効 (regressionGate=false) |
| driveDlq | 0.02ms | 0.04ms | 80ms | 0.00033ms | PASS | stable (p10 -7% (閾値未満)、 p95 +25% (裾は実行間の振れ幅と区別できないため判定には使わない)) — gate 無効 (regressionGate=false) |

## Concurrent p95 (concurrency = 10, 50 iter each)

| op | p95 | cap | gate |
|---|---|---|---|
| driveProducer | 0.12ms | 160ms | PASS |
| driveConsumerGroup | 0.25ms | 300ms | PASS |
| driveTransaction | 0.19ms | 160ms | PASS |
| driveDlq | 0.40ms | 160ms | PASS |

## Memory retention (200 iter, arrayBuffers axis is the gate; heap is informational)

| op | heapUsed Δ | arrayBuffers Δ | cap | gc exposed | verdict |
|---|---|---|---|---|---|
| driveProducer | 1528 B | 0 B | 102400 B | yes | PASS |
| driveConsumerGroup | -7480 B | 0 B | 102400 B | yes | PASS |
| driveTransaction | 208 B | 0 B | 102400 B | yes | PASS |
| driveDlq | -3096 B | 0 B | 102400 B | yes | PASS |

## Detailed serial reports

### driveProducer

# Perf Report — driveProducer.serial

| metric | value |
|---|---|
| iterations | 200 |
| warmup | 5 |
| p10 | 0.0059ms |
| p50 | 0.0062ms |
| p95 | 0.01ms |
| p99 | 0.03ms |
| mean | 0.0076ms |
| stdev | 0.0045ms |
| min | 0.0053ms |
| max | 0.04ms |
| total | 1.52ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.0059ms | 0.0057ms | +0.00021ms | +3.69% |
| p50 | 0.0062ms | 0.0063ms | -0.000041ms | -0.66% |
| p95 | 0.01ms | 0.02ms | -0.0060ms | -30.22% |
| p99 | 0.03ms | 0.06ms | -0.03ms | -47.76% |
| mean | 0.0076ms | 0.0090ms | -0.0014ms | -15.66% |
| min | 0.0053ms | 0.0049ms | +0.00038ms | +7.69% |
| max | 0.04ms | 0.12ms | -0.08ms | -66.39% |
| total | 1.52ms | 1.80ms | -0.28ms | -15.66% |

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
| max | 0.15ms |
| total | 3.74ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.01ms | 0.01ms | -0.00043ms | -2.96% |
| p50 | 0.02ms | 0.02ms | +5.0e-7ms | +0.00% |
| p95 | 0.03ms | 0.03ms | +0.0035ms | +13.09% |
| p99 | 0.05ms | 0.05ms | +0.0040ms | +8.57% |
| mean | 0.02ms | 0.02ms | +0.00029ms | +1.59% |
| min | 0.01ms | 0.01ms | -0.00042ms | -3.07% |
| max | 0.15ms | 0.13ms | +0.01ms | +8.63% |
| total | 3.74ms | 3.68ms | +0.06ms | +1.59% |

### driveTransaction

# Perf Report — driveTransaction.serial

| metric | value |
|---|---|
| iterations | 200 |
| warmup | 5 |
| p10 | 0.0090ms |
| p50 | 0.0097ms |
| p95 | 0.02ms |
| p99 | 0.03ms |
| mean | 0.01ms |
| stdev | 0.0080ms |
| min | 0.0087ms |
| max | 0.11ms |
| total | 2.21ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.0090ms | 0.0096ms | -0.00067ms | -6.93% |
| p50 | 0.0097ms | 0.0099ms | -0.00017ms | -1.69% |
| p95 | 0.02ms | 0.01ms | +0.0038ms | +26.54% |
| p99 | 0.03ms | 0.03ms | +0.0018ms | +6.66% |
| mean | 0.01ms | 0.01ms | +0.00035ms | +3.25% |
| min | 0.0087ms | 0.0095ms | -0.00083ms | -8.73% |
| max | 0.11ms | 0.04ms | +0.08ms | +211.16% |
| total | 2.21ms | 2.14ms | +0.07ms | +3.25% |

### driveDlq

# Perf Report — driveDlq.serial

| metric | value |
|---|---|
| iterations | 200 |
| warmup | 5 |
| p10 | 0.02ms |
| p50 | 0.02ms |
| p95 | 0.04ms |
| p99 | 0.95ms |
| mean | 0.05ms |
| stdev | 0.22ms |
| min | 0.01ms |
| max | 2.21ms |
| total | 9.60ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.02ms | 0.02ms | -0.0013ms | -7.43% |
| p50 | 0.02ms | 0.02ms | -0.0010ms | -5.85% |
| p95 | 0.04ms | 0.03ms | +0.0071ms | +25.48% |
| p99 | 0.95ms | 0.04ms | +0.92ms | +2418.13% |
| mean | 0.05ms | 0.02ms | +0.03ms | +147.26% |
| min | 0.01ms | 0.02ms | -0.0016ms | -9.85% |
| max | 2.21ms | 0.05ms | +2.16ms | +4442.12% |
| total | 9.60ms | 3.88ms | +5.72ms | +147.26% |

