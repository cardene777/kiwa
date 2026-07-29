# Perf Suite — streaming

Threshold source: [docs/quality/perf-thresholds.md](../../../quality/perf-thresholds)

測定系の分解能 = 0.00017ms (何もしない関数を同じ経路で呼んだ時の p10)。 回帰判定の絶対下限は既定でこの 2 倍 = 0.00033ms、 op ごとの実効値は下表の「下限」 列。

## Serial (concurrency = 1)

| op | p10 (回帰判定) | p95 (上限判定) | cap | 下限 | gate | regression |
|---|---|---|---|---|---|---|
| kafkaProducerSend | 0.00046ms | 0.0022ms | 10ms | 0.00033ms | PASS | stable — gate 無効 (regressionGate=false) |
| redpandaProducerSend | 0.00046ms | 0.00059ms | 10ms | 0.00033ms | PASS | stable — gate 無効 (regressionGate=false) |
| natsPublish | 0.00042ms | 0.00054ms | 10ms | 0.00033ms | PASS | stable — gate 無効 (regressionGate=false) |
| idempotentProducerSend | 0.00025ms | 0.00051ms | 10ms | 0.00033ms | PASS | stable (検知には +0.00033ms (baseline 比 +133%) 以上の悪化が必要) — gate 無効 (regressionGate=false) |
| readCommittedFilter | 0.00017ms | 0.00029ms | 5ms | 0.00033ms | PASS | stable (検知には +0.00033ms (baseline 比 +199%) 以上の悪化が必要) — gate 無効 (regressionGate=false) |
| dlqHandleSuccess | 0.00029ms | 0.00050ms | 5ms | 0.00033ms | PASS | stable (検知には +0.00033ms (baseline 比 +114%) 以上の悪化が必要) — gate 無効 (regressionGate=false) |
| schemaRegistryRegister | 0.00050ms | 0.0021ms | 5ms | 0.00033ms | PASS | stable — gate 無効 (regressionGate=false) |
| transactionalProducerCycle | 0.0023ms | 0.0035ms | 20ms | 0.00033ms | PASS | stable — gate 無効 (regressionGate=false) |

## Concurrent p95 (concurrency = 10, 50 iter each)

| op | p95 | cap | gate |
|---|---|---|---|
| kafkaProducerSend | 0.01ms | 20ms | PASS |
| redpandaProducerSend | 0.01ms | 20ms | PASS |
| natsPublish | 0.01ms | 20ms | PASS |
| idempotentProducerSend | 0.00ms | 20ms | PASS |
| readCommittedFilter | 0.01ms | 10ms | PASS |
| dlqHandleSuccess | 0.00ms | 10ms | PASS |
| schemaRegistryRegister | 0.02ms | 10ms | PASS |
| transactionalProducerCycle | 0.04ms | 40ms | PASS |

## Memory retention (200 iter, arrayBuffers axis is the gate; heap is informational)

| op | heapUsed Δ | arrayBuffers Δ | cap | gc exposed | verdict |
|---|---|---|---|---|---|
| kafkaProducerSend | 20440 B | 0 B | 102400 B | yes | PASS |
| redpandaProducerSend | 17432 B | 0 B | 102400 B | yes | PASS |
| natsPublish | 40944 B | 0 B | 102400 B | yes | PASS |
| idempotentProducerSend | 3192 B | 0 B | 102400 B | yes | PASS |
| readCommittedFilter | 848 B | 0 B | 102400 B | yes | PASS |
| dlqHandleSuccess | -928 B | 0 B | 102400 B | yes | PASS |
| schemaRegistryRegister | 68912 B | 0 B | 102400 B | yes | PASS |
| transactionalProducerCycle | 30416 B | 0 B | 102400 B | yes | PASS |

## Detailed serial reports

### kafkaProducerSend

# Perf Report — kafkaProducerSend.serial

