# Perf Suite — streaming

Threshold source: [docs/quality/perf-thresholds.md](../../../quality/perf-thresholds)

測定系の分解能 = 0.00017ms (何もしない関数を同じ経路で呼んだ時の p10)。 回帰判定の絶対下限は既定でこの 2 倍 = 0.00033ms、 op ごとの実効値は下表の「下限」 列。

## Serial (concurrency = 1)

| op | p10 (回帰判定) | p95 (上限判定) | cap | 下限 | gate | regression |
|---|---|---|---|---|---|---|
| kafkaProducerSend | 0.00050ms | 0.0023ms | 10ms | 0.00033ms | PASS | stable — gate 無効 (regressionGate=false) |
| redpandaProducerSend | 0.00046ms | 0.00071ms | 10ms | 0.00033ms | PASS | stable (p10 0% (閾値未満)、 p95 +21% (裾は実行間の振れ幅と区別できないため判定には使わない)) — gate 無効 (regressionGate=false) |
| natsPublish | 0.00042ms | 0.00067ms | 10ms | 0.00033ms | PASS | stable — gate 無効 (regressionGate=false) |
| idempotentProducerSend | 0.00025ms | 0.00038ms | 10ms | 0.00033ms | PASS | stable (検知には +0.00033ms (baseline 比 +133%) 以上の悪化が必要) — gate 無効 (regressionGate=false) |
| readCommittedFilter | 0.00021ms | 0.00029ms | 5ms | 0.00033ms | PASS | stable (差 0.000041ms が下限 0.00033ms 未満で判定を保留) — gate 無効 (regressionGate=false) |
| dlqHandleSuccess | 0.00033ms | 0.00050ms | 5ms | 0.00033ms | PASS | stable (検知には +0.00033ms (baseline 比 +114%) 以上の悪化が必要) — gate 無効 (regressionGate=false) |
| schemaRegistryRegister | 0.00058ms | 0.0022ms | 5ms | 0.00033ms | PASS | stable — gate 無効 (regressionGate=false) |
| transactionalProducerCycle | 0.0022ms | 0.0038ms | 20ms | 0.00033ms | PASS | stable — gate 無効 (regressionGate=false) |

## Concurrent p95 (concurrency = 10, 50 iter each)

| op | p95 | cap | gate |
|---|---|---|---|
| kafkaProducerSend | 0.01ms | 20ms | PASS |
| redpandaProducerSend | 0.01ms | 20ms | PASS |
| natsPublish | 0.01ms | 20ms | PASS |
| idempotentProducerSend | 0.00ms | 20ms | PASS |
| readCommittedFilter | 0.00ms | 10ms | PASS |
| dlqHandleSuccess | 0.00ms | 10ms | PASS |
| schemaRegistryRegister | 0.02ms | 10ms | PASS |
| transactionalProducerCycle | 0.04ms | 40ms | PASS |

## Memory retention (200 iter, arrayBuffers axis is the gate; heap is informational)

| op | heapUsed Δ | arrayBuffers Δ | cap | gc exposed | verdict |
|---|---|---|---|---|---|
| kafkaProducerSend | -100904 B | 0 B | 102400 B | yes | PASS |
| redpandaProducerSend | 17496 B | 0 B | 102400 B | yes | PASS |
| natsPublish | 40944 B | 0 B | 102400 B | yes | PASS |
| idempotentProducerSend | 616 B | 0 B | 102400 B | yes | PASS |
| readCommittedFilter | 4240 B | 0 B | 102400 B | yes | PASS |
| dlqHandleSuccess | 2032 B | 0 B | 102400 B | yes | PASS |
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
| p95 | 0.0023ms |
| p99 | 0.0086ms |
| mean | 0.0011ms |
| stdev | 0.0022ms |
| min | 0.00046ms |
| max | 0.03ms |
| total | 0.22ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.00050ms | 0.00050ms | 0.00ms | 0.00% |
| p50 | 0.00054ms | 0.00054ms | 0.00ms | 0.00% |
| p95 | 0.0023ms | 0.0021ms | +0.00019ms | +9.02% |
| p99 | 0.0086ms | 0.0070ms | +0.0015ms | +21.82% |
| mean | 0.0011ms | 0.00099ms | +0.000082ms | +8.26% |
| min | 0.00046ms | 0.00046ms | 0.00ms | 0.00% |
| max | 0.03ms | 0.02ms | +0.01ms | +59.46% |
| total | 0.22ms | 0.20ms | +0.02ms | +8.26% |

