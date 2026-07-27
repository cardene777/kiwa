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
| readCommittedFilter | 0.01ms | 10ms | PASS |
| dlqHandleSuccess | 0.00ms | 10ms | PASS |
| schemaRegistryRegister | 0.06ms | 10ms | PASS |
| transactionalProducerCycle | 0.07ms | 40ms | PASS |

## Memory retention (200 iter, arrayBuffers axis is the gate; heap is informational)

| op | heapUsed Δ | arrayBuffers Δ | cap | gc exposed | verdict |
|---|---|---|---|---|---|
| kafkaProducerSend | 21576 B | 0 B | 102400 B | yes | PASS |
| redpandaProducerSend | 19160 B | 0 B | 102400 B | yes | PASS |
| natsPublish | 40152 B | 0 B | 102400 B | yes | PASS |
| idempotentProducerSend | 816 B | 0 B | 102400 B | yes | PASS |
| readCommittedFilter | 1048 B | 0 B | 102400 B | yes | PASS |
| dlqHandleSuccess | 15504 B | 0 B | 102400 B | yes | PASS |
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
| p50 | 0.00ms | 0.00ms | -0.00ms | -13.28% |
| p95 | 0.00ms | 0.00ms | -0.00ms | -12.86% |
| p99 | 0.01ms | 0.01ms | +0.00ms | +3.93% |
| mean | 0.00ms | 0.00ms | -0.00ms | -1.28% |
| min | 0.00ms | 0.00ms | -0.00ms | -9.17% |
| max | 0.01ms | 0.01ms | +0.00ms | +3.53% |
| total | 0.19ms | 0.19ms | -0.00ms | -1.28% |

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
| max | 0.01ms |
| total | 0.11ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p50 | 0.00ms | 0.00ms | 0.00ms | 0.00% |
| p95 | 0.00ms | 0.00ms | +0.00ms | +0.66% |
| p99 | 0.00ms | 0.00ms | +0.00ms | +16.60% |
| mean | 0.00ms | 0.00ms | +0.00ms | +6.14% |
| min | 0.00ms | 0.00ms | 0.00ms | 0.00% |
| max | 0.01ms | 0.00ms | +0.01ms | +282.65% |
| total | 0.11ms | 0.11ms | +0.01ms | +6.14% |

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
| total | 0.13ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p50 | 0.00ms | 0.00ms | 0.00ms | 0.00% |
| p95 | 0.00ms | 0.00ms | -0.00ms | -29.34% |
| p99 | 0.01ms | 0.01ms | +0.00ms | +17.56% |
| mean | 0.00ms | 0.00ms | +0.00ms | +6.73% |
| min | 0.00ms | 0.00ms | 0.00ms | 0.00% |
| max | 0.01ms | 0.01ms | +0.01ms | +112.06% |
| total | 0.13ms | 0.12ms | +0.01ms | +6.73% |

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
| p50 | 0.00ms | 0.00ms | -0.00ms | -14.09% |
| p95 | 0.00ms | 0.00ms | -0.00ms | -9.27% |
| p99 | 0.00ms | 0.00ms | +0.00ms | +23.73% |
| mean | 0.00ms | 0.00ms | -0.00ms | -0.70% |
| min | 0.00ms | 0.00ms | -0.00ms | -16.80% |
| max | 0.00ms | 0.00ms | +0.00ms | +23.03% |
| total | 0.06ms | 0.06ms | -0.00ms | -0.70% |

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
| total | 0.06ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p50 | 0.00ms | 0.00ms | 0.00ms | 0.00% |
| p95 | 0.00ms | 0.00ms | 0.00ms | 0.00% |
| p99 | 0.00ms | 0.00ms | +0.00ms | +36.74% |
| mean | 0.00ms | 0.00ms | +0.00ms | +6.33% |
| min | 0.00ms | 0.00ms | 0.00ms | 0.00% |
| max | 0.01ms | 0.01ms | +0.00ms | +22.06% |
| total | 0.06ms | 0.05ms | +0.00ms | +6.33% |

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
| p95 | 0.00ms | 0.00ms | -0.00ms | -7.71% |
| p99 | 0.00ms | 0.00ms | +0.00ms | +62.65% |
| mean | 0.00ms | 0.00ms | +0.00ms | +7.01% |
| min | 0.00ms | 0.00ms | 0.00ms | 0.00% |
| max | 0.00ms | 0.00ms | +0.00ms | +220.54% |
| total | 0.08ms | 0.07ms | +0.01ms | +7.01% |

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
| p95 | 0.00ms | 0.00ms | +0.00ms | +40.31% |
| p99 | 0.01ms | 0.00ms | +0.00ms | +72.03% |
| mean | 0.00ms | 0.00ms | +0.00ms | +13.27% |
| min | 0.00ms | 0.00ms | 0.00ms | 0.00% |
| max | 0.01ms | 0.01ms | +0.01ms | +65.17% |
| total | 0.18ms | 0.16ms | +0.02ms | +13.27% |

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
| total | 0.56ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p50 | 0.00ms | 0.00ms | +0.00ms | +1.76% |
| p95 | 0.00ms | 0.00ms | +0.00ms | +10.08% |
| p99 | 0.01ms | 0.01ms | +0.00ms | +17.53% |
| mean | 0.00ms | 0.00ms | +0.00ms | +4.47% |
| min | 0.00ms | 0.00ms | +0.00ms | +3.88% |
| max | 0.02ms | 0.01ms | +0.00ms | +25.24% |
| total | 0.56ms | 0.53ms | +0.02ms | +4.47% |

