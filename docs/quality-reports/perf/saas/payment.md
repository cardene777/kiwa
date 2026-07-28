# Perf Suite — payment

Threshold source: [docs/quality/perf-thresholds.md](../../../quality/perf-thresholds)

## Serial p95 (concurrency = 1)

| op | p95 | cap | gate | regression |
|---|---|---|---|---|
| stripeSignWebhook | 0.01ms | 10ms | PASS | stable (検知には +0.5ms (baseline 比 +6648%) 以上の悪化が必要) |
| stripeVerifyWebhook | 0.00ms | 10ms | PASS | stable (検知には +0.5ms (baseline 比 +7885%) 以上の悪化が必要) |
| paddleSignWebhook | 0.00ms | 10ms | PASS | stable (検知には +0.5ms (baseline 比 +13581%) 以上の悪化が必要) |
| paddleVerifyWebhook | 0.00ms | 10ms | PASS | stable (検知には +0.5ms (baseline 比 +12493%) 以上の悪化が必要) |
| lemonSqueezySignWebhook | 0.00ms | 10ms | PASS | stable (検知には +0.5ms (baseline 比 +14797%) 以上の悪化が必要) |
| lemonSqueezyVerifyWebhook | 0.00ms | 10ms | PASS | stable (検知には +0.5ms (baseline 比 +12889%) 以上の悪化が必要) |
| dunningStart | 0.00ms | 5ms | PASS | stable (検知には +0.5ms (baseline 比 +47461%) 以上の悪化が必要) |
| retryStart | 0.00ms | 5ms | PASS | stable (差 0.01ms が下限 0.5ms 未満で判定を保留) |
| retryBackoffMs | 0.00ms | 5ms | PASS | stable (検知には +0.5ms (baseline 比 +85763%) 以上の悪化が必要) |

## Concurrent p95 (concurrency = 10, 50 iter each)

| op | p95 | cap | gate |
|---|---|---|---|
| stripeSignWebhook | 0.04ms | 20ms | PASS |
| stripeVerifyWebhook | 0.05ms | 20ms | PASS |
| paddleSignWebhook | 0.04ms | 20ms | PASS |
| paddleVerifyWebhook | 0.04ms | 20ms | PASS |
| lemonSqueezySignWebhook | 0.03ms | 20ms | PASS |
| lemonSqueezyVerifyWebhook | 0.04ms | 20ms | PASS |
| dunningStart | 0.00ms | 10ms | PASS |
| retryStart | 0.04ms | 10ms | PASS |
| retryBackoffMs | 0.01ms | 10ms | PASS |

## Memory retention (200 iter, arrayBuffers axis is the gate; heap is informational)

| op | heapUsed Δ | arrayBuffers Δ | cap | gc exposed | verdict |
|---|---|---|---|---|---|
| stripeSignWebhook | -13824 B | 0 B | 102400 B | yes | PASS |
| stripeVerifyWebhook | -21608 B | 0 B | 102400 B | yes | PASS |
| paddleSignWebhook | 2184 B | 0 B | 102400 B | yes | PASS |
| paddleVerifyWebhook | 1192 B | 0 B | 102400 B | yes | PASS |
| lemonSqueezySignWebhook | 6904 B | 0 B | 102400 B | yes | PASS |
| lemonSqueezyVerifyWebhook | 10104 B | 0 B | 102400 B | yes | PASS |
| dunningStart | 32 B | 0 B | 102400 B | yes | PASS |
| retryStart | 16 B | 0 B | 102400 B | yes | PASS |
| retryBackoffMs | 6952 B | 0 B | 102400 B | yes | PASS |

## Detailed serial reports

### stripeSignWebhook

# Perf Report — stripeSignWebhook.serial

