# Perf Suite — payment

Threshold source: [docs/quality/perf-thresholds.md](../../../quality/perf-thresholds)

測定系の分解能 = 0.00017ms (何もしない関数を同じ経路で呼んだ時の p10)。 回帰判定の絶対下限は既定でこの 2 倍 = 0.00033ms、 op ごとの実効値は下表の「下限」 列。

## Serial (concurrency = 1)

| op | p10 (回帰判定) | p95 (上限判定) | cap | 下限 | gate | regression |
|---|---|---|---|---|---|---|
| stripeSignWebhook | 0.0025ms | 0.0057ms | 10ms | 0.00033ms | PASS | stable — gate 無効 (regressionGate=false) |
| stripeVerifyWebhook | 0.0030ms | 0.0045ms | 10ms | 0.00033ms | PASS | stable — gate 無効 (regressionGate=false) |
| paddleSignWebhook | 0.0036ms | 0.0045ms | 10ms | 0.00033ms | PASS | stable — gate 無効 (regressionGate=false) |
| paddleVerifyWebhook | 0.0032ms | 0.0042ms | 10ms | 0.00033ms | PASS | stable — gate 無効 (regressionGate=false) |
| lemonSqueezySignWebhook | 0.0023ms | 0.0046ms | 10ms | 0.00033ms | PASS | stable (p10 -7% (閾値未満)、 p95 +41% (裾は実行間の振れ幅と区別できないため判定には使わない)) — gate 無効 (regressionGate=false) |
| lemonSqueezyVerifyWebhook | 0.0034ms | 0.0043ms | 10ms | 0.00033ms | PASS | stable — gate 無効 (regressionGate=false) |
| dunningStart | 0.00067ms | 0.00075ms | 5ms | 0.00033ms | PASS | regressed — gate 無効 (regressionGate=false) |
| retryStart | 0.0027ms | 0.0047ms | 5ms | 0.00033ms | PASS | stable (p10 +12% (閾値未満)、 p95 +22% (裾は実行間の振れ幅と区別できないため判定には使わない)) — gate 無効 (regressionGate=false) |
| retryBackoffMs | 0.00021ms | 0.00051ms | 5ms | 0.00033ms | PASS | stable (検知には +0.00033ms (baseline 比 +161%) 以上の悪化が必要) — gate 無効 (regressionGate=false) |

## Concurrent p95 (concurrency = 10, 50 iter each)

| op | p95 | cap | gate |
|---|---|---|---|
| stripeSignWebhook | 0.09ms | 20ms | PASS |
| stripeVerifyWebhook | 0.04ms | 20ms | PASS |
| paddleSignWebhook | 0.04ms | 20ms | PASS |
| paddleVerifyWebhook | 0.04ms | 20ms | PASS |
| lemonSqueezySignWebhook | 0.04ms | 20ms | PASS |
| lemonSqueezyVerifyWebhook | 0.05ms | 20ms | PASS |
| dunningStart | 0.01ms | 10ms | PASS |
| retryStart | 0.04ms | 10ms | PASS |
| retryBackoffMs | 0.01ms | 10ms | PASS |

## Memory retention (200 iter, arrayBuffers axis is the gate; heap is informational)

| op | heapUsed Δ | arrayBuffers Δ | cap | gc exposed | verdict |
|---|---|---|---|---|---|
| stripeSignWebhook | 25624 B | 8192 B | 102400 B | yes | PASS |
| stripeVerifyWebhook | -15520 B | 0 B | 102400 B | yes | PASS |
| paddleSignWebhook | 4144 B | -16384 B | 102400 B | yes | PASS |
| paddleVerifyWebhook | 264 B | 0 B | 102400 B | yes | PASS |
| lemonSqueezySignWebhook | -15328 B | -24576 B | 102400 B | yes | PASS |
| lemonSqueezyVerifyWebhook | -5184 B | -81920 B | 102400 B | yes | PASS |
| dunningStart | 2832 B | 0 B | 102400 B | yes | PASS |
| retryStart | -416 B | -8192 B | 102400 B | yes | PASS |
| retryBackoffMs | -2088 B | 0 B | 102400 B | yes | PASS |

## Detailed serial reports

### stripeSignWebhook

# Perf Report — stripeSignWebhook.serial

