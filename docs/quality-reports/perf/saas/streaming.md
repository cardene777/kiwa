# Perf Suite — streaming

Threshold source: [docs/quality/perf-thresholds.md](../../../quality/perf-thresholds)

測定系の分解能 = 0.00017ms (何もしない関数を同じ経路で呼んだ時の p10)。 回帰判定の絶対下限は既定でこの 2 倍 = 0.00033ms、 op ごとの実効値は下表の「下限」 列。

## Serial (concurrency = 1)

| op | p10 (回帰判定) | p95 (上限判定) | cap | 下限 | gate | regression |
|---|---|---|---|---|---|---|
| kafkaProducerSend | 0.00046ms | 0.0022ms | 10ms | 0.00033ms | PASS | stable — gate 無効 (regressionGate=false) |
| redpandaProducerSend | 0.00046ms | 0.00063ms | 10ms | 0.00033ms | PASS | stable — gate 無効 (regressionGate=false) |
| natsPublish | 0.00042ms | 0.00076ms | 10ms | 0.00033ms | PASS | stable — gate 無効 (regressionGate=false) |
| idempotentProducerSend | 0.00025ms | 0.00038ms | 10ms | 0.00033ms | PASS | stable (検知には +0.00033ms (baseline 比 +133%) 以上の悪化が必要) — gate 無効 (regressionGate=false) |
| readCommittedFilter | 0.00017ms | 0.00025ms | 5ms | 0.00033ms | PASS | stable (検知には +0.00033ms (baseline 比 +199%) 以上の悪化が必要) — gate 無効 (regressionGate=false) |
| dlqHandleSuccess | 0.00029ms | 0.00055ms | 5ms | 0.00033ms | PASS | stable (検知には +0.00033ms (baseline 比 +114%) 以上の悪化が必要) — gate 無効 (regressionGate=false) |
| schemaRegistryRegister | 0.00058ms | 0.0021ms | 5ms | 0.00033ms | PASS | stable — gate 無効 (regressionGate=false) |
| transactionalProducerCycle | 0.0023ms | 0.0034ms | 20ms | 0.00033ms | PASS | stable — gate 無効 (regressionGate=false) |

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
| transactionalProducerCycle | 0.05ms | 40ms | PASS |

## Memory retention (200 iter, arrayBuffers axis is the gate; heap is informational)

| op | heapUsed Δ | arrayBuffers Δ | cap | gc exposed | verdict |
|---|---|---|---|---|---|
| kafkaProducerSend | -354184 B | 0 B | 102400 B | yes | PASS |
| redpandaProducerSend | 18848 B | 0 B | 102400 B | yes | PASS |
| natsPublish | 40944 B | 0 B | 102400 B | yes | PASS |
| idempotentProducerSend | 616 B | 0 B | 102400 B | yes | PASS |
| readCommittedFilter | 944 B | 0 B | 102400 B | yes | PASS |
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
| p10 | 0.00046ms |
| p50 | 0.00054ms |
| p95 | 0.0022ms |
| p99 | 0.0075ms |
| mean | 0.00095ms |
| stdev | 0.0012ms |
| min | 0.00046ms |
| max | 0.0091ms |
| total | 0.19ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.00046ms | 0.00050ms | -0.000042ms | -8.40% |
| p50 | 0.00054ms | 0.00054ms | -5.0e-7ms | -0.09% |
| p95 | 0.0022ms | 0.0021ms | +0.000090ms | +4.28% |
| p99 | 0.0075ms | 0.0070ms | +0.00041ms | +5.84% |
| mean | 0.00095ms | 0.00099ms | -0.000041ms | -4.12% |
| min | 0.00046ms | 0.00046ms | 0.00ms | 0.00% |
| max | 0.0091ms | 0.02ms | -0.0078ms | -46.19% |
| total | 0.19ms | 0.20ms | -0.0082ms | -4.12% |

### redpandaProducerSend

# Perf Report — redpandaProducerSend.serial

