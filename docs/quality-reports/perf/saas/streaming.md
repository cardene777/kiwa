# Perf Suite — streaming

Threshold source: [docs/quality/perf-thresholds.md](../../../quality/perf-thresholds)

測定系の分解能 = 0.00017ms (何もしない関数を同じ経路で呼んだ時の p10)。 回帰判定の絶対下限は既定でこの 2 倍 = 0.00033ms、 op ごとの実効値は下表の「下限」 列。

## Serial (concurrency = 1)

| op | p10 (回帰判定) | p95 (上限判定) | cap | 下限 | gate | regression |
|---|---|---|---|---|---|---|
| kafkaProducerSend | 0.00050ms | 0.0044ms | 10ms | 0.00033ms | PASS | stable (p10 0% (閾値未満)、 p95 +108% (裾は実行間の振れ幅と区別できないため判定には使わない)) — gate 無効 (regressionGate=false) |
| redpandaProducerSend | 0.00046ms | 0.00059ms | 10ms | 0.00033ms | PASS | stable — gate 無効 (regressionGate=false) |
| natsPublish | 0.00042ms | 0.00067ms | 10ms | 0.00033ms | PASS | stable — gate 無効 (regressionGate=false) |
| idempotentProducerSend | 0.00025ms | 0.00038ms | 10ms | 0.00033ms | PASS | stable (検知には +0.00033ms (baseline 比 +133%) 以上の悪化が必要) — gate 無効 (regressionGate=false) |
| readCommittedFilter | 0.00017ms | 0.00033ms | 5ms | 0.00033ms | PASS | stable (検知には +0.00033ms (baseline 比 +199%) 以上の悪化が必要) — gate 無効 (regressionGate=false) |
| dlqHandleSuccess | 0.00029ms | 0.00046ms | 5ms | 0.00033ms | PASS | stable (検知には +0.00033ms (baseline 比 +114%) 以上の悪化が必要) — gate 無効 (regressionGate=false) |
| schemaRegistryRegister | 0.00054ms | 0.0021ms | 5ms | 0.00033ms | PASS | stable — gate 無効 (regressionGate=false) |
| transactionalProducerCycle | 0.0022ms | 0.0040ms | 20ms | 0.00033ms | PASS | stable — gate 無効 (regressionGate=false) |

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
| transactionalProducerCycle | 0.04ms | 40ms | PASS |

## Memory retention (200 iter, arrayBuffers axis is the gate; heap is informational)

| op | heapUsed Δ | arrayBuffers Δ | cap | gc exposed | verdict |
|---|---|---|---|---|---|
| kafkaProducerSend | -102752 B | 0 B | 102400 B | yes | PASS |
| redpandaProducerSend | 17552 B | 0 B | 102400 B | yes | PASS |
| natsPublish | 41040 B | 0 B | 102400 B | yes | PASS |
| idempotentProducerSend | 616 B | 0 B | 102400 B | yes | PASS |
| readCommittedFilter | 848 B | 0 B | 102400 B | yes | PASS |
| dlqHandleSuccess | 1328 B | 0 B | 102400 B | yes | PASS |
| schemaRegistryRegister | 68912 B | 0 B | 102400 B | yes | PASS |
| transactionalProducerCycle | 30416 B | 0 B | 102400 B | yes | PASS |

## Detailed serial reports

### kafkaProducerSend

# Perf Report — kafkaProducerSend.serial

| metric | value |
|---|---|
| iterations | 200 |
| warmup | 5 |
| p10 | 0.00050ms |
| p50 | 0.00054ms |
| p95 | 0.0044ms |
| p99 | 0.0078ms |
| mean | 0.0011ms |
| stdev | 0.0015ms |
| min | 0.00046ms |
| max | 0.01ms |
| total | 0.21ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.00050ms | 0.00050ms | 0.00ms | 0.00% |
| p50 | 0.00054ms | 0.00054ms | 0.00ms | 0.00% |
| p95 | 0.0044ms | 0.0021ms | +0.0023ms | +107.84% |
| p99 | 0.0078ms | 0.0070ms | +0.00071ms | +10.09% |
| mean | 0.0011ms | 0.00099ms | +0.000068ms | +6.83% |
| min | 0.00046ms | 0.00046ms | 0.00ms | 0.00% |
| max | 0.01ms | 0.02ms | -0.0053ms | -31.45% |
| total | 0.21ms | 0.20ms | +0.01ms | +6.83% |

