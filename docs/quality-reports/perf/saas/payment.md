# Perf Suite — payment

Threshold source: [docs/quality/perf-thresholds.md](../../../quality/perf-thresholds)

測定系の分解能 = 0.00017ms (何もしない関数を同じ経路で呼んだ時の p10)。 回帰判定の絶対下限は既定でこの 2 倍 = 0.00033ms、 op ごとの実効値は下表の「下限」 列。

## Serial (concurrency = 1)

| op | p10 (実測) | p95 (上限判定) | cap | 下限 | gate | regression |
|---|---|---|---|---|---|---|
| stripeSignWebhook | 0.0024ms | 0.0069ms | 10ms | 0.00032ms | PASS | stable — gate 無効 (regressionGate=false) |
| stripeVerifyWebhook | 0.0029ms | 0.0061ms | 10ms | 0.00032ms | PASS | stable — gate 無効 (regressionGate=false) |
| paddleSignWebhook | 0.0029ms | 0.0062ms | 10ms | 0.00032ms | PASS | stable — gate 無効 (regressionGate=false) |
| paddleVerifyWebhook | 0.0030ms | 0.0069ms | 10ms | 0.00033ms | PASS | stable — gate 無効 (regressionGate=false) |
| lemonSqueezySignWebhook | 0.0024ms | 0.0068ms | 10ms | 0.00033ms | PASS | stable (換算後 p10 +3% (閾値未満)、 p95 +22% (裾は実行間の振れ幅と区別できないため判定には使わない)) — gate 無効 (regressionGate=false) |
| lemonSqueezyVerifyWebhook | 0.0030ms | 0.01ms | 10ms | 0.00034ms | PASS | stable (換算後 p10 +1% (閾値未満)、 p95 +39% (裾は実行間の振れ幅と区別できないため判定には使わない)) — gate 無効 (regressionGate=false) |
| dunningStart | 0.00025ms | 0.0012ms | 5ms | 0.00033ms | PASS | stable (差 0.000043ms が下限 0.00033ms 未満で判定を保留) — gate 無効 (regressionGate=false) |
| retryStart | 0.0022ms | 0.0052ms | 5ms | 0.00034ms | PASS | stable — gate 無効 (regressionGate=false) |
| retryBackoffMs | 0.00013ms | 0.00038ms | 5ms | 0.00034ms | PASS | stable (差 0.000039ms が下限 0.00034ms 未満で判定を保留) — gate 無効 (regressionGate=false) |

## 実行内正規化 (回帰判定はこの比で行う)

回帰判定は実測値そのものではなく、 同じ実行の中で 1 呼出ずつ交互に測った基準 op との比を読む。 実行と実行の間で機械の状態が変わっても、 その差が分子と分母で相殺される。 「換算後 p10」 は今回の比を baseline を測った時の基準 p10 で ms に戻した値で、 baseline の実測 p10 と直接比べられる。

| op | 基準 op | 基準 p10 | 基準 p95 | 実測 p10 | 比 | baseline の比 | 換算後 p10 | baseline p10 |
|---|---|---|---|---|---|---|---|---|
| stripeSignWebhook | cpu | 0.09ms | 0.10ms | 0.0024ms | 0.028 | 0.030 | 0.0023ms | 0.0025ms |
| stripeVerifyWebhook | cpu | 0.09ms | 0.09ms | 0.0029ms | 0.033 | 0.035 | 0.0027ms | 0.0029ms |
| paddleSignWebhook | cpu | 0.08ms | 0.09ms | 0.0029ms | 0.035 | 0.036 | 0.0028ms | 0.0029ms |
| paddleVerifyWebhook | cpu | 0.08ms | 0.09ms | 0.0030ms | 0.037 | 0.037 | 0.0031ms | 0.0030ms |
| lemonSqueezySignWebhook | cpu | 0.08ms | 0.09ms | 0.0024ms | 0.029 | 0.028 | 0.0024ms | 0.0023ms |
| lemonSqueezyVerifyWebhook | cpu | 0.08ms | 0.09ms | 0.0030ms | 0.038 | 0.037 | 0.0031ms | 0.0031ms |
| dunningStart | cpu | 0.08ms | 0.09ms | 0.00025ms | 0.003 | 0.003 | 0.00025ms | 0.00021ms |
| retryStart | cpu | 0.08ms | 0.09ms | 0.0022ms | 0.027 | 0.027 | 0.0022ms | 0.0022ms |
| retryBackoffMs | cpu | 0.08ms | 0.09ms | 0.00013ms | 0.002 | 0.002 | 0.00013ms | 0.00017ms |

