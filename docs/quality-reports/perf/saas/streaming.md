# Perf Suite — streaming

Threshold source: [docs/quality/perf-thresholds.md](../../../quality/perf-thresholds)

測定系の分解能 = 0.00017ms (何もしない関数を同じ経路で呼んだ時の p10)。 回帰判定の絶対下限は既定でこの 2 倍 = 0.00033ms、 op ごとの実効値は下表の「下限」 列。

## Serial (concurrency = 1)

| op | p10 (回帰判定) | p95 (上限判定) | cap | 下限 | gate | regression |
|---|---|---|---|---|---|---|
| kafkaProducerSend | 0.00046ms | 0.0034ms | 10ms | 0.00033ms | PASS | stable (p10 -8% (閾値未満)、 p95 +60% (裾は実行間の振れ幅と区別できないため判定には使わない)) — gate 無効 (regressionGate=false) |
| redpandaProducerSend | 0.00050ms | 0.00067ms | 10ms | 0.00033ms | PASS | stable — gate 無効 (regressionGate=false) |
| natsPublish | 0.00046ms | 0.0011ms | 10ms | 0.00033ms | PASS | stable — gate 無効 (regressionGate=false) |
| idempotentProducerSend | 0.00029ms | 0.00054ms | 10ms | 0.00033ms | PASS | stable (検知には +0.00033ms (baseline 比 +133%) 以上の悪化が必要) — gate 無効 (regressionGate=false) |
| readCommittedFilter | 0.00046ms | 0.00054ms | 5ms | 0.00033ms | PASS | stable (差 0.00029ms が下限 0.00033ms 未満で判定を保留) — gate 無効 (regressionGate=false) |
| dlqHandleSuccess | 0.00029ms | 0.00059ms | 5ms | 0.00033ms | PASS | stable (検知には +0.00033ms (baseline 比 +114%) 以上の悪化が必要) — gate 無効 (regressionGate=false) |
| schemaRegistryRegister | 0.00058ms | 0.0029ms | 5ms | 0.00033ms | PASS | stable (p10 +8% (閾値未満)、 p95 +29% (裾は実行間の振れ幅と区別できないため判定には使わない)) — gate 無効 (regressionGate=false) |
| transactionalProducerCycle | 0.0027ms | 0.0092ms | 20ms | 0.00033ms | PASS | stable (p10 +16% (閾値未満)、 p95 +164% (裾は実行間の振れ幅と区別できないため判定には使わない)) — gate 無効 (regressionGate=false) |

## Concurrent p95 (concurrency = 10, 50 iter each)

| op | p95 | cap | gate |
|---|---|---|---|
| kafkaProducerSend | 0.02ms | 20ms | PASS |
| redpandaProducerSend | 0.02ms | 20ms | PASS |
| natsPublish | 0.01ms | 20ms | PASS |
| idempotentProducerSend | 0.01ms | 20ms | PASS |
| readCommittedFilter | 0.08ms | 10ms | PASS |
| dlqHandleSuccess | 0.16ms | 10ms | PASS |
| schemaRegistryRegister | 0.02ms | 10ms | PASS |
| transactionalProducerCycle | 0.19ms | 40ms | PASS |

## Memory retention (200 iter, arrayBuffers axis is the gate; heap is informational)

| op | heapUsed Δ | arrayBuffers Δ | cap | gc exposed | verdict |
|---|---|---|---|---|---|
| kafkaProducerSend | 17488 B | 0 B | 102400 B | yes | PASS |
| redpandaProducerSend | 17400 B | 0 B | 102400 B | yes | PASS |
| natsPublish | 47904 B | 0 B | 102400 B | yes | PASS |
| idempotentProducerSend | 4312 B | 0 B | 102400 B | yes | PASS |
| readCommittedFilter | 3800 B | 0 B | 102400 B | yes | PASS |
| dlqHandleSuccess | 1328 B | 0 B | 102400 B | yes | PASS |
| schemaRegistryRegister | 68912 B | 0 B | 102400 B | yes | PASS |
| transactionalProducerCycle | 30544 B | 0 B | 102400 B | yes | PASS |

## Detailed serial reports

### kafkaProducerSend

# Perf Report — kafkaProducerSend.serial