| metric | value |
|---|---|
| iterations | 200 |
| warmup | 5 |
| p10 | 0.00046ms |
| p50 | 0.00063ms |
| p95 | 0.0022ms |
| p99 | 0.0068ms |
| mean | 0.00092ms |
| stdev | 0.0011ms |
| min | 0.00046ms |
| max | 0.0085ms |
| total | 0.18ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.00046ms | 0.00050ms | -0.000041ms | -8.20% |
| p50 | 0.00063ms | 0.00054ms | +0.000083ms | +15.31% |
| p95 | 0.0022ms | 0.0021ms | +0.00010ms | +4.84% |
| p99 | 0.0068ms | 0.0070ms | -0.00029ms | -4.07% |
| mean | 0.00092ms | 0.00099ms | -0.000070ms | -7.05% |
| min | 0.00046ms | 0.00046ms | 0.00ms | 0.00% |
| max | 0.0085ms | 0.02ms | -0.0085ms | -49.88% |
| total | 0.18ms | 0.20ms | -0.01ms | -7.05% |

### redpandaProducerSend

# Perf Report — redpandaProducerSend.serial

| metric | value |
|---|---|
| iterations | 200 |
| warmup | 5 |
| p10 | 0.00046ms |
| p50 | 0.00046ms |
| p95 | 0.00059ms |
| p99 | 0.0028ms |
| mean | 0.00055ms |
| stdev | 0.00044ms |
| min | 0.00042ms |
| max | 0.0055ms |
| total | 0.11ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.00046ms | 0.00046ms | 0.00ms | 0.00% |
| p50 | 0.00046ms | 0.00050ms | -0.000041ms | -8.20% |
| p95 | 0.00059ms | 0.00059ms | +0.0000083ms | +1.42% |
| p99 | 0.0028ms | 0.0012ms | +0.0016ms | +139.15% |
| mean | 0.00055ms | 0.00053ms | +0.000017ms | +3.17% |
| min | 0.00042ms | 0.00042ms | -0.0000010ms | -0.24% |
| max | 0.0055ms | 0.0030ms | +0.0024ms | +79.45% |
| total | 0.11ms | 0.11ms | +0.0034ms | +3.17% |

### natsPublish

# Perf Report — natsPublish.serial

| metric | value |
|---|---|
| iterations | 200 |
| warmup | 5 |
| p10 | 0.00042ms |
| p50 | 0.00042ms |
| p95 | 0.00054ms |
| p99 | 0.0035ms |
| mean | 0.00056ms |
| stdev | 0.00077ms |
| min | 0.00038ms |
| max | 0.0075ms |
| total | 0.11ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.00042ms | 0.00042ms | -0.0000010ms | -0.24% |
| p50 | 0.00042ms | 0.00046ms | -0.000041ms | -8.95% |
| p95 | 0.00054ms | 0.00096ms | -0.00042ms | -43.60% |
| p99 | 0.0035ms | 0.0029ms | +0.00063ms | +22.00% |
| mean | 0.00056ms | 0.00059ms | -0.000030ms | -5.04% |
| min | 0.00038ms | 0.00042ms | -0.000041ms | -9.86% |
| max | 0.0075ms | 0.0090ms | -0.0015ms | -16.59% |
| total | 0.11ms | 0.12ms | -0.0060ms | -5.04% |

### idempotentProducerSend

# Perf Report — idempotentProducerSend.serial

| metric | value |
|---|---|
| iterations | 200 |
| warmup | 5 |
| p10 | 0.00025ms |
| p50 | 0.00029ms |
| p95 | 0.00051ms |
| p99 | 0.0031ms |
| mean | 0.00035ms |
| stdev | 0.00042ms |
| min | 0.00025ms |
| max | 0.0040ms |
| total | 0.07ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.00025ms | 0.00025ms | 0.00ms | 0.00% |
| p50 | 0.00029ms | 0.00029ms | 0.00ms | 0.00% |
| p95 | 0.00051ms | 0.00046ms | +0.000045ms | +9.80% |
| p99 | 0.0031ms | 0.0012ms | +0.0019ms | +153.81% |
| mean | 0.00035ms | 0.00032ms | +0.000027ms | +8.32% |
| min | 0.00025ms | 0.00025ms | 0.00ms | 0.00% |
| max | 0.0040ms | 0.0027ms | +0.0013ms | +45.45% |
| total | 0.07ms | 0.06ms | +0.0054ms | +8.32% |

### readCommittedFilter

# Perf Report — readCommittedFilter.serial