## Concurrent p95 (concurrency = 10, 50 iter each)

| op | p95 | cap | gate |
|---|---|---|---|
| stripeSignWebhook | 0.05ms | 20ms | PASS |
| stripeVerifyWebhook | 0.04ms | 20ms | PASS |
| paddleSignWebhook | 0.04ms | 20ms | PASS |
| paddleVerifyWebhook | 0.04ms | 20ms | PASS |
| lemonSqueezySignWebhook | 0.03ms | 20ms | PASS |
| lemonSqueezyVerifyWebhook | 0.04ms | 20ms | PASS |
| dunningStart | 0.01ms | 10ms | PASS |
| retryStart | 0.04ms | 10ms | PASS |
| retryBackoffMs | 0.01ms | 10ms | PASS |

## Memory retention (200 iter, arrayBuffers axis is the gate; heap is informational)

| op | heapUsed Δ | arrayBuffers Δ | cap | gc exposed | verdict |
|---|---|---|---|---|---|
| stripeSignWebhook | -14496 B | 0 B | 102400 B | yes | PASS |
| stripeVerifyWebhook | -22688 B | 0 B | 102400 B | yes | PASS |
| paddleSignWebhook | 2312 B | 0 B | 102400 B | yes | PASS |
| paddleVerifyWebhook | -280 B | 0 B | 102400 B | yes | PASS |
| lemonSqueezySignWebhook | 432 B | 0 B | 102400 B | yes | PASS |
| lemonSqueezyVerifyWebhook | 840 B | 0 B | 102400 B | yes | PASS |
| dunningStart | 64 B | 0 B | 102400 B | yes | PASS |
| retryStart | -384 B | 0 B | 102400 B | yes | PASS |
| retryBackoffMs | 48 B | 0 B | 102400 B | yes | PASS |

## Detailed serial reports

### stripeSignWebhook

# Perf Report — stripeSignWebhook.serial

| metric | value |
|---|---|
| iterations | 200 |
| warmup | 5 |
| p10 | 0.0024ms |
| p50 | 0.0028ms |
| p95 | 0.0069ms |
| p99 | 0.02ms |
| mean | 0.0038ms |
| stdev | 0.0038ms |
| min | 0.0023ms |
| max | 0.03ms |
| total | 0.77ms |

## Baseline diff

current は baseline を測った時の機械の速さへ換算済み (倍率 0.958)。 回帰判定が読む量と同じ。 実測値は上表。

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.0023ms | 0.0025ms | -0.00022ms | -8.96% |
| p50 | 0.0027ms | 0.0029ms | -0.00020ms | -6.93% |
| p95 | 0.0066ms | 0.02ms | -0.01ms | -67.23% |
| p99 | 0.02ms | 0.07ms | -0.04ms | -67.21% |
| mean | 0.0037ms | 0.0065ms | -0.0028ms | -43.26% |
| min | 0.0022ms | 0.0023ms | -0.00014ms | -5.89% |
| max | 0.03ms | 0.17ms | -0.13ms | -80.87% |
| total | 0.74ms | 1.30ms | -0.56ms | -43.26% |

### stripeVerifyWebhook

# Perf Report — stripeVerifyWebhook.serial

| metric | value |
|---|---|
| iterations | 200 |
| warmup | 5 |
| p10 | 0.0029ms |
| p50 | 0.0030ms |
| p95 | 0.0061ms |
| p99 | 0.01ms |
| mean | 0.0036ms |
| stdev | 0.0021ms |
| min | 0.0028ms |
| max | 0.02ms |
| total | 0.72ms |

## Baseline diff

current は baseline を測った時の機械の速さへ換算済み (倍率 0.950)。 回帰判定が読む量と同じ。 実測値は上表。

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.0027ms | 0.0029ms | -0.00014ms | -4.99% |
| p50 | 0.0029ms | 0.0031ms | -0.00027ms | -8.79% |
| p95 | 0.0058ms | 0.0083ms | -0.0025ms | -29.84% |
| p99 | 0.01ms | 0.02ms | -0.0069ms | -35.88% |
| mean | 0.0034ms | 0.0048ms | -0.0014ms | -28.67% |
| min | 0.0027ms | 0.0028ms | -0.00014ms | -4.99% |
| max | 0.02ms | 0.17ms | -0.15ms | -86.53% |
| total | 0.68ms | 0.95ms | -0.27ms | -28.67% |