| metric | value |
|---|---|
| iterations | 200 |
| warmup | 5 |
| p10 | 0.00046ms |
| p50 | 0.00050ms |
| p95 | 0.0034ms |
| p99 | 0.0084ms |
| mean | 0.0011ms |
| stdev | 0.0026ms |
| min | 0.00046ms |
| max | 0.03ms |
| total | 0.23ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.00046ms | 0.00050ms | -0.000041ms | -8.20% |
| p50 | 0.00050ms | 0.00054ms | -0.000042ms | -7.75% |
| p95 | 0.0034ms | 0.0021ms | +0.0013ms | +59.69% |
| p99 | 0.0084ms | 0.0070ms | +0.0013ms | +18.95% |
| mean | 0.0011ms | 0.00099ms | +0.00014ms | +13.83% |
| min | 0.00046ms | 0.00046ms | 0.00ms | 0.00% |
| max | 0.03ms | 0.02ms | +0.02ms | +92.39% |
| total | 0.23ms | 0.20ms | +0.03ms | +13.83% |

### redpandaProducerSend

# Perf Report — redpandaProducerSend.serial

| metric | value |
|---|---|
| iterations | 200 |
| warmup | 5 |
| p10 | 0.00050ms |
| p50 | 0.00054ms |
| p95 | 0.00067ms |
| p99 | 0.0015ms |
| mean | 0.00058ms |
| stdev | 0.00022ms |
| min | 0.00050ms |
| max | 0.0031ms |
| total | 0.12ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.00050ms | 0.00046ms | +0.000042ms | +9.17% |
| p50 | 0.00054ms | 0.00050ms | +0.000042ms | +8.40% |
| p95 | 0.00067ms | 0.00059ms | +0.000083ms | +14.16% |
| p99 | 0.0015ms | 0.0012ms | +0.00029ms | +24.99% |
| mean | 0.00058ms | 0.00053ms | +0.000050ms | +9.37% |
| min | 0.00050ms | 0.00042ms | +0.000083ms | +19.90% |
| max | 0.0031ms | 0.0030ms | +0.000083ms | +2.73% |
| total | 0.12ms | 0.11ms | +0.010ms | +9.37% |

### natsPublish

# Perf Report — natsPublish.serial

| metric | value |
|---|---|
| iterations | 200 |
| warmup | 5 |
| p10 | 0.00046ms |
| p50 | 0.00050ms |
| p95 | 0.0011ms |
| p99 | 0.0042ms |
| mean | 0.00064ms |
| stdev | 0.00079ms |
| min | 0.00046ms |
| max | 0.0075ms |
| total | 0.13ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.00046ms | 0.00042ms | +0.000041ms | +9.83% |
| p50 | 0.00050ms | 0.00046ms | +0.000042ms | +9.17% |
| p95 | 0.0011ms | 0.00096ms | +0.000091ms | +9.51% |
| p99 | 0.0042ms | 0.0029ms | +0.0013ms | +46.41% |
| mean | 0.00064ms | 0.00059ms | +0.000049ms | +8.20% |
| min | 0.00046ms | 0.00042ms | +0.000042ms | +10.10% |
| max | 0.0075ms | 0.0090ms | -0.0015ms | -17.05% |
| total | 0.13ms | 0.12ms | +0.0097ms | +8.20% |

### idempotentProducerSend

# Perf Report — idempotentProducerSend.serial

| metric | value |
|---|---|
| iterations | 200 |
| warmup | 5 |
| p10 | 0.00029ms |
| p50 | 0.00029ms |
| p95 | 0.00054ms |
| p99 | 0.0015ms |
| mean | 0.00036ms |
| stdev | 0.00034ms |
| min | 0.00025ms |
| max | 0.0041ms |
| total | 0.07ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.00029ms | 0.00025ms | +0.000041ms | +16.40% |
| p50 | 0.00029ms | 0.00029ms | +0.0000010ms | +0.34% |
| p95 | 0.00054ms | 0.00046ms | +0.000083ms | +18.00% |
| p99 | 0.0015ms | 0.0012ms | +0.00026ms | +21.03% |
| mean | 0.00036ms | 0.00032ms | +0.000040ms | +12.44% |
| min | 0.00025ms | 0.00025ms | 0.00ms | 0.00% |
| max | 0.0041ms | 0.0027ms | +0.0013ms | +48.47% |
| total | 0.07ms | 0.06ms | +0.0080ms | +12.44% |

### readCommittedFilter

# Perf Report — readCommittedFilter.serial

