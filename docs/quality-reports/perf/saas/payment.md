# Perf Suite — payment

Threshold source: [docs/quality/perf-thresholds.md](../../../quality/perf-thresholds)

測定系の分解能 = 0.00017ms (何もしない関数を同じ経路で呼んだ時の p10)。 回帰判定の絶対下限は既定でこの 2 倍 = 0.00033ms、 op ごとの実効値は下表の「下限」 列。

## Serial (concurrency = 1)

| op | p10 (回帰判定) | p95 (上限判定) | cap | 下限 | gate | regression |
|---|---|---|---|---|---|---|
| stripeSignWebhook | 0.0022ms | 0.0060ms | 10ms | 0.00033ms | PASS | stable — gate 無効 (regressionGate=false) |
| stripeVerifyWebhook | 0.0026ms | 0.0044ms | 10ms | 0.00033ms | PASS | stable — gate 無効 (regressionGate=false) |
| paddleSignWebhook | 0.0027ms | 0.0056ms | 10ms | 0.00033ms | PASS | stable — gate 無効 (regressionGate=false) |
| paddleVerifyWebhook | 0.0028ms | 0.0039ms | 10ms | 0.00033ms | PASS | stable — gate 無効 (regressionGate=false) |
| lemonSqueezySignWebhook | 0.0022ms | 0.0028ms | 10ms | 0.00033ms | PASS | stable — gate 無効 (regressionGate=false) |
| lemonSqueezyVerifyWebhook | 0.0027ms | 0.0037ms | 10ms | 0.00033ms | PASS | stable — gate 無効 (regressionGate=false) |
| dunningStart | 0.00025ms | 0.00034ms | 5ms | 0.00033ms | PASS | stable (検知には +0.00033ms (baseline 比 +114%) 以上の悪化が必要) — gate 無効 (regressionGate=false) |
| retryStart | 0.0020ms | 0.0031ms | 5ms | 0.00033ms | PASS | stable — gate 無効 (regressionGate=false) |
| retryBackoffMs | 0.00017ms | 0.00029ms | 5ms | 0.00033ms | PASS | stable (差 0.000042ms が下限 0.00033ms 未満で判定を保留) — gate 無効 (regressionGate=false) |

## Concurrent p95 (concurrency = 10, 50 iter each)

| op | p95 | cap | gate |
|---|---|---|---|
| stripeSignWebhook | 0.04ms | 20ms | PASS |
| stripeVerifyWebhook | 0.04ms | 20ms | PASS |
| paddleSignWebhook | 0.04ms | 20ms | PASS |
| paddleVerifyWebhook | 0.04ms | 20ms | PASS |
| lemonSqueezySignWebhook | 0.03ms | 20ms | PASS |
| lemonSqueezyVerifyWebhook | 0.04ms | 20ms | PASS |
| dunningStart | 0.01ms | 10ms | PASS |
| retryStart | 0.03ms | 10ms | PASS |
| retryBackoffMs | 0.01ms | 10ms | PASS |

## Memory retention (200 iter, arrayBuffers axis is the gate; heap is informational)

| op | heapUsed Δ | arrayBuffers Δ | cap | gc exposed | verdict |
|---|---|---|---|---|---|
| stripeSignWebhook | -15432 B | 0 B | 102400 B | yes | PASS |
| stripeVerifyWebhook | -22072 B | 0 B | 102400 B | yes | PASS |
| paddleSignWebhook | 2376 B | 0 B | 102400 B | yes | PASS |
| paddleVerifyWebhook | 712 B | 0 B | 102400 B | yes | PASS |
| lemonSqueezySignWebhook | 944 B | 0 B | 102400 B | yes | PASS |
| lemonSqueezyVerifyWebhook | 2848 B | 0 B | 102400 B | yes | PASS |
| dunningStart | 1352 B | 0 B | 102400 B | yes | PASS |
| retryStart | -416 B | 0 B | 102400 B | yes | PASS |
| retryBackoffMs | -452888 B | 0 B | 102400 B | yes | PASS |

## Detailed serial reports

### stripeSignWebhook

# Perf Report — stripeSignWebhook.serial

| metric | value |
|---|---|
| iterations | 200 |
| warmup | 5 |
| p10 | 0.0022ms |
| p50 | 0.0024ms |
| p95 | 0.0060ms |
| p99 | 0.01ms |
| mean | 0.0031ms |
| stdev | 0.0024ms |
| min | 0.0022ms |
| max | 0.03ms |
| total | 0.61ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.0022ms | 0.0025ms | -0.00029ms | -11.53% |
| p50 | 0.0024ms | 0.0031ms | -0.00071ms | -22.98% |
| p95 | 0.0060ms | 0.0059ms | +0.00013ms | +2.13% |
| p99 | 0.01ms | 0.01ms | -0.0022ms | -14.98% |
| mean | 0.0031ms | 0.0036ms | -0.00054ms | -14.95% |
| min | 0.0022ms | 0.0024ms | -0.00025ms | -10.38% |
| max | 0.03ms | 0.03ms | -0.0032ms | -10.83% |
| total | 0.61ms | 0.72ms | -0.11ms | -14.95% |