### paddleSignWebhook

# Perf Report — paddleSignWebhook.serial

| metric | value |
|---|---|
| iterations | 200 |
| warmup | 5 |
| p10 | 0.0029ms |
| p50 | 0.0031ms |
| p95 | 0.0062ms |
| p99 | 0.02ms |
| mean | 0.0039ms |
| stdev | 0.0048ms |
| min | 0.0028ms |
| max | 0.06ms |
| total | 0.79ms |

## Baseline diff

current は baseline を測った時の機械の速さへ換算済み (倍率 0.969)。 回帰判定が読む量と同じ。 実測値は上表。

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.0028ms | 0.0029ms | -0.000088ms | -3.03% |
| p50 | 0.0030ms | 0.0031ms | -0.00014ms | -4.37% |
| p95 | 0.0061ms | 0.0067ms | -0.00062ms | -9.33% |
| p99 | 0.02ms | 0.03ms | -0.02ms | -48.91% |
| mean | 0.0038ms | 0.0042ms | -0.00042ms | -9.94% |
| min | 0.0027ms | 0.0028ms | -0.000046ms | -1.64% |
| max | 0.06ms | 0.06ms | +0.0058ms | +10.52% |
| total | 0.77ms | 0.85ms | -0.08ms | -9.94% |

### paddleVerifyWebhook

# Perf Report — paddleVerifyWebhook.serial

| metric | value |
|---|---|
| iterations | 200 |
| warmup | 5 |
| p10 | 0.0030ms |
| p50 | 0.0033ms |
| p95 | 0.0069ms |
| p99 | 0.02ms |
| mean | 0.0043ms |
| stdev | 0.0047ms |
| min | 0.0029ms |
| max | 0.05ms |
| total | 0.86ms |

## Baseline diff

current は baseline を測った時の機械の速さへ換算済み (倍率 1.005)。 回帰判定が読む量と同じ。 実測値は上表。

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.0031ms | 0.0030ms | +0.000013ms | +0.42% |
| p50 | 0.0033ms | 0.0032ms | +0.000057ms | +1.76% |
| p95 | 0.0069ms | 0.0061ms | +0.00085ms | +14.00% |
| p99 | 0.02ms | 0.01ms | +0.01ms | +102.16% |
| mean | 0.0043ms | 0.0037ms | +0.00059ms | +16.02% |
| min | 0.0029ms | 0.0029ms | +0.000012ms | +0.42% |
| max | 0.05ms | 0.02ms | +0.03ms | +131.75% |
| total | 0.86ms | 0.74ms | +0.12ms | +16.02% |

### lemonSqueezySignWebhook

# Perf Report — lemonSqueezySignWebhook.serial

| metric | value |
|---|---|
| iterations | 200 |
| warmup | 5 |
| p10 | 0.0024ms |
| p50 | 0.0026ms |
| p95 | 0.0068ms |
| p99 | 0.03ms |
| mean | 0.0038ms |
| stdev | 0.0051ms |
| min | 0.0023ms |
| max | 0.05ms |
| total | 0.75ms |

## Baseline diff

current は baseline を測った時の機械の速さへ換算済み (倍率 1.008)。 回帰判定が読む量と同じ。 実測値は上表。

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.0024ms | 0.0023ms | +0.000061ms | +2.63% |
| p50 | 0.0026ms | 0.0025ms | +0.00013ms | +5.03% |
| p95 | 0.0069ms | 0.0056ms | +0.0013ms | +22.43% |
| p99 | 0.03ms | 0.01ms | +0.02ms | +155.66% |
| mean | 0.0038ms | 0.0032ms | +0.00061ms | +19.28% |
| min | 0.0023ms | 0.0022ms | +0.000061ms | +2.70% |
| max | 0.05ms | 0.05ms | -0.0039ms | -7.51% |
| total | 0.76ms | 0.64ms | +0.12ms | +19.28% |

### lemonSqueezyVerifyWebhook

# Perf Report — lemonSqueezyVerifyWebhook.serial

| metric | value |
|---|---|
| iterations | 200 |
| warmup | 5 |
| p10 | 0.0030ms |
| p50 | 0.0032ms |
| p95 | 0.01ms |
| p99 | 0.04ms |
| mean | 0.0051ms |
| stdev | 0.0077ms |
| min | 0.0029ms |
| max | 0.08ms |
| total | 1.02ms |

## Baseline diff

