# Perf Suite — payment

Threshold source: [docs/quality/perf-thresholds.md](../../../quality/perf-thresholds)

測定系の分解能 = 0.00017ms (何もしない関数を同じ経路で呼んだ時の p10)。 回帰判定の絶対下限は既定でこの 2 倍 = 0.00033ms、 op ごとの実効値は下表の「下限」 列。

## Serial (concurrency = 1)

| op | p10 (回帰判定) | p95 (上限判定) | cap | 下限 | gate | regression |
|---|---|---|---|---|---|---|
| stripeSignWebhook | 0.0024ms | 0.0068ms | 10ms | 0.00033ms | PASS | stable — gate 無効 (regressionGate=false) |
| stripeVerifyWebhook | 0.0035ms | 0.0055ms | 10ms | 0.00033ms | PASS | stable — gate 無効 (regressionGate=false) |
| paddleSignWebhook | 0.0032ms | 0.0040ms | 10ms | 0.00033ms | PASS | stable — gate 無効 (regressionGate=false) |
| paddleVerifyWebhook | 0.0032ms | 0.0071ms | 10ms | 0.00033ms | PASS | stable (p10 -3% (閾値未満)、 p95 +74% (裾は実行間の振れ幅と区別できないため判定には使わない)) — gate 無効 (regressionGate=false) |
| lemonSqueezySignWebhook | 0.0027ms | 0.0036ms | 10ms | 0.00033ms | PASS | stable — gate 無効 (regressionGate=false) |
| lemonSqueezyVerifyWebhook | 0.0030ms | 0.0038ms | 10ms | 0.00033ms | PASS | stable — gate 無効 (regressionGate=false) |
| dunningStart | 0.00025ms | 0.00038ms | 5ms | 0.00033ms | PASS | stable (検知には +0.00033ms (baseline 比 +114%) 以上の悪化が必要) — gate 無効 (regressionGate=false) |
| retryStart | 0.0022ms | 0.0030ms | 5ms | 0.00033ms | PASS | stable — gate 無効 (regressionGate=false) |
| retryBackoffMs | 0.00021ms | 0.00029ms | 5ms | 0.00033ms | PASS | stable (検知には +0.00033ms (baseline 比 +160%) 以上の悪化が必要) — gate 無効 (regressionGate=false) |

## Concurrent p95 (concurrency = 10, 50 iter each)

| op | p95 | cap | gate |
|---|---|---|---|
| stripeSignWebhook | 0.04ms | 20ms | PASS |
| stripeVerifyWebhook | 0.05ms | 20ms | PASS |
| paddleSignWebhook | 0.05ms | 20ms | PASS |
| paddleVerifyWebhook | 0.56ms | 20ms | PASS |
| lemonSqueezySignWebhook | 0.04ms | 20ms | PASS |
| lemonSqueezyVerifyWebhook | 0.04ms | 20ms | PASS |
| dunningStart | 0.00ms | 10ms | PASS |
| retryStart | 0.04ms | 10ms | PASS |
| retryBackoffMs | 0.01ms | 10ms | PASS |

## Memory retention (200 iter, arrayBuffers axis is the gate; heap is informational)

| op | heapUsed Δ | arrayBuffers Δ | cap | gc exposed | verdict |
|---|---|---|---|---|---|
| stripeSignWebhook | -15696 B | -495 B | 102400 B | yes | PASS |
| stripeVerifyWebhook | -22608 B | 32768 B | 102400 B | yes | PASS |
| paddleSignWebhook | 4088 B | -16384 B | 102400 B | yes | PASS |
| paddleVerifyWebhook | 712 B | 0 B | 102400 B | yes | PASS |
| lemonSqueezySignWebhook | 400 B | 0 B | 102400 B | yes | PASS |
| lemonSqueezyVerifyWebhook | 848 B | -81920 B | 102400 B | yes | PASS |
| dunningStart | 15048 B | 0 B | 102400 B | yes | PASS |
| retryStart | -528 B | 8192 B | 102400 B | yes | PASS |
| retryBackoffMs | 12224 B | 0 B | 102400 B | yes | PASS |

## Detailed serial reports

### stripeSignWebhook

# Perf Report — stripeSignWebhook.serial

| metric | value |
|---|---|
| iterations | 200 |
| warmup | 5 |
| p10 | 0.0024ms |
| p50 | 0.0028ms |
| p95 | 0.0068ms |
| p99 | 0.01ms |
| mean | 0.0034ms |
| stdev | 0.0022ms |
| min | 0.0022ms |
| max | 0.02ms |
| total | 0.68ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.0024ms | 0.0025ms | -0.00013ms | -5.01% |
| p50 | 0.0028ms | 0.0031ms | -0.00025ms | -8.12% |
| p95 | 0.0068ms | 0.0059ms | +0.00094ms | +16.02% |
| p99 | 0.01ms | 0.01ms | -0.0012ms | -8.34% |
| mean | 0.0034ms | 0.0036ms | -0.00021ms | -5.91% |
| min | 0.0022ms | 0.0024ms | -0.00021ms | -8.61% |
| max | 0.02ms | 0.03ms | -0.0066ms | -22.22% |
| total | 0.68ms | 0.72ms | -0.04ms | -5.91% |