### stripeVerifyWebhook

# Perf Report — stripeVerifyWebhook.serial

| metric | value |
|---|---|
| iterations | 200 |
| warmup | 5 |
| p10 | 0.0026ms |
| p50 | 0.0027ms |
| p95 | 0.0044ms |
| p99 | 0.0094ms |
| mean | 0.0031ms |
| stdev | 0.0012ms |
| min | 0.0026ms |
| max | 0.01ms |
| total | 0.61ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.0026ms | 0.0030ms | -0.00033ms | -11.26% |
| p50 | 0.0027ms | 0.0030ms | -0.00033ms | -10.95% |
| p95 | 0.0044ms | 0.0050ms | -0.00056ms | -11.33% |
| p99 | 0.0094ms | 0.01ms | -0.00078ms | -7.66% |
| mean | 0.0031ms | 0.0034ms | -0.00037ms | -10.88% |
| min | 0.0026ms | 0.0029ms | -0.00029ms | -10.16% |
| max | 0.01ms | 0.02ms | -0.0054ms | -29.38% |
| total | 0.61ms | 0.69ms | -0.07ms | -10.88% |

### paddleSignWebhook

# Perf Report — paddleSignWebhook.serial

| metric | value |
|---|---|
| iterations | 200 |
| warmup | 5 |
| p10 | 0.0027ms |
| p50 | 0.0028ms |
| p95 | 0.0056ms |
| p99 | 0.0075ms |
| mean | 0.0031ms |
| stdev | 0.0012ms |
| min | 0.0027ms |
| max | 0.01ms |
| total | 0.62ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.0027ms | 0.0031ms | -0.00033ms | -10.80% |
| p50 | 0.0028ms | 0.0032ms | -0.00037ms | -11.69% |
| p95 | 0.0056ms | 0.0051ms | +0.00047ms | +9.13% |
| p99 | 0.0075ms | 0.02ms | -0.02ms | -66.89% |
| mean | 0.0031ms | 0.0039ms | -0.00074ms | -19.16% |
| min | 0.0027ms | 0.0030ms | -0.00033ms | -11.10% |
| max | 0.01ms | 0.04ms | -0.03ms | -68.77% |
| total | 0.62ms | 0.77ms | -0.15ms | -19.16% |

### paddleVerifyWebhook

# Perf Report — paddleVerifyWebhook.serial

| metric | value |
|---|---|
| iterations | 200 |
| warmup | 5 |
| p10 | 0.0028ms |
| p50 | 0.0029ms |
| p95 | 0.0039ms |
| p99 | 0.0056ms |
| mean | 0.0031ms |
| stdev | 0.00069ms |
| min | 0.0028ms |
| max | 0.0091ms |
| total | 0.61ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.0028ms | 0.0032ms | -0.00046ms | -14.09% |
| p50 | 0.0029ms | 0.0034ms | -0.00048ms | -14.29% |
| p95 | 0.0039ms | 0.0041ms | -0.00022ms | -5.33% |
| p99 | 0.0056ms | 0.0061ms | -0.00046ms | -7.58% |
| mean | 0.0031ms | 0.0035ms | -0.00048ms | -13.70% |
| min | 0.0028ms | 0.0031ms | -0.00033ms | -10.69% |
| max | 0.0091ms | 0.01ms | -0.0049ms | -34.93% |
| total | 0.61ms | 0.71ms | -0.10ms | -13.70% |

### lemonSqueezySignWebhook

# Perf Report — lemonSqueezySignWebhook.serial

| metric | value |
|---|---|
| iterations | 200 |
| warmup | 5 |
| p10 | 0.0022ms |
| p50 | 0.0022ms |
| p95 | 0.0028ms |
| p99 | 0.0074ms |
| mean | 0.0025ms |
| stdev | 0.0010ms |
| min | 0.0021ms |
| max | 0.01ms |
| total | 0.49ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.0022ms | 0.0025ms | -0.00033ms | -13.36% |
| p50 | 0.0022ms | 0.0026ms | -0.00033ms | -12.93% |
| p95 | 0.0028ms | 0.0033ms | -0.00042ms | -12.88% |
| p99 | 0.0074ms | 0.0068ms | +0.00058ms | +8.53% |
| mean | 0.0025ms | 0.0028ms | -0.00035ms | -12.47% |
| min | 0.0021ms | 0.0024ms | -0.00033ms | -13.78% |
| max | 0.01ms | 0.01ms | -0.00021ms | -1.92% |
| total | 0.49ms | 0.56ms | -0.07ms | -12.47% |