### redpandaProducerSend

# Perf Report — redpandaProducerSend.serial

| metric | value |
|---|---|
| iterations | 200 |
| warmup | 5 |
| p10 | 0.00046ms |
| p50 | 0.00046ms |
| p95 | 0.00071ms |
| p99 | 0.0024ms |
| mean | 0.00054ms |
| stdev | 0.00039ms |
| min | 0.00042ms |
| max | 0.0047ms |
| total | 0.11ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.00046ms | 0.00046ms | 0.00ms | 0.00% |
| p50 | 0.00046ms | 0.00050ms | -0.000041ms | -8.20% |
| p95 | 0.00071ms | 0.00059ms | +0.00012ms | +20.81% |
| p99 | 0.0024ms | 0.0012ms | +0.0013ms | +107.61% |
| mean | 0.00054ms | 0.00053ms | +0.000013ms | +2.51% |
| min | 0.00042ms | 0.00042ms | -0.0000010ms | -0.24% |
| max | 0.0047ms | 0.0030ms | +0.0016ms | +53.42% |
| total | 0.11ms | 0.11ms | +0.0027ms | +2.51% |

### natsPublish

# Perf Report — natsPublish.serial

| metric | value |
|---|---|
| iterations | 200 |
| warmup | 5 |
| p10 | 0.00042ms |
| p50 | 0.00042ms |
| p95 | 0.00067ms |
| p99 | 0.0032ms |
| mean | 0.00056ms |
| stdev | 0.00072ms |
| min | 0.00038ms |
| max | 0.0069ms |
| total | 0.11ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.00042ms | 0.00042ms | -0.0000010ms | -0.24% |
| p50 | 0.00042ms | 0.00046ms | -0.000041ms | -8.95% |
| p95 | 0.00067ms | 0.00096ms | -0.00029ms | -30.16% |
| p99 | 0.0032ms | 0.0029ms | +0.00034ms | +11.77% |
| mean | 0.00056ms | 0.00059ms | -0.000039ms | -6.49% |
| min | 0.00038ms | 0.00042ms | -0.000041ms | -9.86% |
| max | 0.0069ms | 0.0090ms | -0.0022ms | -23.97% |
| total | 0.11ms | 0.12ms | -0.0077ms | -6.49% |

### idempotentProducerSend

# Perf Report — idempotentProducerSend.serial

| metric | value |
|---|---|
| iterations | 200 |
| warmup | 5 |
| p10 | 0.00025ms |
| p50 | 0.00029ms |
| p95 | 0.00038ms |
| p99 | 0.0013ms |
| mean | 0.00032ms |
| stdev | 0.00027ms |
| min | 0.00021ms |
| max | 0.0030ms |
| total | 0.06ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.00025ms | 0.00025ms | 0.00ms | 0.00% |
| p50 | 0.00029ms | 0.00029ms | 0.00ms | 0.00% |
| p95 | 0.00038ms | 0.00046ms | -0.000082ms | -17.75% |
| p99 | 0.0013ms | 0.0012ms | +0.000087ms | +7.17% |
| mean | 0.00032ms | 0.00032ms | -0.0000025ms | -0.78% |
| min | 0.00021ms | 0.00025ms | -0.000042ms | -16.80% |
| max | 0.0030ms | 0.0027ms | +0.00021ms | +7.56% |
| total | 0.06ms | 0.06ms | -0.00051ms | -0.78% |

### readCommittedFilter

# Perf Report — readCommittedFilter.serial

