# Perf Suite — payment

Threshold source: [docs/quality/perf-thresholds.md](../../../quality/perf-thresholds)

測定系の分解能 = 0.00017ms (何もしない関数を同じ経路で呼んだ時の p10)。 回帰判定の絶対下限は既定でこの 2 倍 = 0.00033ms、 op ごとの実効値は下表の「下限」 列。

## Serial (concurrency = 1)

| op | p10 (回帰判定) | p95 (上限判定) | cap | 下限 | gate | regression |
|---|---|---|---|---|---|---|
| stripeSignWebhook | 0.0022ms | 0.0064ms | 10ms | 0.00033ms | PASS | stable — gate 無効 (regressionGate=false) |
| stripeVerifyWebhook | 0.0028ms | 0.0065ms | 10ms | 0.00033ms | PASS | stable (p10 -4% (閾値未満)、 p95 +31% (裾は実行間の振れ幅と区別できないため判定には使わない)) — gate 無効 (regressionGate=false) |
| paddleSignWebhook | 0.0027ms | 0.0033ms | 10ms | 0.00033ms | PASS | stable — gate 無効 (regressionGate=false) |
| paddleVerifyWebhook | 0.0029ms | 0.0040ms | 10ms | 0.00033ms | PASS | stable — gate 無効 (regressionGate=false) |
| lemonSqueezySignWebhook | 0.0022ms | 0.0027ms | 10ms | 0.00033ms | PASS | stable — gate 無効 (regressionGate=false) |
| lemonSqueezyVerifyWebhook | 0.0028ms | 0.0036ms | 10ms | 0.00033ms | PASS | stable — gate 無効 (regressionGate=false) |
| dunningStart | 0.00025ms | 0.00038ms | 5ms | 0.00033ms | PASS | stable (検知には +0.00033ms (baseline 比 +114%) 以上の悪化が必要) — gate 無効 (regressionGate=false) |
| retryStart | 0.0021ms | 0.0028ms | 5ms | 0.00033ms | PASS | stable — gate 無効 (regressionGate=false) |
| retryBackoffMs | 0.00017ms | 0.00021ms | 5ms | 0.00033ms | PASS | stable (差 0.000042ms が下限 0.00033ms 未満で判定を保留) — gate 無効 (regressionGate=false) |

## Concurrent p95 (concurrency = 10, 50 iter each)

| op | p95 | cap | gate |
|---|---|---|---|
| stripeSignWebhook | 0.05ms | 20ms | PASS |
| stripeVerifyWebhook | 0.04ms | 20ms | PASS |
| paddleSignWebhook | 0.04ms | 20ms | PASS |
| paddleVerifyWebhook | 0.04ms | 20ms | PASS |
| lemonSqueezySignWebhook | 0.04ms | 20ms | PASS |
| lemonSqueezyVerifyWebhook | 0.04ms | 20ms | PASS |
| dunningStart | 0.00ms | 10ms | PASS |
| retryStart | 0.04ms | 10ms | PASS |
| retryBackoffMs | 0.01ms | 10ms | PASS |

## Memory retention (200 iter, arrayBuffers axis is the gate; heap is informational)

| op | heapUsed Δ | arrayBuffers Δ | cap | gc exposed | verdict |
|---|---|---|---|---|---|
| stripeSignWebhook | -14272 B | 0 B | 102400 B | yes | PASS |
| stripeVerifyWebhook | -21624 B | 0 B | 102400 B | yes | PASS |
| paddleSignWebhook | 2376 B | 0 B | 102400 B | yes | PASS |
| paddleVerifyWebhook | 616 B | 0 B | 102400 B | yes | PASS |
| lemonSqueezySignWebhook | 944 B | 0 B | 102400 B | yes | PASS |
| lemonSqueezyVerifyWebhook | 3784 B | 0 B | 102400 B | yes | PASS |
| dunningStart | 1352 B | 0 B | 102400 B | yes | PASS |
| retryStart | 32 B | 0 B | 102400 B | yes | PASS |
| retryBackoffMs | 6824 B | 0 B | 102400 B | yes | PASS |

## Detailed serial reports

### stripeSignWebhook

# Perf Report — stripeSignWebhook.serial

| metric | value |
|---|---|
| iterations | 200 |
| warmup | 5 |
| p10 | 0.0022ms |
| p50 | 0.0024ms |
| p95 | 0.0064ms |
| p99 | 0.01ms |
| mean | 0.0033ms |
| stdev | 0.0045ms |
| min | 0.0022ms |
| max | 0.06ms |
| total | 0.67ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.0022ms | 0.0025ms | -0.00029ms | -11.53% |
| p50 | 0.0024ms | 0.0031ms | -0.00071ms | -22.98% |
| p95 | 0.0064ms | 0.0059ms | +0.00051ms | +8.68% |
| p99 | 0.01ms | 0.01ms | -0.00015ms | -1.03% |
| mean | 0.0033ms | 0.0036ms | -0.00026ms | -7.35% |
| min | 0.0022ms | 0.0024ms | -0.00025ms | -10.38% |
| max | 0.06ms | 0.03ms | +0.03ms | +93.81% |
| total | 0.67ms | 0.72ms | -0.05ms | -7.35% |