### lemonSqueezyVerifyWebhook

# Perf Report — lemonSqueezyVerifyWebhook.serial

| metric | value |
|---|---|
| iterations | 200 |
| warmup | 5 |
| p10 | 0.0027ms |
| p50 | 0.0028ms |
| p95 | 0.0037ms |
| p99 | 0.0060ms |
| mean | 0.0030ms |
| stdev | 0.00057ms |
| min | 0.0027ms |
| max | 0.0067ms |
| total | 0.60ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.0027ms | 0.0034ms | -0.00063ms | -18.52% |
| p50 | 0.0028ms | 0.0035ms | -0.00067ms | -19.06% |
| p95 | 0.0037ms | 0.0043ms | -0.00067ms | -15.36% |
| p99 | 0.0060ms | 0.0062ms | -0.00017ms | -2.71% |
| mean | 0.0030ms | 0.0036ms | -0.00065ms | -17.89% |
| min | 0.0027ms | 0.0033ms | -0.00058ms | -17.71% |
| max | 0.0067ms | 0.0093ms | -0.0026ms | -28.13% |
| total | 0.60ms | 0.73ms | -0.13ms | -17.89% |

### dunningStart

# Perf Report — dunningStart.serial

| metric | value |
|---|---|
| iterations | 200 |
| warmup | 5 |
| p10 | 0.00025ms |
| p50 | 0.00025ms |
| p95 | 0.00034ms |
| p99 | 0.0032ms |
| mean | 0.00038ms |
| stdev | 0.00077ms |
| min | 0.00021ms |
| max | 0.0090ms |
| total | 0.08ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.00025ms | 0.00029ms | -0.000042ms | -14.38% |
| p50 | 0.00025ms | 0.00033ms | -0.000083ms | -24.92% |
| p95 | 0.00034ms | 0.00042ms | -0.000084ms | -20.04% |
| p99 | 0.0032ms | 0.0027ms | +0.00049ms | +17.88% |
| mean | 0.00038ms | 0.00055ms | -0.00017ms | -31.22% |
| min | 0.00021ms | 0.00025ms | -0.000042ms | -16.80% |
| max | 0.0090ms | 0.03ms | -0.02ms | -71.10% |
| total | 0.08ms | 0.11ms | -0.03ms | -31.22% |

### retryStart

# Perf Report — retryStart.serial

| metric | value |
|---|---|
| iterations | 200 |
| warmup | 5 |
| p10 | 0.0020ms |
| p50 | 0.0021ms |
| p95 | 0.0031ms |
| p99 | 0.0076ms |
| mean | 0.0024ms |
| stdev | 0.0011ms |
| min | 0.0020ms |
| max | 0.01ms |
| total | 0.48ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.0020ms | 0.0025ms | -0.00042ms | -16.92% |
| p50 | 0.0021ms | 0.0026ms | -0.00046ms | -17.76% |
| p95 | 0.0031ms | 0.0038ms | -0.00078ms | -20.29% |
| p99 | 0.0076ms | 0.02ms | -0.0074ms | -49.40% |
| mean | 0.0024ms | 0.0030ms | -0.00059ms | -19.71% |
| min | 0.0020ms | 0.0024ms | -0.00042ms | -17.56% |
| max | 0.01ms | 0.02ms | -0.01ms | -48.19% |
| total | 0.48ms | 0.59ms | -0.12ms | -19.71% |

### retryBackoffMs

# Perf Report — retryBackoffMs.serial

| metric | value |
|---|---|
| iterations | 200 |
| warmup | 5 |
| p10 | 0.00017ms |
| p50 | 0.00017ms |
| p95 | 0.00029ms |
| p99 | 0.0032ms |
| mean | 0.00031ms |
| stdev | 0.00097ms |
| min | 0.00017ms |
| max | 0.01ms |
| total | 0.06ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.00017ms | 0.00021ms | -0.000042ms | -20.19% |
| p50 | 0.00017ms | 0.00021ms | -0.000042ms | -20.10% |
| p95 | 0.00029ms | 0.00029ms | 0.00ms | 0.00% |
| p99 | 0.0032ms | 0.0021ms | +0.0011ms | +50.09% |
| mean | 0.00031ms | 0.00031ms | +0.0000031ms | +1.01% |
| min | 0.00017ms | 0.00017ms | 0.00ms | 0.00% |
| max | 0.01ms | 0.01ms | +0.0017ms | +15.93% |
| total | 0.06ms | 0.06ms | +0.00062ms | +1.01% |