| metric | value |
|---|---|
| iterations | 200 |
| warmup | 5 |
| p10 | 0.00046ms |
| p50 | 0.00046ms |
| p95 | 0.00063ms |
| p99 | 0.0016ms |
| mean | 0.00053ms |
| stdev | 0.00032ms |
| min | 0.00042ms |
| max | 0.0037ms |
| total | 0.11ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.00046ms | 0.00046ms | 0.00ms | 0.00% |
| p50 | 0.00046ms | 0.00050ms | -0.000041ms | -8.20% |
| p95 | 0.00063ms | 0.00059ms | +0.000041ms | +7.00% |
| p99 | 0.0016ms | 0.0012ms | +0.00043ms | +36.98% |
| mean | 0.00053ms | 0.00053ms | +2.3e-7ms | +0.04% |
| min | 0.00042ms | 0.00042ms | -0.0000010ms | -0.24% |
| max | 0.0037ms | 0.0030ms | +0.00071ms | +23.27% |
| total | 0.11ms | 0.11ms | +0.000046ms | +0.04% |

### natsPublish

# Perf Report — natsPublish.serial

| metric | value |
|---|---|
| iterations | 200 |
| warmup | 5 |
| p10 | 0.00042ms |
| p50 | 0.00042ms |
| p95 | 0.00076ms |
| p99 | 0.0033ms |
| mean | 0.00055ms |
| stdev | 0.00070ms |
| min | 0.00038ms |
| max | 0.0067ms |
| total | 0.11ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.00042ms | 0.00042ms | -0.0000010ms | -0.24% |
| p50 | 0.00042ms | 0.00046ms | -0.000041ms | -8.95% |
| p95 | 0.00076ms | 0.00096ms | -0.00020ms | -20.87% |
| p99 | 0.0033ms | 0.0029ms | +0.00046ms | +15.99% |
| mean | 0.00055ms | 0.00059ms | -0.000043ms | -7.22% |
| min | 0.00038ms | 0.00042ms | -0.000041ms | -9.86% |
| max | 0.0067ms | 0.0090ms | -0.0023ms | -25.35% |
| total | 0.11ms | 0.12ms | -0.0086ms | -7.22% |

### idempotentProducerSend

# Perf Report — idempotentProducerSend.serial

| metric | value |
|---|---|
| iterations | 200 |
| warmup | 5 |
| p10 | 0.00025ms |
| p50 | 0.00025ms |
| p95 | 0.00038ms |
| p99 | 0.0010ms |
| mean | 0.00031ms |
| stdev | 0.00022ms |
| min | 0.00025ms |
| max | 0.0027ms |
| total | 0.06ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.00025ms | 0.00025ms | 0.00ms | 0.00% |
| p50 | 0.00025ms | 0.00029ms | -0.000041ms | -14.09% |
| p95 | 0.00038ms | 0.00046ms | -0.000082ms | -17.76% |
| p99 | 0.0010ms | 0.0012ms | -0.00017ms | -13.88% |
| mean | 0.00031ms | 0.00032ms | -0.000018ms | -5.49% |
| min | 0.00025ms | 0.00025ms | 0.00ms | 0.00% |
| max | 0.0027ms | 0.0027ms | -0.000041ms | -1.49% |
| total | 0.06ms | 0.06ms | -0.0036ms | -5.49% |

### readCommittedFilter

# Perf Report — readCommittedFilter.serial