### redpandaProducerSend

# Perf Report — redpandaProducerSend.serial

| metric | value |
|---|---|
| iterations | 200 |
| warmup | 5 |
| p10 | 0.00046ms |
| p50 | 0.00046ms |
| p95 | 0.00059ms |
| p99 | 0.0025ms |
| mean | 0.00052ms |
| stdev | 0.00033ms |
| min | 0.00042ms |
| max | 0.0037ms |
| total | 0.10ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.00046ms | 0.00046ms | 0.00ms | 0.00% |
| p50 | 0.00046ms | 0.00050ms | -0.000041ms | -8.20% |
| p95 | 0.00059ms | 0.00059ms | +0.0000020ms | +0.35% |
| p99 | 0.0025ms | 0.0012ms | +0.0013ms | +114.50% |
| mean | 0.00052ms | 0.00053ms | -0.0000096ms | -1.80% |
| min | 0.00042ms | 0.00042ms | -0.0000010ms | -0.24% |
| max | 0.0037ms | 0.0030ms | +0.00071ms | +23.27% |
| total | 0.10ms | 0.11ms | -0.0019ms | -1.80% |

### natsPublish

# Perf Report — natsPublish.serial

| metric | value |
|---|---|
| iterations | 200 |
| warmup | 5 |
| p10 | 0.00042ms |
| p50 | 0.00050ms |
| p95 | 0.00067ms |
| p99 | 0.0032ms |
| mean | 0.00059ms |
| stdev | 0.00063ms |
| min | 0.00038ms |
| max | 0.0062ms |
| total | 0.12ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.00042ms | 0.00042ms | -0.0000010ms | -0.24% |
| p50 | 0.00050ms | 0.00046ms | +0.000042ms | +9.17% |
| p95 | 0.00067ms | 0.00096ms | -0.00029ms | -30.48% |
| p99 | 0.0032ms | 0.0029ms | +0.00037ms | +12.90% |
| mean | 0.00059ms | 0.00059ms | -0.0000021ms | -0.35% |
| min | 0.00038ms | 0.00042ms | -0.000041ms | -9.86% |
| max | 0.0062ms | 0.0090ms | -0.0029ms | -31.81% |
| total | 0.12ms | 0.12ms | -0.00042ms | -0.35% |

### idempotentProducerSend

# Perf Report — idempotentProducerSend.serial

| metric | value |
|---|---|
| iterations | 200 |
| warmup | 5 |
| p10 | 0.00025ms |
| p50 | 0.00025ms |
| p95 | 0.00038ms |
| p99 | 0.0011ms |
| mean | 0.00031ms |
| stdev | 0.00022ms |
| min | 0.00021ms |
| max | 0.0027ms |
| total | 0.06ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.00025ms | 0.00025ms | 0.00ms | 0.00% |
| p50 | 0.00025ms | 0.00029ms | -0.000041ms | -14.09% |
| p95 | 0.00038ms | 0.00046ms | -0.000080ms | -17.31% |
| p99 | 0.0011ms | 0.0012ms | -0.000087ms | -7.17% |
| mean | 0.00031ms | 0.00032ms | -0.000017ms | -5.36% |
| min | 0.00021ms | 0.00025ms | -0.000042ms | -16.80% |
| max | 0.0027ms | 0.0027ms | -0.000042ms | -1.53% |
| total | 0.06ms | 0.06ms | -0.0035ms | -5.36% |

### readCommittedFilter

# Perf Report — readCommittedFilter.serial

