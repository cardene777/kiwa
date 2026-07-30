# Perf Suite — streaming

Threshold source: [docs/quality/perf-thresholds.md](../../../quality/perf-thresholds)

測定系の分解能 = 0.00017ms (何もしない関数を同じ経路で呼んだ時の p10)。 回帰判定の絶対下限は既定でこの 2 倍 = 0.00033ms、 op ごとの実効値は下表の「下限」 列。

## Serial (concurrency = 1)

| op | p10 (実測) | p95 (上限判定) | cap | 下限 | gate | regression |
|---|---|---|---|---|---|---|
| kafkaProducerSend | 0.00050ms | 0.0055ms | 10ms | 0.00031ms | PASS | stable (換算後 p10 +1% (閾値未満)、 p95 +115% (裾は実行間の振れ幅と区別できないため判定には使わない)) — gate 無効 (regressionGate=false) |
| redpandaProducerSend | 0.00050ms | 0.0072ms | 10ms | 0.00030ms | PASS | stable (換算後 p10 -2% (閾値未満)、 p95 +674% (裾は実行間の振れ幅と区別できないため判定には使わない)) — gate 無効 (regressionGate=false) |
| natsPublish | 0.00038ms | 0.0061ms | 10ms | 0.00030ms | PASS | stable (換算後 p10 +1% (閾値未満)、 p95 +238% (裾は実行間の振れ幅と区別できないため判定には使わない)) — gate 無効 (regressionGate=false) |
| idempotentProducerSend | 0.00025ms | 0.0027ms | 10ms | 0.00030ms | PASS | stable (検知には +0.00030ms (baseline 比 +120%) 以上の悪化が必要) — gate 無効 (regressionGate=false) |
| readCommittedFilter | 0.00021ms | 0.0015ms | 5ms | 0.00030ms | PASS | stable (検知には +0.00030ms (baseline 比 +182%) 以上の悪化が必要) — gate 無効 (regressionGate=false) |
| dlqHandleSuccess | 0.00033ms | 0.0014ms | 5ms | 0.00030ms | PASS | stable (差 0.000052ms が下限 0.00030ms 未満で判定を保留) — gate 無効 (regressionGate=false) |
| schemaRegistryRegister | 0.00054ms | 0.0089ms | 5ms | 0.00030ms | PASS | stable (換算後 p10 +7% (閾値未満)、 p95 +107% (裾は実行間の振れ幅と区別できないため判定には使わない)) — gate 無効 (regressionGate=false) |
| transactionalProducerCycle | 0.0025ms | 0.0089ms | 20ms | 0.00030ms | PASS | stable — gate 無効 (regressionGate=false) |

## 実行内正規化 (回帰判定はこの比で行う)

回帰判定は実測値そのものではなく、 同じ実行の中で 1 呼出ずつ交互に測った基準 op との比を読む。 実行と実行の間で機械の状態が変わっても、 その差が分子と分母で相殺される。 「換算後 p10」 は今回の比を baseline を測った時の基準 p10 で ms に戻した値で、 baseline の実測 p10 と直接比べられる。

| op | 基準 op | 基準 p10 | 基準 p95 | 実測 p10 | 比 | baseline の比 | 換算後 p10 | baseline p10 |
|---|---|---|---|---|---|---|---|---|
| kafkaProducerSend | cpu | 0.09ms | 0.09ms | 0.00050ms | 0.006 | 0.006 | 0.00046ms | 0.00046ms |
| redpandaProducerSend | cpu | 0.09ms | 0.12ms | 0.00050ms | 0.006 | 0.006 | 0.00045ms | 0.00046ms |
| natsPublish | cpu | 0.09ms | 0.24ms | 0.00038ms | 0.004 | 0.004 | 0.00034ms | 0.00033ms |
| idempotentProducerSend | cpu | 0.09ms | 0.14ms | 0.00025ms | 0.003 | 0.003 | 0.00022ms | 0.00025ms |
| readCommittedFilter | cpu | 0.09ms | 0.09ms | 0.00021ms | 0.002 | 0.002 | 0.00019ms | 0.00017ms |
| dlqHandleSuccess | cpu | 0.09ms | 0.09ms | 0.00033ms | 0.004 | 0.003 | 0.00030ms | 0.00025ms |
| schemaRegistryRegister | cpu | 0.09ms | 0.10ms | 0.00054ms | 0.006 | 0.006 | 0.00049ms | 0.00046ms |
| transactionalProducerCycle | cpu | 0.09ms | 0.10ms | 0.0025ms | 0.028 | 0.027 | 0.0023ms | 0.0022ms |

