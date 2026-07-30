# Perf Suite — email

Threshold source: [docs/quality/perf-thresholds.md](../../quality/perf-thresholds)

測定系の分解能 = 0.00017ms (何もしない関数を同じ経路で呼んだ時の p10)。 回帰判定の絶対下限は既定でこの 2 倍 = 0.00033ms、 op ごとの実効値は下表の「下限」 列。

## Serial (concurrency = 1)

| op | p10 (実測) | p95 (上限判定) | cap | 下限 | gate | regression |
|---|---|---|---|---|---|---|
| sendEmail | 0.00033ms | 0.0015ms | 5ms | 0.00034ms | PASS | stable (検知には +0.00034ms (baseline 比 +102%) 以上の悪化が必要) — gate 無効 (regressionGate=false) |
| verifyWebhookSignature | 0.0023ms | 0.01ms | 5ms | 0.00033ms | PASS | stable — gate 無効 (regressionGate=false) |
| parseDeliveryEvent | 0.00029ms | 0.0035ms | 5ms | 0.00034ms | PASS | stable (検知には +0.00034ms (baseline 比 +115%) 以上の悪化が必要) — gate 無効 (regressionGate=false) |

## 実行内正規化 (回帰判定はこの比で行う)

回帰判定は実測値そのものではなく、 同じ実行の中で 1 呼出ずつ交互に測った基準 op との比を読む。 実行と実行の間で機械の状態が変わっても、 その差が分子と分母で相殺される。 「換算後 p10」 は今回の比を baseline を測った時の基準 p10 で ms に戻した値で、 baseline の実測 p10 と直接比べられる。

| op | 基準 op | 基準 p10 | 基準 p95 | 実測 p10 | 比 | baseline の比 | 換算後 p10 | baseline p10 |
|---|---|---|---|---|---|---|---|---|
| sendEmail | cpu | 0.08ms | 0.09ms | 0.00033ms | 0.004 | 0.004 | 0.00034ms | 0.00033ms |
| verifyWebhookSignature | cpu | 0.08ms | 0.09ms | 0.0023ms | 0.028 | 0.026 | 0.0023ms | 0.0021ms |
| parseDeliveryEvent | cpu | 0.08ms | 0.09ms | 0.00029ms | 0.004 | 0.004 | 0.00029ms | 0.00029ms |

## Concurrent p95 (concurrency = 10, 50 iter each)

| op | p95 | cap | gate |
|---|---|---|---|
| sendEmail | 0.01ms | 10ms | PASS |
| verifyWebhookSignature | 0.04ms | 10ms | PASS |
| parseDeliveryEvent | 0.01ms | 10ms | PASS |

## Memory retention (200 iter, arrayBuffers axis is the gate; heap is informational)

| op | heapUsed Δ | arrayBuffers Δ | cap | gc exposed | verdict |
|---|---|---|---|---|---|
| sendEmail | 32368 B | 0 B | 102400 B | yes | PASS |
| verifyWebhookSignature | -29536 B | 0 B | 102400 B | yes | PASS |
| parseDeliveryEvent | 648 B | 0 B | 102400 B | yes | PASS |

## Detailed serial reports

### sendEmail

# Perf Report — sendEmail.serial

| metric | value |
|---|---|
| iterations | 200 |
| warmup | 5 |
| p10 | 0.00033ms |
| p50 | 0.00038ms |
| p95 | 0.0015ms |
| p99 | 0.0092ms |
| mean | 0.00068ms |
| stdev | 0.0014ms |
| min | 0.00029ms |
| max | 0.01ms |
| total | 0.14ms |

## Baseline diff

current は baseline を測った時の機械の速さへ換算済み (倍率 1.022)。 回帰判定が読む量と同じ。 実測値は上表。

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.00034ms | 0.00033ms | +0.0000072ms | +2.16% |
| p50 | 0.00038ms | 0.00042ms | -0.000033ms | -7.91% |
| p95 | 0.0016ms | 0.0039ms | -0.0024ms | -59.90% |
| p99 | 0.0094ms | 0.0092ms | +0.00020ms | +2.20% |
| mean | 0.00070ms | 0.00095ms | -0.00025ms | -26.78% |
| min | 0.00030ms | 0.00029ms | +0.0000063ms | +2.16% |
| max | 0.01ms | 0.01ms | -0.0010ms | -9.15% |
| total | 0.14ms | 0.19ms | -0.05ms | -26.78% |

### verifyWebhookSignature

# Perf Report — verifyWebhookSignature.serial

| metric | value |
|---|---|
| iterations | 200 |
| warmup | 5 |
| p10 | 0.0023ms |
| p50 | 0.0025ms |
| p95 | 0.01ms |
| p99 | 0.04ms |
| mean | 0.0043ms |
| stdev | 0.0063ms |
| min | 0.0022ms |
| max | 0.05ms |
| total | 0.85ms |

## Baseline diff

current は baseline を測った時の機械の速さへ換算済み (倍率 0.977)。 回帰判定が読む量と同じ。 実測値は上表。

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.0023ms | 0.0021ms | +0.00015ms | +7.28% |
| p50 | 0.0025ms | 0.0024ms | +0.00011ms | +4.54% |
| p95 | 0.01ms | 0.01ms | +0.00027ms | +2.29% |
| p99 | 0.03ms | 0.02ms | +0.01ms | +41.21% |
| mean | 0.0042ms | 0.0038ms | +0.00041ms | +11.04% |
| min | 0.0022ms | 0.0020ms | +0.00012ms | +5.76% |
| max | 0.05ms | 0.04ms | +0.01ms | +36.32% |
| total | 0.83ms | 0.75ms | +0.08ms | +11.04% |

### parseDeliveryEvent

# Perf Report — parseDeliveryEvent.serial

| metric | value |
|---|---|
| iterations | 200 |
| warmup | 5 |
| p10 | 0.00029ms |
| p50 | 0.00029ms |
| p95 | 0.0035ms |
| p99 | 0.01ms |
| mean | 0.00088ms |
| stdev | 0.0025ms |
| min | 0.00025ms |
| max | 0.02ms |
| total | 0.18ms |

## Baseline diff

current は baseline を測った時の機械の速さへ換算済み (倍率 1.006)。 回帰判定が読む量と同じ。 実測値は上表。

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.00029ms | 0.00029ms | +0.0000016ms | +0.57% |
| p50 | 0.00029ms | 0.00033ms | -0.000039ms | -11.82% |
| p95 | 0.0035ms | 0.0029ms | +0.00060ms | +20.67% |
| p99 | 0.01ms | 0.0089ms | +0.0033ms | +37.46% |
| mean | 0.00088ms | 0.00074ms | +0.00015ms | +19.88% |
| min | 0.00025ms | 0.00025ms | +0.0000014ms | +0.57% |
| max | 0.02ms | 0.02ms | +0.0018ms | +8.89% |
| total | 0.18ms | 0.15ms | +0.03ms | +19.88% |

