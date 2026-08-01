# Perf Suite — queue

Threshold source: [docs/quality/perf-thresholds.md](../../../quality/perf-thresholds)

測定系の分解能 = 0.00017ms (何もしない関数を同じ経路で呼んだ時の p10)。 回帰判定の絶対下限は既定でこの 2 倍 = 0.00033ms、 op ごとの実効値は下表の「下限」 列。

## Serial (concurrency = 1)

| op | p10 (実測) | p95 (上限判定) | cap | 下限 | gate | regression |
|---|---|---|---|---|---|---|
| bullmqEnvAccessor | 0.00013ms | 0.0014ms | 5ms | 0.00030ms | PASS | stable (検知には +0.00030ms (baseline 比 +242%) 以上の悪化が必要) — gate 無効 (regressionGate=false) |
| inngestEnvAccessor | 0.00013ms | 0.00025ms | 5ms | 0.00030ms | PASS | stable (検知には +0.00030ms (baseline 比 +244%) 以上の悪化が必要) — gate 無効 (regressionGate=false) |
| cloudflareQueuesEnvAccessor | 0.00017ms | 0.00059ms | 5ms | 0.00030ms | PASS | stable (検知には +0.00030ms (baseline 比 +182%) 以上の悪化が必要) — gate 無効 (regressionGate=false) |
| sqsEnvAccessor | 0.00017ms | 0.00029ms | 5ms | 0.00030ms | PASS | stable (検知には +0.00030ms (baseline 比 +181%) 以上の悪化が必要) — gate 無効 (regressionGate=false) |
| rabbitmqEnvAccessor | 0.00013ms | 0.00021ms | 5ms | 0.00030ms | PASS | stable (検知には +0.00030ms (baseline 比 +239%) 以上の悪化が必要) — gate 無効 (regressionGate=false) |

## 実行内正規化 (回帰判定はこの比で行う)

回帰判定は実測値そのものではなく、 同じ実行の中で 1 呼出ずつ交互に測った基準 op との比を読む。 実行と実行の間で機械の状態が変わっても、 その差が分子と分母で相殺される。 「換算後 p10」 は今回の比を baseline を測った時の基準 p10 で ms に戻した値で、 baseline の実測 p10 と直接比べられる。


