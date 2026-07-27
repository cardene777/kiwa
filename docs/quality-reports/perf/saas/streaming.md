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
| transactionalProducerCycle | 0.00ms | 20ms | PASS | stable |

## Concurrent p95 (concurrency = 10, 50 iter each)

| op | p95 | cap | gate |
|---|---|---|---|
| kafkaProducerSend | 0.01ms | 20ms | PASS |
| redpandaProducerSend | 0.01ms | 20ms | PASS |
| natsPublish | 0.01ms | 20ms | PASS |
| idempotentProducerSend | 0.00ms | 20ms | PASS |
| readCommittedFilter | 0.00ms | 10ms | PASS |
| dlqHandleSuccess | 0.01ms | 10ms | PASS |
| schemaRegistryRegister | 0.02ms | 10ms | PASS |
| transactionalProducerCycle | 0.04ms | 40ms | PASS |

## Memory retention (200 iter, arrayBuffers axis is the gate; heap is informational)

| op | heapUsed Δ | arrayBuffers Δ | cap | gc exposed | verdict |
|---|---|---|---|---|---|
| kafkaProducerSend | 11208 B | 0 B | 102400 B | yes | PASS |
| redpandaProducerSend | 33320 B | 0 B | 102400 B | yes | PASS |
| natsPublish | 41144 B | 0 B | 102400 B | yes | PASS |
| idempotentProducerSend | 816 B | 0 B | 102400 B | yes | PASS |
| readCommittedFilter | 1048 B | 0 B | 102400 B | yes | PASS |
| dlqHandleSuccess | 1528 B | 0 B | 102400 B | yes | PASS |
| schemaRegistryRegister | 76480 B | 0 B | 102400 B | yes | PASS |
| transactionalProducerCycle | 29504 B | 0 B | 102400 B | yes | PASS |

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
| total | 0.18ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p50 | 0.00ms | 0.00ms | -0.00ms | -13.28% |
| p95 | 0.00ms | 0.00ms | -0.00ms | -22.03% |
| p99 | 0.01ms | 0.01ms | +0.00ms | +3.48% |
| mean | 0.00ms | 0.00ms | -0.00ms | -6.50% |
| min | 0.00ms | 0.00ms | 0.00ms | 0.00% |
| max | 0.01ms | 0.01ms | +0.00ms | +0.01% |
| total | 0.18ms | 0.19ms | -0.01ms | -6.50% |

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
| stdev | 0.01ms |
| min | 0.00ms |
| max | 0.14ms |
| total | 0.26ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p50 | 0.00ms | 0.00ms | 0.00ms | 0.00% |
| p95 | 0.00ms | 0.00ms | +0.00ms | +20.33% |
| p99 | 0.00ms | 0.00ms | +0.00ms | +272.07% |
| mean | 0.00ms | 0.00ms | +0.00ms | +149.65% |
| min | 0.00ms | 0.00ms | 0.00ms | 0.00% |
| max | 0.14ms | 0.00ms | +0.14ms | +6552.79% |
| total | 0.26ms | 0.11ms | +0.16ms | +149.65% |

### natsPublish

# Perf Report — natsPublish.serial

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
| total | 0.12ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p50 | 0.00ms | 0.00ms | 0.00ms | 0.00% |
| p95 | 0.00ms | 0.00ms | -0.00ms | -24.74% |
| p99 | 0.01ms | 0.01ms | +0.00ms | +21.19% |
| mean | 0.00ms | 0.00ms | +0.00ms | +6.08% |
| min | 0.00ms | 0.00ms | 0.00ms | 0.00% |
| max | 0.01ms | 0.01ms | +0.01ms | +75.32% |
| total | 0.12ms | 0.12ms | +0.01ms | +6.08% |

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
| max | 0.00ms |
| total | 0.07ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p50 | 0.00ms | 0.00ms | +0.00ms | +0.34% |
| p95 | 0.00ms | 0.00ms | +0.00ms | +10.00% |
| p99 | 0.00ms | 0.00ms | +0.00ms | +52.28% |
| mean | 0.00ms | 0.00ms | +0.00ms | +14.19% |
| min | 0.00ms | 0.00ms | 0.00ms | 0.00% |
| max | 0.00ms | 0.00ms | +0.00ms | +46.15% |
| total | 0.07ms | 0.06ms | +0.01ms | +14.19% |

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
| max | 0.01ms |
| total | 0.05ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p50 | 0.00ms | 0.00ms | 0.00ms | 0.00% |
| p95 | 0.00ms | 0.00ms | 0.00ms | 0.00% |
| p99 | 0.00ms | 0.00ms | +0.00ms | +6.67% |
| mean | 0.00ms | 0.00ms | +0.00ms | +3.28% |
| min | 0.00ms | 0.00ms | 0.00ms | 0.00% |
| max | 0.01ms | 0.01ms | +0.00ms | +11.72% |
| total | 0.05ms | 0.05ms | +0.00ms | +3.28% |

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
| p50 | 0.00ms | 0.00ms | 0.00ms | 0.00% |
| p95 | 0.00ms | 0.00ms | -0.00ms | -15.04% |
| p99 | 0.00ms | 0.00ms | +0.00ms | +70.60% |
| mean | 0.00ms | 0.00ms | +0.00ms | +5.94% |
| min | 0.00ms | 0.00ms | 0.00ms | 0.00% |
| max | 0.00ms | 0.00ms | +0.00ms | +229.36% |
| total | 0.08ms | 0.07ms | +0.00ms | +5.94% |

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
| max | 0.01ms |
| total | 0.18ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p50 | 0.00ms | 0.00ms | 0.00ms | 0.00% |
| p95 | 0.00ms | 0.00ms | +0.00ms | +45.33% |
| p99 | 0.01ms | 0.00ms | +0.00ms | +49.93% |
| mean | 0.00ms | 0.00ms | +0.00ms | +12.59% |
| min | 0.00ms | 0.00ms | -0.00ms | -7.58% |
| max | 0.01ms | 0.01ms | +0.00ms | +57.22% |
| total | 0.18ms | 0.16ms | +0.02ms | +12.59% |

### transactionalProducerCycle

# Perf Report — transactionalProducerCycle.serial

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
| total | 0.55ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p50 | 0.00ms | 0.00ms | +0.00ms | +1.76% |
| p95 | 0.00ms | 0.00ms | +0.00ms | +7.75% |
| p99 | 0.01ms | 0.01ms | -0.00ms | -0.81% |
| mean | 0.00ms | 0.00ms | +0.00ms | +3.25% |
| min | 0.00ms | 0.00ms | +0.00ms | +3.88% |
| max | 0.02ms | 0.01ms | +0.00ms | +23.58% |
| total | 0.55ms | 0.53ms | +0.02ms | +3.25% |