## Concurrent p95 (concurrency = 10, 50 iter each)

| op | p95 | cap | gate |
|---|---|---|---|
| kafkaProducerSend | 0.02ms | 20ms | PASS |
| redpandaProducerSend | 0.02ms | 20ms | PASS |
| natsPublish | 0.01ms | 20ms | PASS |
| idempotentProducerSend | 0.00ms | 20ms | PASS |
| readCommittedFilter | 0.01ms | 10ms | PASS |
| dlqHandleSuccess | 0.03ms | 10ms | PASS |
| schemaRegistryRegister | 0.02ms | 10ms | PASS |
| transactionalProducerCycle | 0.04ms | 40ms | PASS |

## Memory retention (200 iter, arrayBuffers axis is the gate; heap is informational)

| op | heapUsed Δ | arrayBuffers Δ | cap | gc exposed | verdict |
|---|---|---|---|---|---|
| kafkaProducerSend | 13616 B | 0 B | 102400 B | yes | PASS |
| redpandaProducerSend | 17568 B | 0 B | 102400 B | yes | PASS |
| natsPublish | 47752 B | 0 B | 102400 B | yes | PASS |
| idempotentProducerSend | -376 B | 0 B | 102400 B | yes | PASS |
| readCommittedFilter | 976 B | 0 B | 102400 B | yes | PASS |
| dlqHandleSuccess | 1360 B | 0 B | 102400 B | yes | PASS |
| schemaRegistryRegister | 68888 B | 0 B | 102400 B | yes | PASS |
| transactionalProducerCycle | 30448 B | 0 B | 102400 B | yes | PASS |

## Detailed serial reports

### kafkaProducerSend

# Perf Report — kafkaProducerSend.serial

| metric | value |
|---|---|
| iterations | 200 |
| warmup | 5 |
| p10 | 0.00050ms |
| p50 | 0.00058ms |
| p95 | 0.0055ms |
| p99 | 0.01ms |
| mean | 0.0014ms |
| stdev | 0.0024ms |
| min | 0.00050ms |
| max | 0.02ms |
| total | 0.28ms |

## Baseline diff

current は baseline を測った時の機械の速さへ換算済み (倍率 0.924)。 回帰判定が読む量と同じ。 実測値は上表。

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.00046ms | 0.00046ms | +0.0000039ms | +0.84% |
| p50 | 0.00054ms | 0.00050ms | +0.000039ms | +7.71% |
| p95 | 0.0051ms | 0.0024ms | +0.0027ms | +114.68% |
| p99 | 0.01ms | 0.0084ms | +0.0033ms | +39.86% |
| mean | 0.0013ms | 0.0010ms | +0.00029ms | +28.83% |
| min | 0.00046ms | 0.00042ms | +0.000046ms | +11.03% |
| max | 0.01ms | 0.01ms | +0.00033ms | +2.42% |
| total | 0.26ms | 0.20ms | +0.06ms | +28.83% |

### redpandaProducerSend

# Perf Report — redpandaProducerSend.serial

| metric | value |
|---|---|
| iterations | 200 |
| warmup | 5 |
| p10 | 0.00050ms |
| p50 | 0.00054ms |
| p95 | 0.0072ms |
| p99 | 0.02ms |
| mean | 0.0021ms |
| stdev | 0.01ms |
| min | 0.00050ms |
| max | 0.17ms |
| total | 0.43ms |

## Baseline diff

