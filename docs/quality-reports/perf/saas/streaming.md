# Perf Suite — streaming

Threshold source: [docs/quality/perf-thresholds.md](../../../quality/perf-thresholds)

測定系の分解能 = 0.00017ms (何もしない関数を同じ経路で呼んだ時の p10)。 回帰判定の絶対下限は既定でこの 2 倍 = 0.00033ms、 op ごとの実効値は下表の「下限」 列。

## Serial (concurrency = 1)

| op | p10 (回帰判定) | p95 (上限判定) | cap | 下限 | gate | regression |
|---|---|---|---|---|---|---|
| kafkaProducerSend | 0.00063ms | 0.0017ms | 10ms | 0.00033ms | PASS | stable (差 0.00013ms が下限 0.00033ms 未満で判定を保留) — gate 無効 (regressionGate=false) |
| redpandaProducerSend | 0.00046ms | 0.00067ms | 10ms | 0.00033ms | PASS | stable — gate 無効 (regressionGate=false) |
| natsPublish | 0.00042ms | 0.00059ms | 10ms | 0.00033ms | PASS | stable — gate 無効 (regressionGate=false) |
| idempotentProducerSend | 0.00025ms | 0.00042ms | 10ms | 0.00033ms | PASS | stable (検知には +0.00033ms (baseline 比 +133%) 以上の悪化が必要) — gate 無効 (regressionGate=false) |
| readCommittedFilter | 0.00017ms | 0.00033ms | 5ms | 0.00033ms | PASS | stable (検知には +0.00033ms (baseline 比 +199%) 以上の悪化が必要) — gate 無効 (regressionGate=false) |
| dlqHandleSuccess | 0.00029ms | 0.00046ms | 5ms | 0.00033ms | PASS | stable (検知には +0.00033ms (baseline 比 +114%) 以上の悪化が必要) — gate 無効 (regressionGate=false) |
| schemaRegistryRegister | 0.00050ms | 0.0023ms | 5ms | 0.00033ms | PASS | stable — gate 無効 (regressionGate=false) |
| transactionalProducerCycle | 0.0022ms | 0.0049ms | 20ms | 0.00033ms | PASS | stable (p10 -2% (閾値未満)、 p95 +41% (裾は実行間の振れ幅と区別できないため判定には使わない)) — gate 無効 (regressionGate=false) |

## Concurrent p95 (concurrency = 10, 50 iter each)

| op | p95 | cap | gate |
|---|---|---|---|
| kafkaProducerSend | 0.01ms | 20ms | PASS |
| redpandaProducerSend | 0.01ms | 20ms | PASS |
| natsPublish | 0.01ms | 20ms | PASS |
| idempotentProducerSend | 0.00ms | 20ms | PASS |
| readCommittedFilter | 0.01ms | 10ms | PASS |
| dlqHandleSuccess | 0.00ms | 10ms | PASS |
| schemaRegistryRegister | 0.01ms | 10ms | PASS |
| transactionalProducerCycle | 0.04ms | 40ms | PASS |

## Memory retention (200 iter, arrayBuffers axis is the gate; heap is informational)

| op | heapUsed Δ | arrayBuffers Δ | cap | gc exposed | verdict |
|---|---|---|---|---|---|
| kafkaProducerSend | 132536 B | -121604 B | 102400 B | yes | PASS |
| redpandaProducerSend | 33408 B | 0 B | 102400 B | yes | PASS |
| natsPublish | 41040 B | 0 B | 102400 B | yes | PASS |
| idempotentProducerSend | -624 B | 0 B | 102400 B | yes | PASS |
| readCommittedFilter | 1848 B | 0 B | 102400 B | yes | PASS |
| dlqHandleSuccess | 1328 B | 0 B | 102400 B | yes | PASS |
| schemaRegistryRegister | 76224 B | 0 B | 102400 B | yes | PASS |
| transactionalProducerCycle | 30416 B | 0 B | 102400 B | yes | PASS |

## Detailed serial reports

### kafkaProducerSend

# Perf Report — kafkaProducerSend.serial

