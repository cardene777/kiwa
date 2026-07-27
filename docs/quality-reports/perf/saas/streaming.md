# Perf Suite — streaming

Threshold source: [docs/quality/perf-thresholds.md](../../../quality/perf-thresholds)

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
| schemaRegistryRegister | 0.03ms | 10ms | PASS |
| transactionalProducerCycle | 0.03ms | 40ms | PASS |

## Memory retention (200 iter, arrayBuffers axis is the gate; heap is informational)

| op | heapUsed Δ | arrayBuffers Δ | cap | gc exposed | verdict |
|---|---|---|---|---|---|
| kafkaProducerSend | 16960 B | 0 B | 102400 B | yes | PASS |
| redpandaProducerSend | 17864 B | 0 B | 102400 B | yes | PASS |
| natsPublish | 39848 B | 0 B | 102400 B | yes | PASS |
| idempotentProducerSend | 816 B | 0 B | 102400 B | yes | PASS |
| readCommittedFilter | 1048 B | 0 B | 102400 B | yes | PASS |
| dlqHandleSuccess | 1528 B | 0 B | 102400 B | yes | PASS |
| schemaRegistryRegister | 69112 B | 0 B | 102400 B | yes | PASS |
| transactionalProducerCycle | 30784 B | 0 B | 102400 B | yes | PASS |

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
| total | 0.19ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p50 | 0.00ms | 0.00ms | -0.00ms | -20.00% |
| p95 | 0.00ms | 0.00ms | -0.00ms | -9.75% |
| p99 | 0.01ms | 0.01ms | +0.00ms | +5.03% |
| mean | 0.00ms | 0.00ms | +0.00ms | +2.36% |
| min | 0.00ms | 0.00ms | 0.00ms | 0.00% |
| max | 0.01ms | 0.01ms | +0.00ms | +16.81% |
| total | 0.19ms | 0.19ms | +0.00ms | +2.36% |

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
| total | 0.10ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p50 | 0.00ms | 0.00ms | 0.00ms | 0.00% |
| p95 | 0.00ms | 0.00ms | 0.00ms | 0.00% |
| p99 | 0.00ms | 0.00ms | +0.00ms | +0.18% |
| mean | 0.00ms | 0.00ms | -0.00ms | -0.95% |
| min | 0.00ms | 0.00ms | 0.00ms | 0.00% |
| max | 0.00ms | 0.00ms | +0.00ms | +11.54% |
| total | 0.10ms | 0.11ms | -0.00ms | -0.95% |

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
| total | 0.11ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p50 | 0.00ms | 0.00ms | 0.00ms | 0.00% |
| p95 | 0.00ms | 0.00ms | -0.00ms | -24.74% |
| p99 | 0.00ms | 0.01ms | -0.00ms | -26.52% |
| mean | 0.00ms | 0.00ms | -0.00ms | -3.16% |
| min | 0.00ms | 0.00ms | 0.00ms | 0.00% |
| max | 0.01ms | 0.01ms | +0.00ms | +8.44% |
| total | 0.11ms | 0.12ms | -0.00ms | -3.16% |

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
| total | 0.06ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p50 | 0.00ms | 0.00ms | 0.00ms | 0.00% |
| p95 | 0.00ms | 0.00ms | -0.00ms | -9.27% |
| p99 | 0.00ms | 0.00ms | +0.00ms | +56.58% |
| mean | 0.00ms | 0.00ms | +0.00ms | +2.09% |
| min | 0.00ms | 0.00ms | 0.00ms | 0.00% |
| max | 0.00ms | 0.00ms | +0.00ms | +36.50% |
| total | 0.06ms | 0.06ms | +0.00ms | +2.09% |

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
| p99 | 0.00ms | 0.00ms | +0.00ms | +23.00% |
| mean | 0.00ms | 0.00ms | +0.00ms | +5.68% |
| min | 0.00ms | 0.00ms | 0.00ms | 0.00% |
| max | 0.01ms | 0.01ms | +0.00ms | +29.64% |
| total | 0.05ms | 0.05ms | +0.00ms | +5.68% |

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
| max | 0.01ms |
| total | 0.08ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p50 | 0.00ms | 0.00ms | 0.00ms | 0.00% |
| p95 | 0.00ms | 0.00ms | -0.00ms | -22.98% |
| p99 | 0.00ms | 0.00ms | +0.00ms | +70.89% |
| mean | 0.00ms | 0.00ms | +0.00ms | +9.56% |
| min | 0.00ms | 0.00ms | 0.00ms | 0.00% |
| max | 0.01ms | 0.00ms | +0.00ms | +323.43% |
| total | 0.08ms | 0.07ms | +0.01ms | +9.56% |

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
| p95 | 0.00ms | 0.00ms | +0.00ms | +45.73% |
| p99 | 0.01ms | 0.00ms | +0.00ms | +102.05% |
| mean | 0.00ms | 0.00ms | +0.00ms | +13.96% |
| min | 0.00ms | 0.00ms | -0.00ms | -15.34% |
| max | 0.01ms | 0.01ms | +0.00ms | +53.24% |
| total | 0.18ms | 0.16ms | +0.02ms | +13.96% |

### transactionalProducerCycle

# Perf Report — transactionalProducerCycle.serial

| metric | value |
|---|---|
| iterations | 200 |
| warmup | 5 |
| p50 | 0.00ms |
| p95 | 0.00ms |
| p99 | 0.02ms |
| mean | 0.00ms |
| stdev | 0.00ms |
| min | 0.00ms |
| max | 0.04ms |
| total | 0.59ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p50 | 0.00ms | 0.00ms | 0.00ms | 0.00% |
| p95 | 0.00ms | 0.00ms | +0.00ms | +48.69% |
| p99 | 0.02ms | 0.01ms | +0.00ms | +44.42% |
| mean | 0.00ms | 0.00ms | +0.00ms | +11.34% |
| min | 0.00ms | 0.00ms | +0.00ms | +1.94% |
| max | 0.04ms | 0.01ms | +0.02ms | +195.01% |
| total | 0.59ms | 0.53ms | +0.06ms | +11.34% |