| metric | value |
|---|---|
| iterations | 200 |
| warmup | 5 |
| p50 | 0.00ms |
| p95 | 0.01ms |
| p99 | 0.01ms |
| mean | 0.00ms |
| stdev | 0.00ms |
| min | 0.00ms |
| max | 0.03ms |
| total | 0.56ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p50 | 0.00ms | 0.00ms | -0.00ms | -14.29% |
| p95 | 0.01ms | 0.01ms | -0.00ms | -29.03% |
| p99 | 0.01ms | 0.02ms | -0.01ms | -31.42% |
| mean | 0.00ms | 0.00ms | -0.00ms | -20.97% |
| min | 0.00ms | 0.00ms | -0.00ms | -10.53% |
| max | 0.03ms | 0.03ms | -0.00ms | -8.49% |
| total | 0.56ms | 0.71ms | -0.15ms | -20.97% |

### stripeVerifyWebhook

# Perf Report — stripeVerifyWebhook.serial

| metric | value |
|---|---|
| iterations | 200 |
| warmup | 5 |
| p50 | 0.00ms |
| p95 | 0.00ms |
| p99 | 0.01ms |
| mean | 0.00ms |
| stdev | 0.00ms |
| min | 0.00ms |
| max | 0.01ms |
| total | 0.61ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p50 | 0.00ms | 0.00ms | -0.00ms | -5.63% |
| p95 | 0.00ms | 0.01ms | -0.00ms | -29.08% |
| p99 | 0.01ms | 0.01ms | -0.01ms | -40.72% |
| mean | 0.00ms | 0.00ms | -0.00ms | -14.09% |
| min | 0.00ms | 0.00ms | -0.00ms | -4.55% |
| max | 0.01ms | 0.03ms | -0.02ms | -58.65% |
| total | 0.61ms | 0.71ms | -0.10ms | -14.09% |

### paddleSignWebhook

# Perf Report — paddleSignWebhook.serial

| metric | value |
|---|---|
| iterations | 200 |
| warmup | 5 |
| p50 | 0.00ms |
| p95 | 0.00ms |
| p99 | 0.01ms |
| mean | 0.00ms |
| stdev | 0.00ms |
| min | 0.00ms |
| max | 0.02ms |
| total | 0.67ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p50 | 0.00ms | 0.00ms | +0.00ms | +4.17% |
| p95 | 0.00ms | 0.00ms | -0.00ms | -1.48% |
| p99 | 0.01ms | 0.01ms | +0.00ms | +24.27% |
| mean | 0.00ms | 0.00ms | +0.00ms | +3.44% |
| min | 0.00ms | 0.00ms | 0.00ms | 0.00% |
| max | 0.02ms | 0.01ms | +0.00ms | +16.72% |
| total | 0.67ms | 0.65ms | +0.02ms | +3.44% |

### paddleVerifyWebhook

# Perf Report — paddleVerifyWebhook.serial

| metric | value |
|---|---|
| iterations | 200 |
| warmup | 5 |
| p50 | 0.00ms |
| p95 | 0.00ms |
| p99 | 0.01ms |
| mean | 0.00ms |
| stdev | 0.00ms |
| min | 0.00ms |
| max | 0.01ms |
| total | 0.63ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p50 | 0.00ms | 0.00ms | -0.00ms | -6.57% |
| p95 | 0.00ms | 0.00ms | -0.00ms | -6.09% |
| p99 | 0.01ms | 0.01ms | -0.00ms | -0.76% |
| mean | 0.00ms | 0.00ms | -0.00ms | -6.14% |
| min | 0.00ms | 0.00ms | -0.00ms | -4.23% |
| max | 0.01ms | 0.01ms | -0.00ms | -0.93% |
| total | 0.63ms | 0.67ms | -0.04ms | -6.14% |

### lemonSqueezySignWebhook

# Perf Report — lemonSqueezySignWebhook.serial

| metric | value |
|---|---|
| iterations | 200 |
| warmup | 5 |
| p50 | 0.00ms |
| p95 | 0.00ms |
| p99 | 0.01ms |
| mean | 0.00ms |
| stdev | 0.00ms |
| min | 0.00ms |
| max | 0.01ms |
| total | 0.50ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p50 | 0.00ms | 0.00ms | -0.00ms | -11.34% |
| p95 | 0.00ms | 0.00ms | -0.00ms | -17.31% |
| p99 | 0.01ms | 0.01ms | -0.00ms | -5.28% |
| mean | 0.00ms | 0.00ms | -0.00ms | -12.58% |
| min | 0.00ms | 0.00ms | -0.00ms | -10.34% |
| max | 0.01ms | 0.01ms | +0.00ms | +0.33% |
| total | 0.50ms | 0.58ms | -0.07ms | -12.58% |