current は baseline を測った時の機械の速さへ換算済み (倍率 0.901)。 回帰判定が読む量と同じ。 実測値は上表。

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.00045ms | 0.00046ms | -0.0000076ms | -1.66% |
| p50 | 0.00049ms | 0.00050ms | -0.000012ms | -2.36% |
| p95 | 0.0065ms | 0.00084ms | +0.0057ms | +674.22% |
| p99 | 0.02ms | 0.0043ms | +0.01ms | +334.12% |
| mean | 0.0019ms | 0.00071ms | +0.0012ms | +170.94% |
| min | 0.00045ms | 0.00042ms | +0.000033ms | +8.00% |
| max | 0.15ms | 0.02ms | +0.14ms | +797.91% |
| total | 0.39ms | 0.14ms | +0.24ms | +170.94% |

### natsPublish

# Perf Report — natsPublish.serial

| metric | value |
|---|---|
| iterations | 200 |
| warmup | 5 |
| p10 | 0.00038ms |
| p50 | 0.00042ms |
| p95 | 0.0061ms |
| p99 | 0.02ms |
| mean | 0.0022ms |
| stdev | 0.01ms |
| min | 0.00033ms |
| max | 0.15ms |
| total | 0.44ms |

## Baseline diff

current は baseline を測った時の機械の速さへ換算済み (倍率 0.897)。 回帰判定が読む量と同じ。 実測値は上表。

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.00034ms | 0.00033ms | +0.0000035ms | +1.05% |
| p50 | 0.00037ms | 0.00038ms | -8.1e-7ms | -0.22% |
| p95 | 0.0055ms | 0.0016ms | +0.0039ms | +238.15% |
| p99 | 0.02ms | 0.0077ms | +0.01ms | +187.95% |
| mean | 0.0020ms | 0.00073ms | +0.0012ms | +166.59% |
| min | 0.00030ms | 0.00033ms | -0.000034ms | -10.27% |
| max | 0.14ms | 0.02ms | +0.11ms | +532.68% |
| total | 0.39ms | 0.15ms | +0.24ms | +166.59% |

### idempotentProducerSend

# Perf Report — idempotentProducerSend.serial

| metric | value |
|---|---|
| iterations | 200 |
| warmup | 5 |
| p10 | 0.00025ms |
| p50 | 0.00031ms |
| p95 | 0.0027ms |
| p99 | 0.0076ms |
| mean | 0.0010ms |
| stdev | 0.0044ms |
| min | 0.00025ms |
| max | 0.05ms |
| total | 0.21ms |

## Baseline diff

current は baseline を測った時の機械の速さへ換算済み (倍率 0.896)。 回帰判定が読む量と同じ。 実測値は上表。

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.00022ms | 0.00025ms | -0.000026ms | -10.40% |
| p50 | 0.00028ms | 0.00029ms | -0.000011ms | -3.78% |
| p95 | 0.0025ms | 0.00058ms | +0.0019ms | +320.37% |
| p99 | 0.0068ms | 0.0029ms | +0.0039ms | +136.53% |
| mean | 0.00093ms | 0.00038ms | +0.00055ms | +143.90% |
| min | 0.00022ms | 0.00025ms | -0.000026ms | -10.40% |
| max | 0.05ms | 0.0077ms | +0.04ms | +534.01% |
| total | 0.19ms | 0.08ms | +0.11ms | +143.90% |

### readCommittedFilter

# Perf Report — readCommittedFilter.serial

| metric | value |
|---|---|
| iterations | 200 |
| warmup | 5 |
| p10 | 0.00021ms |
| p50 | 0.00021ms |
| p95 | 0.0015ms |
| p99 | 0.0096ms |
| mean | 0.00060ms |
| stdev | 0.0018ms |
| min | 0.00017ms |
| max | 0.02ms |
| total | 0.12ms |

## Baseline diff

current は baseline を測った時の機械の速さへ換算済み (倍率 0.902)。 回帰判定が読む量と同じ。 実測値は上表。

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.00019ms | 0.00017ms | +0.000022ms | +13.08% |
| p50 | 0.00019ms | 0.00021ms | -0.000019ms | -9.32% |
| p95 | 0.0014ms | 0.00043ms | +0.00097ms | +225.33% |
| p99 | 0.0086ms | 0.0037ms | +0.0050ms | +135.88% |
| mean | 0.00054ms | 0.00034ms | +0.00020ms | +58.49% |
| min | 0.00015ms | 0.00017ms | -0.000015ms | -9.21% |
| max | 0.02ms | 0.0075ms | +0.0088ms | +117.58% |
| total | 0.11ms | 0.07ms | +0.04ms | +58.49% |