### stripeVerifyWebhook

# Perf Report — stripeVerifyWebhook.serial

| metric | value |
|---|---|
| iterations | 200 |
| warmup | 5 |
| p10 | 0.0035ms |
| p50 | 0.0036ms |
| p95 | 0.0055ms |
| p99 | 0.01ms |
| mean | 0.0039ms |
| stdev | 0.0014ms |
| min | 0.0034ms |
| max | 0.01ms |
| total | 0.79ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.0035ms | 0.0030ms | +0.00050ms | +16.90% |
| p50 | 0.0036ms | 0.0030ms | +0.00054ms | +17.78% |
| p95 | 0.0055ms | 0.0050ms | +0.00051ms | +10.34% |
| p99 | 0.01ms | 0.01ms | +0.00090ms | +8.78% |
| mean | 0.0039ms | 0.0034ms | +0.00050ms | +14.52% |
| min | 0.0034ms | 0.0029ms | +0.00050ms | +17.39% |
| max | 0.01ms | 0.02ms | -0.0036ms | -19.59% |
| total | 0.79ms | 0.69ms | +0.10ms | +14.52% |

### paddleSignWebhook

# Perf Report — paddleSignWebhook.serial

| metric | value |
|---|---|
| iterations | 200 |
| warmup | 5 |
| p10 | 0.0032ms |
| p50 | 0.0033ms |
| p95 | 0.0040ms |
| p99 | 0.01ms |
| mean | 0.0035ms |
| stdev | 0.0011ms |
| min | 0.0031ms |
| max | 0.01ms |
| total | 0.71ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.0032ms | 0.0031ms | +0.00013ms | +4.05% |
| p50 | 0.0033ms | 0.0032ms | +0.000083ms | +2.59% |
| p95 | 0.0040ms | 0.0051ms | -0.0011ms | -22.01% |
| p99 | 0.01ms | 0.02ms | -0.01ms | -56.03% |
| mean | 0.0035ms | 0.0039ms | -0.00032ms | -8.32% |
| min | 0.0031ms | 0.0030ms | +0.00013ms | +4.17% |
| max | 0.01ms | 0.04ms | -0.03ms | -68.98% |
| total | 0.71ms | 0.77ms | -0.06ms | -8.32% |

### paddleVerifyWebhook

# Perf Report — paddleVerifyWebhook.serial

| metric | value |
|---|---|
| iterations | 200 |
| warmup | 5 |
| p10 | 0.0032ms |
| p50 | 0.0033ms |
| p95 | 0.0071ms |
| p99 | 2.46ms |
| mean | 0.05ms |
| stdev | 0.37ms |
| min | 0.0031ms |
| max | 3.89ms |
| total | 9.87ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.0032ms | 0.0032ms | -0.000083ms | -2.55% |
| p50 | 0.0033ms | 0.0034ms | -0.000020ms | -0.61% |
| p95 | 0.0071ms | 0.0041ms | +0.0031ms | +74.49% |
| p99 | 2.46ms | 0.0061ms | +2.45ms | +40417.29% |
| mean | 0.05ms | 0.0035ms | +0.05ms | +1295.84% |
| min | 0.0031ms | 0.0031ms | -0.000041ms | -1.31% |
| max | 3.89ms | 0.01ms | +3.87ms | +27746.73% |
| total | 9.87ms | 0.71ms | +9.16ms | +1295.84% |

### lemonSqueezySignWebhook

# Perf Report — lemonSqueezySignWebhook.serial

| metric | value |
|---|---|
| iterations | 200 |
| warmup | 5 |
| p10 | 0.0027ms |
| p50 | 0.0027ms |
| p95 | 0.0036ms |
| p99 | 0.0080ms |
| mean | 0.0030ms |
| stdev | 0.0012ms |
| min | 0.0026ms |
| max | 0.01ms |
| total | 0.60ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.0027ms | 0.0025ms | +0.00017ms | +6.64% |
| p50 | 0.0027ms | 0.0026ms | +0.00013ms | +4.84% |
| p95 | 0.0036ms | 0.0033ms | +0.00034ms | +10.30% |
| p99 | 0.0080ms | 0.0068ms | +0.0013ms | +18.54% |
| mean | 0.0030ms | 0.0028ms | +0.00017ms | +6.18% |
| min | 0.0026ms | 0.0024ms | +0.00021ms | +8.61% |
| max | 0.01ms | 0.01ms | +0.0029ms | +26.55% |
| total | 0.60ms | 0.56ms | +0.03ms | +6.18% |

