# Perf Suite — payment

Threshold source: [docs/quality/perf-thresholds.md](../../../quality/perf-thresholds)

測定系の分解能 = 0.00017ms (何もしない関数を同じ経路で呼んだ時の p10)。 回帰判定の絶対下限は既定でこの 2 倍 = 0.00033ms、 op ごとの実効値は下表の「下限」 列。

## Serial (concurrency = 1)

| op | p10 (回帰判定) | p95 (上限判定) | cap | 下限 | gate | regression |
|---|---|---|---|---|---|---|
| stripeSignWebhook | 0.0022ms | 0.0062ms | 10ms | 0.00033ms | PASS | stable — gate 無効 (regressionGate=false) |
| stripeVerifyWebhook | 0.0027ms | 0.0044ms | 10ms | 0.00033ms | PASS | stable — gate 無効 (regressionGate=false) |
| paddleSignWebhook | 0.0029ms | 0.0035ms | 10ms | 0.00033ms | PASS | stable — gate 無効 (regressionGate=false) |
| paddleVerifyWebhook | 0.0030ms | 0.0039ms | 10ms | 0.00033ms | PASS | stable — gate 無効 (regressionGate=false) |
| lemonSqueezySignWebhook | 0.0022ms | 0.0031ms | 10ms | 0.00033ms | PASS | stable — gate 無効 (regressionGate=false) |
| lemonSqueezyVerifyWebhook | 0.0030ms | 0.0038ms | 10ms | 0.00033ms | PASS | stable — gate 無効 (regressionGate=false) |
| dunningStart | 0.00025ms | 0.00038ms | 5ms | 0.00033ms | PASS | stable (検知には +0.00033ms (baseline 比 +114%) 以上の悪化が必要) — gate 無効 (regressionGate=false) |
| retryStart | 0.0022ms | 0.0029ms | 5ms | 0.00033ms | PASS | stable — gate 無効 (regressionGate=false) |
| retryBackoffMs | 0.00017ms | 0.00025ms | 5ms | 0.00033ms | PASS | stable (差 0.000042ms が下限 0.00033ms 未満で判定を保留) — gate 無効 (regressionGate=false) |

## Concurrent p95 (concurrency = 10, 50 iter each)

| op | p95 | cap | gate |
|---|---|---|---|
| stripeSignWebhook | 0.04ms | 20ms | PASS |
| stripeVerifyWebhook | 0.04ms | 20ms | PASS |
| paddleSignWebhook | 0.04ms | 20ms | PASS |
| paddleVerifyWebhook | 0.04ms | 20ms | PASS |
| lemonSqueezySignWebhook | 0.03ms | 20ms | PASS |
| lemonSqueezyVerifyWebhook | 0.05ms | 20ms | PASS |
| dunningStart | 0.00ms | 10ms | PASS |
| retryStart | 0.04ms | 10ms | PASS |
| retryBackoffMs | 0.01ms | 10ms | PASS |

## Memory retention (200 iter, arrayBuffers axis is the gate; heap is informational)

| op | heapUsed Δ | arrayBuffers Δ | cap | gc exposed | verdict |
|---|---|---|---|---|---|
| stripeSignWebhook | -14536 B | 0 B | 102400 B | yes | PASS |
| stripeVerifyWebhook | -21624 B | 0 B | 102400 B | yes | PASS |
| paddleSignWebhook | 2376 B | 0 B | 102400 B | yes | PASS |
| paddleVerifyWebhook | 232 B | 0 B | 102400 B | yes | PASS |
| lemonSqueezySignWebhook | 944 B | 0 B | 102400 B | yes | PASS |
| lemonSqueezyVerifyWebhook | 848 B | -114688 B | 102400 B | yes | PASS |
| dunningStart | 1432 B | 0 B | 102400 B | yes | PASS |
| retryStart | -416 B | 0 B | 102400 B | yes | PASS |
| retryBackoffMs | -456272 B | 0 B | 102400 B | yes | PASS |

## Detailed serial reports

### stripeSignWebhook

# Perf Report — stripeSignWebhook.serial

| metric | value |
|---|---|
| iterations | 200 |
| warmup | 5 |
| p10 | 0.0022ms |
| p50 | 0.0022ms |
| p95 | 0.0062ms |
| p99 | 0.01ms |
| mean | 0.0030ms |
| stdev | 0.0024ms |
| min | 0.0021ms |
| max | 0.03ms |
| total | 0.60ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.0022ms | 0.0025ms | -0.00033ms | -13.18% |
| p50 | 0.0022ms | 0.0031ms | -0.00083ms | -27.03% |
| p95 | 0.0062ms | 0.0059ms | +0.00034ms | +5.79% |
| p99 | 0.01ms | 0.01ms | -0.0025ms | -17.05% |
| mean | 0.0030ms | 0.0036ms | -0.00060ms | -16.70% |
| min | 0.0021ms | 0.0024ms | -0.00029ms | -12.08% |
| max | 0.03ms | 0.03ms | +0.00046ms | +1.55% |
| total | 0.60ms | 0.72ms | -0.12ms | -16.70% |