| metric | value |
|---|---|
| iterations | 200 |
| warmup | 5 |
| p10 | 0.00063ms |
| p50 | 0.00067ms |
| p95 | 0.0017ms |
| p99 | 0.0068ms |
| mean | 0.00095ms |
| stdev | 0.0010ms |
| min | 0.00058ms |
| max | 0.0080ms |
| total | 0.19ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.00063ms | 0.00050ms | +0.00013ms | +25.00% |
| p50 | 0.00067ms | 0.00054ms | +0.00012ms | +22.88% |
| p95 | 0.0017ms | 0.0021ms | -0.00040ms | -18.97% |
| p99 | 0.0068ms | 0.0070ms | -0.00021ms | -2.99% |
| mean | 0.00095ms | 0.00099ms | -0.000042ms | -4.24% |
| min | 0.00058ms | 0.00046ms | +0.00012ms | +27.29% |
| max | 0.0080ms | 0.02ms | -0.0089ms | -52.58% |
| total | 0.19ms | 0.20ms | -0.0084ms | -4.24% |

### redpandaProducerSend

# Perf Report — redpandaProducerSend.serial

| metric | value |
|---|---|
| iterations | 200 |
| warmup | 5 |
| p10 | 0.00046ms |
| p50 | 0.00046ms |
| p95 | 0.00067ms |
| p99 | 0.0025ms |
| mean | 0.00054ms |
| stdev | 0.00040ms |
| min | 0.00042ms |
| max | 0.0045ms |
| total | 0.11ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.00046ms | 0.00046ms | 0.00ms | 0.00% |
| p50 | 0.00046ms | 0.00050ms | -0.000041ms | -8.20% |
| p95 | 0.00067ms | 0.00059ms | +0.000083ms | +14.16% |
| p99 | 0.0025ms | 0.0012ms | +0.0014ms | +118.24% |
| mean | 0.00054ms | 0.00053ms | +0.0000062ms | +1.17% |
| min | 0.00042ms | 0.00042ms | -0.0000010ms | -0.24% |
| max | 0.0045ms | 0.0030ms | +0.0015ms | +49.31% |
| total | 0.11ms | 0.11ms | +0.0012ms | +1.17% |

### natsPublish

# Perf Report — natsPublish.serial

| metric | value |
|---|---|
| iterations | 200 |
| warmup | 5 |
| p10 | 0.00042ms |
| p50 | 0.00042ms |
| p95 | 0.00059ms |
| p99 | 0.0032ms |
| mean | 0.00055ms |
| stdev | 0.00069ms |
| min | 0.00038ms |
| max | 0.0073ms |
| total | 0.11ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.00042ms | 0.00042ms | -0.0000010ms | -0.24% |
| p50 | 0.00042ms | 0.00046ms | -0.000041ms | -8.95% |
| p95 | 0.00059ms | 0.00096ms | -0.00037ms | -38.37% |
| p99 | 0.0032ms | 0.0029ms | +0.00033ms | +11.46% |
| mean | 0.00055ms | 0.00059ms | -0.000046ms | -7.77% |
| min | 0.00038ms | 0.00042ms | -0.000041ms | -9.86% |
| max | 0.0073ms | 0.0090ms | -0.0018ms | -19.82% |
| total | 0.11ms | 0.12ms | -0.0092ms | -7.77% |

### idempotentProducerSend

# Perf Report — idempotentProducerSend.serial

| metric | value |
|---|---|
| iterations | 200 |
| warmup | 5 |
| p10 | 0.00025ms |
| p50 | 0.00029ms |
| p95 | 0.00042ms |
| p99 | 0.0013ms |
| mean | 0.00033ms |
| stdev | 0.00029ms |
| min | 0.00025ms |
| max | 0.0032ms |
| total | 0.07ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.00025ms | 0.00025ms | 0.00ms | 0.00% |
| p50 | 0.00029ms | 0.00029ms | 0.00ms | 0.00% |
| p95 | 0.00042ms | 0.00046ms | -0.000038ms | -8.20% |
| p99 | 0.0013ms | 0.0012ms | +0.000047ms | +3.90% |
| mean | 0.00033ms | 0.00032ms | +0.0000096ms | +2.96% |
| min | 0.00025ms | 0.00025ms | 0.00ms | 0.00% |
| max | 0.0032ms | 0.0027ms | +0.00046ms | +16.65% |
| total | 0.07ms | 0.06ms | +0.0019ms | +2.96% |

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
| stdev | 0.00058ms |
| min | 0.00017ms |
| max | 0.0074ms |
| total | 0.06ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.00017ms | 0.00017ms | 0.00ms | 0.00% |
| p50 | 0.00021ms | 0.00021ms | 0.00ms | 0.00% |
| p95 | 0.00033ms | 0.00029ms | +0.000039ms | +13.26% |
| p99 | 0.0020ms | 0.0023ms | -0.00024ms | -10.48% |
| mean | 0.00028ms | 0.00027ms | +0.000013ms | +4.83% |
| min | 0.00017ms | 0.00017ms | 0.00ms | 0.00% |
| max | 0.0074ms | 0.0070ms | +0.00037ms | +5.36% |
| total | 0.06ms | 0.05ms | +0.0026ms | +4.83% |

