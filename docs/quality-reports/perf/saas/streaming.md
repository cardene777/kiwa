# Perf Suite — streaming

Threshold source: [docs/quality/perf-thresholds.md](../../../quality/perf-thresholds)

測定系の分解能 = 0.00017ms (何もしない関数を同じ経路で呼んだ時の p10)。 回帰判定の絶対下限は既定でこの 2 倍 = 0.00033ms、 op ごとの実効値は下表の「下限」 列。

## Serial (concurrency = 1)

| op | p10 (回帰判定) | p95 (上限判定) | cap | 下限 | gate | regression |
|---|---|---|---|---|---|---|
| kafkaProducerSend | 0.00050ms | 0.0020ms | 10ms | 0.00033ms | PASS | stable — gate 無効 (regressionGate=false) |
| redpandaProducerSend | 0.00046ms | 0.00063ms | 10ms | 0.00033ms | PASS | stable — gate 無効 (regressionGate=false) |
| natsPublish | 0.00042ms | 0.0010ms | 10ms | 0.00033ms | PASS | stable — gate 無効 (regressionGate=false) |
| idempotentProducerSend | 0.00025ms | 0.00046ms | 10ms | 0.00033ms | PASS | stable (検知には +0.00033ms (baseline 比 +133%) 以上の悪化が必要) — gate 無効 (regressionGate=false) |
| readCommittedFilter | 0.00017ms | 0.00033ms | 5ms | 0.00033ms | PASS | stable (検知には +0.00033ms (baseline 比 +199%) 以上の悪化が必要) — gate 無効 (regressionGate=false) |
| dlqHandleSuccess | 0.00029ms | 0.00050ms | 5ms | 0.00033ms | PASS | stable (検知には +0.00033ms (baseline 比 +114%) 以上の悪化が必要) — gate 無効 (regressionGate=false) |
| schemaRegistryRegister | 0.00050ms | 0.0028ms | 5ms | 0.00033ms | PASS | stable (p10 -8% (閾値未満)、 p95 +26% (裾は実行間の振れ幅と区別できないため判定には使わない)) — gate 無効 (regressionGate=false) |
| transactionalProducerCycle | 0.0023ms | 0.0032ms | 20ms | 0.00033ms | PASS | stable — gate 無効 (regressionGate=false) |

## Concurrent p95 (concurrency = 10, 50 iter each)

| op | p95 | cap | gate |
|---|---|---|---|
| kafkaProducerSend | 0.01ms | 20ms | PASS |
| redpandaProducerSend | 0.01ms | 20ms | PASS |
| natsPublish | 0.01ms | 20ms | PASS |
| idempotentProducerSend | 0.00ms | 20ms | PASS |
| readCommittedFilter | 0.01ms | 10ms | PASS |
| dlqHandleSuccess | 0.01ms | 10ms | PASS |
| schemaRegistryRegister | 0.03ms | 10ms | PASS |
| transactionalProducerCycle | 0.04ms | 40ms | PASS |

## Memory retention (200 iter, arrayBuffers axis is the gate; heap is informational)

| op | heapUsed Δ | arrayBuffers Δ | cap | gc exposed | verdict |
|---|---|---|---|---|---|
| kafkaProducerSend | 13784 B | 0 B | 102400 B | yes | PASS |
| redpandaProducerSend | 17552 B | 0 B | 102400 B | yes | PASS |
| natsPublish | 40944 B | 0 B | 102400 B | yes | PASS |
| idempotentProducerSend | 3088 B | 0 B | 102400 B | yes | PASS |
| readCommittedFilter | -184 B | 0 B | 102400 B | yes | PASS |
| dlqHandleSuccess | 1328 B | 0 B | 102400 B | yes | PASS |
| schemaRegistryRegister | 68832 B | 0 B | 102400 B | yes | PASS |
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
| p95 | 0.0020ms |
| p99 | 0.0066ms |
| mean | 0.00091ms |
| stdev | 0.0011ms |
| min | 0.00046ms |
| max | 0.0083ms |
| total | 0.18ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.00050ms | 0.00050ms | 0.00ms | 0.00% |
| p50 | 0.00054ms | 0.00054ms | -5.0e-7ms | -0.09% |
| p95 | 0.0020ms | 0.0021ms | -0.00013ms | -6.03% |
| p99 | 0.0066ms | 0.0070ms | -0.00050ms | -7.03% |
| mean | 0.00091ms | 0.00099ms | -0.000088ms | -8.88% |
| min | 0.00046ms | 0.00046ms | 0.00ms | 0.00% |
| max | 0.0083ms | 0.02ms | -0.0087ms | -51.11% |
| total | 0.18ms | 0.20ms | -0.02ms | -8.88% |