### stripeVerifyWebhook

# Perf Report — stripeVerifyWebhook.serial

| metric | value |
|---|---|
| iterations | 200 |
| warmup | 5 |
| p10 | 0.0027ms |
| p50 | 0.0028ms |
| p95 | 0.0044ms |
| p99 | 0.01ms |
| mean | 0.0031ms |
| stdev | 0.0012ms |
| min | 0.0027ms |
| max | 0.01ms |
| total | 0.63ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.0027ms | 0.0030ms | -0.00021ms | -7.03% |
| p50 | 0.0028ms | 0.0030ms | -0.00021ms | -6.84% |
| p95 | 0.0044ms | 0.0050ms | -0.00053ms | -10.74% |
| p99 | 0.01ms | 0.01ms | +0.000093ms | +0.91% |
| mean | 0.0031ms | 0.0034ms | -0.00029ms | -8.45% |
| min | 0.0027ms | 0.0029ms | -0.00021ms | -7.27% |
| max | 0.01ms | 0.02ms | -0.0065ms | -35.54% |
| total | 0.63ms | 0.69ms | -0.06ms | -8.45% |

### paddleSignWebhook

# Perf Report — paddleSignWebhook.serial

| metric | value |
|---|---|
| iterations | 200 |
| warmup | 5 |
| p10 | 0.0029ms |
| p50 | 0.0030ms |
| p95 | 0.0035ms |
| p99 | 0.0082ms |
| mean | 0.0032ms |
| stdev | 0.0013ms |
| min | 0.0028ms |
| max | 0.02ms |
| total | 0.64ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.0029ms | 0.0031ms | -0.00021ms | -6.75% |
| p50 | 0.0030ms | 0.0032ms | -0.00025ms | -7.76% |
| p95 | 0.0035ms | 0.0051ms | -0.0016ms | -30.91% |
| p99 | 0.0082ms | 0.02ms | -0.01ms | -63.79% |
| mean | 0.0032ms | 0.0039ms | -0.00065ms | -16.84% |
| min | 0.0028ms | 0.0030ms | -0.00021ms | -6.97% |
| max | 0.02ms | 0.04ms | -0.02ms | -57.19% |
| total | 0.64ms | 0.77ms | -0.13ms | -16.84% |

### paddleVerifyWebhook

# Perf Report — paddleVerifyWebhook.serial

| metric | value |
|---|---|
| iterations | 200 |
| warmup | 5 |
| p10 | 0.0030ms |
| p50 | 0.0030ms |
| p95 | 0.0039ms |
| p99 | 0.0058ms |
| mean | 0.0032ms |
| stdev | 0.00094ms |
| min | 0.0029ms |
| max | 0.01ms |
| total | 0.64ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.0030ms | 0.0032ms | -0.00029ms | -8.98% |
| p50 | 0.0030ms | 0.0034ms | -0.00031ms | -9.32% |
| p95 | 0.0039ms | 0.0041ms | -0.00017ms | -4.26% |
| p99 | 0.0058ms | 0.0061ms | -0.00027ms | -4.41% |
| mean | 0.0032ms | 0.0035ms | -0.00031ms | -8.86% |
| min | 0.0029ms | 0.0031ms | -0.00025ms | -8.00% |
| max | 0.01ms | 0.01ms | -0.0014ms | -10.15% |
| total | 0.64ms | 0.71ms | -0.06ms | -8.86% |

### lemonSqueezySignWebhook

# Perf Report — lemonSqueezySignWebhook.serial

| metric | value |
|---|---|
| iterations | 200 |
| warmup | 5 |
| p10 | 0.0022ms |
| p50 | 0.0023ms |
| p95 | 0.0031ms |
| p99 | 0.0081ms |
| mean | 0.0026ms |
| stdev | 0.0011ms |
| min | 0.0022ms |
| max | 0.01ms |
| total | 0.52ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.0022ms | 0.0025ms | -0.00025ms | -10.00% |
| p50 | 0.0023ms | 0.0026ms | -0.00025ms | -9.71% |
| p95 | 0.0031ms | 0.0033ms | -0.00016ms | -5.00% |
| p99 | 0.0081ms | 0.0068ms | +0.0014ms | +20.07% |
| mean | 0.0026ms | 0.0028ms | -0.00022ms | -7.85% |
| min | 0.0022ms | 0.0024ms | -0.00025ms | -10.34% |
| max | 0.01ms | 0.01ms | +0.00058ms | +5.39% |
| total | 0.52ms | 0.56ms | -0.04ms | -7.85% |

