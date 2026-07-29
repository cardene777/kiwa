# Perf Suite — streaming

Threshold source: [docs/quality/perf-thresholds.md](../../../quality/perf-thresholds)

## Serial p95 (concurrency = 1)

| op | p95 | cap | gate | regression |
|---|---|---|---|---|
| kafkaProducerSend | 0.00ms | 10ms | PASS | stable (検知には +0.5ms (baseline 比 +18853%) 以上の悪化が必要) — gate 無効 (regressionGate=false) |
| redpandaProducerSend | 0.00ms | 10ms | PASS | stable (検知には +0.5ms (baseline 比 +70616%) 以上の悪化が必要) — gate 無効 (regressionGate=false) |
| natsPublish | 0.00ms | 10ms | PASS | stable (検知には +0.5ms (baseline 比 +59805%) 以上の悪化が必要) — gate 無効 (regressionGate=false) |
| idempotentProducerSend | 0.00ms | 10ms | PASS | stable (検知には +0.5ms (baseline 比 +131148%) 以上の悪化が必要) — gate 無効 (regressionGate=false) |
| readCommittedFilter | 0.00ms | 5ms | PASS | stable (検知には +0.5ms (baseline 比 +200000%) 以上の悪化が必要) — gate 無効 (regressionGate=false) |
| dlqHandleSuccess | 0.00ms | 5ms | PASS | stable (検知には +0.5ms (baseline 比 +92251%) 以上の悪化が必要) — gate 無効 (regressionGate=false) |
| schemaRegistryRegister | 0.01ms | 5ms | PASS | stable (検知には +0.5ms (baseline 比 +22645%) 以上の悪化が必要) — gate 無効 (regressionGate=false) |
| transactionalProducerCycle | 0.00ms | 20ms | PASS | stable (検知には +0.5ms (baseline 比 +11288%) 以上の悪化が必要) — gate 無効 (regressionGate=false) |

## Concurrent p95 (concurrency = 10, 50 iter each)

| op | p95 | cap | gate |
|---|---|---|---|
| kafkaProducerSend | 0.01ms | 20ms | PASS |
| redpandaProducerSend | 0.01ms | 20ms | PASS |
| natsPublish | 0.01ms | 20ms | PASS |
| idempotentProducerSend | 0.00ms | 20ms | PASS |
| readCommittedFilter | 0.00ms | 10ms | PASS |
| dlqHandleSuccess | 0.00ms | 10ms | PASS |
| schemaRegistryRegister | 0.04ms | 10ms | PASS |
| transactionalProducerCycle | 0.04ms | 40ms | PASS |

## Memory retention (200 iter, arrayBuffers axis is the gate; heap is informational)