current は baseline を測った時の機械の速さへ換算済み (倍率 1.036)。 回帰判定が読む量と同じ。 実測値は上表。

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.0031ms | 0.0031ms | +0.000024ms | +0.76% |
| p50 | 0.0034ms | 0.0033ms | +0.000073ms | +2.23% |
| p95 | 0.01ms | 0.0080ms | +0.0031ms | +38.58% |
| p99 | 0.04ms | 0.04ms | +0.0025ms | +6.39% |
| mean | 0.0053ms | 0.0046ms | +0.00070ms | +15.25% |
| min | 0.0030ms | 0.0030ms | +0.000018ms | +0.61% |
| max | 0.08ms | 0.07ms | +0.01ms | +13.91% |
| total | 1.06ms | 0.92ms | +0.14ms | +15.25% |

### dunningStart

# Perf Report — dunningStart.serial

| metric | value |
|---|---|
| iterations | 200 |
| warmup | 5 |
| p10 | 0.00025ms |
| p50 | 0.00029ms |
| p95 | 0.0012ms |
| p99 | 0.0091ms |
| mean | 0.00056ms |
| stdev | 0.0016ms |
| min | 0.00021ms |
| max | 0.02ms |
| total | 0.11ms |

## Baseline diff

current は baseline を測った時の機械の速さへ換算済み (倍率 1.002)。 回帰判定が読む量と同じ。 実測値は上表。

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.00025ms | 0.00021ms | +0.000043ms | +20.44% |
| p50 | 0.00029ms | 0.00025ms | +0.000042ms | +16.64% |
| p95 | 0.0012ms | 0.00046ms | +0.00071ms | +154.40% |
| p99 | 0.0092ms | 0.0037ms | +0.0054ms | +146.38% |
| mean | 0.00056ms | 0.00040ms | +0.00017ms | +42.53% |
| min | 0.00021ms | 0.00017ms | +0.000041ms | +24.81% |
| max | 0.02ms | 0.01ms | +0.0066ms | +63.65% |
| total | 0.11ms | 0.08ms | +0.03ms | +42.53% |

### retryStart

# Perf Report — retryStart.serial

| metric | value |
|---|---|
| iterations | 200 |
| warmup | 5 |
| p10 | 0.0022ms |
| p50 | 0.0024ms |
| p95 | 0.0052ms |
| p99 | 0.03ms |
| mean | 0.0036ms |
| stdev | 0.0067ms |
| min | 0.0021ms |
| max | 0.07ms |
| total | 0.71ms |

## Baseline diff

current は baseline を測った時の機械の速さへ換算済み (倍率 1.011)。 回帰判定が読む量と同じ。 実測値は上表。

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.0022ms | 0.0022ms | -0.000017ms | -0.79% |
| p50 | 0.0024ms | 0.0024ms | +0.000026ms | +1.09% |
| p95 | 0.0052ms | 0.0048ms | +0.00044ms | +9.16% |
| p99 | 0.03ms | 0.02ms | +0.01ms | +50.38% |
| mean | 0.0036ms | 0.0032ms | +0.00043ms | +13.55% |
| min | 0.0021ms | 0.0021ms | +0.000023ms | +1.09% |
| max | 0.07ms | 0.05ms | +0.02ms | +49.56% |
| total | 0.72ms | 0.63ms | +0.09ms | +13.55% |

### retryBackoffMs

# Perf Report — retryBackoffMs.serial

| metric | value |
|---|---|
| iterations | 200 |
| warmup | 5 |
| p10 | 0.00013ms |
| p50 | 0.00017ms |
| p95 | 0.00038ms |
| p99 | 0.0064ms |
| mean | 0.00036ms |
| stdev | 0.0013ms |
| min | 0.00013ms |
| max | 0.01ms |
| total | 0.07ms |

## Baseline diff

current は baseline を測った時の機械の速さへ換算済み (倍率 1.014)。 回帰判定が読む量と同じ。 実測値は上表。

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.00013ms | 0.00017ms | -0.000039ms | -23.68% |
| p50 | 0.00017ms | 0.00017ms | +0.0000023ms | +1.36% |
| p95 | 0.00038ms | 0.00025ms | +0.00013ms | +52.04% |
| p99 | 0.0065ms | 0.0018ms | +0.0047ms | +267.77% |
| mean | 0.00037ms | 0.00028ms | +0.000092ms | +33.18% |
| min | 0.00013ms | 0.00013ms | +0.0000017ms | +1.36% |
| max | 0.01ms | 0.01ms | +0.0012ms | +9.28% |
| total | 0.07ms | 0.06ms | +0.02ms | +33.18% |

