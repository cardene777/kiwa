# Perf Suite — payment

Threshold source: [docs/quality/perf-thresholds.md](../../../quality/perf-thresholds)

測定系の分解能 = 0.00017ms (何もしない関数を同じ経路で呼んだ時の p10)。 回帰判定の絶対下限は既定でこの 2 倍 = 0.00033ms、 op ごとの実効値は下表の「下限」 列。

## Serial (concurrency = 1)

| op | p10 (実測) | p95 (上限判定) | cap | 下限 | gate | regression |
|---|---|---|---|---|---|---|
| stripeSignWebhook | 0.0023ms | 0.0063ms | 10ms | 0.00033ms | PASS | stable — gate 無効 (regressionGate=false) |
| stripeVerifyWebhook | 0.0027ms | 0.0048ms | 10ms | 0.00033ms | PASS | stable — gate 無効 (regressionGate=false) |
| paddleSignWebhook | 0.0029ms | 0.0067ms | 10ms | 0.00034ms | PASS | stable — gate 無効 (regressionGate=false) |
| paddleVerifyWebhook | 0.0031ms | 0.0055ms | 10ms | 0.00033ms | PASS | stable — gate 無効 (regressionGate=false) |
| lemonSqueezySignWebhook | 0.0022ms | 0.0051ms | 10ms | 0.00033ms | PASS | stable — gate 無効 (regressionGate=false) |
| lemonSqueezyVerifyWebhook | 0.0029ms | 0.0046ms | 10ms | 0.00033ms | PASS | stable — gate 無効 (regressionGate=false) |
| dunningStart | 0.00025ms | 0.00046ms | 5ms | 0.00033ms | PASS | stable (差 0.000042ms が下限 0.00033ms 未満で判定を保留) — gate 無効 (regressionGate=false) |
| retryStart | 0.0021ms | 0.0039ms | 5ms | 0.00033ms | PASS | stable — gate 無効 (regressionGate=false) |
| retryBackoffMs | 0.00013ms | 0.00033ms | 5ms | 0.00034ms | PASS | stable (差 0.000040ms が下限 0.00034ms 未満で判定を保留) — gate 無効 (regressionGate=false) |

## 実行内正規化 (回帰判定はこの比で行う)

回帰判定は実測値そのものではなく、 同じ実行の中で 1 呼出ずつ交互に測った基準 op との比を読む。 実行と実行の間で機械の状態が変わっても、 その差が分子と分母で相殺される。 「換算後 p10」 は今回の比を baseline を測った時の基準 p10 で ms に戻した値で、 baseline の実測 p10 と直接比べられる。

| op | 基準 op | 基準 p10 | 実測 p10 | 比 | baseline の比 | 換算後 p10 | baseline p10 |
|---|---|---|---|---|---|---|---|
| stripeSignWebhook | cpu | 0.08ms | 0.0023ms | 0.028 | 0.030 | 0.0023ms | 0.0024ms |
| stripeVerifyWebhook | cpu | 0.08ms | 0.0027ms | 0.033 | 0.035 | 0.0027ms | 0.0028ms |
| paddleSignWebhook | cpu | 0.08ms | 0.0029ms | 0.036 | 0.035 | 0.0029ms | 0.0029ms |
| paddleVerifyWebhook | cpu | 0.08ms | 0.0031ms | 0.038 | 0.036 | 0.0031ms | 0.0029ms |
| lemonSqueezySignWebhook | cpu | 0.08ms | 0.0022ms | 0.028 | 0.028 | 0.0022ms | 0.0023ms |
| lemonSqueezyVerifyWebhook | cpu | 0.08ms | 0.0029ms | 0.036 | 0.036 | 0.0029ms | 0.0029ms |
| dunningStart | cpu | 0.08ms | 0.00025ms | 0.003 | 0.003 | 0.00025ms | 0.00021ms |
| retryStart | cpu | 0.08ms | 0.0021ms | 0.026 | 0.027 | 0.0021ms | 0.0022ms |
| retryBackoffMs | cpu | 0.08ms | 0.00013ms | 0.002 | 0.002 | 0.00013ms | 0.00017ms |