### stripeVerifyWebhook

# Perf Report — stripeVerifyWebhook.serial

| metric | value |
|---|---|
| iterations | 200 |
| warmup | 5 |
| p10 | 0.0028ms |
| p50 | 0.0030ms |
| p95 | 0.0065ms |
| p99 | 0.01ms |
| mean | 0.0035ms |
| stdev | 0.0020ms |
| min | 0.0028ms |
| max | 0.02ms |
| total | 0.70ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.0028ms | 0.0030ms | -0.00013ms | -4.23% |
| p50 | 0.0030ms | 0.0030ms | -0.000084ms | -2.76% |
| p95 | 0.0065ms | 0.0050ms | +0.0015ms | +30.52% |
| p99 | 0.01ms | 0.01ms | +0.0018ms | +18.13% |
| mean | 0.0035ms | 0.0034ms | +0.000056ms | +1.62% |
| min | 0.0028ms | 0.0029ms | -0.000084ms | -2.92% |
| max | 0.02ms | 0.02ms | +0.0029ms | +15.95% |
| total | 0.70ms | 0.69ms | +0.01ms | +1.62% |

### paddleSignWebhook

# Perf Report — paddleSignWebhook.serial

| metric | value |
|---|---|
| iterations | 200 |
| warmup | 5 |
| p10 | 0.0027ms |
| p50 | 0.0028ms |
| p95 | 0.0033ms |
| p99 | 0.0068ms |
| mean | 0.0030ms |
| stdev | 0.00098ms |
| min | 0.0026ms |
| max | 0.01ms |
| total | 0.60ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.0027ms | 0.0031ms | -0.00037ms | -12.16% |
| p50 | 0.0028ms | 0.0032ms | -0.00042ms | -12.97% |
| p95 | 0.0033ms | 0.0051ms | -0.0019ms | -36.62% |
| p99 | 0.0068ms | 0.02ms | -0.02ms | -69.99% |
| mean | 0.0030ms | 0.0039ms | -0.00087ms | -22.51% |
| min | 0.0026ms | 0.0030ms | -0.00037ms | -12.50% |
| max | 0.01ms | 0.04ms | -0.03ms | -71.97% |
| total | 0.60ms | 0.77ms | -0.17ms | -22.51% |

### paddleVerifyWebhook

# Perf Report — paddleVerifyWebhook.serial

| metric | value |
|---|---|
| iterations | 200 |
| warmup | 5 |
| p10 | 0.0029ms |
| p50 | 0.0030ms |
| p95 | 0.0040ms |
| p99 | 0.0072ms |
| mean | 0.0032ms |
| stdev | 0.00085ms |
| min | 0.0028ms |
| max | 0.01ms |
| total | 0.64ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.0029ms | 0.0032ms | -0.00033ms | -10.28% |
| p50 | 0.0030ms | 0.0034ms | -0.00035ms | -10.57% |
| p95 | 0.0040ms | 0.0041ms | -0.000047ms | -1.16% |
| p99 | 0.0072ms | 0.0061ms | +0.0011ms | +18.47% |
| mean | 0.0032ms | 0.0035ms | -0.00033ms | -9.35% |
| min | 0.0028ms | 0.0031ms | -0.00029ms | -9.34% |
| max | 0.01ms | 0.01ms | -0.0031ms | -22.09% |
| total | 0.64ms | 0.71ms | -0.07ms | -9.35% |

### lemonSqueezySignWebhook

# Perf Report — lemonSqueezySignWebhook.serial

| metric | value |
|---|---|
| iterations | 200 |
| warmup | 5 |
| p10 | 0.0022ms |
| p50 | 0.0022ms |
| p95 | 0.0027ms |
| p99 | 0.0071ms |
| mean | 0.0024ms |
| stdev | 0.00097ms |
| min | 0.0021ms |
| max | 0.01ms |
| total | 0.49ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.0022ms | 0.0025ms | -0.00033ms | -13.32% |
| p50 | 0.0022ms | 0.0026ms | -0.00037ms | -14.51% |
| p95 | 0.0027ms | 0.0033ms | -0.00054ms | -16.69% |
| p99 | 0.0071ms | 0.0068ms | +0.00028ms | +4.17% |
| mean | 0.0024ms | 0.0028ms | -0.00037ms | -13.22% |
| min | 0.0021ms | 0.0024ms | -0.00029ms | -12.08% |
| max | 0.01ms | 0.01ms | -0.00042ms | -3.84% |
| total | 0.49ms | 0.56ms | -0.07ms | -13.22% |