### redpandaProducerSend

# Perf Report — redpandaProducerSend.serial

| metric | value |
|---|---|
| iterations | 200 |
| warmup | 5 |
| p10 | 0.00046ms |
| p50 | 0.00050ms |
| p95 | 0.00063ms |
| p99 | 0.0018ms |
| mean | 0.00054ms |
| stdev | 0.00039ms |
| min | 0.00046ms |
| max | 0.0047ms |
| total | 0.11ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.00046ms | 0.00046ms | 0.00ms | 0.00% |
| p50 | 0.00050ms | 0.00050ms | 0.00ms | 0.00% |
| p95 | 0.00063ms | 0.00059ms | +0.000039ms | +6.65% |
| p99 | 0.0018ms | 0.0012ms | +0.00064ms | +54.75% |
| mean | 0.00054ms | 0.00053ms | +0.000010ms | +1.87% |
| min | 0.00046ms | 0.00042ms | +0.000041ms | +9.83% |
| max | 0.0047ms | 0.0030ms | +0.0017ms | +54.77% |
| total | 0.11ms | 0.11ms | +0.0020ms | +1.87% |

### natsPublish

# Perf Report — natsPublish.serial

| metric | value |
|---|---|
| iterations | 200 |
| warmup | 5 |
| p10 | 0.00042ms |
| p50 | 0.00042ms |
| p95 | 0.0010ms |
| p99 | 0.0071ms |
| mean | 0.00069ms |
| stdev | 0.0016ms |
| min | 0.00038ms |
| max | 0.02ms |
| total | 0.14ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.00042ms | 0.00042ms | -0.0000010ms | -0.24% |
| p50 | 0.00042ms | 0.00046ms | -0.000041ms | -8.95% |
| p95 | 0.0010ms | 0.00096ms | +0.000056ms | +5.79% |
| p99 | 0.0071ms | 0.0029ms | +0.0042ms | +147.32% |
| mean | 0.00069ms | 0.00059ms | +0.000095ms | +15.98% |
| min | 0.00038ms | 0.00042ms | -0.000041ms | -9.86% |
| max | 0.02ms | 0.0090ms | +0.01ms | +119.81% |
| total | 0.14ms | 0.12ms | +0.02ms | +15.98% |

### idempotentProducerSend

# Perf Report — idempotentProducerSend.serial

| metric | value |
|---|---|
| iterations | 200 |
| warmup | 5 |
| p10 | 0.00025ms |
| p50 | 0.00029ms |
| p95 | 0.00046ms |
| p99 | 0.0013ms |
| mean | 0.00032ms |
| stdev | 0.00028ms |
| min | 0.00025ms |
| max | 0.0030ms |
| total | 0.06ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.00025ms | 0.00025ms | 0.00ms | 0.00% |
| p50 | 0.00029ms | 0.00029ms | 0.00ms | 0.00% |
| p95 | 0.00046ms | 0.00046ms | -0.0000030ms | -0.66% |
| p99 | 0.0013ms | 0.0012ms | +0.00013ms | +10.80% |
| mean | 0.00032ms | 0.00032ms | -0.0000025ms | -0.78% |
| min | 0.00025ms | 0.00025ms | 0.00ms | 0.00% |
| max | 0.0030ms | 0.0027ms | +0.00025ms | +9.09% |
| total | 0.06ms | 0.06ms | -0.00051ms | -0.78% |

### readCommittedFilter

# Perf Report — readCommittedFilter.serial