| metric | value |
|---|---|
| iterations | 200 |
| warmup | 5 |
| p10 | 0.00017ms |
| p50 | 0.00021ms |
| p95 | 0.00033ms |
| p99 | 0.0020ms |
| mean | 0.00028ms |
| stdev | 0.00054ms |
| min | 0.00017ms |
| max | 0.0068ms |
| total | 0.06ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.00017ms | 0.00017ms | 0.00ms | 0.00% |
| p50 | 0.00021ms | 0.00021ms | 0.00ms | 0.00% |
| p95 | 0.00033ms | 0.00029ms | +0.000039ms | +13.26% |
| p99 | 0.0020ms | 0.0023ms | -0.00024ms | -10.49% |
| mean | 0.00028ms | 0.00027ms | +0.000010ms | +3.70% |
| min | 0.00017ms | 0.00017ms | 0.00ms | 0.00% |
| max | 0.0068ms | 0.0070ms | -0.00021ms | -2.97% |
| total | 0.06ms | 0.05ms | +0.0020ms | +3.70% |

### dlqHandleSuccess

# Perf Report — dlqHandleSuccess.serial

| metric | value |
|---|---|
| iterations | 200 |
| warmup | 5 |
| p10 | 0.00029ms |
| p50 | 0.00033ms |
| p95 | 0.00046ms |
| p99 | 0.0019ms |
| mean | 0.00038ms |
| stdev | 0.00033ms |
| min | 0.00029ms |
| max | 0.0041ms |
| total | 0.08ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.00029ms | 0.00029ms | 0.00ms | 0.00% |
| p50 | 0.00033ms | 0.00033ms | 0.00ms | 0.00% |
| p95 | 0.00046ms | 0.00055ms | -0.000086ms | -15.76% |
| p99 | 0.0019ms | 0.0013ms | +0.00062ms | +48.27% |
| mean | 0.00038ms | 0.00041ms | -0.000029ms | -7.14% |
| min | 0.00029ms | 0.00029ms | 0.00ms | 0.00% |
| max | 0.0041ms | 0.0078ms | -0.0037ms | -47.86% |
| total | 0.08ms | 0.08ms | -0.0058ms | -7.14% |

### schemaRegistryRegister

# Perf Report — schemaRegistryRegister.serial

| metric | value |
|---|---|
| iterations | 200 |
| warmup | 5 |
| p10 | 0.00054ms |
| p50 | 0.00063ms |
| p95 | 0.0021ms |
| p99 | 0.0064ms |
| mean | 0.0013ms |
| stdev | 0.0063ms |
| min | 0.00054ms |
| max | 0.09ms |
| total | 0.27ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.00054ms | 0.00054ms | +1.0e-7ms | +0.02% |
| p50 | 0.00063ms | 0.00063ms | 0.00ms | 0.00% |
| p95 | 0.0021ms | 0.0023ms | -0.00017ms | -7.63% |
| p99 | 0.0064ms | 0.0051ms | +0.0012ms | +24.13% |
| mean | 0.0013ms | 0.00087ms | +0.00048ms | +55.67% |
| min | 0.00054ms | 0.00046ms | +0.000083ms | +18.12% |
| max | 0.09ms | 0.01ms | +0.08ms | +771.05% |
| total | 0.27ms | 0.17ms | +0.10ms | +55.67% |

### transactionalProducerCycle

# Perf Report — transactionalProducerCycle.serial

| metric | value |
|---|---|
| iterations | 200 |
| warmup | 5 |
| p10 | 0.0022ms |
| p50 | 0.0023ms |
| p95 | 0.0040ms |
| p99 | 0.0093ms |
| mean | 0.0027ms |
| stdev | 0.0016ms |
| min | 0.0022ms |
| max | 0.01ms |
| total | 0.54ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.0022ms | 0.0023ms | -0.000042ms | -1.83% |
| p50 | 0.0023ms | 0.0024ms | -0.000083ms | -3.49% |
| p95 | 0.0040ms | 0.0035ms | +0.00057ms | +16.53% |
| p99 | 0.0093ms | 0.01ms | -0.0055ms | -37.27% |
| mean | 0.0027ms | 0.0028ms | -0.00012ms | -4.36% |
| min | 0.0022ms | 0.0022ms | -0.000042ms | -1.90% |
| max | 0.01ms | 0.03ms | -0.01ms | -43.51% |
| total | 0.54ms | 0.57ms | -0.02ms | -4.36% |

