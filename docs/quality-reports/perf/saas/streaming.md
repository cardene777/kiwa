# Perf Suite — streaming

Threshold source: [docs/quality/perf-thresholds.md](../../../quality/perf-thresholds)

測定系の分解能 = 0.00042ms (何もしない関数を同じ経路で呼んだ時の p10)。 回帰判定の絶対下限は既定でこの 2 倍 = 0.00083ms、 op ごとの実効値は下表の「下限」 列。

## Serial (concurrency = 1)

| op | p10 (実測) | p95 (上限判定) | cap | 下限 | gate | regression |
|---|---|---|---|---|---|---|
| kafkaProducerSend | 0.00054ms | 0.01ms | 10ms | 0.00073ms | PASS | stable (検知には +0.00073ms (baseline 比 +159%) 以上の悪化が必要) — gate 無効 (regressionGate=false) |
| redpandaProducerSend | 0.00050ms | 0.00088ms | 10ms | 0.00072ms | PASS | stable (検知には +0.00072ms (baseline 比 +156%) 以上の悪化が必要) — gate 無効 (regressionGate=false) |
| natsPublish | 0.00042ms | 0.0018ms | 10ms | 0.00071ms | PASS | stable (検知には +0.00071ms (baseline 比 +214%) 以上の悪化が必要) — gate 無効 (regressionGate=false) |
| idempotentProducerSend | 0.00029ms | 0.00042ms | 10ms | 0.00072ms | PASS | stable (検知には +0.00072ms (baseline 比 +286%) 以上の悪化が必要) — gate 無効 (regressionGate=false) |
| readCommittedFilter | 0.00021ms | 0.00029ms | 5ms | 0.00072ms | PASS | stable (検知には +0.00072ms (baseline 比 +431%) 以上の悪化が必要) — gate 無効 (regressionGate=false) |
| dlqHandleSuccess | 0.00038ms | 0.00055ms | 5ms | 0.00071ms | PASS | stable (差 0.000071ms が下限 0.00071ms 未満で判定を保留) — gate 無効 (regressionGate=false) |
| schemaRegistryRegister | 0.00054ms | 0.0026ms | 5ms | 0.00072ms | PASS | stable (検知には +0.00072ms (baseline 比 +156%) 以上の悪化が必要) — gate 無効 (regressionGate=false) |
| transactionalProducerCycle | 0.0026ms | 0.0038ms | 20ms | 0.00072ms | PASS | stable — gate 無効 (regressionGate=false) |

## 実行内正規化 (回帰判定はこの比で行う)

回帰判定は実測値そのものではなく、 同じ実行の中で 1 呼出ずつ交互に測った基準 op との比を読む。 実行と実行の間で機械の状態が変わっても、 その差が分子と分母で相殺される。 「換算後 p10」 は今回の比を baseline を測った時の基準 p10 で ms に戻した値で、 baseline の実測 p10 と直接比べられる。


