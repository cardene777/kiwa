# Perf Suite — streaming

Threshold source: [docs/quality/perf-thresholds.md](../../quality/perf-thresholds)

## Serial p95 (concurrency = 1)

| op | p95 | cap | gate | regression |
|---|---|---|---|---|
| kafkaProducerSend | 0.00ms | 10ms | PASS | stable |
| redpandaProducerSend | 0.00ms | 10ms | PASS | stable |
| natsPublish | 0.00ms | 10ms | PASS | stable |
| idempotentProducerSend | 0.00ms | 10ms | PASS | stable |
| readCommittedFilter | 0.00ms | 5ms | PASS | stable |
| dlqHandleSuccess | 0.00ms | 5ms | PASS | stable |
| schemaRegistryRegister | 0.00ms | 5ms | PASS | stable |
| transactionalProducerCycle | 0.01ms | 20ms | PASS | stable |

## Concurrent p95 (concurrency = 10, 50 iter each)

| op | p95 | cap | gate |
|---|---|---|---|
| kafkaProducerSend | 0.01ms | 20ms | PASS |
| redpandaProducerSend | 0.01ms | 20ms | PASS |
| natsPublish | 0.01ms | 20ms | PASS |
| idempotentProducerSend | 0.00ms | 20ms | PASS |
| readCommittedFilter | 0.01ms | 10ms | PASS |
| dlqHandleSuccess | 0.01ms | 10ms | PASS |
| schemaRegistryRegister | 0.01ms | 10ms | PASS |
| transactionalProducerCycle | 0.03ms | 40ms | PASS |

## Memory retention (200 iter, arrayBuffers axis is the gate; heap is informational)

| op | heapUsed Δ | arrayBuffers Δ | cap | verdict |
|---|---|---|---|---|
| kafkaProducerSend | 447064 B | 0 B | 102400 B | PASS |
| redpandaProducerSend | 445952 B | 0 B | 102400 B | PASS |
| natsPublish | 174664 B | 0 B | 102400 B | PASS |
| idempotentProducerSend | 272464 B | 0 B | 102400 B | PASS |
| readCommittedFilter | 168680 B | 0 B | 102400 B | PASS |
| dlqHandleSuccess | 357504 B | 0 B | 102400 B | PASS |
| schemaRegistryRegister | 370104 B | 0 B | 102400 B | PASS |
| transactionalProducerCycle | 1445432 B | 0 B | 102400 B | PASS |

## Detailed serial reports

### kafkaProducerSend

# Perf Report — kafkaProducerSend.serial

| metric | value |
|---|---|
| iterations | 200 |
| warmup | 5 |
| p50 | 0.00ms |
| p95 | 0.00ms |
| p99 | 0.01ms |
| mean | 0.00ms |
| stdev | 0.00ms |
| min | 0.00ms |
| max | 0.01ms |
| total | 0.16ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p50 | 0.00ms | 0.00ms | 0.00ms | 0.00% |
| p95 | 0.00ms | 0.00ms | -0.00ms | -2.52% |
| p99 | 0.01ms | 0.01ms | +0.00ms | +7.39% |
| mean | 0.00ms | 0.00ms | +0.00ms | +2.81% |
| min | 0.00ms | 0.00ms | 0.00ms | 0.00% |
| max | 0.01ms | 0.01ms | +0.00ms | +12.57% |
| total | 0.16ms | 0.16ms | +0.00ms | +2.81% |

### redpandaProducerSend

# Perf Report — redpandaProducerSend.serial

| metric | value |
|---|---|
| iterations | 200 |
| warmup | 5 |
| p50 | 0.00ms |
| p95 | 0.00ms |
| p99 | 0.00ms |
| mean | 0.00ms |
| stdev | 0.00ms |
| min | 0.00ms |
| max | 0.00ms |
| total | 0.13ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p50 | 0.00ms | 0.00ms | 0.00ms | 0.00% |
| p95 | 0.00ms | 0.00ms | +0.00ms | +22.22% |
| p99 | 0.00ms | 0.00ms | +0.00ms | +21.96% |
| mean | 0.00ms | 0.00ms | +0.00ms | +7.36% |
| min | 0.00ms | 0.00ms | -0.00ms | -9.17% |
| max | 0.00ms | 0.01ms | -0.00ms | -30.71% |
| total | 0.13ms | 0.12ms | +0.01ms | +7.36% |

### natsPublish

# Perf Report — natsPublish.serial

| metric | value |
|---|---|
| iterations | 200 |
| warmup | 5 |
| p50 | 0.00ms |
| p95 | 0.00ms |
| p99 | 0.00ms |
| mean | 0.00ms |
| stdev | 0.00ms |
| min | 0.00ms |
| max | 0.01ms |
| total | 0.12ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p50 | 0.00ms | 0.00ms | 0.00ms | 0.00% |
| p95 | 0.00ms | 0.00ms | -0.00ms | -2.72% |
| p99 | 0.00ms | 0.00ms | -0.00ms | -1.23% |
| mean | 0.00ms | 0.00ms | -0.00ms | -3.33% |
| min | 0.00ms | 0.00ms | 0.00ms | 0.00% |
| max | 0.01ms | 0.00ms | +0.00ms | +33.03% |
| total | 0.12ms | 0.13ms | -0.00ms | -3.33% |