### dlqHandleSuccess

# Perf Report — dlqHandleSuccess.serial

| metric | value |
|---|---|
| iterations | 200 |
| warmup | 5 |
| p10 | 0.00029ms |
| p50 | 0.00033ms |
| p95 | 0.00046ms |
| p99 | 0.0023ms |
| mean | 0.00040ms |
| stdev | 0.00047ms |
| min | 0.00029ms |
| max | 0.0057ms |
| total | 0.08ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.00029ms | 0.00029ms | -1.0e-7ms | -0.03% |
| p50 | 0.00033ms | 0.00033ms | 0.00ms | 0.00% |
| p95 | 0.00046ms | 0.00055ms | -0.000085ms | -15.58% |
| p99 | 0.0023ms | 0.0013ms | +0.00097ms | +74.68% |
| mean | 0.00040ms | 0.00041ms | -0.0000017ms | -0.42% |
| min | 0.00029ms | 0.00029ms | 0.00ms | 0.00% |
| max | 0.0057ms | 0.0078ms | -0.0021ms | -26.59% |
| total | 0.08ms | 0.08ms | -0.00034ms | -0.42% |

### schemaRegistryRegister

# Perf Report — schemaRegistryRegister.serial

| metric | value |
|---|---|
| iterations | 200 |
| warmup | 5 |
| p10 | 0.00050ms |
| p50 | 0.00058ms |
| p95 | 0.0023ms |
| p99 | 0.0059ms |
| mean | 0.00089ms |
| stdev | 0.0013ms |
| min | 0.00042ms |
| max | 0.01ms |
| total | 0.18ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.00050ms | 0.00054ms | -0.000042ms | -7.73% |
| p50 | 0.00058ms | 0.00063ms | -0.000041ms | -6.56% |
| p95 | 0.0023ms | 0.0023ms | +0.000036ms | +1.58% |
| p99 | 0.0059ms | 0.0051ms | +0.00078ms | +15.10% |
| mean | 0.00089ms | 0.00087ms | +0.000026ms | +2.96% |
| min | 0.00042ms | 0.00046ms | -0.000042ms | -9.17% |
| max | 0.01ms | 0.01ms | +0.0028ms | +27.76% |
| total | 0.18ms | 0.17ms | +0.0051ms | +2.96% |

### transactionalProducerCycle

# Perf Report — transactionalProducerCycle.serial

| metric | value |
|---|---|
| iterations | 200 |
| warmup | 5 |
| p10 | 0.0022ms |
| p50 | 0.0023ms |
| p95 | 0.0049ms |
| p99 | 0.02ms |
| mean | 0.0030ms |
| stdev | 0.0035ms |
| min | 0.0022ms |
| max | 0.04ms |
| total | 0.60ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.0022ms | 0.0023ms | -0.000042ms | -1.83% |
| p50 | 0.0023ms | 0.0024ms | -0.000041ms | -1.75% |
| p95 | 0.0049ms | 0.0035ms | +0.0014ms | +40.83% |
| p99 | 0.02ms | 0.01ms | +0.0021ms | +13.94% |
| mean | 0.0030ms | 0.0028ms | +0.00017ms | +6.00% |
| min | 0.0022ms | 0.0022ms | -0.000042ms | -1.90% |
| max | 0.04ms | 0.03ms | +0.02ms | +70.72% |
| total | 0.60ms | 0.57ms | +0.03ms | +6.00% |