## Concurrent p95 (concurrency = 10, 50 iter each)

| op | p95 | cap | gate |
|---|---|---|---|
| stripeSignWebhook | 0.05ms | 20ms | PASS |
| stripeVerifyWebhook | 0.04ms | 20ms | PASS |
| paddleSignWebhook | 0.04ms | 20ms | PASS |
| paddleVerifyWebhook | 0.04ms | 20ms | PASS |
| lemonSqueezySignWebhook | 0.03ms | 20ms | PASS |
| lemonSqueezyVerifyWebhook | 0.05ms | 20ms | PASS |
| dunningStart | 0.01ms | 10ms | PASS |
| retryStart | 0.03ms | 10ms | PASS |
| retryBackoffMs | 0.00ms | 10ms | PASS |

## Memory retention (200 iter, arrayBuffers axis is the gate; heap is informational)

| op | heapUsed Δ | arrayBuffers Δ | cap | gc exposed | verdict |
|---|---|---|---|---|---|
| stripeSignWebhook | -14624 B | 0 B | 102400 B | yes | PASS |
| stripeVerifyWebhook | -21496 B | 0 B | 102400 B | yes | PASS |
| paddleSignWebhook | 1864 B | 0 B | 102400 B | yes | PASS |
| paddleVerifyWebhook | 264 B | 0 B | 102400 B | yes | PASS |
| lemonSqueezySignWebhook | 528 B | 0 B | 102400 B | yes | PASS |
| lemonSqueezyVerifyWebhook | 9264 B | 0 B | 102400 B | yes | PASS |
| dunningStart | -880 B | 0 B | 102400 B | yes | PASS |
| retryStart | -384 B | 0 B | 102400 B | yes | PASS |
| retryBackoffMs | 48 B | 0 B | 102400 B | yes | PASS |

## Detailed serial reports

### stripeSignWebhook

# Perf Report — stripeSignWebhook.serial

| metric | value |
|---|---|
| iterations | 200 |
| warmup | 5 |
| p10 | 0.0023ms |
| p50 | 0.0025ms |
| p95 | 0.0063ms |
| p99 | 0.01ms |
| mean | 0.0033ms |
| stdev | 0.0027ms |
| min | 0.0023ms |
| max | 0.03ms |
| total | 0.66ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.0023ms | 0.0024ms | -0.000083ms | -3.44% |
| p50 | 0.0025ms | 0.0027ms | -0.00021ms | -7.68% |
| p95 | 0.0063ms | 0.0079ms | -0.0016ms | -20.01% |
| p99 | 0.01ms | 0.03ms | -0.01ms | -46.77% |
| mean | 0.0033ms | 0.0040ms | -0.00068ms | -17.16% |
| min | 0.0023ms | 0.0023ms | -0.000042ms | -1.80% |
| max | 0.03ms | 0.05ms | -0.02ms | -44.05% |
| total | 0.66ms | 0.80ms | -0.14ms | -17.16% |

### stripeVerifyWebhook

# Perf Report — stripeVerifyWebhook.serial

| metric | value |
|---|---|
| iterations | 200 |
| warmup | 5 |
| p10 | 0.0027ms |
| p50 | 0.0028ms |
| p95 | 0.0048ms |
| p99 | 0.0083ms |
| mean | 0.0032ms |
| stdev | 0.0013ms |
| min | 0.0027ms |
| max | 0.01ms |
| total | 0.64ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.0027ms | 0.0028ms | -0.000078ms | -2.80% |
| p50 | 0.0028ms | 0.0031ms | -0.00025ms | -8.11% |
| p95 | 0.0048ms | 0.0070ms | -0.0022ms | -31.22% |
| p99 | 0.0083ms | 0.05ms | -0.04ms | -81.67% |
| mean | 0.0032ms | 0.0045ms | -0.0013ms | -28.87% |
| min | 0.0027ms | 0.0027ms | 0.00ms | 0.00% |
| max | 0.01ms | 0.08ms | -0.06ms | -82.12% |
| total | 0.64ms | 0.90ms | -0.26ms | -28.87% |

