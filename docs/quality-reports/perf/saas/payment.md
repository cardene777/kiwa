# Perf Suite — payment

Threshold source: [docs/quality/perf-thresholds.md](../../../quality/perf-thresholds)

測定系の分解能 = 0.00017ms (何もしない関数を同じ経路で呼んだ時の p10)。 回帰判定の絶対下限は既定でこの 2 倍 = 0.00033ms、 op ごとの実効値は下表の「下限」 列。

## Serial (concurrency = 1)

| op | p10 (回帰判定) | p95 (上限判定) | cap | 下限 | gate | regression |
|---|---|---|---|---|---|---|
| stripeSignWebhook | 0.0022ms | 0.0063ms | 10ms | 0.00033ms | PASS | stable — gate 無効 (regressionGate=false) |
| stripeVerifyWebhook | 0.0027ms | 0.0053ms | 10ms | 0.00033ms | PASS | stable — gate 無効 (regressionGate=false) |
| paddleSignWebhook | 0.0028ms | 0.0033ms | 10ms | 0.00033ms | PASS | stable — gate 無効 (regressionGate=false) |
| paddleVerifyWebhook | 0.0030ms | 0.0064ms | 10ms | 0.00033ms | PASS | stable (p10 -8% (閾値未満)、 p95 +56% (裾は実行間の振れ幅と区別できないため判定には使わない)) — gate 無効 (regressionGate=false) |
| lemonSqueezySignWebhook | 0.0023ms | 0.0030ms | 10ms | 0.00033ms | PASS | stable — gate 無効 (regressionGate=false) |
| lemonSqueezyVerifyWebhook | 0.0030ms | 0.0038ms | 10ms | 0.00033ms | PASS | stable — gate 無効 (regressionGate=false) |
| dunningStart | 0.00025ms | 0.00034ms | 5ms | 0.00033ms | PASS | stable (検知には +0.00033ms (baseline 比 +114%) 以上の悪化が必要) — gate 無効 (regressionGate=false) |
| retryStart | 0.0021ms | 0.0028ms | 5ms | 0.00033ms | PASS | stable — gate 無効 (regressionGate=false) |
| retryBackoffMs | 0.00017ms | 0.00021ms | 5ms | 0.00033ms | PASS | stable (差 0.000042ms が下限 0.00033ms 未満で判定を保留) — gate 無効 (regressionGate=false) |

## Concurrent p95 (concurrency = 10, 50 iter each)

| op | p95 | cap | gate |
|---|---|---|---|
| stripeSignWebhook | 0.04ms | 20ms | PASS |
| stripeVerifyWebhook | 0.05ms | 20ms | PASS |
| paddleSignWebhook | 0.05ms | 20ms | PASS |
| paddleVerifyWebhook | 0.04ms | 20ms | PASS |
| lemonSqueezySignWebhook | 0.04ms | 20ms | PASS |
| lemonSqueezyVerifyWebhook | 0.04ms | 20ms | PASS |
| dunningStart | 0.00ms | 10ms | PASS |
| retryStart | 0.04ms | 10ms | PASS |
| retryBackoffMs | 0.01ms | 10ms | PASS |

## Memory retention (200 iter, arrayBuffers axis is the gate; heap is informational)

| op | heapUsed Δ | arrayBuffers Δ | cap | gc exposed | verdict |
|---|---|---|---|---|---|
| stripeSignWebhook | -12128 B | 0 B | 102400 B | yes | PASS |
| stripeVerifyWebhook | -21920 B | 0 B | 102400 B | yes | PASS |
| paddleSignWebhook | 1928 B | 0 B | 102400 B | yes | PASS |
| paddleVerifyWebhook | 232 B | -98304 B | 102400 B | yes | PASS |
| lemonSqueezySignWebhook | 496 B | 0 B | 102400 B | yes | PASS |
| lemonSqueezyVerifyWebhook | 3336 B | 32768 B | 102400 B | yes | PASS |
| dunningStart | -104 B | 0 B | 102400 B | yes | PASS |
| retryStart | 32 B | 0 B | 102400 B | yes | PASS |
| retryBackoffMs | -466928 B | 0 B | 102400 B | yes | PASS |

## Detailed serial reports

### stripeSignWebhook

# Perf Report — stripeSignWebhook.serial