| metric | value |
|---|---|
| iterations | 200 |
| warmup | 5 |
| p10 | 0.00017ms |
| p50 | 0.00021ms |
| p95 | 0.00033ms |
| p99 | 0.0022ms |
| mean | 0.00027ms |
| stdev | 0.00052ms |
| min | 0.00017ms |
| max | 0.0068ms |
| total | 0.05ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.00017ms | 0.00017ms | -1.0e-7ms | -0.06% |
| p50 | 0.00021ms | 0.00021ms | 0.00ms | 0.00% |
| p95 | 0.00033ms | 0.00029ms | +0.000039ms | +13.25% |
| p99 | 0.0022ms | 0.0023ms | -0.000080ms | -3.56% |
| mean | 0.00027ms | 0.00027ms | -0.0000015ms | -0.57% |
| min | 0.00017ms | 0.00017ms | 0.00ms | 0.00% |
| max | 0.0068ms | 0.0070ms | -0.00021ms | -2.99% |
| total | 0.05ms | 0.05ms | -0.00030ms | -0.57% |

### dlqHandleSuccess

# Perf Report — dlqHandleSuccess.serial

| metric | value |
|---|---|
| iterations | 200 |
| warmup | 5 |
| p10 | 0.00029ms |
| p50 | 0.00033ms |
| p95 | 0.00050ms |
| p99 | 0.0018ms |
| mean | 0.00038ms |
| stdev | 0.00035ms |
| min | 0.00029ms |
| max | 0.0046ms |
| total | 0.08ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.00029ms | 0.00029ms | 0.00ms | 0.00% |
| p50 | 0.00033ms | 0.00033ms | 0.00ms | 0.00% |
| p95 | 0.00050ms | 0.00055ms | -0.000042ms | -7.69% |
| p99 | 0.0018ms | 0.0013ms | +0.00050ms | +38.57% |
| mean | 0.00038ms | 0.00041ms | -0.000026ms | -6.48% |
| min | 0.00029ms | 0.00029ms | 0.00ms | 0.00% |
| max | 0.0046ms | 0.0078ms | -0.0032ms | -40.95% |
| total | 0.08ms | 0.08ms | -0.0053ms | -6.48% |

### schemaRegistryRegister

# Perf Report — schemaRegistryRegister.serial

| metric | value |
|---|---|
| iterations | 200 |
| warmup | 5 |
| p10 | 0.00050ms |
| p50 | 0.00063ms |
| p95 | 0.0028ms |
| p99 | 0.0086ms |
| mean | 0.0011ms |
| stdev | 0.0021ms |
| min | 0.00042ms |
| max | 0.02ms |
| total | 0.22ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.00050ms | 0.00054ms | -0.000042ms | -7.73% |
| p50 | 0.00063ms | 0.00063ms | 0.00ms | 0.00% |
| p95 | 0.0028ms | 0.0023ms | +0.00059ms | +26.04% |
| p99 | 0.0086ms | 0.0051ms | +0.0035ms | +67.40% |
| mean | 0.0011ms | 0.00087ms | +0.00022ms | +25.60% |
| min | 0.00042ms | 0.00046ms | -0.000042ms | -9.17% |
| max | 0.02ms | 0.01ms | +0.01ms | +127.35% |
| total | 0.22ms | 0.17ms | +0.04ms | +25.60% |

### transactionalProducerCycle

# Perf Report — transactionalProducerCycle.serial

| metric | value |
|---|---|
| iterations | 200 |
| warmup | 5 |
| p10 | 0.0023ms |
| p50 | 0.0024ms |
| p95 | 0.0032ms |
| p99 | 0.0095ms |
| mean | 0.0027ms |
| stdev | 0.0014ms |
| min | 0.0022ms |
| max | 0.01ms |
| total | 0.54ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.0023ms | 0.0023ms | 0.00ms | 0.00% |
| p50 | 0.0024ms | 0.0024ms | 0.00ms | 0.00% |
| p95 | 0.0032ms | 0.0035ms | -0.00024ms | -6.90% |
| p99 | 0.0095ms | 0.01ms | -0.0054ms | -36.09% |
| mean | 0.0027ms | 0.0028ms | -0.00012ms | -4.11% |
| min | 0.0022ms | 0.0022ms | +0.000042ms | +1.90% |
| max | 0.01ms | 0.03ms | -0.01ms | -43.67% |
| total | 0.54ms | 0.57ms | -0.02ms | -4.11% |