| metric | value |
|---|---|
| iterations | 200 |
| warmup | 5 |
| p10 | 0.00046ms |
| p50 | 0.00046ms |
| p95 | 0.00054ms |
| p99 | 0.0056ms |
| mean | 0.00065ms |
| stdev | 0.0012ms |
| min | 0.00042ms |
| max | 0.01ms |
| total | 0.13ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.00046ms | 0.00017ms | +0.00029ms | +174.25% |
| p50 | 0.00046ms | 0.00021ms | +0.00025ms | +120.67% |
| p95 | 0.00054ms | 0.00029ms | +0.00025ms | +84.32% |
| p99 | 0.0056ms | 0.0023ms | +0.0033ms | +148.78% |
| mean | 0.00065ms | 0.00027ms | +0.00038ms | +141.96% |
| min | 0.00042ms | 0.00017ms | +0.00025ms | +151.20% |
| max | 0.01ms | 0.0070ms | +0.0048ms | +68.46% |
| total | 0.13ms | 0.05ms | +0.08ms | +141.96% |

### dlqHandleSuccess

# Perf Report — dlqHandleSuccess.serial

| metric | value |
|---|---|
| iterations | 200 |
| warmup | 5 |
| p10 | 0.00029ms |
| p50 | 0.00033ms |
| p95 | 0.00059ms |
| p99 | 0.0020ms |
| mean | 0.00040ms |
| stdev | 0.00036ms |
| min | 0.00029ms |
| max | 0.0044ms |
| total | 0.08ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.00029ms | 0.00029ms | 0.00ms | 0.00% |
| p50 | 0.00033ms | 0.00033ms | 0.00ms | 0.00% |
| p95 | 0.00059ms | 0.00055ms | +0.000040ms | +7.31% |
| p99 | 0.0020ms | 0.0013ms | +0.00075ms | +58.14% |
| mean | 0.00040ms | 0.00041ms | -0.000010ms | -2.47% |
| min | 0.00029ms | 0.00029ms | 0.00ms | 0.00% |
| max | 0.0044ms | 0.0078ms | -0.0034ms | -43.61% |
| total | 0.08ms | 0.08ms | -0.0020ms | -2.47% |

### schemaRegistryRegister

# Perf Report — schemaRegistryRegister.serial

| metric | value |
|---|---|
| iterations | 200 |
| warmup | 5 |
| p10 | 0.00058ms |
| p50 | 0.00071ms |
| p95 | 0.0029ms |
| p99 | 0.02ms |
| mean | 0.0026ms |
| stdev | 0.02ms |
| min | 0.00046ms |
| max | 0.27ms |
| total | 0.53ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.00058ms | 0.00054ms | +0.000041ms | +7.58% |
| p50 | 0.00071ms | 0.00063ms | +0.000083ms | +13.28% |
| p95 | 0.0029ms | 0.0023ms | +0.00064ms | +28.51% |
| p99 | 0.02ms | 0.0051ms | +0.01ms | +202.05% |
| mean | 0.0026ms | 0.00087ms | +0.0018ms | +204.10% |
| min | 0.00046ms | 0.00046ms | +0.0000010ms | +0.22% |
| max | 0.27ms | 0.01ms | +0.26ms | +2558.86% |
| total | 0.53ms | 0.17ms | +0.35ms | +204.10% |

### transactionalProducerCycle

# Perf Report — transactionalProducerCycle.serial

| metric | value |
|---|---|
| iterations | 200 |
| warmup | 5 |
| p10 | 0.0027ms |
| p50 | 0.0027ms |
| p95 | 0.0092ms |
| p99 | 0.05ms |
| mean | 0.0051ms |
| stdev | 0.01ms |
| min | 0.0026ms |
| max | 0.11ms |
| total | 1.01ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.0027ms | 0.0023ms | +0.00037ms | +16.32% |
| p50 | 0.0027ms | 0.0024ms | +0.00037ms | +15.79% |
| p95 | 0.0092ms | 0.0035ms | +0.0057ms | +164.22% |
| p99 | 0.05ms | 0.01ms | +0.03ms | +212.65% |
| mean | 0.0051ms | 0.0028ms | +0.0022ms | +78.00% |
| min | 0.0026ms | 0.0022ms | +0.00037ms | +16.98% |
| max | 0.11ms | 0.03ms | +0.09ms | +332.11% |
| total | 1.01ms | 0.57ms | +0.44ms | +78.00% |

