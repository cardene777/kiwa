# Perf Suite — payment

Threshold source: [docs/quality/perf-thresholds.md](../../../quality/perf-thresholds)

測定系の分解能 = 0.00017ms (何もしない関数を同じ経路で呼んだ時の p10)。 回帰判定の絶対下限は既定でこの 2 倍 = 0.00033ms、 op ごとの実効値は下表の「下限」 列。

## Serial (concurrency = 1)

| op | p10 (実測) | p95 (上限判定) | cap | 下限 | gate | regression |
|---|---|---|---|---|---|---|
| stripeSignWebhook | 0.0023ms | 0.0072ms | 10ms | 0.00034ms | PASS | stable — gate 無効 (regressionGate=false) |
| stripeVerifyWebhook | 0.0027ms | 0.0068ms | 10ms | 0.00034ms | PASS | stable — gate 無効 (regressionGate=false) |
| paddleSignWebhook | 0.0028ms | 0.0062ms | 10ms | 0.00034ms | PASS | stable — gate 無効 (regressionGate=false) |
| paddleVerifyWebhook | 0.0029ms | 0.0084ms | 10ms | 0.00034ms | PASS | stable (換算後 p10 -2% (閾値未満)、 p95 +42% (裾は実行間の振れ幅と区別できないため判定には使わない)) — gate 無効 (regressionGate=false) |
| lemonSqueezySignWebhook | 0.0025ms | 0.0078ms | 10ms | 0.00033ms | PASS | stable (換算後 p10 +5% (閾値未満)、 p95 +37% (裾は実行間の振れ幅と区別できないため判定には使わない)) — gate 無効 (regressionGate=false) |
| lemonSqueezyVerifyWebhook | 0.0031ms | 0.02ms | 10ms | 0.00033ms | PASS | stable (換算後 p10 -0% (閾値未満)、 p95 +170% (裾は実行間の振れ幅と区別できないため判定には使わない)) — gate 無効 (regressionGate=false) |
| dunningStart | 0.00025ms | 0.00038ms | 5ms | 0.00033ms | PASS | stable (差 0.000044ms が下限 0.00033ms 未満で判定を保留) — gate 無効 (regressionGate=false) |
| retryStart | 0.0022ms | 0.01ms | 5ms | 0.00033ms | PASS | stable (換算後 p10 -1% (閾値未満)、 p95 +109% (裾は実行間の振れ幅と区別できないため判定には使わない)) — gate 無効 (regressionGate=false) |
| retryBackoffMs | 0.00017ms | 0.00034ms | 5ms | 0.00033ms | PASS | stable (検知には +0.00033ms (baseline 比 +198%) 以上の悪化が必要) — gate 無効 (regressionGate=false) |

## 実行内正規化 (回帰判定はこの比で行う)

回帰判定は実測値そのものではなく、 同じ実行の中で 1 呼出ずつ交互に測った基準 op との比を読む。 実行と実行の間で機械の状態が変わっても、 その差が分子と分母で相殺される。 「換算後 p10」 は今回の比を baseline を測った時の基準 p10 で ms に戻した値で、 baseline の実測 p10 と直接比べられる。


