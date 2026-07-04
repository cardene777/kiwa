# Perf Suite — dogfood-kafka-event-pipeline

Threshold source: [docs/quality/perf-thresholds.md](../../quality/perf-thresholds)

## Serial p95 (concurrency = 1)

| op | p95 | cap | gate | regression |
|---|---|---|---|---|
| driveProducer | 0.01ms | 80ms | PASS | n/a (baseline seeded) |
| driveConsumerGroup | 0.03ms | 150ms | PASS | n/a (baseline seeded) |
| driveTransaction | 0.02ms | 80ms | PASS | n/a (baseline seeded) |
| driveDlq | 0.02ms | 80ms | PASS | n/a (baseline seeded) |

## Concurrent p95 (concurrency = 10, 50 iter each)

| op | p95 | cap | gate |
|---|---|---|---|
| driveProducer | 0.09ms | 160ms | PASS |
| driveConsumerGroup | 0.16ms | 300ms | PASS |
| driveTransaction | 0.10ms | 160ms | PASS |
| driveDlq | 0.16ms | 160ms | PASS |

## Memory retention (200 iter, arrayBuffers axis is the gate; heap is informational)

| op | heapUsed Δ | arrayBuffers Δ | cap | verdict |
|---|---|---|---|---|
| driveProducer | 3133104 B | 0 B | 102400 B | PASS |
| driveConsumerGroup | -7577296 B | 0 B | 102400 B | PASS |
| driveTransaction | -2735984 B | 0 B | 102400 B | PASS |
| driveDlq | -2715616 B | 0 B | 102400 B | PASS |

## Detailed serial reports

### driveProducer

# Perf Report — driveProducer.serial

| metric | value |
|---|---|
| iterations | 200 |
| warmup | 5 |
| p50 | 0.00ms |
| p95 | 0.01ms |
| p99 | 0.03ms |
| mean | 0.01ms |
| stdev | 0.00ms |
| min | 0.00ms |
| max | 0.04ms |
| total | 1.24ms |

### driveConsumerGroup

# Perf Report — driveConsumerGroup.serial

| metric | value |
|---|---|
| iterations | 200 |
| warmup | 5 |
| p50 | 0.01ms |
| p95 | 0.03ms |
| p99 | 0.26ms |
| mean | 0.02ms |
| stdev | 0.04ms |
| min | 0.01ms |
| max | 0.49ms |
| total | 4.38ms |

### driveTransaction

# Perf Report — driveTransaction.serial

| metric | value |
|---|---|
| iterations | 200 |
| warmup | 5 |
| p50 | 0.01ms |
| p95 | 0.02ms |
| p99 | 0.03ms |
| mean | 0.01ms |
| stdev | 0.00ms |
| min | 0.01ms |
| max | 0.04ms |
| total | 1.80ms |

### driveDlq

# Perf Report — driveDlq.serial

| metric | value |
|---|---|
| iterations | 200 |
| warmup | 5 |
| p50 | 0.01ms |
| p95 | 0.02ms |
| p99 | 0.03ms |
| mean | 0.02ms |
| stdev | 0.00ms |
| min | 0.01ms |
| max | 0.04ms |
| total | 3.07ms |

