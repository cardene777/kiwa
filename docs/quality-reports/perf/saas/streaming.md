# Perf Suite — streaming

Threshold source: [docs/quality/perf-thresholds.md](../../../quality/perf-thresholds)

測定系の分解能 = 0.00017ms (何もしない関数を同じ経路で呼んだ時の p10)。 回帰判定の絶対下限は既定でこの 2 倍 = 0.00033ms、 op ごとの実効値は下表の「下限」 列。

## Serial (concurrency = 1)

| op | p10 (実測) | p95 (上限判定) | cap | 下限 | gate | regression |
|---|---|---|---|---|---|---|
| kafkaProducerSend | 0.00046ms | 0.0070ms | 10ms | 0.00032ms | PASS | stable — gate 無効 (regressionGate=false) |
| redpandaProducerSend | 0.00046ms | 0.0022ms | 10ms | 0.00033ms | PASS | stable — gate 無効 (regressionGate=false) |
| natsPublish | 0.00033ms | 0.0016ms | 10ms | 0.00033ms | PASS | stable — gate 無効 (regressionGate=false) |
| idempotentProducerSend | 0.00025ms | 0.0023ms | 10ms | 0.00033ms | PASS | stable (検知には +0.00033ms (baseline 比 +133%) 以上の悪化が必要) — gate 無効 (regressionGate=false) |
| readCommittedFilter | 0.00021ms | 0.01ms | 5ms | 0.00033ms | PASS | stable (差 0.000039ms が下限 0.00033ms 未満で判定を保留) — gate 無効 (regressionGate=false) |
| dlqHandleSuccess | 0.00029ms | 0.0013ms | 5ms | 0.00033ms | PASS | stable (検知には +0.00033ms (baseline 比 +133%) 以上の悪化が必要) — gate 無効 (regressionGate=false) |
| schemaRegistryRegister | 0.00050ms | 0.0057ms | 5ms | 0.00034ms | PASS | stable — gate 無効 (regressionGate=false) |
| transactionalProducerCycle | 0.0024ms | 0.09ms | 20ms | 0.00033ms | PASS | stable (p10 -0% (閾値未満)、 p95 +201% (裾は実行間の振れ幅と区別できないため判定には使わない)) — gate 無効 (regressionGate=false) |

## 実行内正規化 (回帰判定はこの比で行う)

回帰判定は実測値そのものではなく、 同じ実行の中で 1 呼出ずつ交互に測った基準 op との比を読む。 実行と実行の間で機械の状態が変わっても、 その差が分子と分母で相殺される。 「換算後 p10」 は今回の比を baseline を測った時の基準 p10 で ms に戻した値で、 baseline の実測 p10 と直接比べられる。

| op | 基準 op | 基準 p10 | 実測 p10 | 比 | baseline の比 | 換算後 p10 | baseline p10 |
|---|---|---|---|---|---|---|---|
| kafkaProducerSend | cpu | 0.08ms | 0.00046ms | 0.006 | 0.006 | 0.00045ms | 0.00046ms |
| redpandaProducerSend | cpu | 0.08ms | 0.00046ms | 0.006 | 0.006 | 0.00045ms | 0.00046ms |
| natsPublish | cpu | 0.08ms | 0.00033ms | 0.004 | 0.004 | 0.00033ms | 0.00033ms |
| idempotentProducerSend | cpu | 0.08ms | 0.00025ms | 0.003 | 0.003 | 0.00025ms | 0.00025ms |
| readCommittedFilter | cpu | 0.08ms | 0.00021ms | 0.003 | 0.002 | 0.00021ms | 0.00017ms |
| dlqHandleSuccess | cpu | 0.08ms | 0.00029ms | 0.004 | 0.003 | 0.00029ms | 0.00025ms |
| schemaRegistryRegister | cpu | 0.08ms | 0.00050ms | 0.006 | 0.007 | 0.00051ms | 0.00054ms |
| transactionalProducerCycle | cpu | 0.08ms | 0.0024ms | 0.029 | 0.029 | 0.0024ms | 0.0024ms |

## Concurrent p95 (concurrency = 10, 50 iter each)

| op | p95 | cap | gate |
|---|---|---|---|
| kafkaProducerSend | 0.02ms | 20ms | PASS |
| redpandaProducerSend | 0.01ms | 20ms | PASS |
| natsPublish | 0.01ms | 20ms | PASS |
| idempotentProducerSend | 0.00ms | 20ms | PASS |
| readCommittedFilter | 0.01ms | 10ms | PASS |
| dlqHandleSuccess | 0.01ms | 10ms | PASS |
| schemaRegistryRegister | 0.02ms | 10ms | PASS |
| transactionalProducerCycle | 0.08ms | 40ms | PASS |

## Memory retention (200 iter, arrayBuffers axis is the gate; heap is informational)

