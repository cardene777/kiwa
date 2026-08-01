# Perf Suite — email

Threshold source: [docs/quality/perf-thresholds.md](../../quality/perf-thresholds)

測定系の分解能 = 0.00017ms (何もしない関数を同じ経路で呼んだ時の p10)。 回帰判定の絶対下限は既定でこの 2 倍 = 0.00033ms、 op ごとの実効値は下表の「下限」 列。

## Serial (concurrency = 1)

| op | p10 (実測) | p95 (上限判定) | cap | 下限 | gate | regression |
|---|---|---|---|---|---|---|
| sendEmail | 0.00033ms | 0.0014ms | 5ms | 0.00030ms | PASS | stable — gate 無効 (regressionGate=false) |
| verifyWebhookSignature | 0.0024ms | 0.01ms | 5ms | 0.00030ms | PASS | stable — gate 無効 (regressionGate=false) |
| parseDeliveryEvent | 0.00029ms | 0.0028ms | 5ms | 0.00031ms | PASS | stable (検知には +0.00031ms (baseline 比 +105%) 以上の悪化が必要) — gate 無効 (regressionGate=false) |

## 実行内正規化 (回帰判定はこの比で行う)

回帰判定は実測値そのものではなく、 同じ実行の中で 1 呼出ずつ交互に測った基準 op との比を読む。 実行と実行の間で機械の状態が変わっても、 その差が分子と分母で相殺される。 「換算後 p10」 は今回の比を baseline を測った時の基準 p10 で ms に戻した値で、 baseline の実測 p10 と直接比べられる。


「実行間のばらつき」 は baseline が持つ過去の比が、 baseline 自身の比からどれだけ離れたかの最大値。 その op が実装を変えずに測るだけでどれだけ動くかを表す。 判定はこの幅の 2 倍と相対閾値の大きい方を超えた差だけを有意として扱う (#1739)。 履歴が 3 件に満たない op では推定できないため n/a になり、 相対閾値だけで判定する。

| op | 基準 op | 基準 p10 | 基準 p95 | 実測 p10 | 比 | baseline の比 | 実行間のばらつき | 実効閾値 | 換算後 p10 | baseline p10 |
|---|---|---|---|---|---|---|---|---|---|---|
| sendEmail | cpu | 0.09ms | 0.10ms | 0.00033ms | 0.004 | 0.004 | n/a | 20.0% | 0.00030ms | 0.00033ms |
| verifyWebhookSignature | cpu | 0.09ms | 0.10ms | 0.0024ms | 0.027 | 0.026 | n/a | 20.0% | 0.0022ms | 0.0021ms |
| parseDeliveryEvent | cpu | 0.09ms | 0.09ms | 0.00029ms | 0.003 | 0.004 | n/a | 20.0% | 0.00027ms | 0.00029ms |

## Concurrent p95 (concurrency = 10, 50 iter each)

| op | p95 | cap | gate |
|---|---|---|---|
| sendEmail | 0.01ms | 10ms | PASS |
| verifyWebhookSignature | 0.04ms | 10ms | PASS |
| parseDeliveryEvent | 0.01ms | 10ms | PASS |

## Memory retention (200 iter, arrayBuffers axis is the gate; heap is informational)

| op | heapUsed Δ | arrayBuffers Δ | cap | gc exposed | 呼出 (空回し + 反復) | verdict |
|---|---|---|---|---|---|---|
| sendEmail | 29144 B | 0 B | 102400 B | yes | 220 (20 + 200) | PASS |
| verifyWebhookSignature | -28496 B | 0 B | 102400 B | yes | 220 (20 + 200) | PASS |
| parseDeliveryEvent | 8344 B | 0 B | 102400 B | yes | 220 (20 + 200) | PASS |

## Detailed serial reports

### sendEmail

# Perf Report — sendEmail.serial

| metric | value |
|---|---|
| iterations | 200 |
| warmup | 5 |
| p10 | 0.00033ms |
| p50 | 0.00038ms |
| p95 | 0.0014ms |
| p99 | 0.0065ms |
| mean | 0.00065ms |
| stdev | 0.0015ms |
| min | 0.00033ms |
| max | 0.02ms |
| total | 0.13ms |

## Baseline diff

current は baseline を測った時の機械の速さへ換算済み (倍率 0.892)。 回帰判定が読む量と同じ。 実測値は上表。

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.00030ms | 0.00033ms | -0.000035ms | -10.59% |
| p50 | 0.00033ms | 0.00042ms | -0.000082ms | -19.62% |
| p95 | 0.0013ms | 0.0039ms | -0.0027ms | -67.61% |
| p99 | 0.0058ms | 0.0092ms | -0.0034ms | -37.06% |
| mean | 0.00058ms | 0.00095ms | -0.00037ms | -38.56% |
| min | 0.00030ms | 0.00029ms | +0.0000059ms | +2.04% |
| max | 0.02ms | 0.01ms | +0.0044ms | +38.86% |
| total | 0.12ms | 0.19ms | -0.07ms | -38.56% |

### verifyWebhookSignature

# Perf Report — verifyWebhookSignature.serial

| metric | value |
|---|---|
| iterations | 200 |
| warmup | 5 |
| p10 | 0.0024ms |
| p50 | 0.0027ms |
| p95 | 0.01ms |
| p99 | 0.03ms |
| mean | 0.0047ms |
| stdev | 0.0073ms |
| min | 0.0022ms |
| max | 0.08ms |
| total | 0.95ms |

## Baseline diff

current は baseline を測った時の機械の速さへ換算済み (倍率 0.895)。 回帰判定が読む量と同じ。 実測値は上表。

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.0022ms | 0.0021ms | +0.000033ms | +1.53% |
| p50 | 0.0024ms | 0.0024ms | +0.000010ms | +0.44% |
| p95 | 0.01ms | 0.01ms | -0.00038ms | -3.31% |
| p99 | 0.02ms | 0.02ms | -0.0018ms | -7.35% |
| mean | 0.0042ms | 0.0038ms | +0.00049ms | +13.10% |
| min | 0.0020ms | 0.0020ms | -0.000028ms | -1.38% |
| max | 0.07ms | 0.04ms | +0.04ms | +97.77% |
| total | 0.85ms | 0.75ms | +0.10ms | +13.10% |

### parseDeliveryEvent

# Perf Report — parseDeliveryEvent.serial

| metric | value |
|---|---|
| iterations | 200 |
| warmup | 5 |
| p10 | 0.00029ms |
| p50 | 0.00033ms |
| p95 | 0.0028ms |
| p99 | 0.01ms |
| mean | 0.00084ms |
| stdev | 0.0024ms |
| min | 0.00029ms |
| max | 0.03ms |
| total | 0.17ms |

## Baseline diff

current は baseline を測った時の機械の速さへ換算済み (倍率 0.916)。 回帰判定が読む量と同じ。 実測値は上表。

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.00027ms | 0.00029ms | -0.000024ms | -8.12% |
| p50 | 0.00030ms | 0.00033ms | -0.000028ms | -8.43% |
| p95 | 0.0025ms | 0.0029ms | -0.00035ms | -12.20% |
| p99 | 0.01ms | 0.0089ms | +0.0016ms | +17.51% |
| mean | 0.00077ms | 0.00074ms | +0.000036ms | +4.90% |
| min | 0.00027ms | 0.00025ms | +0.000016ms | +6.59% |
| max | 0.02ms | 0.02ms | +0.0036ms | +18.11% |
| total | 0.15ms | 0.15ms | +0.0072ms | +4.90% |