| metric | value |
|---|---|
| iterations | 200 |
| warmup | 5 |
| p10 | 0.00017ms |
| p50 | 0.00021ms |
| p95 | 0.00025ms |
| p99 | 0.0021ms |
| mean | 0.00027ms |
| stdev | 0.00053ms |
| min | 0.00017ms |
| max | 0.0070ms |
| total | 0.05ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.00017ms | 0.00017ms | 0.00ms | 0.00% |
| p50 | 0.00021ms | 0.00021ms | 0.00ms | 0.00% |
| p95 | 0.00025ms | 0.00029ms | -0.000044ms | -14.98% |
| p99 | 0.0021ms | 0.0023ms | -0.00012ms | -5.50% |
| mean | 0.00027ms | 0.00027ms | +9.9e-7ms | +0.37% |
| min | 0.00017ms | 0.00017ms | 0.00ms | 0.00% |
| max | 0.0070ms | 0.0070ms | -0.000042ms | -0.60% |
| total | 0.05ms | 0.05ms | +0.00020ms | +0.37% |

### dlqHandleSuccess

# Perf Report — dlqHandleSuccess.serial

| metric | value |
|---|---|
| iterations | 200 |
| warmup | 5 |
| p10 | 0.00029ms |
| p50 | 0.00033ms |
| p95 | 0.00055ms |
| p99 | 0.0021ms |
| mean | 0.00042ms |
| stdev | 0.00037ms |
| min | 0.00025ms |
| max | 0.0036ms |
| total | 0.08ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.00029ms | 0.00029ms | 0.00ms | 0.00% |
| p50 | 0.00033ms | 0.00033ms | +0.0000010ms | +0.30% |
| p95 | 0.00055ms | 0.00055ms | 0.00ms | 0.00% |
| p99 | 0.0021ms | 0.0013ms | +0.00084ms | +64.92% |
| mean | 0.00042ms | 0.00041ms | +0.000015ms | +3.78% |
| min | 0.00025ms | 0.00029ms | -0.000041ms | -14.09% |
| max | 0.0036ms | 0.0078ms | -0.0043ms | -54.26% |
| total | 0.08ms | 0.08ms | +0.0031ms | +3.78% |

### schemaRegistryRegister

# Perf Report — schemaRegistryRegister.serial

| metric | value |
|---|---|
| iterations | 200 |
| warmup | 5 |
| p10 | 0.00058ms |
| p50 | 0.00063ms |
| p95 | 0.0021ms |
| p99 | 0.0093ms |
| mean | 0.00097ms |
| stdev | 0.0016ms |
| min | 0.00054ms |
| max | 0.02ms |
| total | 0.19ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.00058ms | 0.00054ms | +0.000041ms | +7.58% |
| p50 | 0.00063ms | 0.00063ms | 0.00ms | 0.00% |
| p95 | 0.0021ms | 0.0023ms | -0.00013ms | -5.63% |
| p99 | 0.0093ms | 0.0051ms | +0.0041ms | +80.27% |
| mean | 0.00097ms | 0.00087ms | +0.00010ms | +11.60% |
| min | 0.00054ms | 0.00046ms | +0.000083ms | +18.12% |
| max | 0.02ms | 0.01ms | +0.0059ms | +57.96% |
| total | 0.19ms | 0.17ms | +0.02ms | +11.60% |

### transactionalProducerCycle

# Perf Report — transactionalProducerCycle.serial

| metric | value |
|---|---|
| iterations | 200 |
| warmup | 5 |
| p10 | 0.0023ms |
| p50 | 0.0023ms |
| p95 | 0.0034ms |
| p99 | 0.0093ms |
| mean | 0.0027ms |
| stdev | 0.0014ms |
| min | 0.0022ms |
| max | 0.01ms |
| total | 0.53ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.0023ms | 0.0023ms | -0.0000051ms | -0.22% |
| p50 | 0.0023ms | 0.0024ms | -0.000041ms | -1.73% |
| p95 | 0.0034ms | 0.0035ms | -0.000082ms | -2.36% |
| p99 | 0.0093ms | 0.01ms | -0.0055ms | -37.21% |
| mean | 0.0027ms | 0.0028ms | -0.00017ms | -6.02% |
| min | 0.0022ms | 0.0022ms | 0.00ms | 0.00% |
| max | 0.01ms | 0.03ms | -0.01ms | -43.67% |
| total | 0.53ms | 0.57ms | -0.03ms | -6.02% |

