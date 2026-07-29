# Perf Suite — payment

Threshold source: [docs/quality/perf-thresholds.md](../../../quality/perf-thresholds)

測定系の分解能 = 0.00017ms (何もしない関数を同じ経路で呼んだ時の p10)。 回帰判定の絶対下限は既定でこの 2 倍 = 0.00033ms、 op ごとの実効値は下表の「下限」 列。

## Serial (concurrency = 1)

| op | p10 (回帰判定) | p95 (上限判定) | cap | 下限 | gate | regression |
|---|---|---|---|---|---|---|
| stripeSignWebhook | 0.0022ms | 0.0061ms | 10ms | 0.00033ms | PASS | stable — gate 無効 (regressionGate=false) |
| stripeVerifyWebhook | 0.0027ms | 0.0064ms | 10ms | 0.00033ms | PASS | stable (p10 -8% (閾値未満)、 p95 +28% (裾は実行間の振れ幅と区別できないため判定には使わない)) — gate 無効 (regressionGate=false) |
| paddleSignWebhook | 0.0027ms | 0.0034ms | 10ms | 0.00033ms | PASS | stable — gate 無効 (regressionGate=false) |
| paddleVerifyWebhook | 0.0030ms | 0.0042ms | 10ms | 0.00033ms | PASS | stable — gate 無効 (regressionGate=false) |
| lemonSqueezySignWebhook | 0.0022ms | 0.0030ms | 10ms | 0.00033ms | PASS | stable — gate 無効 (regressionGate=false) |
| lemonSqueezyVerifyWebhook | 0.0029ms | 0.0034ms | 10ms | 0.00033ms | PASS | stable — gate 無効 (regressionGate=false) |
| dunningStart | 0.00025ms | 0.00033ms | 5ms | 0.00033ms | PASS | stable (検知には +0.00033ms (baseline 比 +114%) 以上の悪化が必要) — gate 無効 (regressionGate=false) |
| retryStart | 0.0020ms | 0.0027ms | 5ms | 0.00033ms | PASS | stable — gate 無効 (regressionGate=false) |
| retryBackoffMs | 0.00017ms | 0.00025ms | 5ms | 0.00033ms | PASS | stable (差 0.000042ms が下限 0.00033ms 未満で判定を保留) — gate 無効 (regressionGate=false) |

## Concurrent p95 (concurrency = 10, 50 iter each)

| op | p95 | cap | gate |
|---|---|---|---|
| stripeSignWebhook | 0.07ms | 20ms | PASS |
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
| stripeSignWebhook | -15416 B | 0 B | 102400 B | yes | PASS |
| stripeVerifyWebhook | -21472 B | 0 B | 102400 B | yes | PASS |
| paddleSignWebhook | 2376 B | 0 B | 102400 B | yes | PASS |
| paddleVerifyWebhook | 616 B | 0 B | 102400 B | yes | PASS |
| lemonSqueezySignWebhook | 496 B | 0 B | 102400 B | yes | PASS |
| lemonSqueezyVerifyWebhook | 1968 B | 0 B | 102400 B | yes | PASS |
| dunningStart | 1352 B | 0 B | 102400 B | yes | PASS |
| retryStart | -416 B | 0 B | 102400 B | yes | PASS |
| retryBackoffMs | -220576 B | 0 B | 102400 B | yes | PASS |

## Detailed serial reports

### stripeSignWebhook

# Perf Report — stripeSignWebhook.serial

| metric | value |
|---|---|
| iterations | 200 |
| warmup | 5 |
| p10 | 0.0022ms |
| p50 | 0.0023ms |
| p95 | 0.0061ms |
| p99 | 0.01ms |
| mean | 0.0031ms |
| stdev | 0.0027ms |
| min | 0.0021ms |
| max | 0.03ms |
| total | 0.62ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.0022ms | 0.0025ms | -0.00033ms | -13.18% |
| p50 | 0.0023ms | 0.0031ms | -0.00075ms | -24.34% |
| p95 | 0.0061ms | 0.0059ms | +0.00027ms | +4.57% |
| p99 | 0.01ms | 0.01ms | -0.00095ms | -6.59% |
| mean | 0.0031ms | 0.0036ms | -0.00050ms | -13.94% |
| min | 0.0021ms | 0.0024ms | -0.00033ms | -13.82% |
| max | 0.03ms | 0.03ms | +0.0014ms | +4.64% |
| total | 0.62ms | 0.72ms | -0.10ms | -13.94% |

### stripeVerifyWebhook