### lemonSqueezyVerifyWebhook

# Perf Report — lemonSqueezyVerifyWebhook.serial

| metric | value |
|---|---|
| iterations | 200 |
| warmup | 5 |
| p50 | 0.00ms |
| p95 | 0.00ms |
| p99 | 0.01ms |
| mean | 0.00ms |
| stdev | 0.00ms |
| min | 0.00ms |
| max | 0.01ms |
| total | 0.60ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p50 | 0.00ms | 0.00ms | -0.00ms | -8.00% |
| p95 | 0.00ms | 0.00ms | -0.00ms | -8.69% |
| p99 | 0.01ms | 0.00ms | +0.00ms | +9.96% |
| mean | 0.00ms | 0.00ms | -0.00ms | -6.94% |
| min | 0.00ms | 0.00ms | -0.00ms | -5.73% |
| max | 0.01ms | 0.01ms | +0.00ms | +18.83% |
| total | 0.60ms | 0.65ms | -0.04ms | -6.94% |

### dunningStart

# Perf Report — dunningStart.serial

| metric | value |
|---|---|
| iterations | 200 |
| warmup | 5 |
| p50 | 0.00ms |
| p95 | 0.00ms |
| p99 | 0.00ms |
| mean | 0.00ms |
| stdev | 0.00ms |
| min | 0.00ms |
| max | 0.01ms |
| total | 0.08ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p50 | 0.00ms | 0.00ms | -0.00ms | -14.38% |
| p95 | 0.00ms | 0.00ms | -0.00ms | -68.30% |
| p99 | 0.00ms | 0.01ms | -0.00ms | -59.61% |
| mean | 0.00ms | 0.00ms | -0.00ms | -73.69% |
| min | 0.00ms | 0.00ms | -0.00ms | -16.80% |
| max | 0.01ms | 0.15ms | -0.14ms | -93.93% |
| total | 0.08ms | 0.29ms | -0.21ms | -73.69% |

### retryStart

# Perf Report — retryStart.serial

| metric | value |
|---|---|
| iterations | 200 |
| warmup | 5 |
| p50 | 0.00ms |
| p95 | 0.00ms |
| p99 | 0.01ms |
| mean | 0.00ms |
| stdev | 0.00ms |
| min | 0.00ms |
| max | 0.01ms |
| total | 0.46ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p50 | 0.00ms | 0.00ms | -0.00ms | -12.25% |
| p95 | 0.00ms | 0.01ms | -0.01ms | -68.20% |
| p99 | 0.01ms | 0.03ms | -0.02ms | -70.59% |
| mean | 0.00ms | 0.00ms | -0.00ms | -37.43% |
| min | 0.00ms | 0.00ms | -0.00ms | -11.32% |
| max | 0.01ms | 0.07ms | -0.05ms | -77.93% |
| total | 0.46ms | 0.74ms | -0.28ms | -37.43% |

### retryBackoffMs

# Perf Report — retryBackoffMs.serial

| metric | value |
|---|---|
| iterations | 200 |
| warmup | 5 |
| p50 | 0.00ms |
| p95 | 0.00ms |
| p99 | 0.00ms |
| mean | 0.00ms |
| stdev | 0.00ms |
| min | 0.00ms |
| max | 0.01ms |
| total | 0.05ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p50 | 0.00ms | 0.00ms | -0.00ms | -54.59% |
| p95 | 0.00ms | 0.00ms | -0.00ms | -50.08% |
| p99 | 0.00ms | 0.01ms | -0.00ms | -65.98% |
| mean | 0.00ms | 0.00ms | -0.00ms | -68.86% |
| min | 0.00ms | 0.00ms | -0.00ms | -60.10% |
| max | 0.01ms | 0.05ms | -0.04ms | -79.64% |
| total | 0.05ms | 0.18ms | -0.12ms | -68.86% |