### lemonSqueezyVerifyWebhook

# Perf Report — lemonSqueezyVerifyWebhook.serial

| metric | value |
|---|---|
| iterations | 200 |
| warmup | 5 |
| p10 | 0.0030ms |
| p50 | 0.0031ms |
| p95 | 0.0038ms |
| p99 | 0.0056ms |
| mean | 0.0032ms |
| stdev | 0.00059ms |
| min | 0.0029ms |
| max | 0.0093ms |
| total | 0.64ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.0030ms | 0.0034ms | -0.00042ms | -12.33% |
| p50 | 0.0031ms | 0.0035ms | -0.00042ms | -11.89% |
| p95 | 0.0038ms | 0.0043ms | -0.00054ms | -12.48% |
| p99 | 0.0056ms | 0.0062ms | -0.00054ms | -8.79% |
| mean | 0.0032ms | 0.0036ms | -0.00043ms | -11.71% |
| min | 0.0029ms | 0.0033ms | -0.00037ms | -11.39% |
| max | 0.0093ms | 0.0093ms | 0.00ms | 0.00% |
| total | 0.64ms | 0.73ms | -0.09ms | -11.71% |

### dunningStart

# Perf Report — dunningStart.serial

| metric | value |
|---|---|
| iterations | 200 |
| warmup | 5 |
| p10 | 0.00025ms |
| p50 | 0.00029ms |
| p95 | 0.00038ms |
| p99 | 0.0024ms |
| mean | 0.00038ms |
| stdev | 0.00078ms |
| min | 0.00021ms |
| max | 0.0091ms |
| total | 0.08ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.00025ms | 0.00029ms | -0.000042ms | -14.38% |
| p50 | 0.00029ms | 0.00033ms | -0.000042ms | -12.61% |
| p95 | 0.00038ms | 0.00042ms | -0.000044ms | -10.52% |
| p99 | 0.0024ms | 0.0027ms | -0.00037ms | -13.40% |
| mean | 0.00038ms | 0.00055ms | -0.00017ms | -30.77% |
| min | 0.00021ms | 0.00025ms | -0.000042ms | -16.80% |
| max | 0.0091ms | 0.03ms | -0.02ms | -70.97% |
| total | 0.08ms | 0.11ms | -0.03ms | -30.77% |

### retryStart

# Perf Report — retryStart.serial

| metric | value |
|---|---|
| iterations | 200 |
| warmup | 5 |
| p10 | 0.0022ms |
| p50 | 0.0022ms |
| p95 | 0.0029ms |
| p99 | 0.0082ms |
| mean | 0.0025ms |
| stdev | 0.0011ms |
| min | 0.0021ms |
| max | 0.01ms |
| total | 0.49ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.0022ms | 0.0025ms | -0.00029ms | -11.84% |
| p50 | 0.0022ms | 0.0026ms | -0.00033ms | -12.93% |
| p95 | 0.0029ms | 0.0038ms | -0.00096ms | -25.02% |
| p99 | 0.0082ms | 0.02ms | -0.0068ms | -45.56% |
| mean | 0.0025ms | 0.0030ms | -0.00051ms | -17.01% |
| min | 0.0021ms | 0.0024ms | -0.00025ms | -10.53% |
| max | 0.01ms | 0.02ms | -0.01ms | -42.66% |
| total | 0.49ms | 0.59ms | -0.10ms | -17.01% |

### retryBackoffMs

# Perf Report — retryBackoffMs.serial

| metric | value |
|---|---|
| iterations | 200 |
| warmup | 5 |
| p10 | 0.00017ms |
| p50 | 0.00021ms |
| p95 | 0.00025ms |
| p99 | 0.0013ms |
| mean | 0.00024ms |
| stdev | 0.00042ms |
| min | 0.00017ms |
| max | 0.0056ms |
| total | 0.05ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.00017ms | 0.00021ms | -0.000042ms | -20.19% |
| p50 | 0.00021ms | 0.00021ms | -0.0000010ms | -0.48% |
| p95 | 0.00025ms | 0.00029ms | -0.000040ms | -13.66% |
| p99 | 0.0013ms | 0.0021ms | -0.00087ms | -40.67% |
| mean | 0.00024ms | 0.00031ms | -0.000062ms | -20.36% |
| min | 0.00017ms | 0.00017ms | 0.00ms | 0.00% |
| max | 0.0056ms | 0.01ms | -0.0049ms | -46.62% |
| total | 0.05ms | 0.06ms | -0.01ms | -20.36% |

