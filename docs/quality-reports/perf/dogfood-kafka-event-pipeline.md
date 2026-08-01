# Perf Suite — dogfood-kafka-event-pipeline

Threshold source: [docs/quality/perf-thresholds.md](../../quality/perf-thresholds)

測定系の分解能 = 0.00017ms (何もしない関数を同じ経路で呼んだ時の p10)。 回帰判定の絶対下限は既定でこの 2 倍 = 0.00033ms、 op ごとの実効値は下表の「下限」 列。

## Serial (concurrency = 1)

| op | p10 (実測) | p95 (上限判定) | cap | 下限 | gate | regression |
|---|---|---|---|---|---|---|
| driveProducer | 0.0063ms | 0.04ms | 80ms | 0.00031ms | PASS | stable (換算後 p10 -6% (閾値未満)、 p95 +37% (裾は実行間の振れ幅と区別できないため判定には使わない)) — gate 無効 (regressionGate=false) |
| driveConsumerGroup | 0.01ms | 0.03ms | 150ms | 0.00031ms | PASS | stable — gate 無効 (regressionGate=false) |
| driveTransaction | 0.0095ms | 0.02ms | 80ms | 0.00031ms | PASS | stable — gate 無効 (regressionGate=false) |
| driveDlq | 0.02ms | 0.04ms | 80ms | 0.00031ms | PASS | stable (換算後 p10 +1% (閾値未満)、 p95 +29% (裾は実行間の振れ幅と区別できないため判定には使わない)) — gate 無効 (regressionGate=false) |

## 実行内正規化 (回帰判定はこの比で行う)

回帰判定は実測値そのものではなく、 同じ実行の中で 1 呼出ずつ交互に測った基準 op との比を読む。 実行と実行の間で機械の状態が変わっても、 その差が分子と分母で相殺される。 「換算後 p10」 は今回の比を baseline を測った時の基準 p10 で ms に戻した値で、 baseline の実測 p10 と直接比べられる。


