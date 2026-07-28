# Perf Suite — streaming

Threshold source: [docs/quality/perf-thresholds.md](../../../quality/perf-thresholds)

## Serial p95 (concurrency = 1)

| op | p95 | cap | gate | regression |
|---|---|---|---|---|
| kafkaProducerSend | 0.00ms | 10ms | PASS | stable (検知には +0.5ms (baseline 比 +18853%) 以上の悪化が必要) |
| redpandaProducerSend | 0.00ms | 10ms | PASS | stable (検知には +0.5ms (baseline 比 +70616%) 以上の悪化が必要) |
| natsPublish | 0.00ms | 10ms | PASS | stable (検知には +0.5ms (baseline 比 +59805%) 以上の悪化が必要) |
| idempotentProducerSend | 0.00ms | 10ms | PASS | stable (検知には +0.5ms (baseline 比 +131148%) 以上の悪化が必要) |
| readCommittedFilter | 0.00ms | 5ms | PASS | stable (検知には +0.5ms (baseline 比 +200000%) 以上の悪化が必要) |
| dlqHandleSuccess | 0.00ms | 5ms | PASS | stable (検知には +0.5ms (baseline 比 +92251%) 以上の悪化が必要) |
| schemaRegistryRegister | 0.00ms | 5ms | PASS | stable (検知には +0.5ms (baseline 比 +22645%) 以上の悪化が必要) |
| transactionalProducerCycle | 0.00ms | 20ms | PASS | stable (検知には +0.5ms (baseline 比 +11288%) 以上の悪化が必要) |

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

| op | heapUsed Δ | arrayBuffers Δ | cap | gc exposed | verdict |
|---|---|---|---|---|---|
| kafkaProducerSend | 10944 B | 0 B | 102400 B | yes | PASS |
| redpandaProducerSend | 18376 B | 0 B | 102400 B | yes | PASS |
| natsPublish | 41040 B | 0 B | 102400 B | yes | PASS |
| idempotentProducerSend | 616 B | 0 B | 102400 B | yes | PASS |
| readCommittedFilter | 944 B | 0 B | 102400 B | yes | PASS |
| dlqHandleSuccess | 1328 B | 0 B | 102400 B | yes | PASS |
| schemaRegistryRegister | 68912 B | 0 B | 102400 B | yes | PASS |
| transactionalProducerCycle | 29344 B | 0 B | 102400 B | yes | PASS |

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
| total | 0.20ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p50 | 0.00ms | 0.00ms | 0.00ms | 0.00% |
| p95 | 0.00ms | 0.00ms | -0.00ms | -14.45% |
| p99 | 0.01ms | 0.01ms | +0.00ms | +5.54% |
| mean | 0.00ms | 0.00ms | -0.00ms | -8.52% |
| min | 0.00ms | 0.00ms | 0.00ms | 0.00% |
| max | 0.01ms | 0.02ms | -0.00ms | -28.93% |
| total | 0.20ms | 0.21ms | -0.02ms | -8.52% |

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
| p95 | 0.00ms | 0.00ms | -0.00ms | -5.51% |
| p99 | 0.00ms | 0.00ms | -0.00ms | -34.79% |
| mean | 0.00ms | 0.00ms | +0.00ms | +2.05% |
| min | 0.00ms | 0.00ms | 0.00ms | 0.00% |
| max | 0.01ms | 0.00ms | +0.01ms | +140.41% |
| total | 0.11ms | 0.11ms | +0.00ms | +2.05% |

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
| p95 | 0.00ms | 0.00ms | +0.00ms | +1.13% |
| p99 | 0.01ms | 0.00ms | +0.00ms | +47.64% |
| mean | 0.00ms | 0.00ms | +0.00ms | +11.25% |
| min | 0.00ms | 0.00ms | -0.00ms | -11.20% |
| max | 0.01ms | 0.01ms | +0.00ms | +54.48% |
| total | 0.13ms | 0.12ms | +0.01ms | +11.25% |

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
| total | 0.09ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p50 | 0.00ms | 0.00ms | +0.00ms | +0.34% |
| p95 | 0.00ms | 0.00ms | +0.00ms | +21.22% |
| p99 | 0.00ms | 0.00ms | +0.00ms | +82.15% |
| mean | 0.00ms | 0.00ms | +0.00ms | +33.60% |
| min | 0.00ms | 0.00ms | 0.00ms | 0.00% |
| max | 0.01ms | 0.00ms | +0.01ms | +445.81% |
| total | 0.09ms | 0.06ms | +0.02ms | +33.60% |

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
| p99 | 0.00ms | 0.00ms | -0.00ms | -8.78% |
| mean | 0.00ms | 0.00ms | -0.00ms | -0.83% |
| min | 0.00ms | 0.00ms | 0.00ms | 0.00% |
| max | 0.01ms | 0.01ms | +0.00ms | +18.24% |
| total | 0.05ms | 0.05ms | -0.00ms | -0.83% |

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
| total | 0.09ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p50 | 0.00ms | 0.00ms | +0.00ms | +12.61% |
| p95 | 0.00ms | 0.00ms | +0.00ms | +0.38% |
| p99 | 0.00ms | 0.00ms | +0.00ms | +100.07% |
| mean | 0.00ms | 0.00ms | +0.00ms | +22.66% |
| min | 0.00ms | 0.00ms | +0.00ms | +14.43% |
| max | 0.01ms | 0.00ms | +0.00ms | +348.06% |
| total | 0.09ms | 0.07ms | +0.02ms | +22.66% |

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
| total | 0.19ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p50 | 0.00ms | 0.00ms | 0.00ms | 0.00% |
| p95 | 0.00ms | 0.00ms | +0.00ms | +3.32% |
| p99 | 0.01ms | 0.00ms | +0.00ms | +29.82% |
| mean | 0.00ms | 0.00ms | +0.00ms | +9.37% |
| min | 0.00ms | 0.00ms | -0.00ms | -7.58% |
| max | 0.01ms | 0.01ms | +0.00ms | +31.51% |
| total | 0.19ms | 0.17ms | +0.02ms | +9.37% |

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
| max | 0.01ms |
| total | 0.53ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p50 | 0.00ms | 0.00ms | -0.00ms | -5.09% |
| p95 | 0.00ms | 0.00ms | -0.00ms | -25.21% |
| p99 | 0.01ms | 0.01ms | -0.00ms | -14.06% |
| mean | 0.00ms | 0.00ms | -0.00ms | -7.95% |
| min | 0.00ms | 0.00ms | -0.00ms | -3.69% |
| max | 0.01ms | 0.02ms | -0.00ms | -26.42% |
| total | 0.53ms | 0.58ms | -0.05ms | -7.95% |