### idempotentProducerSend

# Perf Report — idempotentProducerSend.serial

| metric | value |
|---|---|
| iterations | 200 |
| warmup | 5 |
| p50 | 0.00ms |
| p95 | 0.00ms |
| p99 | 0.00ms |
| mean | 0.00ms |
| stdev | 0.00ms |
| min | 0.00ms |
| max | 0.01ms |
| total | 0.07ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p50 | 0.00ms | 0.00ms | 0.00ms | 0.00% |
| p95 | 0.00ms | 0.00ms | -0.00ms | -65.37% |
| p99 | 0.00ms | 0.00ms | +0.00ms | +11.38% |
| mean | 0.00ms | 0.00ms | -0.00ms | -10.53% |
| min | 0.00ms | 0.00ms | 0.00ms | 0.00% |
| max | 0.01ms | 0.01ms | +0.00ms | +31.61% |
| total | 0.07ms | 0.08ms | -0.01ms | -10.53% |

### readCommittedFilter

# Perf Report — readCommittedFilter.serial

| metric | value |
|---|---|
| iterations | 200 |
| warmup | 5 |
| p50 | 0.00ms |
| p95 | 0.00ms |
| p99 | 0.00ms |
| mean | 0.00ms |
| stdev | 0.00ms |
| min | 0.00ms |
| max | 0.00ms |
| total | 0.04ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p50 | 0.00ms | 0.00ms | 0.00ms | 0.00% |
| p95 | 0.00ms | 0.00ms | -0.00ms | -63.08% |
| p99 | 0.00ms | 0.00ms | -0.00ms | -17.58% |
| mean | 0.00ms | 0.00ms | -0.00ms | -17.43% |
| min | 0.00ms | 0.00ms | -0.00ms | -24.70% |
| max | 0.00ms | 0.00ms | -0.00ms | -11.50% |
| total | 0.04ms | 0.05ms | -0.01ms | -17.43% |

### dlqHandleSuccess

# Perf Report — dlqHandleSuccess.serial

| metric | value |
|---|---|
| iterations | 200 |
| warmup | 5 |
| p50 | 0.00ms |
| p95 | 0.00ms |
| p99 | 0.00ms |
| mean | 0.00ms |
| stdev | 0.00ms |
| min | 0.00ms |
| max | 0.00ms |
| total | 0.08ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p50 | 0.00ms | 0.00ms | -0.00ms | -0.34% |
| p95 | 0.00ms | 0.00ms | +0.00ms | +7.66% |
| p99 | 0.00ms | 0.00ms | -0.00ms | -25.00% |
| mean | 0.00ms | 0.00ms | -0.00ms | -12.63% |
| min | 0.00ms | 0.00ms | 0.00ms | 0.00% |
| max | 0.00ms | 0.01ms | -0.01ms | -78.11% |
| total | 0.08ms | 0.09ms | -0.01ms | -12.63% |

### schemaRegistryRegister

# Perf Report — schemaRegistryRegister.serial

| metric | value |
|---|---|
| iterations | 200 |
| warmup | 5 |
| p50 | 0.00ms |
| p95 | 0.00ms |
| p99 | 0.01ms |
| mean | 0.00ms |
| stdev | 0.00ms |
| min | 0.00ms |
| max | 0.02ms |
| total | 0.19ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p50 | 0.00ms | 0.00ms | -0.00ms | -7.19% |
| p95 | 0.00ms | 0.00ms | +0.00ms | +13.69% |
| p99 | 0.01ms | 0.00ms | +0.00ms | +64.82% |
| mean | 0.00ms | 0.00ms | +0.00ms | +10.90% |
| min | 0.00ms | 0.00ms | 0.00ms | 0.00% |
| max | 0.02ms | 0.01ms | +0.01ms | +106.73% |
| total | 0.19ms | 0.17ms | +0.02ms | +10.90% |

### transactionalProducerCycle

# Perf Report — transactionalProducerCycle.serial

| metric | value |
|---|---|
| iterations | 200 |
| warmup | 5 |
| p50 | 0.00ms |
| p95 | 0.01ms |
| p99 | 0.01ms |
| mean | 0.00ms |
| stdev | 0.02ms |
| min | 0.00ms |
| max | 0.26ms |
| total | 0.79ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p50 | 0.00ms | 0.00ms | -0.00ms | -1.80% |
| p95 | 0.01ms | 0.01ms | -0.00ms | -10.46% |
| p99 | 0.01ms | 0.01ms | +0.00ms | +4.07% |
| mean | 0.00ms | 0.00ms | -0.00ms | -8.26% |
| min | 0.00ms | 0.00ms | 0.00ms | 0.00% |
| max | 0.26ms | 0.28ms | -0.02ms | -6.52% |
| total | 0.79ms | 0.86ms | -0.07ms | -8.26% |