「実行間のばらつき」 は baseline が持つ過去の比が、 baseline 自身の比からどれだけ離れたかの最大値。 その op が実装を変えずに測るだけでどれだけ動くかを表す。 判定はこの幅の 2 倍と相対閾値の大きい方を超えた差だけを有意として扱う (#1739)。 履歴が 3 件に満たない op では推定できないため n/a になり、 相対閾値だけで判定する。

| op | 基準 op | 基準 p10 | 基準 p95 | 実測 p10 | 比 | baseline の比 | 実行間のばらつき | 実効閾値 | 換算後 p10 | baseline p10 |
|---|---|---|---|---|---|---|---|---|---|---|
| kafkaProducerSend | cpu | 0.09ms | 0.13ms | 0.00054ms | 0.006 | 0.006 | n/a | 20.0% | 0.00047ms | 0.00046ms |
| redpandaProducerSend | cpu | 0.09ms | 0.10ms | 0.00050ms | 0.005 | 0.006 | n/a | 20.0% | 0.00043ms | 0.00046ms |
| natsPublish | cpu | 0.09ms | 0.10ms | 0.00042ms | 0.004 | 0.004 | n/a | 20.0% | 0.00035ms | 0.00033ms |
| idempotentProducerSend | cpu | 0.09ms | 0.10ms | 0.00029ms | 0.003 | 0.003 | n/a | 20.0% | 0.00025ms | 0.00025ms |
| readCommittedFilter | cpu | 0.09ms | 0.10ms | 0.00021ms | 0.002 | 0.002 | n/a | 20.0% | 0.00018ms | 0.00017ms |
| dlqHandleSuccess | cpu | 0.09ms | 0.10ms | 0.00038ms | 0.004 | 0.003 | n/a | 20.0% | 0.00032ms | 0.00025ms |
| schemaRegistryRegister | cpu | 0.09ms | 0.09ms | 0.00054ms | 0.006 | 0.006 | n/a | 20.0% | 0.00046ms | 0.00046ms |
| transactionalProducerCycle | cpu | 0.09ms | 0.09ms | 0.0026ms | 0.028 | 0.027 | n/a | 20.0% | 0.0022ms | 0.0022ms |

## Concurrent p95 (concurrency = 10, 50 iter each)

| op | p95 | cap | gate |
|---|---|---|---|
| kafkaProducerSend | 0.05ms | 20ms | PASS |
| redpandaProducerSend | 0.01ms | 20ms | PASS |
| natsPublish | 0.01ms | 20ms | PASS |
| idempotentProducerSend | 0.00ms | 20ms | PASS |
| readCommittedFilter | 0.01ms | 10ms | PASS |
| dlqHandleSuccess | 0.00ms | 10ms | PASS |
| schemaRegistryRegister | 0.02ms | 10ms | PASS |
| transactionalProducerCycle | 0.04ms | 40ms | PASS |

## Memory retention (200 iter, arrayBuffers axis is the gate; heap is informational)

| op | heapUsed Δ | arrayBuffers Δ | cap | gc exposed | 呼出 (空回し + 反復) | verdict |
|---|---|---|---|---|---|---|
| kafkaProducerSend | 9680 B | -121926 B | 102400 B | yes | 220 (20 + 200) | PASS |
| redpandaProducerSend | 18976 B | 0 B | 102400 B | yes | 220 (20 + 200) | PASS |
| natsPublish | 47224 B | 0 B | 102400 B | yes | 220 (20 + 200) | PASS |
| idempotentProducerSend | 3440 B | 0 B | 102400 B | yes | 220 (20 + 200) | PASS |
| readCommittedFilter | 3432 B | 0 B | 102400 B | yes | 220 (20 + 200) | PASS |
| dlqHandleSuccess | 14048 B | 0 B | 102400 B | yes | 220 (20 + 200) | PASS |
| schemaRegistryRegister | 84096 B | 0 B | 102400 B | yes | 220 (20 + 200) | PASS |
| transactionalProducerCycle | 14496 B | 0 B | 102400 B | yes | 220 (20 + 200) | PASS |

## Detailed serial reports

### kafkaProducerSend

# Perf Report — kafkaProducerSend.serial

| metric | value |
|---|---|
| iterations | 200 |
| warmup | 5 |
| p10 | 0.00054ms |
| p50 | 0.00058ms |
| p95 | 0.01ms |
| p99 | 0.02ms |
| mean | 0.0023ms |
| stdev | 0.0043ms |
| min | 0.00050ms |
| max | 0.03ms |
| total | 0.45ms |

## Baseline diff

current は baseline を測った時の機械の速さへ換算済み (倍率 0.872)。 回帰判定が読む量と同じ。 実測値は上表。

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.00047ms | 0.00046ms | +0.000015ms | +3.24% |
| p50 | 0.00051ms | 0.00050ms | +0.0000095ms | +1.89% |
| p95 | 0.01ms | 0.0024ms | +0.0081ms | +343.77% |
| p99 | 0.02ms | 0.0084ms | +0.0096ms | +114.46% |
| mean | 0.0020ms | 0.0010ms | +0.00097ms | +97.64% |
| min | 0.00044ms | 0.00042ms | +0.000020ms | +4.85% |
| max | 0.02ms | 0.01ms | +0.0094ms | +67.88% |
| total | 0.39ms | 0.20ms | +0.19ms | +97.64% |

### redpandaProducerSend

# Perf Report — redpandaProducerSend.serial

| metric | value |
|---|---|
| iterations | 200 |
| warmup | 5 |
| p10 | 0.00050ms |
| p50 | 0.00054ms |
| p95 | 0.00088ms |
| p99 | 0.0017ms |
| mean | 0.00060ms |
| stdev | 0.00025ms |
| min | 0.00050ms |
| max | 0.0032ms |
| total | 0.12ms |

## Baseline diff

current は baseline を測った時の機械の速さへ換算済み (倍率 0.858)。 回帰判定が読む量と同じ。 実測値は上表。

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.00043ms | 0.00046ms | -0.000029ms | -6.36% |
| p50 | 0.00046ms | 0.00050ms | -0.000035ms | -7.02% |
| p95 | 0.00075ms | 0.00084ms | -0.000091ms | -10.80% |
| p99 | 0.0014ms | 0.0043ms | -0.0028ms | -66.36% |
| mean | 0.00052ms | 0.00071ms | -0.00019ms | -27.12% |
| min | 0.00043ms | 0.00042ms | +0.000012ms | +2.85% |
| max | 0.0028ms | 0.02ms | -0.01ms | -83.89% |
| total | 0.10ms | 0.14ms | -0.04ms | -27.12% |

### natsPublish

# Perf Report — natsPublish.serial

| metric | value |
|---|---|
| iterations | 200 |
| warmup | 5 |
| p10 | 0.00042ms |
| p50 | 0.00046ms |
| p95 | 0.0018ms |
| p99 | 0.0071ms |
| mean | 0.00067ms |
| stdev | 0.0013ms |
| min | 0.00038ms |
| max | 0.02ms |
| total | 0.13ms |

## Baseline diff

current は baseline を測った時の機械の速さへ換算済み (倍率 0.853)。 回帰判定が読む量と同じ。 実測値は上表。

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.00035ms | 0.00033ms | +0.000022ms | +6.58% |
| p50 | 0.00039ms | 0.00038ms | +0.000016ms | +4.20% |
| p95 | 0.0016ms | 0.0016ms | -0.000063ms | -3.85% |
| p99 | 0.0061ms | 0.0077ms | -0.0017ms | -21.46% |
| mean | 0.00058ms | 0.00073ms | -0.00016ms | -21.69% |
| min | 0.00032ms | 0.00033ms | -0.000013ms | -3.92% |
| max | 0.01ms | 0.02ms | -0.0079ms | -36.72% |
| total | 0.12ms | 0.15ms | -0.03ms | -21.69% |

### idempotentProducerSend

# Perf Report — idempotentProducerSend.serial

| metric | value |
|---|---|
| iterations | 200 |
| warmup | 5 |
| p10 | 0.00029ms |
| p50 | 0.00029ms |
| p95 | 0.00042ms |
| p99 | 0.0013ms |
| mean | 0.00035ms |
| stdev | 0.00025ms |
| min | 0.00025ms |
| max | 0.0031ms |
| total | 0.07ms |

## Baseline diff

current は baseline を測った時の機械の速さへ換算済み (倍率 0.858)。 回帰判定が読む量と同じ。 実測値は上表。

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.00025ms | 0.00025ms | -3.1e-7ms | -0.13% |
| p50 | 0.00025ms | 0.00029ms | -0.000040ms | -13.90% |
| p95 | 0.00036ms | 0.00058ms | -0.00022ms | -37.72% |
| p99 | 0.0011ms | 0.0029ms | -0.0017ms | -60.15% |
| mean | 0.00030ms | 0.00038ms | -0.000085ms | -22.33% |
| min | 0.00021ms | 0.00025ms | -0.000035ms | -14.20% |
| max | 0.0026ms | 0.0077ms | -0.0050ms | -65.50% |
| total | 0.06ms | 0.08ms | -0.02ms | -22.33% |

### readCommittedFilter

# Perf Report — readCommittedFilter.serial

| metric | value |
|---|---|
| iterations | 200 |
| warmup | 5 |
| p10 | 0.00021ms |
| p50 | 0.00025ms |
| p95 | 0.00029ms |
| p99 | 0.0024ms |
| mean | 0.00032ms |
| stdev | 0.00068ms |
| min | 0.00017ms |
| max | 0.0091ms |
| total | 0.06ms |

## Baseline diff

current は baseline を測った時の機械の速さへ換算済み (倍率 0.859)。 回帰判定が読む量と同じ。 実測値は上表。

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.00018ms | 0.00017ms | +0.000013ms | +7.60% |
| p50 | 0.00021ms | 0.00021ms | +0.0000067ms | +3.21% |
| p95 | 0.00025ms | 0.00043ms | -0.00018ms | -41.61% |
| p99 | 0.0021ms | 0.0037ms | -0.0016ms | -43.12% |
| mean | 0.00028ms | 0.00034ms | -0.000066ms | -19.35% |
| min | 0.00014ms | 0.00017ms | -0.000023ms | -13.61% |
| max | 0.0078ms | 0.0075ms | +0.00030ms | +4.01% |
| total | 0.06ms | 0.07ms | -0.01ms | -19.35% |

### dlqHandleSuccess

# Perf Report — dlqHandleSuccess.serial

| metric | value |
|---|---|
| iterations | 200 |
| warmup | 5 |
| p10 | 0.00038ms |
| p50 | 0.00038ms |
| p95 | 0.00055ms |
| p99 | 0.0020ms |
| mean | 0.00095ms |
| stdev | 0.0074ms |
| min | 0.00033ms |
| max | 0.10ms |
| total | 0.19ms |

## Baseline diff

current は baseline を測った時の機械の速さへ換算済み (倍率 0.857)。 回帰判定が読む量と同じ。 実測値は上表。

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.00032ms | 0.00025ms | +0.000071ms | +28.54% |
| p50 | 0.00032ms | 0.00029ms | +0.000029ms | +10.06% |
| p95 | 0.00047ms | 0.00054ms | -0.000077ms | -14.13% |
| p99 | 0.0017ms | 0.0037ms | -0.0019ms | -52.47% |
| mean | 0.00081ms | 0.00042ms | +0.00040ms | +94.88% |
| min | 0.00029ms | 0.00025ms | +0.000035ms | +14.15% |
| max | 0.09ms | 0.0058ms | +0.08ms | +1449.85% |
| total | 0.16ms | 0.08ms | +0.08ms | +94.88% |

### schemaRegistryRegister

# Perf Report — schemaRegistryRegister.serial

| metric | value |
|---|---|
| iterations | 200 |
| warmup | 5 |
| p10 | 0.00054ms |
| p50 | 0.00058ms |
| p95 | 0.0026ms |
| p99 | 0.0064ms |
| mean | 0.0010ms |
| stdev | 0.0016ms |
| min | 0.00050ms |
| max | 0.02ms |
| total | 0.20ms |

## Baseline diff

current は baseline を測った時の機械の速さへ換算済み (倍率 0.858)。 回帰判定が読む量と同じ。 実測値は上表。

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.00046ms | 0.00046ms | +0.0000060ms | +1.30% |
| p50 | 0.00050ms | 0.00058ms | -0.000082ms | -14.09% |
| p95 | 0.0023ms | 0.0039ms | -0.0016ms | -41.25% |
| p99 | 0.0055ms | 0.01ms | -0.0055ms | -49.91% |
| mean | 0.00086ms | 0.0011ms | -0.00021ms | -19.51% |
| min | 0.00043ms | 0.00042ms | +0.000013ms | +3.08% |
| max | 0.01ms | 0.01ms | -0.0021ms | -13.77% |
| total | 0.17ms | 0.21ms | -0.04ms | -19.51% |

### transactionalProducerCycle

# Perf Report — transactionalProducerCycle.serial

| metric | value |
|---|---|
| iterations | 200 |
| warmup | 5 |
| p10 | 0.0026ms |
| p50 | 0.0026ms |
| p95 | 0.0038ms |
| p99 | 0.01ms |
| mean | 0.0030ms |
| stdev | 0.0019ms |
| min | 0.0025ms |
| max | 0.02ms |
| total | 0.60ms |

## Baseline diff

current は baseline を測った時の機械の速さへ換算済み (倍率 0.864)。 回帰判定が読む量と同じ。 実測値は上表。

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.0022ms | 0.0022ms | +0.000024ms | +1.07% |
| p50 | 0.0023ms | 0.0024ms | -0.00011ms | -4.51% |
| p95 | 0.0033ms | 0.01ms | -0.0086ms | -72.20% |
| p99 | 0.01ms | 0.02ms | -0.01ms | -49.00% |
| mean | 0.0026ms | 0.0039ms | -0.0013ms | -33.40% |
| min | 0.0022ms | 0.0021ms | +0.000035ms | +1.65% |
| max | 0.02ms | 0.04ms | -0.02ms | -58.53% |
| total | 0.52ms | 0.78ms | -0.26ms | -33.40% |