「実行間のばらつき」 は baseline が持つ過去の比が、 baseline 自身の比からどれだけ離れたかの最大値。 その op が実装を変えずに測るだけでどれだけ動くかを表す。 判定はこの幅の 2 倍と相対閾値の大きい方を超えた差だけを有意として扱う (#1739)。 履歴が 3 件に満たない op では推定できないため n/a になり、 相対閾値だけで判定する。

| op | 基準 op | 基準 p10 | 基準 p95 | 実測 p10 | 比 | baseline の比 | 実行間のばらつき | 実効閾値 | 換算後 p10 | baseline p10 |
|---|---|---|---|---|---|---|---|---|---|---|
| stripeSignWebhook | cpu | 0.08ms | 0.08ms | 0.0023ms | 0.029 | 0.030 | n/a | 20.0% | 0.0024ms | 0.0025ms |
| stripeVerifyWebhook | cpu | 0.08ms | 0.08ms | 0.0027ms | 0.034 | 0.035 | n/a | 20.0% | 0.0028ms | 0.0029ms |
| paddleSignWebhook | cpu | 0.08ms | 0.08ms | 0.0028ms | 0.035 | 0.036 | n/a | 20.0% | 0.0029ms | 0.0029ms |
| paddleVerifyWebhook | cpu | 0.08ms | 0.08ms | 0.0029ms | 0.036 | 0.037 | n/a | 20.0% | 0.0030ms | 0.0030ms |
| lemonSqueezySignWebhook | cpu | 0.08ms | 0.08ms | 0.0025ms | 0.030 | 0.028 | n/a | 20.0% | 0.0025ms | 0.0023ms |
| lemonSqueezyVerifyWebhook | cpu | 0.08ms | 0.15ms | 0.0031ms | 0.037 | 0.037 | n/a | 20.0% | 0.0031ms | 0.0031ms |
| dunningStart | cpu | 0.08ms | 0.08ms | 0.00025ms | 0.003 | 0.003 | n/a | 20.0% | 0.00025ms | 0.00021ms |
| retryStart | cpu | 0.08ms | 0.09ms | 0.0022ms | 0.027 | 0.027 | n/a | 20.0% | 0.0022ms | 0.0022ms |
| retryBackoffMs | cpu | 0.08ms | 0.08ms | 0.00017ms | 0.002 | 0.002 | n/a | 20.0% | 0.00016ms | 0.00017ms |

## Concurrent p95 (concurrency = 10, 50 iter each)

| op | p95 | cap | gate |
|---|---|---|---|
| stripeSignWebhook | 0.05ms | 20ms | PASS |
| stripeVerifyWebhook | 0.04ms | 20ms | PASS |
| paddleSignWebhook | 0.04ms | 20ms | PASS |
| paddleVerifyWebhook | 0.05ms | 20ms | PASS |
| lemonSqueezySignWebhook | 0.04ms | 20ms | PASS |
| lemonSqueezyVerifyWebhook | 0.04ms | 20ms | PASS |
| dunningStart | 0.01ms | 10ms | PASS |
| retryStart | 0.04ms | 10ms | PASS |
| retryBackoffMs | 0.00ms | 10ms | PASS |

## Memory retention (200 iter, arrayBuffers axis is the gate; heap is informational)

| op | heapUsed Δ | arrayBuffers Δ | cap | gc exposed | 呼出 (空回し + 反復) | verdict |
|---|---|---|---|---|---|---|
| stripeSignWebhook | -18496 B | 0 B | 102400 B | yes | 220 (20 + 200) | PASS |
| stripeVerifyWebhook | -21944 B | 0 B | 102400 B | yes | 220 (20 + 200) | PASS |
| paddleSignWebhook | 1960 B | 0 B | 102400 B | yes | 220 (20 + 200) | PASS |
| paddleVerifyWebhook | 168 B | 0 B | 102400 B | yes | 220 (20 + 200) | PASS |
| lemonSqueezySignWebhook | 528 B | 0 B | 102400 B | yes | 220 (20 + 200) | PASS |
| lemonSqueezyVerifyWebhook | 2056 B | -114688 B | 102400 B | yes | 220 (20 + 200) | PASS |
| dunningStart | -976 B | 0 B | 102400 B | yes | 220 (20 + 200) | PASS |
| retryStart | -384 B | 0 B | 102400 B | yes | 220 (20 + 200) | PASS |
| retryBackoffMs | 48 B | 0 B | 102400 B | yes | 220 (20 + 200) | PASS |

## Detailed serial reports

### stripeSignWebhook

# Perf Report — stripeSignWebhook.serial

| metric | value |
|---|---|
| iterations | 200 |
| warmup | 5 |
| p10 | 0.0023ms |
| p50 | 0.0025ms |
| p95 | 0.0072ms |
| p99 | 0.02ms |
| mean | 0.0036ms |
| stdev | 0.0049ms |
| min | 0.0022ms |
| max | 0.06ms |
| total | 0.72ms |

## Baseline diff

current は baseline を測った時の機械の速さへ換算済み (倍率 1.039)。 回帰判定が読む量と同じ。 実測値は上表。

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.0024ms | 0.0025ms | -0.00012ms | -4.98% |
| p50 | 0.0026ms | 0.0029ms | -0.00032ms | -10.98% |
| p95 | 0.0075ms | 0.02ms | -0.01ms | -62.93% |
| p99 | 0.02ms | 0.07ms | -0.04ms | -62.99% |
| mean | 0.0038ms | 0.0065ms | -0.0027ms | -42.06% |
| min | 0.0023ms | 0.0023ms | -0.000082ms | -3.52% |
| max | 0.06ms | 0.17ms | -0.11ms | -63.38% |
| total | 0.75ms | 1.30ms | -0.55ms | -42.06% |

### stripeVerifyWebhook

# Perf Report — stripeVerifyWebhook.serial

| metric | value |
|---|---|
| iterations | 200 |
| warmup | 5 |
| p10 | 0.0027ms |
| p50 | 0.0029ms |
| p95 | 0.0068ms |
| p99 | 0.01ms |
| mean | 0.0036ms |
| stdev | 0.0032ms |
| min | 0.0026ms |
| max | 0.04ms |
| total | 0.71ms |

## Baseline diff

current は baseline を測った時の機械の速さへ換算済み (倍率 1.024)。 回帰判定が読む量と同じ。 実測値は上表。

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.0028ms | 0.0029ms | -0.000060ms | -2.07% |
| p50 | 0.0029ms | 0.0031ms | -0.00018ms | -5.81% |
| p95 | 0.0070ms | 0.0083ms | -0.0013ms | -15.54% |
| p99 | 0.01ms | 0.02ms | -0.0067ms | -34.89% |
| mean | 0.0036ms | 0.0048ms | -0.0011ms | -23.69% |
| min | 0.0027ms | 0.0028ms | -0.00010ms | -3.71% |
| max | 0.04ms | 0.17ms | -0.13ms | -75.56% |
| total | 0.73ms | 0.95ms | -0.23ms | -23.69% |

### paddleSignWebhook

# Perf Report — paddleSignWebhook.serial

| metric | value |
|---|---|
| iterations | 200 |
| warmup | 5 |
| p10 | 0.0028ms |
| p50 | 0.0030ms |
| p95 | 0.0062ms |
| p99 | 0.03ms |
| mean | 0.0038ms |
| stdev | 0.0041ms |
| min | 0.0026ms |
| max | 0.05ms |
| total | 0.77ms |

## Baseline diff

current は baseline を測った時の機械の速さへ換算済み (倍率 1.013)。 回帰判定が読む量と同じ。 実測値は上表。

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.0029ms | 0.0029ms | -0.000045ms | -1.54% |
| p50 | 0.0031ms | 0.0031ms | -0.000042ms | -1.35% |
| p95 | 0.0063ms | 0.0067ms | -0.00043ms | -6.41% |
| p99 | 0.03ms | 0.03ms | -0.0065ms | -20.06% |
| mean | 0.0039ms | 0.0042ms | -0.00037ms | -8.66% |
| min | 0.0027ms | 0.0028ms | -0.00013ms | -4.72% |
| max | 0.05ms | 0.06ms | -0.0085ms | -15.36% |
| total | 0.78ms | 0.85ms | -0.07ms | -8.66% |

### paddleVerifyWebhook

# Perf Report — paddleVerifyWebhook.serial

| metric | value |
|---|---|
| iterations | 200 |
| warmup | 5 |
| p10 | 0.0029ms |
| p50 | 0.0032ms |
| p95 | 0.0084ms |
| p99 | 0.04ms |
| mean | 0.0047ms |
| stdev | 0.0064ms |
| min | 0.0028ms |
| max | 0.06ms |
| total | 0.95ms |

## Baseline diff

current は baseline を測った時の機械の速さへ換算済み (倍率 1.022)。 回帰判定が読む量と同じ。 実測値は上表。

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.0030ms | 0.0030ms | -0.000062ms | -2.03% |
| p50 | 0.0033ms | 0.0032ms | +0.0000066ms | +0.20% |
| p95 | 0.0086ms | 0.0061ms | +0.0025ms | +41.60% |
| p99 | 0.04ms | 0.01ms | +0.03ms | +221.32% |
| mean | 0.0048ms | 0.0037ms | +0.0011ms | +30.67% |
| min | 0.0029ms | 0.0029ms | -0.000064ms | -2.21% |
| max | 0.06ms | 0.02ms | +0.04ms | +156.92% |
| total | 0.97ms | 0.74ms | +0.23ms | +30.67% |

### lemonSqueezySignWebhook

# Perf Report — lemonSqueezySignWebhook.serial

| metric | value |
|---|---|
| iterations | 200 |
| warmup | 5 |
| p10 | 0.0025ms |
| p50 | 0.0027ms |
| p95 | 0.0078ms |
| p99 | 0.05ms |
| mean | 0.0043ms |
| stdev | 0.0078ms |
| min | 0.0023ms |
| max | 0.08ms |
| total | 0.85ms |

## Baseline diff

current は baseline を測った時の機械の速さへ換算済み (倍率 0.998)。 回帰判定が読む量と同じ。 実測値は上表。

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.0025ms | 0.0023ms | +0.00012ms | +5.14% |
| p50 | 0.0027ms | 0.0025ms | +0.00016ms | +6.44% |
| p95 | 0.0077ms | 0.0056ms | +0.0021ms | +37.38% |
| p99 | 0.05ms | 0.01ms | +0.04ms | +270.21% |
| mean | 0.0043ms | 0.0032ms | +0.0011ms | +34.00% |
| min | 0.0023ms | 0.0022ms | +0.000078ms | +3.47% |
| max | 0.08ms | 0.05ms | +0.03ms | +55.99% |
| total | 0.85ms | 0.64ms | +0.22ms | +34.00% |

### lemonSqueezyVerifyWebhook

# Perf Report — lemonSqueezyVerifyWebhook.serial

| metric | value |
|---|---|
| iterations | 200 |
| warmup | 5 |
| p10 | 0.0031ms |
| p50 | 0.0033ms |
| p95 | 0.02ms |
| p99 | 0.06ms |
| mean | 0.0071ms |
| stdev | 0.02ms |
| min | 0.0030ms |
| max | 0.25ms |
| total | 1.43ms |

## Baseline diff

current は baseline を測った時の機械の速さへ換算済み (倍率 0.999)。 回帰判定が読む量と同じ。 実測値は上表。

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.0031ms | 0.0031ms | -0.0000033ms | -0.11% |
| p50 | 0.0033ms | 0.0033ms | +0.000017ms | +0.52% |
| p95 | 0.02ms | 0.0080ms | +0.01ms | +169.88% |
| p99 | 0.06ms | 0.04ms | +0.02ms | +58.30% |
| mean | 0.0071ms | 0.0046ms | +0.0026ms | +55.75% |
| min | 0.0030ms | 0.0030ms | +0.000038ms | +1.28% |
| max | 0.25ms | 0.07ms | +0.18ms | +244.77% |
| total | 1.43ms | 0.92ms | +0.51ms | +55.75% |

### dunningStart

# Perf Report — dunningStart.serial

| metric | value |
|---|---|
| iterations | 200 |
| warmup | 5 |
| p10 | 0.00025ms |
| p50 | 0.00025ms |
| p95 | 0.00038ms |
| p99 | 0.0028ms |
| mean | 0.00037ms |
| stdev | 0.00071ms |
| min | 0.00021ms |
| max | 0.0093ms |
| total | 0.07ms |

## Baseline diff

current は baseline を測った時の機械の速さへ換算済み (倍率 1.008)。 回帰判定が読む量と同じ。 実測値は上表。

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.00025ms | 0.00021ms | +0.000044ms | +21.12% |
| p50 | 0.00025ms | 0.00025ms | +0.0000019ms | +0.77% |
| p95 | 0.00038ms | 0.00046ms | -0.000082ms | -17.87% |
| p99 | 0.0029ms | 0.0037ms | -0.00085ms | -22.93% |
| mean | 0.00037ms | 0.00040ms | -0.000026ms | -6.55% |
| min | 0.00021ms | 0.00017ms | +0.000043ms | +25.51% |
| max | 0.0094ms | 0.01ms | -0.00097ms | -9.38% |
| total | 0.07ms | 0.08ms | -0.0052ms | -6.55% |

### retryStart

# Perf Report — retryStart.serial

| metric | value |
|---|---|
| iterations | 200 |
| warmup | 5 |
| p10 | 0.0022ms |
| p50 | 0.0025ms |
| p95 | 0.01ms |
| p99 | 0.03ms |
| mean | 0.0040ms |
| stdev | 0.0051ms |
| min | 0.0021ms |
| max | 0.04ms |
| total | 0.80ms |

## Baseline diff

current は baseline を測った時の機械の速さへ換算済み (倍率 0.989)。 回帰判定が読む量と同じ。 実測値は上表。

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.0022ms | 0.0022ms | -0.000023ms | -1.06% |
| p50 | 0.0025ms | 0.0024ms | +0.000099ms | +4.15% |
| p95 | 0.01ms | 0.0048ms | +0.0052ms | +109.04% |
| p99 | 0.03ms | 0.02ms | +0.01ms | +52.46% |
| mean | 0.0039ms | 0.0032ms | +0.00078ms | +24.41% |
| min | 0.0021ms | 0.0021ms | -0.000023ms | -1.11% |
| max | 0.04ms | 0.05ms | -0.0083ms | -17.15% |
| total | 0.79ms | 0.63ms | +0.16ms | +24.41% |

### retryBackoffMs

# Perf Report — retryBackoffMs.serial

| metric | value |
|---|---|
| iterations | 200 |
| warmup | 5 |
| p10 | 0.00017ms |
| p50 | 0.00017ms |
| p95 | 0.00034ms |
| p99 | 0.0040ms |
| mean | 0.00033ms |
| stdev | 0.00093ms |
| min | 0.00013ms |
| max | 0.01ms |
| total | 0.07ms |

## Baseline diff

current は baseline を測った時の機械の速さへ換算済み (倍率 0.991)。 回帰判定が読む量と同じ。 実測値は上表。

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.00016ms | 0.00017ms | -0.0000014ms | -0.86% |
| p50 | 0.00017ms | 0.00017ms | -0.0000014ms | -0.86% |
| p95 | 0.00033ms | 0.00025ms | +0.000083ms | +33.26% |
| p99 | 0.0039ms | 0.0018ms | +0.0022ms | +123.40% |
| mean | 0.00032ms | 0.00028ms | +0.000049ms | +17.77% |
| min | 0.00012ms | 0.00013ms | -0.0000011ms | -0.86% |
| max | 0.01ms | 0.01ms | -0.0018ms | -13.56% |
| total | 0.06ms | 0.06ms | +0.0098ms | +17.77% |