### lemonSqueezyVerifyWebhook

# Perf Report — lemonSqueezyVerifyWebhook.serial

| metric | value |
|---|---|
| iterations | 200 |
| warmup | 5 |
| p10 | 0.0030ms |
| p50 | 0.0031ms |
| p95 | 0.0038ms |
| p99 | 0.0048ms |
| mean | 0.0032ms |
| stdev | 0.00051ms |
| min | 0.0030ms |
| max | 0.0085ms |
| total | 0.64ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.0030ms | 0.0034ms | -0.00034ms | -10.02% |
| p50 | 0.0031ms | 0.0035ms | -0.00042ms | -11.91% |
| p95 | 0.0038ms | 0.0043ms | -0.00058ms | -13.45% |
| p99 | 0.0048ms | 0.0062ms | -0.0013ms | -21.45% |
| mean | 0.0032ms | 0.0036ms | -0.00045ms | -12.29% |
| min | 0.0030ms | 0.0033ms | -0.00033ms | -10.12% |
| max | 0.0085ms | 0.0093ms | -0.00087ms | -9.38% |
| total | 0.64ms | 0.73ms | -0.09ms | -12.29% |

### dunningStart

# Perf Report — dunningStart.serial

| metric | value |
|---|---|
| iterations | 200 |
| warmup | 5 |
| p10 | 0.00025ms |
| p50 | 0.00029ms |
| p95 | 0.00038ms |
| p99 | 0.0035ms |
| mean | 0.00042ms |
| stdev | 0.00079ms |
| min | 0.00025ms |
| max | 0.0077ms |
| total | 0.08ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.00025ms | 0.00029ms | -0.000042ms | -14.38% |
| p50 | 0.00029ms | 0.00033ms | -0.000041ms | -12.31% |
| p95 | 0.00038ms | 0.00042ms | -0.000044ms | -10.52% |
| p99 | 0.0035ms | 0.0027ms | +0.00080ms | +29.11% |
| mean | 0.00042ms | 0.00055ms | -0.00013ms | -23.33% |
| min | 0.00025ms | 0.00025ms | 0.00ms | 0.00% |
| max | 0.0077ms | 0.03ms | -0.02ms | -75.36% |
| total | 0.08ms | 0.11ms | -0.03ms | -23.33% |

### retryStart

# Perf Report — retryStart.serial

| metric | value |
|---|---|
| iterations | 200 |
| warmup | 5 |
| p10 | 0.0022ms |
| p50 | 0.0024ms |
| p95 | 0.0030ms |
| p99 | 0.0054ms |
| mean | 0.0025ms |
| stdev | 0.00066ms |
| min | 0.0022ms |
| max | 0.0084ms |
| total | 0.50ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.0022ms | 0.0025ms | -0.00025ms | -10.13% |
| p50 | 0.0024ms | 0.0026ms | -0.00017ms | -6.50% |
| p95 | 0.0030ms | 0.0038ms | -0.00088ms | -22.86% |
| p99 | 0.0054ms | 0.02ms | -0.0097ms | -64.34% |
| mean | 0.0025ms | 0.0030ms | -0.00047ms | -15.79% |
| min | 0.0022ms | 0.0024ms | -0.00021ms | -8.80% |
| max | 0.0084ms | 0.02ms | -0.02ms | -65.12% |
| total | 0.50ms | 0.59ms | -0.09ms | -15.79% |

### retryBackoffMs

# Perf Report — retryBackoffMs.serial

| metric | value |
|---|---|
| iterations | 200 |
| warmup | 5 |
| p10 | 0.00021ms |
| p50 | 0.00021ms |
| p95 | 0.00029ms |
| p99 | 0.0015ms |
| mean | 0.00028ms |
| stdev | 0.00060ms |
| min | 0.00021ms |
| max | 0.0083ms |
| total | 0.06ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.00021ms | 0.00021ms | 0.00ms | 0.00% |
| p50 | 0.00021ms | 0.00021ms | 0.00ms | 0.00% |
| p95 | 0.00029ms | 0.00029ms | 0.00ms | 0.00% |
| p99 | 0.0015ms | 0.0021ms | -0.00062ms | -29.18% |
| mean | 0.00028ms | 0.00031ms | -0.000020ms | -6.63% |
| min | 0.00021ms | 0.00017ms | +0.000042ms | +25.30% |
| max | 0.0083ms | 0.01ms | -0.0022ms | -20.72% |
| total | 0.06ms | 0.06ms | -0.0040ms | -6.63% |