### paddleSignWebhook

# Perf Report — paddleSignWebhook.serial

| metric | value |
|---|---|
| iterations | 200 |
| warmup | 5 |
| p10 | 0.0029ms |
| p50 | 0.0030ms |
| p95 | 0.0067ms |
| p99 | 0.04ms |
| mean | 0.0041ms |
| stdev | 0.0056ms |
| min | 0.0027ms |
| max | 0.06ms |
| total | 0.82ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.0029ms | 0.0029ms | 0.00ms | 0.00% |
| p50 | 0.0030ms | 0.0031ms | -0.000041ms | -1.33% |
| p95 | 0.0067ms | 0.0071ms | -0.00042ms | -5.96% |
| p99 | 0.04ms | 0.03ms | +0.0089ms | +28.16% |
| mean | 0.0041ms | 0.0043ms | -0.00016ms | -3.70% |
| min | 0.0027ms | 0.0027ms | 0.00ms | 0.00% |
| max | 0.06ms | 0.06ms | +0.0023ms | +4.14% |
| total | 0.82ms | 0.85ms | -0.03ms | -3.70% |

### paddleVerifyWebhook

# Perf Report — paddleVerifyWebhook.serial

| metric | value |
|---|---|
| iterations | 200 |
| warmup | 5 |
| p10 | 0.0031ms |
| p50 | 0.0034ms |
| p95 | 0.0055ms |
| p99 | 0.01ms |
| mean | 0.0039ms |
| stdev | 0.0045ms |
| min | 0.0029ms |
| max | 0.06ms |
| total | 0.78ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.0031ms | 0.0029ms | +0.00017ms | +5.69% |
| p50 | 0.0034ms | 0.0030ms | +0.00033ms | +10.98% |
| p95 | 0.0055ms | 0.0050ms | +0.00054ms | +10.82% |
| p99 | 0.01ms | 0.02ms | -0.0049ms | -28.16% |
| mean | 0.0039ms | 0.0036ms | +0.00035ms | +9.78% |
| min | 0.0029ms | 0.0029ms | +0.000041ms | +1.43% |
| max | 0.06ms | 0.04ms | +0.02ms | +58.98% |
| total | 0.78ms | 0.71ms | +0.07ms | +9.78% |

### lemonSqueezySignWebhook

# Perf Report — lemonSqueezySignWebhook.serial

| metric | value |
|---|---|
| iterations | 200 |
| warmup | 5 |
| p10 | 0.0022ms |
| p50 | 0.0024ms |
| p95 | 0.0051ms |
| p99 | 0.01ms |
| mean | 0.0027ms |
| stdev | 0.0013ms |
| min | 0.0022ms |
| max | 0.01ms |
| total | 0.54ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.0022ms | 0.0023ms | -0.000042ms | -1.83% |
| p50 | 0.0024ms | 0.0025ms | -0.000083ms | -3.38% |
| p95 | 0.0051ms | 0.0051ms | +0.000012ms | +0.25% |
| p99 | 0.01ms | 0.02ms | -0.0049ms | -32.85% |
| mean | 0.0027ms | 0.0032ms | -0.00046ms | -14.56% |
| min | 0.0022ms | 0.0022ms | -0.000041ms | -1.86% |
| max | 0.01ms | 0.03ms | -0.02ms | -57.96% |
| total | 0.54ms | 0.63ms | -0.09ms | -14.56% |

### lemonSqueezyVerifyWebhook

# Perf Report — lemonSqueezyVerifyWebhook.serial