| metric | value |
|---|---|
| iterations | 200 |
| warmup | 5 |
| p10 | 0.0025ms |
| p50 | 0.0029ms |
| p95 | 0.0057ms |
| p99 | 0.01ms |
| mean | 0.0035ms |
| stdev | 0.0023ms |
| min | 0.0025ms |
| max | 0.03ms |
| total | 0.71ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.0025ms | 0.0025ms | +0.000046ms | +1.85% |
| p50 | 0.0029ms | 0.0031ms | -0.00023ms | -7.43% |
| p95 | 0.0057ms | 0.0059ms | -0.00017ms | -2.82% |
| p99 | 0.01ms | 0.01ms | -0.0012ms | -8.49% |
| mean | 0.0035ms | 0.0036ms | -0.000056ms | -1.55% |
| min | 0.0025ms | 0.0024ms | +0.000041ms | +1.70% |
| max | 0.03ms | 0.03ms | -0.0045ms | -15.19% |
| total | 0.71ms | 0.72ms | -0.01ms | -1.55% |

### stripeVerifyWebhook

# Perf Report — stripeVerifyWebhook.serial

| metric | value |
|---|---|
| iterations | 200 |
| warmup | 5 |
| p10 | 0.0030ms |
| p50 | 0.0031ms |
| p95 | 0.0045ms |
| p99 | 0.01ms |
| mean | 0.0034ms |
| stdev | 0.0014ms |
| min | 0.0029ms |
| max | 0.02ms |
| total | 0.68ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.0030ms | 0.0030ms | 0.00ms | 0.00% |
| p50 | 0.0031ms | 0.0030ms | +0.000041ms | +1.35% |
| p95 | 0.0045ms | 0.0050ms | -0.00045ms | -9.15% |
| p99 | 0.01ms | 0.01ms | +0.0016ms | +16.08% |
| mean | 0.0034ms | 0.0034ms | -0.000046ms | -1.33% |
| min | 0.0029ms | 0.0029ms | 0.00ms | 0.00% |
| max | 0.02ms | 0.02ms | -0.0024ms | -13.21% |
| total | 0.68ms | 0.69ms | -0.0091ms | -1.33% |

### paddleSignWebhook

# Perf Report — paddleSignWebhook.serial

| metric | value |
|---|---|
| iterations | 200 |
| warmup | 5 |
| p10 | 0.0036ms |
| p50 | 0.0037ms |
| p95 | 0.0045ms |
| p99 | 0.01ms |
| mean | 0.0040ms |
| stdev | 0.0013ms |
| min | 0.0035ms |
| max | 0.01ms |
| total | 0.81ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.0036ms | 0.0031ms | +0.00054ms | +17.58% |
| p50 | 0.0037ms | 0.0032ms | +0.00054ms | +16.90% |
| p95 | 0.0045ms | 0.0051ms | -0.00063ms | -12.30% |
| p99 | 0.01ms | 0.02ms | -0.01ms | -49.64% |
| mean | 0.0040ms | 0.0039ms | +0.00018ms | +4.71% |
| min | 0.0035ms | 0.0030ms | +0.00054ms | +18.03% |
| max | 0.01ms | 0.04ms | -0.03ms | -64.74% |
| total | 0.81ms | 0.77ms | +0.04ms | +4.71% |

### paddleVerifyWebhook

# Perf Report — paddleVerifyWebhook.serial

| metric | value |
|---|---|
| iterations | 200 |
| warmup | 5 |
| p10 | 0.0032ms |
| p50 | 0.0033ms |
| p95 | 0.0042ms |
| p99 | 0.0063ms |
| mean | 0.0035ms |
| stdev | 0.0010ms |
| min | 0.0031ms |
| max | 0.02ms |
| total | 0.71ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.0032ms | 0.0032ms | 0.00ms | 0.00% |
| p50 | 0.0033ms | 0.0034ms | -0.000020ms | -0.61% |
| p95 | 0.0042ms | 0.0041ms | +0.00012ms | +2.95% |
| p99 | 0.0063ms | 0.0061ms | +0.00018ms | +3.03% |
| mean | 0.0035ms | 0.0035ms | +0.000014ms | +0.39% |
| min | 0.0031ms | 0.0031ms | 0.00ms | 0.00% |
| max | 0.02ms | 0.01ms | +0.0011ms | +8.05% |
| total | 0.71ms | 0.71ms | +0.0027ms | +0.39% |

### lemonSqueezySignWebhook

# Perf Report — lemonSqueezySignWebhook.serial

| metric | value |
|---|---|
| iterations | 200 |
| warmup | 5 |
| p10 | 0.0023ms |
| p50 | 0.0024ms |
| p95 | 0.0046ms |
| p99 | 0.01ms |
| mean | 0.0030ms |
| stdev | 0.0046ms |
| min | 0.0023ms |
| max | 0.07ms |
| total | 0.60ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.0023ms | 0.0025ms | -0.00017ms | -6.68% |
| p50 | 0.0024ms | 0.0026ms | -0.00021ms | -8.09% |
| p95 | 0.0046ms | 0.0033ms | +0.0013ms | +40.53% |
| p99 | 0.01ms | 0.0068ms | +0.0047ms | +68.93% |
| mean | 0.0030ms | 0.0028ms | +0.00021ms | +7.56% |
| min | 0.0023ms | 0.0024ms | -0.00013ms | -5.21% |
| max | 0.07ms | 0.01ms | +0.06ms | +509.25% |
| total | 0.60ms | 0.56ms | +0.04ms | +7.56% |