| op | heapUsed Δ | arrayBuffers Δ | cap | gc exposed | verdict |
|---|---|---|---|---|---|
| kafkaProducerSend | 10696 B | 0 B | 102400 B | yes | PASS |
| redpandaProducerSend | 18944 B | 0 B | 102400 B | yes | PASS |
| natsPublish | 40944 B | 0 B | 102400 B | yes | PASS |
| idempotentProducerSend | 520 B | 0 B | 102400 B | yes | PASS |
| readCommittedFilter | 944 B | 0 B | 102400 B | yes | PASS |
| dlqHandleSuccess | 1328 B | 0 B | 102400 B | yes | PASS |
| schemaRegistryRegister | 68912 B | 0 B | 102400 B | yes | PASS |
| transactionalProducerCycle | 29136 B | 0 B | 102400 B | yes | PASS |

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
| max | 0.02ms |
| total | 0.24ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p50 | 0.00ms | 0.00ms | +0.00ms | +10.00% |
| p95 | 0.00ms | 0.00ms | -0.00ms | -6.97% |
| p99 | 0.01ms | 0.01ms | +0.00ms | +40.51% |
| mean | 0.00ms | 0.00ms | +0.00ms | +10.80% |
| min | 0.00ms | 0.00ms | +0.00ms | +9.17% |
| max | 0.02ms | 0.02ms | +0.00ms | +15.43% |
| total | 0.24ms | 0.21ms | +0.02ms | +10.80% |

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
| total | 0.11ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p50 | 0.00ms | 0.00ms | +0.00ms | +8.20% |
| p95 | 0.00ms | 0.00ms | -0.00ms | -11.44% |
| p99 | 0.00ms | 0.00ms | -0.00ms | -24.50% |
| mean | 0.00ms | 0.00ms | +0.00ms | +3.72% |
| min | 0.00ms | 0.00ms | +0.00ms | +10.07% |
| max | 0.00ms | 0.00ms | -0.00ms | -25.24% |
| total | 0.11ms | 0.11ms | +0.00ms | +3.72% |

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
| p50 | 0.00ms | 0.00ms | +0.00ms | +10.07% |
| p95 | 0.00ms | 0.00ms | +0.00ms | +4.91% |
| p99 | 0.01ms | 0.00ms | +0.00ms | +66.40% |
| mean | 0.00ms | 0.00ms | +0.00ms | +15.43% |
| min | 0.00ms | 0.00ms | +0.00ms | +10.93% |
| max | 0.01ms | 0.01ms | +0.01ms | +96.06% |
| total | 0.13ms | 0.12ms | +0.02ms | +15.43% |

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
| p95 | 0.00ms | 0.00ms | +0.00ms | +32.79% |
| p99 | 0.00ms | 0.00ms | +0.00ms | +11.65% |
| mean | 0.00ms | 0.00ms | +0.00ms | +8.17% |
| min | 0.00ms | 0.00ms | 0.00ms | 0.00% |
| max | 0.00ms | 0.00ms | +0.00ms | +18.67% |
| total | 0.07ms | 0.06ms | +0.01ms | +8.17% |

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
| p50 | 0.00ms | 0.00ms | +0.00ms | +0.48% |
| p95 | 0.00ms | 0.00ms | +0.00ms | +17.62% |
| p99 | 0.00ms | 0.00ms | +0.00ms | +3.46% |
| mean | 0.00ms | 0.00ms | +0.00ms | +9.14% |
| min | 0.00ms | 0.00ms | 0.00ms | 0.00% |
| max | 0.01ms | 0.01ms | +0.00ms | +18.91% |
| total | 0.06ms | 0.05ms | +0.00ms | +9.14% |

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
| total | 0.09ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p50 | 0.00ms | 0.00ms | +0.00ms | +12.61% |
| p95 | 0.00ms | 0.00ms | -0.00ms | -6.98% |
| p99 | 0.00ms | 0.00ms | +0.00ms | +81.70% |
| mean | 0.00ms | 0.00ms | +0.00ms | +21.65% |
| min | 0.00ms | 0.00ms | +0.00ms | +14.43% |
| max | 0.00ms | 0.00ms | +0.00ms | +303.23% |
| total | 0.09ms | 0.07ms | +0.02ms | +21.65% |

### schemaRegistryRegister

# Perf Report — schemaRegistryRegister.serial

| metric | value |
|---|---|
| iterations | 200 |
| warmup | 5 |
| p50 | 0.00ms |
| p95 | 0.01ms |
| p99 | 0.01ms |
| mean | 0.00ms |
| stdev | 0.00ms |
| min | 0.00ms |
| max | 0.02ms |
| total | 0.32ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p50 | 0.00ms | 0.00ms | +0.00ms | +53.28% |
| p95 | 0.01ms | 0.00ms | +0.00ms | +141.42% |
| p99 | 0.01ms | 0.00ms | +0.01ms | +202.96% |
| mean | 0.00ms | 0.00ms | +0.00ms | +86.93% |
| min | 0.00ms | 0.00ms | +0.00ms | +15.53% |
| max | 0.02ms | 0.01ms | +0.02ms | +151.67% |
| total | 0.32ms | 0.17ms | +0.15ms | +86.93% |

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
| total | 0.61ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p50 | 0.00ms | 0.00ms | +0.00ms | +5.13% |
| p95 | 0.00ms | 0.00ms | -0.00ms | -13.18% |
| p99 | 0.01ms | 0.01ms | +0.00ms | +17.73% |
| mean | 0.00ms | 0.00ms | +0.00ms | +4.90% |
| min | 0.00ms | 0.00ms | +0.00ms | +7.38% |
| max | 0.02ms | 0.02ms | +0.00ms | +14.32% |
| total | 0.61ms | 0.58ms | +0.03ms | +4.90% |