| metric | value |
|---|---|
| iterations | 200 |
| warmup | 5 |
| p10 | 0.00017ms |
| p50 | 0.00021ms |
| p95 | 0.00029ms |
| p99 | 0.0020ms |
| mean | 0.00027ms |
| stdev | 0.00055ms |
| min | 0.00017ms |
| max | 0.0072ms |
| total | 0.05ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.00017ms | 0.00017ms | 0.00ms | 0.00% |
| p50 | 0.00021ms | 0.00021ms | 0.00ms | 0.00% |
| p95 | 0.00029ms | 0.00029ms | -0.0000020ms | -0.70% |
| p99 | 0.0020ms | 0.0023ms | -0.00028ms | -12.63% |
| mean | 0.00027ms | 0.00027ms | +0.0000051ms | +1.90% |
| min | 0.00017ms | 0.00017ms | 0.00ms | 0.00% |
| max | 0.0072ms | 0.0070ms | +0.00021ms | +2.97% |
| total | 0.05ms | 0.05ms | +0.0010ms | +1.90% |

### dlqHandleSuccess

# Perf Report — dlqHandleSuccess.serial

| metric | value |
|---|---|
| iterations | 200 |
| warmup | 5 |
| p10 | 0.00029ms |
| p50 | 0.00033ms |
| p95 | 0.00050ms |
| p99 | 0.0025ms |
| mean | 0.00041ms |
| stdev | 0.00041ms |
| min | 0.00029ms |
| max | 0.0048ms |
| total | 0.08ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.00029ms | 0.00029ms | 0.00ms | 0.00% |
| p50 | 0.00033ms | 0.00033ms | 0.00ms | 0.00% |
| p95 | 0.00050ms | 0.00055ms | -0.000044ms | -8.07% |
| p99 | 0.0025ms | 0.0013ms | +0.0012ms | +90.23% |
| mean | 0.00041ms | 0.00041ms | +0.0000016ms | +0.41% |
| min | 0.00029ms | 0.00029ms | 0.00ms | 0.00% |
| max | 0.0048ms | 0.0078ms | -0.0030ms | -38.82% |
| total | 0.08ms | 0.08ms | +0.00033ms | +0.41% |

### schemaRegistryRegister

# Perf Report — schemaRegistryRegister.serial

| metric | value |
|---|---|
| iterations | 200 |
| warmup | 5 |
| p10 | 0.00050ms |
| p50 | 0.00060ms |
| p95 | 0.0021ms |
| p99 | 0.0047ms |
| mean | 0.00086ms |
| stdev | 0.0011ms |
| min | 0.00042ms |
| max | 0.01ms |
| total | 0.17ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.00050ms | 0.00054ms | -0.000042ms | -7.73% |
| p50 | 0.00060ms | 0.00063ms | -0.000021ms | -3.28% |
| p95 | 0.0021ms | 0.0023ms | -0.00017ms | -7.58% |
| p99 | 0.0047ms | 0.0051ms | -0.00046ms | -8.89% |
| mean | 0.00086ms | 0.00087ms | -0.0000021ms | -0.24% |
| min | 0.00042ms | 0.00046ms | -0.000041ms | -8.95% |
| max | 0.01ms | 0.01ms | +0.0023ms | +22.04% |
| total | 0.17ms | 0.17ms | -0.00042ms | -0.24% |

### transactionalProducerCycle

# Perf Report — transactionalProducerCycle.serial

| metric | value |
|---|---|
| iterations | 200 |
| warmup | 5 |
| p10 | 0.0023ms |
| p50 | 0.0024ms |
| p95 | 0.0035ms |
| p99 | 0.01ms |
| mean | 0.0028ms |
| stdev | 0.0016ms |
| min | 0.0022ms |
| max | 0.02ms |
| total | 0.56ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.0023ms | 0.0023ms | 0.00ms | 0.00% |
| p50 | 0.0024ms | 0.0024ms | 0.00ms | 0.00% |
| p95 | 0.0035ms | 0.0035ms | -0.0000072ms | -0.21% |
| p99 | 0.01ms | 0.01ms | -0.0028ms | -19.04% |
| mean | 0.0028ms | 0.0028ms | -0.000053ms | -1.86% |
| min | 0.0022ms | 0.0022ms | +0.000042ms | +1.90% |
| max | 0.02ms | 0.03ms | -0.01ms | -40.35% |
| total | 0.56ms | 0.57ms | -0.01ms | -1.86% |

