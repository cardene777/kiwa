# Perf Suite — webhook

Threshold source: [docs/quality/perf-thresholds.md](../../quality/perf-thresholds)

測定系の分解能 = 0.00017ms (何もしない関数を同じ経路で呼んだ時の p10)。 回帰判定の絶対下限は既定でこの 2 倍 = 0.00033ms、 op ごとの実効値は下表の「下限」 列。

## Serial (concurrency = 1)

| op | p10 (実測) | p95 (上限判定) | cap | 下限 | gate | regression |
|---|---|---|---|---|---|---|
| verifyIncoming | 0.0035ms | 0.01ms | 5ms | 0.00029ms | PASS | stable — gate 無効 (regressionGate=false) |
| verifyWebhookSignature | 0.0021ms | 0.0045ms | 5ms | 0.00030ms | PASS | stable — gate 無効 (regressionGate=false) |
| parseWebhookPayload | 0.00029ms | 0.00093ms | 5ms | 0.00030ms | PASS | stable (検知には +0.00030ms (baseline 比 +119%) 以上の悪化が必要) — gate 無効 (regressionGate=false) |

## 実行内正規化 (回帰判定はこの比で行う)

回帰判定は実測値そのものではなく、 同じ実行の中で 1 呼出ずつ交互に測った基準 op との比を読む。 実行と実行の間で機械の状態が変わっても、 その差が分子と分母で相殺される。 「換算後 p10」 は今回の比を baseline を測った時の基準 p10 で ms に戻した値で、 baseline の実測 p10 と直接比べられる。


「実行間のばらつき」 は baseline が持つ過去の比が、 baseline 自身の比からどれだけ離れたかの最大値。 その op が実装を変えずに測るだけでどれだけ動くかを表す。 判定はこの幅の 2 倍と相対閾値の大きい方を超えた差だけを有意として扱う (#1739)。 履歴が 3 件に満たない op では推定できないため n/a になり、 相対閾値だけで判定する。

| op | 基準 op | 基準 p10 | 基準 p95 | 実測 p10 | 比 | baseline の比 | 実行間のばらつき | 実効閾値 | 換算後 p10 | baseline p10 |
|---|---|---|---|---|---|---|---|---|---|---|
| verifyIncoming | cpu | 0.09ms | 0.10ms | 0.0035ms | 0.038 | 0.036 | n/a | 20.0% | 0.0030ms | 0.0029ms |
| verifyWebhookSignature | cpu | 0.09ms | 0.09ms | 0.0021ms | 0.024 | 0.023 | n/a | 20.0% | 0.0019ms | 0.0018ms |
| parseWebhookPayload | cpu | 0.09ms | 0.09ms | 0.00029ms | 0.003 | 0.003 | n/a | 20.0% | 0.00026ms | 0.00025ms |

## Concurrent p95 (concurrency = 10, 50 iter each)

| op | p95 | cap | gate |
|---|---|---|---|
| verifyIncoming | 0.06ms | 10ms | PASS |
| verifyWebhookSignature | 0.03ms | 10ms | PASS |
| parseWebhookPayload | 0.01ms | 10ms | PASS |

## Memory retention (200 iter, arrayBuffers axis is the gate; heap is informational)

| op | heapUsed Δ | arrayBuffers Δ | cap | gc exposed | 呼出 (空回し + 反復) | verdict |
|---|---|---|---|---|---|---|
| verifyIncoming | 41152 B | 0 B | 102400 B | yes | 220 (20 + 200) | PASS |
| verifyWebhookSignature | -22440 B | 0 B | 102400 B | yes | 220 (20 + 200) | PASS |
| parseWebhookPayload | 2680 B | 0 B | 102400 B | yes | 220 (20 + 200) | PASS |

## Detailed serial reports

### verifyIncoming

# Perf Report — verifyIncoming.serial

| metric | value |
|---|---|
| iterations | 200 |
| warmup | 5 |
| p10 | 0.0035ms |
| p50 | 0.0037ms |
| p95 | 0.01ms |
| p99 | 0.03ms |
| mean | 0.0054ms |
| stdev | 0.0047ms |
| min | 0.0033ms |
| max | 0.03ms |
| total | 1.08ms |

## Baseline diff

current は baseline を測った時の機械の速さへ換算済み (倍率 0.863)。 回帰判定が読む量と同じ。 実測値は上表。

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.0030ms | 0.0029ms | +0.00011ms | +3.74% |
| p50 | 0.0032ms | 0.0033ms | -0.00013ms | -3.99% |
| p95 | 0.01ms | 0.01ms | -0.0024ms | -16.58% |
| p99 | 0.02ms | 0.02ms | -0.0016ms | -6.46% |
| mean | 0.0047ms | 0.0050ms | -0.00035ms | -7.01% |
| min | 0.0028ms | 0.0027ms | +0.00013ms | +4.89% |
| max | 0.03ms | 0.07ms | -0.04ms | -54.94% |
| total | 0.94ms | 1.01ms | -0.07ms | -7.01% |

### verifyWebhookSignature

# Perf Report — verifyWebhookSignature.serial

| metric | value |
|---|---|
| iterations | 200 |
| warmup | 5 |
| p10 | 0.0021ms |
| p50 | 0.0023ms |
| p95 | 0.0045ms |
| p99 | 0.01ms |
| mean | 0.0028ms |
| stdev | 0.0027ms |
| min | 0.0021ms |
| max | 0.04ms |
| total | 0.56ms |

## Baseline diff

current は baseline を測った時の機械の速さへ換算済み (倍率 0.893)。 回帰判定が読む量と同じ。 実測値は上表。

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.0019ms | 0.0018ms | +0.000065ms | +3.54% |
| p50 | 0.0020ms | 0.0019ms | +0.00011ms | +5.60% |
| p95 | 0.0040ms | 0.0038ms | +0.00023ms | +6.02% |
| p99 | 0.0093ms | 0.01ms | -0.0034ms | -26.69% |
| mean | 0.0025ms | 0.0025ms | +0.0000014ms | +0.06% |
| min | 0.0019ms | 0.0018ms | +0.00011ms | +6.30% |
| max | 0.03ms | 0.03ms | +0.00016ms | +0.49% |
| total | 0.50ms | 0.50ms | +0.00028ms | +0.06% |

### parseWebhookPayload

# Perf Report — parseWebhookPayload.serial

| metric | value |
|---|---|
| iterations | 200 |
| warmup | 5 |
| p10 | 0.00029ms |
| p50 | 0.00029ms |
| p95 | 0.00093ms |
| p99 | 0.0081ms |
| mean | 0.00063ms |
| stdev | 0.0021ms |
| min | 0.00025ms |
| max | 0.02ms |
| total | 0.13ms |

## Baseline diff

current は baseline を測った時の機械の速さへ換算済み (倍率 0.893)。 回帰判定が読む量と同じ。 実測値は上表。

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.00026ms | 0.00025ms | +0.0000098ms | +3.90% |
| p50 | 0.00026ms | 0.00029ms | -0.000030ms | -10.43% |
| p95 | 0.00083ms | 0.00079ms | +0.000040ms | +5.00% |
| p99 | 0.0072ms | 0.0030ms | +0.0042ms | +139.06% |
| mean | 0.00056ms | 0.00043ms | +0.00013ms | +29.64% |
| min | 0.00022ms | 0.00021ms | +0.000014ms | +6.77% |
| max | 0.02ms | 0.01ms | +0.0084ms | +64.56% |
| total | 0.11ms | 0.09ms | +0.03ms | +29.64% |