| op | heapUsed Δ | arrayBuffers Δ | cap | gc exposed | verdict |
|---|---|---|---|---|---|
| kafkaProducerSend | 20152 B | 0 B | 102400 B | yes | PASS |
| redpandaProducerSend | 17432 B | 0 B | 102400 B | yes | PASS |
| natsPublish | 47128 B | 0 B | 102400 B | yes | PASS |
| idempotentProducerSend | 744 B | 0 B | 102400 B | yes | PASS |
| readCommittedFilter | 1728 B | 0 B | 102400 B | yes | PASS |
| dlqHandleSuccess | 2680 B | 0 B | 102400 B | yes | PASS |
| schemaRegistryRegister | -34424 B | 0 B | 102400 B | yes | PASS |
| transactionalProducerCycle | 30448 B | 0 B | 102400 B | yes | PASS |

## Detailed serial reports

### kafkaProducerSend

# Perf Report — kafkaProducerSend.serial

| metric | value |
|---|---|
| iterations | 200 |
| warmup | 5 |
| p10 | 0.00046ms |
| p50 | 0.00050ms |
| p95 | 0.0070ms |
| p99 | 0.01ms |
| mean | 0.0015ms |
| stdev | 0.0027ms |
| min | 0.00042ms |
| max | 0.02ms |
| total | 0.29ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.00046ms | 0.00046ms | 0.00ms | 0.00% |
| p50 | 0.00050ms | 0.00050ms | 0.00ms | 0.00% |
| p95 | 0.0070ms | 0.0069ms | +0.00018ms | +2.60% |
| p99 | 0.01ms | 0.01ms | -0.00063ms | -4.37% |
| mean | 0.0015ms | 0.0014ms | +0.000013ms | +0.88% |
| min | 0.00042ms | 0.00042ms | 0.00ms | 0.00% |
| max | 0.02ms | 0.02ms | +0.00067ms | +3.51% |
| total | 0.29ms | 0.29ms | +0.0025ms | +0.88% |

### redpandaProducerSend

# Perf Report — redpandaProducerSend.serial

| metric | value |
|---|---|
| iterations | 200 |
| warmup | 5 |
| p10 | 0.00046ms |
| p50 | 0.00054ms |
| p95 | 0.0022ms |
| p99 | 0.01ms |
| mean | 0.0011ms |
| stdev | 0.0027ms |
| min | 0.00042ms |
| max | 0.03ms |
| total | 0.22ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.00046ms | 0.00046ms | 0.00ms | 0.00% |
| p50 | 0.00054ms | 0.00050ms | +0.000041ms | +8.20% |
| p95 | 0.0022ms | 0.0034ms | -0.0012ms | -35.90% |
| p99 | 0.01ms | 0.02ms | -0.0090ms | -38.91% |
| mean | 0.0011ms | 0.0014ms | -0.00030ms | -21.85% |
| min | 0.00042ms | 0.00042ms | -0.0000010ms | -0.24% |
| max | 0.03ms | 0.04ms | -0.0090ms | -25.53% |
| total | 0.22ms | 0.28ms | -0.06ms | -21.85% |

### natsPublish

# Perf Report — natsPublish.serial

| metric | value |
|---|---|
| iterations | 200 |
| warmup | 5 |
| p10 | 0.00033ms |
| p50 | 0.00038ms |
| p95 | 0.0016ms |
| p99 | 0.01ms |
| mean | 0.00080ms |
| stdev | 0.0021ms |
| min | 0.00033ms |
| max | 0.02ms |
| total | 0.16ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.00033ms | 0.00033ms | 0.00ms | 0.00% |
| p50 | 0.00038ms | 0.00038ms | 0.00ms | 0.00% |
| p95 | 0.0016ms | 0.0036ms | -0.0019ms | -54.18% |
| p99 | 0.01ms | 0.0098ms | +0.0012ms | +11.71% |
| mean | 0.00080ms | 0.00089ms | -0.000088ms | -9.85% |
| min | 0.00033ms | 0.00029ms | +0.000041ms | +14.04% |
| max | 0.02ms | 0.02ms | -0.0016ms | -7.96% |
| total | 0.16ms | 0.18ms | -0.02ms | -9.85% |

### idempotentProducerSend

# Perf Report — idempotentProducerSend.serial

| metric | value |
|---|---|
| iterations | 200 |
| warmup | 5 |
| p10 | 0.00025ms |
| p50 | 0.00029ms |
| p95 | 0.0023ms |
| p99 | 0.0083ms |
| mean | 0.00065ms |
| stdev | 0.0019ms |
| min | 0.00021ms |
| max | 0.02ms |
| total | 0.13ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.00025ms | 0.00025ms | 0.00ms | 0.00% |
| p50 | 0.00029ms | 0.00029ms | 0.00ms | 0.00% |
| p95 | 0.0023ms | 0.00050ms | +0.0018ms | +349.82% |
| p99 | 0.0083ms | 0.0031ms | +0.0053ms | +170.17% |
| mean | 0.00065ms | 0.00039ms | +0.00026ms | +66.01% |
| min | 0.00021ms | 0.00025ms | -0.000041ms | -16.40% |
| max | 0.02ms | 0.0088ms | +0.01ms | +154.99% |
| total | 0.13ms | 0.08ms | +0.05ms | +66.01% |