### dlqHandleSuccess

# Perf Report — dlqHandleSuccess.serial

| metric | value |
|---|---|
| iterations | 200 |
| warmup | 5 |
| p10 | 0.00033ms |
| p50 | 0.00038ms |
| p95 | 0.0014ms |
| p99 | 0.0048ms |
| mean | 0.00056ms |
| stdev | 0.00085ms |
| min | 0.00029ms |
| max | 0.0084ms |
| total | 0.11ms |

## Baseline diff

current は baseline を測った時の機械の速さへ換算済み (倍率 0.907)。 回帰判定が読む量と同じ。 実測値は上表。

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.00030ms | 0.00025ms | +0.000052ms | +20.83% |
| p50 | 0.00034ms | 0.00029ms | +0.000048ms | +16.50% |
| p95 | 0.0013ms | 0.00054ms | +0.00074ms | +136.60% |
| p99 | 0.0044ms | 0.0037ms | +0.00068ms | +18.39% |
| mean | 0.00050ms | 0.00042ms | +0.000086ms | +20.70% |
| min | 0.00026ms | 0.00025ms | +0.000014ms | +5.59% |
| max | 0.0076ms | 0.0058ms | +0.0018ms | +31.17% |
| total | 0.10ms | 0.08ms | +0.02ms | +20.70% |

### schemaRegistryRegister

# Perf Report — schemaRegistryRegister.serial

| metric | value |
|---|---|
| iterations | 200 |
| warmup | 5 |
| p10 | 0.00054ms |
| p50 | 0.00075ms |
| p95 | 0.0089ms |
| p99 | 0.02ms |
| mean | 0.0018ms |
| stdev | 0.0037ms |
| min | 0.00046ms |
| max | 0.03ms |
| total | 0.35ms |

## Baseline diff

current は baseline を測った時の機械の速さへ換算済み (倍率 0.902)。 回帰判定が読む量と同じ。 実測値は上表。

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.00049ms | 0.00046ms | +0.000030ms | +6.55% |
| p50 | 0.00068ms | 0.00058ms | +0.000094ms | +16.04% |
| p95 | 0.0080ms | 0.0039ms | +0.0041ms | +106.74% |
| p99 | 0.01ms | 0.01ms | +0.0031ms | +28.07% |
| mean | 0.0016ms | 0.0011ms | +0.00050ms | +46.97% |
| min | 0.00041ms | 0.00042ms | -0.0000029ms | -0.69% |
| max | 0.03ms | 0.01ms | +0.01ms | +97.69% |
| total | 0.32ms | 0.21ms | +0.10ms | +46.97% |

### transactionalProducerCycle

# Perf Report — transactionalProducerCycle.serial

| metric | value |
|---|---|
| iterations | 200 |
| warmup | 5 |
| p10 | 0.0025ms |
| p50 | 0.0027ms |
| p95 | 0.0089ms |
| p99 | 0.03ms |
| mean | 0.0038ms |
| stdev | 0.0047ms |
| min | 0.0023ms |
| max | 0.04ms |
| total | 0.77ms |

## Baseline diff

current は baseline を測った時の機械の速さへ換算済み (倍率 0.900)。 回帰判定が読む量と同じ。 実測値は上表。

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.0023ms | 0.0022ms | +0.000043ms | +1.95% |
| p50 | 0.0024ms | 0.0024ms | +0.000026ms | +1.11% |
| p95 | 0.0080ms | 0.01ms | -0.0040ms | -33.14% |
| p99 | 0.03ms | 0.02ms | +0.0027ms | +11.61% |
| mean | 0.0035ms | 0.0039ms | -0.00047ms | -11.88% |
| min | 0.0021ms | 0.0021ms | -0.000024ms | -1.15% |
| max | 0.04ms | 0.04ms | -0.00056ms | -1.45% |
| total | 0.69ms | 0.78ms | -0.09ms | -11.88% |