| metric | value |
|---|---|
| iterations | 200 |
| warmup | 5 |
| p10 | 0.0029ms |
| p50 | 0.0031ms |
| p95 | 0.0046ms |
| p99 | 0.0085ms |
| mean | 0.0035ms |
| stdev | 0.0028ms |
| min | 0.0028ms |
| max | 0.04ms |
| total | 0.70ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.0029ms | 0.0029ms | +0.000041ms | +1.43% |
| p50 | 0.0031ms | 0.0031ms | -0.0000010ms | -0.03% |
| p95 | 0.0046ms | 0.0056ms | -0.00095ms | -17.05% |
| p99 | 0.0085ms | 0.03ms | -0.03ms | -75.03% |
| mean | 0.0035ms | 0.0041ms | -0.00057ms | -13.93% |
| min | 0.0028ms | 0.0028ms | 0.00ms | 0.00% |
| max | 0.04ms | 0.06ms | -0.01ms | -25.39% |
| total | 0.70ms | 0.81ms | -0.11ms | -13.93% |

### dunningStart

# Perf Report — dunningStart.serial

| metric | value |
|---|---|
| iterations | 200 |
| warmup | 5 |
| p10 | 0.00025ms |
| p50 | 0.00029ms |
| p95 | 0.00046ms |
| p99 | 0.0030ms |
| mean | 0.00039ms |
| stdev | 0.00075ms |
| min | 0.00021ms |
| max | 0.0097ms |
| total | 0.08ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.00025ms | 0.00021ms | +0.000042ms | +20.19% |
| p50 | 0.00029ms | 0.00025ms | +0.000041ms | +16.40% |
| p95 | 0.00046ms | 0.00046ms | -0.0000011ms | -0.25% |
| p99 | 0.0030ms | 0.0082ms | -0.0052ms | -63.88% |
| mean | 0.00039ms | 0.00046ms | -0.000068ms | -14.82% |
| min | 0.00021ms | 0.00021ms | 0.00ms | 0.00% |
| max | 0.0097ms | 0.01ms | -0.0025ms | -20.82% |
| total | 0.08ms | 0.09ms | -0.01ms | -14.82% |

### retryStart

# Perf Report — retryStart.serial

| metric | value |
|---|---|
| iterations | 200 |
| warmup | 5 |
| p10 | 0.0021ms |
| p50 | 0.0022ms |
| p95 | 0.0039ms |
| p99 | 0.01ms |
| mean | 0.0028ms |
| stdev | 0.0031ms |
| min | 0.0020ms |
| max | 0.04ms |
| total | 0.55ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.0021ms | 0.0022ms | -0.000083ms | -3.83% |
| p50 | 0.0022ms | 0.0023ms | -0.000083ms | -3.56% |
| p95 | 0.0039ms | 0.0053ms | -0.0014ms | -26.07% |
| p99 | 0.01ms | 0.03ms | -0.02ms | -57.98% |
| mean | 0.0028ms | 0.0031ms | -0.00036ms | -11.57% |
| min | 0.0020ms | 0.0021ms | -0.000042ms | -2.02% |
| max | 0.04ms | 0.05ms | -0.01ms | -22.94% |
| total | 0.55ms | 0.63ms | -0.07ms | -11.57% |

### retryBackoffMs

# Perf Report — retryBackoffMs.serial

| metric | value |
|---|---|
| iterations | 200 |
| warmup | 5 |
| p10 | 0.00013ms |
| p50 | 0.00017ms |
| p95 | 0.00033ms |
| p99 | 0.0051ms |
| mean | 0.00032ms |
| stdev | 0.0011ms |
| min | 0.00013ms |
| max | 0.01ms |
| total | 0.06ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.00013ms | 0.00017ms | -0.000041ms | -24.70% |
| p50 | 0.00017ms | 0.00017ms | 0.00ms | 0.00% |
| p95 | 0.00033ms | 0.00029ms | +0.000039ms | +13.26% |
| p99 | 0.0051ms | 0.0033ms | +0.0018ms | +54.18% |
| mean | 0.00032ms | 0.00036ms | -0.000042ms | -11.56% |
| min | 0.00013ms | 0.00013ms | 0.00ms | 0.00% |
| max | 0.01ms | 0.02ms | -0.0071ms | -37.50% |
| total | 0.06ms | 0.07ms | -0.0084ms | -11.56% |