### lemonSqueezyVerifyWebhook

# Perf Report — lemonSqueezyVerifyWebhook.serial

| metric | value |
|---|---|
| iterations | 200 |
| warmup | 5 |
| p10 | 0.0028ms |
| p50 | 0.0029ms |
| p95 | 0.0036ms |
| p99 | 0.0076ms |
| mean | 0.0031ms |
| stdev | 0.00083ms |
| min | 0.0028ms |
| max | 0.01ms |
| total | 0.62ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.0028ms | 0.0034ms | -0.00054ms | -16.03% |
| p50 | 0.0029ms | 0.0035ms | -0.00058ms | -16.66% |
| p95 | 0.0036ms | 0.0043ms | -0.00070ms | -16.04% |
| p99 | 0.0076ms | 0.0062ms | +0.0014ms | +22.45% |
| mean | 0.0031ms | 0.0036ms | -0.00054ms | -14.92% |
| min | 0.0028ms | 0.0033ms | -0.00050ms | -15.16% |
| max | 0.01ms | 0.0093ms | +0.0012ms | +12.50% |
| total | 0.62ms | 0.73ms | -0.11ms | -14.92% |

### dunningStart

# Perf Report — dunningStart.serial

| metric | value |
|---|---|
| iterations | 200 |
| warmup | 5 |
| p10 | 0.00025ms |
| p50 | 0.00029ms |
| p95 | 0.00038ms |
| p99 | 0.0030ms |
| mean | 0.00041ms |
| stdev | 0.00083ms |
| min | 0.00021ms |
| max | 0.0090ms |
| total | 0.08ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.00025ms | 0.00029ms | -0.000042ms | -14.38% |
| p50 | 0.00029ms | 0.00033ms | -0.000042ms | -12.61% |
| p95 | 0.00038ms | 0.00042ms | -0.000040ms | -9.53% |
| p99 | 0.0030ms | 0.0027ms | +0.00030ms | +10.89% |
| mean | 0.00041ms | 0.00055ms | -0.00014ms | -25.99% |
| min | 0.00021ms | 0.00025ms | -0.000042ms | -16.80% |
| max | 0.0090ms | 0.03ms | -0.02ms | -71.10% |
| total | 0.08ms | 0.11ms | -0.03ms | -25.99% |

### retryStart

# Perf Report — retryStart.serial

| metric | value |
|---|---|
| iterations | 200 |
| warmup | 5 |
| p10 | 0.0021ms |
| p50 | 0.0022ms |
| p95 | 0.0028ms |
| p99 | 0.0094ms |
| mean | 0.0025ms |
| stdev | 0.0013ms |
| min | 0.0021ms |
| max | 0.01ms |
| total | 0.50ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.0021ms | 0.0025ms | -0.00033ms | -13.55% |
| p50 | 0.0022ms | 0.0026ms | -0.00037ms | -14.51% |
| p95 | 0.0028ms | 0.0038ms | -0.00099ms | -25.90% |
| p99 | 0.0094ms | 0.02ms | -0.0056ms | -37.59% |
| mean | 0.0025ms | 0.0030ms | -0.00048ms | -16.17% |
| min | 0.0021ms | 0.0024ms | -0.00029ms | -12.29% |
| max | 0.01ms | 0.02ms | -0.01ms | -44.22% |
| total | 0.50ms | 0.59ms | -0.10ms | -16.17% |

### retryBackoffMs

# Perf Report — retryBackoffMs.serial

| metric | value |
|---|---|
| iterations | 200 |
| warmup | 5 |
| p10 | 0.00017ms |
| p50 | 0.00021ms |
| p95 | 0.00021ms |
| p99 | 0.0021ms |
| mean | 0.00028ms |
| stdev | 0.00082ms |
| min | 0.00017ms |
| max | 0.01ms |
| total | 0.06ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.00017ms | 0.00021ms | -0.000042ms | -20.19% |
| p50 | 0.00021ms | 0.00021ms | -0.0000010ms | -0.48% |
| p95 | 0.00021ms | 0.00029ms | -0.000079ms | -27.02% |
| p99 | 0.0021ms | 0.0021ms | -0.000071ms | -3.31% |
| mean | 0.00028ms | 0.00031ms | -0.000024ms | -7.79% |
| min | 0.00017ms | 0.00017ms | 0.00ms | 0.00% |
| max | 0.01ms | 0.01ms | +0.00058ms | +5.57% |
| total | 0.06ms | 0.06ms | -0.0048ms | -7.79% |