# Perf Report — stripeVerifyWebhook.serial

| metric | value |
|---|---|
| iterations | 200 |
| warmup | 5 |
| p10 | 0.0027ms |
| p50 | 0.0029ms |
| p95 | 0.0064ms |
| p99 | 0.02ms |
| mean | 0.0036ms |
| stdev | 0.0033ms |
| min | 0.0027ms |
| max | 0.04ms |
| total | 0.73ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.0027ms | 0.0030ms | -0.00025ms | -8.42% |
| p50 | 0.0029ms | 0.0030ms | -0.00017ms | -5.49% |
| p95 | 0.0064ms | 0.0050ms | +0.0014ms | +28.25% |
| p99 | 0.02ms | 0.01ms | +0.0064ms | +62.99% |
| mean | 0.0036ms | 0.0034ms | +0.00021ms | +6.10% |
| min | 0.0027ms | 0.0029ms | -0.00021ms | -7.23% |
| max | 0.04ms | 0.02ms | +0.02ms | +98.87% |
| total | 0.73ms | 0.69ms | +0.04ms | +6.10% |

### paddleSignWebhook

# Perf Report — paddleSignWebhook.serial

| metric | value |
|---|---|
| iterations | 200 |
| warmup | 5 |
| p10 | 0.0027ms |
| p50 | 0.0028ms |
| p95 | 0.0034ms |
| p99 | 0.0079ms |
| mean | 0.0031ms |
| stdev | 0.0011ms |
| min | 0.0027ms |
| max | 0.01ms |
| total | 0.61ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.0027ms | 0.0031ms | -0.00033ms | -10.80% |
| p50 | 0.0028ms | 0.0032ms | -0.00037ms | -11.69% |
| p95 | 0.0034ms | 0.0051ms | -0.0018ms | -34.14% |
| p99 | 0.0079ms | 0.02ms | -0.01ms | -65.43% |
| mean | 0.0031ms | 0.0039ms | -0.00080ms | -20.71% |
| min | 0.0027ms | 0.0030ms | -0.00029ms | -9.73% |
| max | 0.01ms | 0.04ms | -0.03ms | -66.60% |
| total | 0.61ms | 0.77ms | -0.16ms | -20.71% |

### paddleVerifyWebhook

# Perf Report — paddleVerifyWebhook.serial

| metric | value |
|---|---|
| iterations | 200 |
| warmup | 5 |
| p10 | 0.0030ms |
| p50 | 0.0031ms |
| p95 | 0.0042ms |
| p99 | 0.0091ms |
| mean | 0.0034ms |
| stdev | 0.0016ms |
| min | 0.0029ms |
| max | 0.02ms |
| total | 0.68ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.0030ms | 0.0032ms | -0.00025ms | -7.69% |
| p50 | 0.0031ms | 0.0034ms | -0.00027ms | -8.09% |
| p95 | 0.0042ms | 0.0041ms | +0.00014ms | +3.36% |
| p99 | 0.0091ms | 0.0061ms | +0.0030ms | +49.82% |
| mean | 0.0034ms | 0.0035ms | -0.00013ms | -3.77% |
| min | 0.0029ms | 0.0031ms | -0.00021ms | -6.66% |
| max | 0.02ms | 0.01ms | +0.0081ms | +57.90% |
| total | 0.68ms | 0.71ms | -0.03ms | -3.77% |

### lemonSqueezySignWebhook

# Perf Report — lemonSqueezySignWebhook.serial

| metric | value |
|---|---|
| iterations | 200 |
| warmup | 5 |
| p10 | 0.0022ms |
| p50 | 0.0023ms |
| p95 | 0.0030ms |
| p99 | 0.01ms |
| mean | 0.0025ms |
| stdev | 0.0011ms |
| min | 0.0022ms |
| max | 0.01ms |
| total | 0.51ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.0022ms | 0.0025ms | -0.00029ms | -11.64% |
| p50 | 0.0023ms | 0.0026ms | -0.00029ms | -11.30% |
| p95 | 0.0030ms | 0.0033ms | -0.00025ms | -7.68% |
| p99 | 0.01ms | 0.0068ms | +0.0038ms | +56.62% |
| mean | 0.0025ms | 0.0028ms | -0.00028ms | -9.94% |
| min | 0.0022ms | 0.0024ms | -0.00025ms | -10.38% |
| max | 0.01ms | 0.01ms | +0.00029ms | +2.70% |
| total | 0.51ms | 0.56ms | -0.06ms | -9.94% |