「実行間のばらつき」 は baseline が持つ過去の比が、 baseline 自身の比からどれだけ離れたかの最大値。 その op が実装を変えずに測るだけでどれだけ動くかを表す。 判定はこの幅の 2 倍と相対閾値の大きい方を超えた差だけを有意として扱う (#1739)。 履歴が 3 件に満たない op では推定できないため n/a になり、 相対閾値だけで判定する。

| op | 基準 op | 基準 p10 | 基準 p95 | 実測 p10 | 比 | baseline の比 | 実行間のばらつき | 実効閾値 | 換算後 p10 | baseline p10 |
|---|---|---|---|---|---|---|---|---|---|---|
| bullmqEnvAccessor | cpu | 0.09ms | 0.10ms | 0.00013ms | 0.001 | 0.002 | n/a | 20.0% | 0.00011ms | 0.00013ms |
| inngestEnvAccessor | cpu | 0.09ms | 0.09ms | 0.00013ms | 0.001 | 0.002 | n/a | 20.0% | 0.00011ms | 0.00013ms |
| cloudflareQueuesEnvAccessor | cpu | 0.09ms | 0.09ms | 0.00017ms | 0.002 | 0.002 | n/a | 20.0% | 0.00015ms | 0.00017ms |
| sqsEnvAccessor | cpu | 0.09ms | 0.09ms | 0.00017ms | 0.002 | 0.002 | n/a | 20.0% | 0.00015ms | 0.00017ms |
| rabbitmqEnvAccessor | cpu | 0.09ms | 0.09ms | 0.00013ms | 0.001 | 0.002 | n/a | 20.0% | 0.00011ms | 0.00013ms |

## Concurrent p95 (concurrency = 10, 50 iter each)

| op | p95 | cap | gate |
|---|---|---|---|
| bullmqEnvAccessor | 0.00ms | 10ms | PASS |
| inngestEnvAccessor | 0.00ms | 10ms | PASS |
| cloudflareQueuesEnvAccessor | 0.00ms | 10ms | PASS |
| sqsEnvAccessor | 0.00ms | 10ms | PASS |
| rabbitmqEnvAccessor | 0.00ms | 10ms | PASS |

## Memory retention (200 iter, arrayBuffers axis is the gate; heap is informational)

| op | heapUsed Δ | arrayBuffers Δ | cap | gc exposed | 呼出 (空回し + 反復) | verdict |
|---|---|---|---|---|---|---|
| bullmqEnvAccessor | -21416 B | 0 B | 102400 B | yes | 220 (20 + 200) | PASS |
| inngestEnvAccessor | -15072 B | 0 B | 102400 B | yes | 220 (20 + 200) | PASS |
| cloudflareQueuesEnvAccessor | 1520 B | 0 B | 102400 B | yes | 220 (20 + 200) | PASS |
| sqsEnvAccessor | 712 B | 0 B | 102400 B | yes | 220 (20 + 200) | PASS |
| rabbitmqEnvAccessor | 1960 B | 0 B | 102400 B | yes | 220 (20 + 200) | PASS |

## Detailed serial reports

### bullmqEnvAccessor

# Perf Report — bullmqEnvAccessor.serial

| metric | value |
|---|---|
| iterations | 200 |
| warmup | 5 |
| p10 | 0.00013ms |
| p50 | 0.00017ms |
| p95 | 0.0014ms |
| p99 | 0.0032ms |
| mean | 0.00036ms |
| stdev | 0.00093ms |
| min | 0.000084ms |
| max | 0.01ms |
| total | 0.07ms |

## Baseline diff

current は baseline を測った時の機械の速さへ換算済み (倍率 0.912)。 回帰判定が読む量と同じ。 実測値は上表。

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.00011ms | 0.00013ms | -0.000011ms | -8.85% |
| p50 | 0.00015ms | 0.00013ms | +0.000027ms | +21.78% |
| p95 | 0.0013ms | 0.0017ms | -0.00041ms | -24.55% |
| p99 | 0.0029ms | 0.0036ms | -0.00068ms | -19.10% |
| mean | 0.00033ms | 0.00044ms | -0.00011ms | -25.20% |
| min | 0.000077ms | 0.000083ms | -0.0000064ms | -7.75% |
| max | 0.01ms | 0.01ms | -0.00026ms | -2.44% |
| total | 0.07ms | 0.09ms | -0.02ms | -25.20% |

### inngestEnvAccessor

# Perf Report — inngestEnvAccessor.serial

| metric | value |
|---|---|
| iterations | 200 |
| warmup | 5 |
| p10 | 0.00013ms |
| p50 | 0.00017ms |
| p95 | 0.00025ms |
| p99 | 0.0015ms |
| mean | 0.00023ms |
| stdev | 0.00051ms |
| min | 0.00013ms |
| max | 0.0064ms |
| total | 0.05ms |

## Baseline diff

current は baseline を測った時の機械の速さへ換算済み (倍率 0.917)。 回帰判定が読む量と同じ。 実測値は上表。

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.00011ms | 0.00013ms | -0.000010ms | -8.30% |
| p50 | 0.00015ms | 0.00013ms | +0.000027ms | +21.78% |
| p95 | 0.00023ms | 0.00033ms | -0.00010ms | -30.78% |
| p99 | 0.0014ms | 0.0025ms | -0.0011ms | -44.62% |
| mean | 0.00021ms | 0.00022ms | -0.000010ms | -4.62% |
| min | 0.00011ms | 0.000083ms | +0.000032ms | +38.11% |
| max | 0.0059ms | 0.0041ms | +0.0018ms | +42.63% |
| total | 0.04ms | 0.04ms | -0.0020ms | -4.62% |

### cloudflareQueuesEnvAccessor

# Perf Report — cloudflareQueuesEnvAccessor.serial

| metric | value |
|---|---|
| iterations | 200 |
| warmup | 5 |
| p10 | 0.00017ms |
| p50 | 0.00021ms |
| p95 | 0.00059ms |
| p99 | 0.0083ms |
| mean | 0.00062ms |
| stdev | 0.0029ms |
| min | 0.00017ms |
| max | 0.03ms |
| total | 0.12ms |

## Baseline diff

current は baseline を測った時の機械の速さへ換算済み (倍率 0.912)。 回帰判定が読む量と同じ。 実測値は上表。

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.00015ms | 0.00017ms | -0.000014ms | -8.26% |
| p50 | 0.00019ms | 0.00017ms | +0.000023ms | +13.57% |
| p95 | 0.00053ms | 0.0014ms | -0.00087ms | -61.95% |
| p99 | 0.0076ms | 0.0049ms | +0.0026ms | +53.60% |
| mean | 0.00057ms | 0.00046ms | +0.00010ms | +21.65% |
| min | 0.00015ms | 0.00013ms | +0.000026ms | +21.10% |
| max | 0.03ms | 0.02ms | +0.0070ms | +35.72% |
| total | 0.11ms | 0.09ms | +0.02ms | +21.65% |

### sqsEnvAccessor

# Perf Report — sqsEnvAccessor.serial

| metric | value |
|---|---|
| iterations | 200 |
| warmup | 5 |
| p10 | 0.00017ms |
| p50 | 0.00021ms |
| p95 | 0.00029ms |
| p99 | 0.0037ms |
| mean | 0.00029ms |
| stdev | 0.00066ms |
| min | 0.00017ms |
| max | 0.0071ms |
| total | 0.06ms |

## Baseline diff

current は baseline を測った時の機械の速さへ換算済み (倍率 0.907)。 回帰判定が読む量と同じ。 実測値は上表。

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.00015ms | 0.00017ms | -0.000015ms | -9.28% |
| p50 | 0.00019ms | 0.00021ms | -0.000019ms | -9.28% |
| p95 | 0.00026ms | 0.00070ms | -0.00044ms | -62.40% |
| p99 | 0.0033ms | 0.0058ms | -0.0024ms | -42.18% |
| mean | 0.00026ms | 0.00048ms | -0.00022ms | -45.46% |
| min | 0.00015ms | 0.00013ms | +0.000026ms | +20.48% |
| max | 0.0065ms | 0.03ms | -0.02ms | -74.32% |
| total | 0.05ms | 0.10ms | -0.04ms | -45.46% |

### rabbitmqEnvAccessor

# Perf Report — rabbitmqEnvAccessor.serial

| metric | value |
|---|---|
| iterations | 200 |
| warmup | 5 |
| p10 | 0.00013ms |
| p50 | 0.00017ms |
| p95 | 0.00021ms |
| p99 | 0.00096ms |
| mean | 0.00017ms |
| stdev | 0.00012ms |
| min | 0.00013ms |
| max | 0.0013ms |
| total | 0.03ms |

## Baseline diff

current は baseline を測った時の機械の速さへ換算済み (倍率 0.899)。 回帰判定が読む量と同じ。 実測値は上表。

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.00011ms | 0.00013ms | -0.000013ms | -10.12% |
| p50 | 0.00015ms | 0.00013ms | +0.000024ms | +19.36% |
| p95 | 0.00019ms | 0.00021ms | -0.000020ms | -9.69% |
| p99 | 0.00086ms | 0.0025ms | -0.0017ms | -66.08% |
| mean | 0.00015ms | 0.00020ms | -0.000044ms | -22.04% |
| min | 0.00011ms | 0.000083ms | +0.000029ms | +35.36% |
| max | 0.0011ms | 0.0060ms | -0.0048ms | -81.15% |
| total | 0.03ms | 0.04ms | -0.0087ms | -22.04% |