| metric | value |
|---|---|
| iterations | 200 |
| warmup | 5 |
| p10 | 0.0022ms |
| p50 | 0.0023ms |
| p95 | 0.0063ms |
| p99 | 0.02ms |
| mean | 0.0032ms |
| stdev | 0.0027ms |
| min | 0.0022ms |
| max | 0.02ms |
| total | 0.63ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.0022ms | 0.0025ms | -0.00025ms | -9.85% |
| p50 | 0.0023ms | 0.0031ms | -0.00075ms | -24.31% |
| p95 | 0.0063ms | 0.0059ms | +0.00039ms | +6.59% |
| p99 | 0.02ms | 0.01ms | +0.0012ms | +8.61% |
| mean | 0.0032ms | 0.0036ms | -0.00043ms | -11.90% |
| min | 0.0022ms | 0.0024ms | -0.00021ms | -8.65% |
| max | 0.02ms | 0.03ms | -0.0048ms | -16.18% |
| total | 0.63ms | 0.72ms | -0.09ms | -11.90% |

### stripeVerifyWebhook

# Perf Report — stripeVerifyWebhook.serial

| metric | value |
|---|---|
| iterations | 200 |
| warmup | 5 |
| p10 | 0.0027ms |
| p50 | 0.0027ms |
| p95 | 0.0053ms |
| p99 | 0.01ms |
| mean | 0.0032ms |
| stdev | 0.0017ms |
| min | 0.0026ms |
| max | 0.02ms |
| total | 0.64ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.0027ms | 0.0030ms | -0.00029ms | -9.84% |
| p50 | 0.0027ms | 0.0030ms | -0.00029ms | -9.60% |
| p95 | 0.0053ms | 0.0050ms | +0.00028ms | +5.65% |
| p99 | 0.01ms | 0.01ms | +0.00011ms | +1.08% |
| mean | 0.0032ms | 0.0034ms | -0.00024ms | -7.13% |
| min | 0.0026ms | 0.0029ms | -0.00029ms | -10.16% |
| max | 0.02ms | 0.02ms | -0.0010ms | -5.69% |
| total | 0.64ms | 0.69ms | -0.05ms | -7.13% |

### paddleSignWebhook

# Perf Report — paddleSignWebhook.serial

| metric | value |
|---|---|
| iterations | 200 |
| warmup | 5 |
| p10 | 0.0028ms |
| p50 | 0.0029ms |
| p95 | 0.0033ms |
| p99 | 0.0076ms |
| mean | 0.0031ms |
| stdev | 0.00093ms |
| min | 0.0027ms |
| max | 0.01ms |
| total | 0.61ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.0028ms | 0.0031ms | -0.00025ms | -8.11% |
| p50 | 0.0029ms | 0.0032ms | -0.00033ms | -10.38% |
| p95 | 0.0033ms | 0.0051ms | -0.0018ms | -35.84% |
| p99 | 0.0076ms | 0.02ms | -0.02ms | -66.39% |
| mean | 0.0031ms | 0.0039ms | -0.00078ms | -20.26% |
| min | 0.0027ms | 0.0030ms | -0.00025ms | -8.33% |
| max | 0.01ms | 0.04ms | -0.03ms | -72.80% |
| total | 0.61ms | 0.77ms | -0.16ms | -20.26% |

### paddleVerifyWebhook

# Perf Report — paddleVerifyWebhook.serial

| metric | value |
|---|---|
| iterations | 200 |
| warmup | 5 |
| p10 | 0.0030ms |
| p50 | 0.0031ms |
| p95 | 0.0064ms |
| p99 | 0.02ms |
| mean | 0.0045ms |
| stdev | 0.0092ms |
| min | 0.0029ms |
| max | 0.11ms |
| total | 0.90ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.0030ms | 0.0032ms | -0.00025ms | -7.69% |
| p50 | 0.0031ms | 0.0034ms | -0.00023ms | -6.84% |
| p95 | 0.0064ms | 0.0041ms | +0.0023ms | +55.86% |
| p99 | 0.02ms | 0.0061ms | +0.02ms | +296.42% |
| mean | 0.0045ms | 0.0035ms | +0.00099ms | +27.91% |
| min | 0.0029ms | 0.0031ms | -0.00021ms | -6.69% |
| max | 0.11ms | 0.01ms | +0.10ms | +721.75% |
| total | 0.90ms | 0.71ms | +0.20ms | +27.91% |

### lemonSqueezySignWebhook

# Perf Report — lemonSqueezySignWebhook.serial

| metric | value |
|---|---|
| iterations | 200 |
| warmup | 5 |
| p10 | 0.0023ms |
| p50 | 0.0025ms |
| p95 | 0.0030ms |
| p99 | 0.0081ms |
| mean | 0.0027ms |
| stdev | 0.0011ms |
| min | 0.0023ms |
| max | 0.01ms |
| total | 0.53ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.0023ms | 0.0025ms | -0.00017ms | -6.64% |
| p50 | 0.0025ms | 0.0026ms | -0.00013ms | -4.88% |
| p95 | 0.0030ms | 0.0033ms | -0.00021ms | -6.46% |
| p99 | 0.0081ms | 0.0068ms | +0.0013ms | +19.49% |
| mean | 0.0027ms | 0.0028ms | -0.00015ms | -5.39% |
| min | 0.0023ms | 0.0024ms | -0.00012ms | -5.17% |
| max | 0.01ms | 0.01ms | +0.00042ms | +3.85% |
| total | 0.53ms | 0.56ms | -0.03ms | -5.39% |