「実行間のばらつき」 は baseline が持つ過去の比が、 baseline 自身の比からどれだけ離れたかの最大値。 その op が実装を変えずに測るだけでどれだけ動くかを表す。 判定はこの幅の 2 倍と相対閾値の大きい方を超えた差だけを有意として扱う (#1739)。 履歴が 3 件に満たない op では推定できないため n/a になり、 相対閾値だけで判定する。

| op | 基準 op | 基準 p10 | 基準 p95 | 実測 p10 | 比 | baseline の比 | 実行間のばらつき | 実効閾値 | 換算後 p10 | baseline p10 |
|---|---|---|---|---|---|---|---|---|---|---|
| driveProducer | cpu | 0.09ms | 0.12ms | 0.0063ms | 0.071 | 0.076 | n/a | 20.0% | 0.0059ms | 0.0062ms |
| driveConsumerGroup | cpu | 0.09ms | 0.09ms | 0.01ms | 0.158 | 0.173 | n/a | 20.0% | 0.01ms | 0.01ms |
| driveTransaction | cpu | 0.09ms | 0.09ms | 0.0095ms | 0.110 | 0.108 | n/a | 20.0% | 0.0089ms | 0.0088ms |
| driveDlq | cpu | 0.09ms | 0.09ms | 0.02ms | 0.185 | 0.184 | n/a | 20.0% | 0.02ms | 0.01ms |

## Concurrent p95 (concurrency = 10, 50 iter each)

| op | p95 | cap | gate |
|---|---|---|---|
| driveProducer | 0.34ms | 160ms | PASS |
| driveConsumerGroup | 0.26ms | 300ms | PASS |
| driveTransaction | 0.12ms | 160ms | PASS |
| driveDlq | 0.28ms | 160ms | PASS |

## Memory retention (200 iter, arrayBuffers axis is the gate; heap is informational)

| op | heapUsed Δ | arrayBuffers Δ | cap | gc exposed | 呼出 (空回し + 反復) | verdict |
|---|---|---|---|---|---|---|
| driveProducer | -2288 B | 0 B | 102400 B | yes | 220 (20 + 200) | PASS |
| driveConsumerGroup | -7448 B | 0 B | 102400 B | yes | 220 (20 + 200) | PASS |
| driveTransaction | 2168 B | 0 B | 102400 B | yes | 220 (20 + 200) | PASS |
| driveDlq | -6720 B | 0 B | 102400 B | yes | 220 (20 + 200) | PASS |

## Detailed serial reports

### driveProducer

# Perf Report — driveProducer.serial

| metric | value |
|---|---|
| iterations | 200 |
| warmup | 5 |
| p10 | 0.0063ms |
| p50 | 0.0068ms |
| p95 | 0.04ms |
| p99 | 0.09ms |
| mean | 0.01ms |
| stdev | 0.03ms |
| min | 0.0061ms |
| max | 0.40ms |
| total | 2.56ms |

## Baseline diff

current は baseline を測った時の機械の速さへ換算済み (倍率 0.924)。 回帰判定が読む量と同じ。 実測値は上表。

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.0059ms | 0.0062ms | -0.00036ms | -5.73% |
| p50 | 0.0063ms | 0.0068ms | -0.00046ms | -6.74% |
| p95 | 0.03ms | 0.02ms | +0.0091ms | +37.36% |
| p99 | 0.09ms | 0.05ms | +0.04ms | +83.03% |
| mean | 0.01ms | 0.0095ms | +0.0023ms | +24.37% |
| min | 0.0057ms | 0.0053ms | +0.00033ms | +6.13% |
| max | 0.37ms | 0.08ms | +0.29ms | +345.83% |
| total | 2.36ms | 1.90ms | +0.46ms | +24.37% |

### driveConsumerGroup

# Perf Report — driveConsumerGroup.serial

| metric | value |
|---|---|
| iterations | 200 |
| warmup | 5 |
| p10 | 0.01ms |
| p50 | 0.02ms |
| p95 | 0.03ms |
| p99 | 0.05ms |
| mean | 0.02ms |
| stdev | 0.01ms |
| min | 0.01ms |
| max | 0.19ms |
| total | 3.60ms |

## Baseline diff

current は baseline を測った時の機械の速さへ換算済み (倍率 0.949)。 回帰判定が読む量と同じ。 実測値は上表。

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.01ms | 0.01ms | -0.0012ms | -8.52% |
| p50 | 0.02ms | 0.02ms | -0.0011ms | -6.75% |
| p95 | 0.03ms | 0.04ms | -0.01ms | -32.95% |
| p99 | 0.05ms | 0.09ms | -0.04ms | -48.05% |
| mean | 0.02ms | 0.02ms | -0.0031ms | -15.57% |
| min | 0.01ms | 0.01ms | -0.00064ms | -4.85% |
| max | 0.18ms | 0.22ms | -0.05ms | -20.64% |
| total | 3.41ms | 4.04ms | -0.63ms | -15.57% |

### driveTransaction

# Perf Report — driveTransaction.serial

| metric | value |
|---|---|
| iterations | 200 |
| warmup | 5 |
| p10 | 0.0095ms |
| p50 | 0.0098ms |
| p95 | 0.02ms |
| p99 | 0.04ms |
| mean | 0.01ms |
| stdev | 0.01ms |
| min | 0.0090ms |
| max | 0.14ms |
| total | 2.40ms |

## Baseline diff

current は baseline を測った時の機械の速さへ換算済み (倍率 0.936)。 回帰判定が読む量と同じ。 実測値は上表。

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.0089ms | 0.0088ms | +0.00014ms | +1.58% |
| p50 | 0.0092ms | 0.0091ms | +0.000076ms | +0.83% |
| p95 | 0.02ms | 0.02ms | -0.0069ms | -27.98% |
| p99 | 0.04ms | 0.06ms | -0.01ms | -25.92% |
| mean | 0.01ms | 0.01ms | -0.00040ms | -3.41% |
| min | 0.0084ms | 0.0085ms | -0.000080ms | -0.94% |
| max | 0.13ms | 0.08ms | +0.05ms | +67.99% |
| total | 2.24ms | 2.32ms | -0.08ms | -3.41% |

### driveDlq

# Perf Report — driveDlq.serial

| metric | value |
|---|---|
| iterations | 200 |
| warmup | 5 |
| p10 | 0.02ms |
| p50 | 0.02ms |
| p95 | 0.04ms |
| p99 | 0.10ms |
| mean | 0.02ms |
| stdev | 0.02ms |
| min | 0.02ms |
| max | 0.21ms |
| total | 4.34ms |

## Baseline diff

current は baseline を測った時の機械の速さへ換算済み (倍率 0.941)。 回帰判定が読む量と同じ。 実測値は上表。

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.02ms | 0.01ms | +0.000097ms | +0.65% |
| p50 | 0.02ms | 0.02ms | +0.00024ms | +1.51% |
| p95 | 0.04ms | 0.03ms | +0.0081ms | +29.26% |
| p99 | 0.09ms | 0.05ms | +0.05ms | +100.78% |
| mean | 0.02ms | 0.02ms | +0.0028ms | +15.64% |
| min | 0.01ms | 0.01ms | +0.000046ms | +0.32% |
| max | 0.20ms | 0.11ms | +0.09ms | +76.14% |
| total | 4.08ms | 3.53ms | +0.55ms | +15.64% |