### readCommittedFilter

# Perf Report — readCommittedFilter.serial

| metric | value |
|---|---|
| iterations | 200 |
| warmup | 5 |
| p10 | 0.00021ms |
| p50 | 0.00067ms |
| p95 | 0.01ms |
| p99 | 0.03ms |
| mean | 0.0030ms |
| stdev | 0.01ms |
| min | 0.00017ms |
| max | 0.17ms |
| total | 0.59ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.00021ms | 0.00017ms | +0.000041ms | +24.55% |
| p50 | 0.00067ms | 0.00021ms | +0.00046ms | +220.43% |
| p95 | 0.01ms | 0.0040ms | +0.0068ms | +171.40% |
| p99 | 0.03ms | 0.01ms | +0.02ms | +141.09% |
| mean | 0.0030ms | 0.00086ms | +0.0021ms | +244.44% |
| min | 0.00017ms | 0.00017ms | 0.00ms | 0.00% |
| max | 0.17ms | 0.03ms | +0.14ms | +470.48% |
| total | 0.59ms | 0.17ms | +0.42ms | +244.44% |

### dlqHandleSuccess

# Perf Report — dlqHandleSuccess.serial

| metric | value |
|---|---|
| iterations | 200 |
| warmup | 5 |
| p10 | 0.00029ms |
| p50 | 0.00033ms |
| p95 | 0.0013ms |
| p99 | 0.0051ms |
| mean | 0.00053ms |
| stdev | 0.00090ms |
| min | 0.00025ms |
| max | 0.0077ms |
| total | 0.11ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.00029ms | 0.00025ms | +0.000041ms | +16.40% |
| p50 | 0.00033ms | 0.00033ms | -0.0000010ms | -0.30% |
| p95 | 0.0013ms | 0.0044ms | -0.0031ms | -70.18% |
| p99 | 0.0051ms | 0.0093ms | -0.0042ms | -45.45% |
| mean | 0.00053ms | 0.0010ms | -0.00049ms | -48.31% |
| min | 0.00025ms | 0.00025ms | 0.00ms | 0.00% |
| max | 0.0077ms | 0.04ms | -0.03ms | -79.49% |
| total | 0.11ms | 0.20ms | -0.10ms | -48.31% |

### schemaRegistryRegister

# Perf Report — schemaRegistryRegister.serial

| metric | value |
|---|---|
| iterations | 200 |
| warmup | 5 |
| p10 | 0.00050ms |
| p50 | 0.00067ms |
| p95 | 0.0057ms |
| p99 | 0.02ms |
| mean | 0.0014ms |
| stdev | 0.0031ms |
| min | 0.00042ms |
| max | 0.03ms |
| total | 0.28ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.00050ms | 0.00054ms | -0.000041ms | -7.58% |
| p50 | 0.00067ms | 0.00069ms | -0.000021ms | -2.98% |
| p95 | 0.0057ms | 0.0061ms | -0.00039ms | -6.41% |
| p99 | 0.02ms | 0.02ms | -0.0019ms | -11.11% |
| mean | 0.0014ms | 0.0026ms | -0.0011ms | -44.71% |
| min | 0.00042ms | 0.00042ms | 0.00ms | 0.00% |
| max | 0.03ms | 0.22ms | -0.19ms | -86.81% |
| total | 0.28ms | 0.51ms | -0.23ms | -44.71% |

### transactionalProducerCycle

# Perf Report — transactionalProducerCycle.serial

| metric | value |
|---|---|
| iterations | 200 |
| warmup | 5 |
| p10 | 0.0024ms |
| p50 | 0.0071ms |
| p95 | 0.09ms |
| p99 | 0.22ms |
| mean | 0.02ms |
| stdev | 0.05ms |
| min | 0.0022ms |
| max | 0.58ms |
| total | 4.56ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.0024ms | 0.0024ms | +1.0e-7ms | +0.00% |
| p50 | 0.0071ms | 0.0027ms | +0.0045ms | +167.94% |
| p95 | 0.09ms | 0.03ms | +0.06ms | +201.49% |
| p99 | 0.22ms | 0.14ms | +0.09ms | +61.15% |
| mean | 0.02ms | 0.02ms | +0.0049ms | +27.08% |
| min | 0.0022ms | 0.0023ms | -0.000041ms | -1.79% |
| max | 0.58ms | 2.09ms | -1.50ms | -72.06% |
| total | 4.56ms | 3.59ms | +0.97ms | +27.08% |