| metric | value |
|---|---|
| iterations | 200 |
| warmup | 5 |
| p10 | 0.00021ms |
| p50 | 0.00025ms |
| p95 | 0.00029ms |
| p99 | 0.0023ms |
| mean | 0.00031ms |
| stdev | 0.00061ms |
| min | 0.00017ms |
| max | 0.0079ms |
| total | 0.06ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.00021ms | 0.00017ms | +0.000041ms | +24.55% |
| p50 | 0.00025ms | 0.00021ms | +0.000042ms | +20.19% |
| p95 | 0.00029ms | 0.00029ms | -0.0000020ms | -0.70% |
| p99 | 0.0023ms | 0.0023ms | +0.000049ms | +2.20% |
| mean | 0.00031ms | 0.00027ms | +0.000041ms | +15.34% |
| min | 0.00017ms | 0.00017ms | 0.00ms | 0.00% |
| max | 0.0079ms | 0.0070ms | +0.00092ms | +13.10% |
| total | 0.06ms | 0.05ms | +0.0083ms | +15.34% |

### dlqHandleSuccess

# Perf Report — dlqHandleSuccess.serial

| metric | value |
|---|---|
| iterations | 200 |
| warmup | 5 |
| p10 | 0.00033ms |
| p50 | 0.00038ms |
| p95 | 0.00050ms |
| p99 | 0.0021ms |
| mean | 0.00044ms |
| stdev | 0.00040ms |
| min | 0.00033ms |
| max | 0.0051ms |
| total | 0.09ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.00033ms | 0.00029ms | +0.000041ms | +14.04% |
| p50 | 0.00038ms | 0.00033ms | +0.000042ms | +12.61% |
| p95 | 0.00050ms | 0.00055ms | -0.000044ms | -8.07% |
| p99 | 0.0021ms | 0.0013ms | +0.00083ms | +64.50% |
| mean | 0.00044ms | 0.00041ms | +0.000032ms | +7.92% |
| min | 0.00033ms | 0.00029ms | +0.000042ms | +14.43% |
| max | 0.0051ms | 0.0078ms | -0.0027ms | -34.57% |
| total | 0.09ms | 0.08ms | +0.0064ms | +7.92% |

### schemaRegistryRegister

# Perf Report — schemaRegistryRegister.serial

| metric | value |
|---|---|
| iterations | 200 |
| warmup | 5 |
| p10 | 0.00058ms |
| p50 | 0.00063ms |
| p95 | 0.0022ms |
| p99 | 0.0061ms |
| mean | 0.00093ms |
| stdev | 0.0013ms |
| min | 0.00050ms |
| max | 0.02ms |
| total | 0.19ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.00058ms | 0.00054ms | +0.000041ms | +7.58% |
| p50 | 0.00063ms | 0.00063ms | 0.00ms | 0.00% |
| p95 | 0.0022ms | 0.0023ms | -0.0000083ms | -0.37% |
| p99 | 0.0061ms | 0.0051ms | +0.00093ms | +18.18% |
| mean | 0.00093ms | 0.00087ms | +0.000069ms | +7.97% |
| min | 0.00050ms | 0.00046ms | +0.000042ms | +9.17% |
| max | 0.02ms | 0.01ms | +0.0049ms | +47.76% |
| total | 0.19ms | 0.17ms | +0.01ms | +7.97% |

### transactionalProducerCycle

# Perf Report — transactionalProducerCycle.serial

| metric | value |
|---|---|
| iterations | 200 |
| warmup | 5 |
| p10 | 0.0022ms |
| p50 | 0.0023ms |
| p95 | 0.0038ms |
| p99 | 0.01ms |
| mean | 0.0027ms |
| stdev | 0.0016ms |
| min | 0.0022ms |
| max | 0.02ms |
| total | 0.54ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.0022ms | 0.0023ms | -0.000042ms | -1.83% |
| p50 | 0.0023ms | 0.0024ms | -0.000042ms | -1.77% |
| p95 | 0.0038ms | 0.0035ms | +0.00032ms | +9.29% |
| p99 | 0.01ms | 0.01ms | -0.0047ms | -31.30% |
| mean | 0.0027ms | 0.0028ms | -0.00012ms | -4.10% |
| min | 0.0022ms | 0.0022ms | -0.000042ms | -1.90% |
| max | 0.02ms | 0.03ms | -0.01ms | -40.67% |
| total | 0.54ms | 0.57ms | -0.02ms | -4.10% |