### lemonSqueezyVerifyWebhook

# Perf Report — lemonSqueezyVerifyWebhook.serial

| metric | value |
|---|---|
| iterations | 200 |
| warmup | 5 |
| p10 | 0.0029ms |
| p50 | 0.0029ms |
| p95 | 0.0034ms |
| p99 | 0.0052ms |
| mean | 0.0030ms |
| stdev | 0.00044ms |
| min | 0.0028ms |
| max | 0.0075ms |
| total | 0.60ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.0029ms | 0.0034ms | -0.00050ms | -14.81% |
| p50 | 0.0029ms | 0.0035ms | -0.00058ms | -16.66% |
| p95 | 0.0034ms | 0.0043ms | -0.00096ms | -22.05% |
| p99 | 0.0052ms | 0.0062ms | -0.0010ms | -16.26% |
| mean | 0.0030ms | 0.0036ms | -0.00062ms | -17.03% |
| min | 0.0028ms | 0.0033ms | -0.00050ms | -15.16% |
| max | 0.0075ms | 0.0093ms | -0.0018ms | -19.19% |
| total | 0.60ms | 0.73ms | -0.12ms | -17.03% |

### dunningStart

# Perf Report — dunningStart.serial

| metric | value |
|---|---|
| iterations | 200 |
| warmup | 5 |
| p10 | 0.00025ms |
| p50 | 0.00029ms |
| p95 | 0.00033ms |
| p99 | 0.0030ms |
| mean | 0.00039ms |
| stdev | 0.00078ms |
| min | 0.00021ms |
| max | 0.0090ms |
| total | 0.08ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.00025ms | 0.00029ms | -0.000042ms | -14.38% |
| p50 | 0.00029ms | 0.00033ms | -0.000042ms | -12.61% |
| p95 | 0.00033ms | 0.00042ms | -0.000085ms | -20.31% |
| p99 | 0.0030ms | 0.0027ms | +0.00029ms | +10.65% |
| mean | 0.00039ms | 0.00055ms | -0.00016ms | -29.78% |
| min | 0.00021ms | 0.00025ms | -0.000042ms | -16.80% |
| max | 0.0090ms | 0.03ms | -0.02ms | -71.37% |
| total | 0.08ms | 0.11ms | -0.03ms | -29.78% |

### retryStart

# Perf Report — retryStart.serial

| metric | value |
|---|---|
| iterations | 200 |
| warmup | 5 |
| p10 | 0.0020ms |
| p50 | 0.0021ms |
| p95 | 0.0027ms |
| p99 | 0.0079ms |
| mean | 0.0024ms |
| stdev | 0.0012ms |
| min | 0.0020ms |
| max | 0.02ms |
| total | 0.47ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.0020ms | 0.0025ms | -0.00042ms | -16.97% |
| p50 | 0.0021ms | 0.0026ms | -0.00046ms | -17.76% |
| p95 | 0.0027ms | 0.0038ms | -0.0011ms | -29.37% |
| p99 | 0.0079ms | 0.02ms | -0.0071ms | -47.17% |
| mean | 0.0024ms | 0.0030ms | -0.00062ms | -20.87% |
| min | 0.0020ms | 0.0024ms | -0.00042ms | -17.52% |
| max | 0.02ms | 0.02ms | -0.0089ms | -36.96% |
| total | 0.47ms | 0.59ms | -0.12ms | -20.87% |

### retryBackoffMs

# Perf Report — retryBackoffMs.serial

| metric | value |
|---|---|
| iterations | 200 |
| warmup | 5 |
| p10 | 0.00017ms |
| p50 | 0.00021ms |
| p95 | 0.00025ms |
| p99 | 0.0018ms |
| mean | 0.00024ms |
| stdev | 0.00039ms |
| min | 0.00017ms |
| max | 0.0043ms |
| total | 0.05ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.00017ms | 0.00021ms | -0.000042ms | -20.19% |
| p50 | 0.00021ms | 0.00021ms | -0.0000010ms | -0.48% |
| p95 | 0.00025ms | 0.00029ms | -0.000040ms | -13.68% |
| p99 | 0.0018ms | 0.0021ms | -0.00028ms | -13.19% |
| mean | 0.00024ms | 0.00031ms | -0.000061ms | -19.87% |
| min | 0.00017ms | 0.00017ms | 0.00ms | 0.00% |
| max | 0.0043ms | 0.01ms | -0.0061ms | -58.57% |
| total | 0.05ms | 0.06ms | -0.01ms | -19.87% |