### lemonSqueezyVerifyWebhook

# Perf Report — lemonSqueezyVerifyWebhook.serial

| metric | value |
|---|---|
| iterations | 200 |
| warmup | 5 |
| p10 | 0.0034ms |
| p50 | 0.0035ms |
| p95 | 0.0043ms |
| p99 | 0.0067ms |
| mean | 0.0036ms |
| stdev | 0.00074ms |
| min | 0.0033ms |
| max | 0.01ms |
| total | 0.73ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.0034ms | 0.0034ms | 0.00ms | 0.00% |
| p50 | 0.0035ms | 0.0035ms | -0.000041ms | -1.17% |
| p95 | 0.0043ms | 0.0043ms | -0.0000011ms | -0.03% |
| p99 | 0.0067ms | 0.0062ms | +0.00054ms | +8.77% |
| mean | 0.0036ms | 0.0036ms | -0.0000048ms | -0.13% |
| min | 0.0033ms | 0.0033ms | +0.0000010ms | +0.03% |
| max | 0.01ms | 0.0093ms | +0.0026ms | +27.68% |
| total | 0.73ms | 0.73ms | -0.00097ms | -0.13% |

### dunningStart

# Perf Report — dunningStart.serial

| metric | value |
|---|---|
| iterations | 200 |
| warmup | 5 |
| p10 | 0.00067ms |
| p50 | 0.00067ms |
| p95 | 0.00075ms |
| p99 | 0.0040ms |
| mean | 0.00086ms |
| stdev | 0.0013ms |
| min | 0.00063ms |
| max | 0.01ms |
| total | 0.17ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.00067ms | 0.00029ms | +0.00037ms | +128.08% |
| p50 | 0.00067ms | 0.00033ms | +0.00033ms | +100.30% |
| p95 | 0.00075ms | 0.00042ms | +0.00033ms | +78.95% |
| p99 | 0.0040ms | 0.0027ms | +0.0013ms | +45.98% |
| mean | 0.00086ms | 0.00055ms | +0.00031ms | +56.81% |
| min | 0.00063ms | 0.00025ms | +0.00038ms | +150.00% |
| max | 0.01ms | 0.03ms | -0.02ms | -59.12% |
| total | 0.17ms | 0.11ms | +0.06ms | +56.81% |

### retryStart

# Perf Report — retryStart.serial

| metric | value |
|---|---|
| iterations | 200 |
| warmup | 5 |
| p10 | 0.0027ms |
| p50 | 0.0029ms |
| p95 | 0.0047ms |
| p99 | 0.01ms |
| mean | 0.01ms |
| stdev | 0.12ms |
| min | 0.0027ms |
| max | 1.68ms |
| total | 2.33ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.0027ms | 0.0025ms | +0.00029ms | +11.88% |
| p50 | 0.0029ms | 0.0026ms | +0.00029ms | +11.26% |
| p95 | 0.0047ms | 0.0038ms | +0.00084ms | +21.95% |
| p99 | 0.01ms | 0.02ms | -0.0038ms | -25.06% |
| mean | 0.01ms | 0.0030ms | +0.0087ms | +292.02% |
| min | 0.0027ms | 0.0024ms | +0.00033ms | +14.02% |
| max | 1.68ms | 0.02ms | +1.66ms | +6878.58% |
| total | 2.33ms | 0.59ms | +1.74ms | +292.02% |

### retryBackoffMs

# Perf Report — retryBackoffMs.serial

| metric | value |
|---|---|
| iterations | 200 |
| warmup | 5 |
| p10 | 0.00021ms |
| p50 | 0.00021ms |
| p95 | 0.00051ms |
| p99 | 0.0068ms |
| mean | 0.0060ms |
| stdev | 0.08ms |
| min | 0.00017ms |
| max | 1.11ms |
| total | 1.20ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.00021ms | 0.00021ms | 0.00ms | 0.00% |
| p50 | 0.00021ms | 0.00021ms | 0.00ms | 0.00% |
| p95 | 0.00051ms | 0.00029ms | +0.00022ms | +75.51% |
| p99 | 0.0068ms | 0.0021ms | +0.0047ms | +220.18% |
| mean | 0.0060ms | 0.00031ms | +0.0057ms | +1872.07% |
| min | 0.00017ms | 0.00017ms | 0.00ms | 0.00% |
| max | 1.11ms | 0.01ms | +1.10ms | +10477.81% |
| total | 1.20ms | 0.06ms | +1.14ms | +1872.07% |