### lemonSqueezyVerifyWebhook

# Perf Report — lemonSqueezyVerifyWebhook.serial

| metric | value |
|---|---|
| iterations | 200 |
| warmup | 5 |
| p10 | 0.0030ms |
| p50 | 0.0030ms |
| p95 | 0.0038ms |
| p99 | 0.0061ms |
| mean | 0.0032ms |
| stdev | 0.00076ms |
| min | 0.0029ms |
| max | 0.01ms |
| total | 0.64ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.0030ms | 0.0034ms | -0.00042ms | -12.36% |
| p50 | 0.0030ms | 0.0035ms | -0.00046ms | -13.09% |
| p95 | 0.0038ms | 0.0043ms | -0.00054ms | -12.48% |
| p99 | 0.0061ms | 0.0062ms | -0.000047ms | -0.76% |
| mean | 0.0032ms | 0.0036ms | -0.00046ms | -12.51% |
| min | 0.0029ms | 0.0033ms | -0.00042ms | -12.64% |
| max | 0.01ms | 0.0093ms | +0.0030ms | +32.59% |
| total | 0.64ms | 0.73ms | -0.09ms | -12.51% |

### dunningStart

# Perf Report — dunningStart.serial

| metric | value |
|---|---|
| iterations | 200 |
| warmup | 5 |
| p10 | 0.00025ms |
| p50 | 0.00029ms |
| p95 | 0.00034ms |
| p99 | 0.0029ms |
| mean | 0.00040ms |
| stdev | 0.00081ms |
| min | 0.00021ms |
| max | 0.0086ms |
| total | 0.08ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.00025ms | 0.00029ms | -0.000042ms | -14.38% |
| p50 | 0.00029ms | 0.00033ms | -0.000042ms | -12.61% |
| p95 | 0.00034ms | 0.00042ms | -0.000079ms | -18.83% |
| p99 | 0.0029ms | 0.0027ms | +0.00018ms | +6.41% |
| mean | 0.00040ms | 0.00055ms | -0.00015ms | -27.96% |
| min | 0.00021ms | 0.00025ms | -0.000042ms | -16.80% |
| max | 0.0086ms | 0.03ms | -0.02ms | -72.57% |
| total | 0.08ms | 0.11ms | -0.03ms | -27.96% |

### retryStart

# Perf Report — retryStart.serial

| metric | value |
|---|---|
| iterations | 200 |
| warmup | 5 |
| p10 | 0.0021ms |
| p50 | 0.0022ms |
| p95 | 0.0028ms |
| p99 | 0.0084ms |
| mean | 0.0024ms |
| stdev | 0.0012ms |
| min | 0.0021ms |
| max | 0.01ms |
| total | 0.48ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.0021ms | 0.0025ms | -0.00034ms | -13.71% |
| p50 | 0.0022ms | 0.0026ms | -0.00042ms | -16.14% |
| p95 | 0.0028ms | 0.0038ms | -0.0010ms | -26.12% |
| p99 | 0.0084ms | 0.02ms | -0.0066ms | -43.84% |
| mean | 0.0024ms | 0.0030ms | -0.00057ms | -19.07% |
| min | 0.0021ms | 0.0024ms | -0.00029ms | -12.29% |
| max | 0.01ms | 0.02ms | -0.01ms | -41.45% |
| total | 0.48ms | 0.59ms | -0.11ms | -19.07% |

### retryBackoffMs

# Perf Report — retryBackoffMs.serial

| metric | value |
|---|---|
| iterations | 200 |
| warmup | 5 |
| p10 | 0.00017ms |
| p50 | 0.00017ms |
| p95 | 0.00021ms |
| p99 | 0.0015ms |
| mean | 0.00024ms |
| stdev | 0.00048ms |
| min | 0.00013ms |
| max | 0.0063ms |
| total | 0.05ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.00017ms | 0.00021ms | -0.000042ms | -20.19% |
| p50 | 0.00017ms | 0.00021ms | -0.000042ms | -20.10% |
| p95 | 0.00021ms | 0.00029ms | -0.000079ms | -27.00% |
| p99 | 0.0015ms | 0.0021ms | -0.00062ms | -28.94% |
| mean | 0.00024ms | 0.00031ms | -0.000064ms | -21.12% |
| min | 0.00013ms | 0.00017ms | -0.000041ms | -24.70% |
| max | 0.0063ms | 0.01ms | -0.0041ms | -39.45% |
| total | 0.05ms | 0.06ms | -0.01ms | -21.12% |

