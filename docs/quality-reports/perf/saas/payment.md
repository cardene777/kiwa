# Perf Suite — payment

Threshold source: [docs/quality/perf-thresholds.md](../../../quality/perf-thresholds)

## Serial p95 (concurrency = 1)

| op | p95 | cap | gate | regression |
|---|---|---|---|---|
| stripeSignWebhook | 0.01ms | 10ms | PASS | stable (検知には +0.5ms (baseline 比 +6648%) 以上の悪化が必要) — gate 無効 (regressionGate=false) |
| stripeVerifyWebhook | 0.01ms | 10ms | PASS | stable (検知には +0.5ms (baseline 比 +7885%) 以上の悪化が必要) — gate 無効 (regressionGate=false) |
| paddleSignWebhook | 0.00ms | 10ms | PASS | stable (検知には +0.5ms (baseline 比 +13581%) 以上の悪化が必要) — gate 無効 (regressionGate=false) |
| paddleVerifyWebhook | 0.00ms | 10ms | PASS | stable (検知には +0.5ms (baseline 比 +12493%) 以上の悪化が必要) — gate 無効 (regressionGate=false) |
| lemonSqueezySignWebhook | 0.00ms | 10ms | PASS | stable (検知には +0.5ms (baseline 比 +14797%) 以上の悪化が必要) — gate 無効 (regressionGate=false) |
| lemonSqueezyVerifyWebhook | 0.01ms | 10ms | PASS | stable (差 0.01ms が下限 0.5ms 未満で判定を保留) — gate 無効 (regressionGate=false) |
| dunningStart | 0.00ms | 5ms | PASS | stable (検知には +0.5ms (baseline 比 +47461%) 以上の悪化が必要) — gate 無効 (regressionGate=false) |
| retryStart | 0.00ms | 5ms | PASS | stable (検知には +0.5ms (baseline 比 +5375%) 以上の悪化が必要) — gate 無効 (regressionGate=false) |
| retryBackoffMs | 0.00ms | 5ms | PASS | stable (検知には +0.5ms (baseline 比 +85763%) 以上の悪化が必要) — gate 無効 (regressionGate=false) |

## Concurrent p95 (concurrency = 10, 50 iter each)

| op | p95 | cap | gate |
|---|---|---|---|
| stripeSignWebhook | 0.05ms | 20ms | PASS |
| stripeVerifyWebhook | 0.04ms | 20ms | PASS |
| paddleSignWebhook | 0.04ms | 20ms | PASS |
| paddleVerifyWebhook | 0.04ms | 20ms | PASS |
| lemonSqueezySignWebhook | 0.03ms | 20ms | PASS |
| lemonSqueezyVerifyWebhook | 0.26ms | 20ms | PASS |
| dunningStart | 0.01ms | 10ms | PASS |
| retryStart | 0.04ms | 10ms | PASS |
| retryBackoffMs | 0.00ms | 10ms | PASS |

## Memory retention (200 iter, arrayBuffers axis is the gate; heap is informational)

| op | heapUsed Δ | arrayBuffers Δ | cap | gc exposed | verdict |
|---|---|---|---|---|---|
| stripeSignWebhook | -20848 B | -133018 B | 102400 B | yes | PASS |
| stripeVerifyWebhook | -21392 B | 32768 B | 102400 B | yes | PASS |
| paddleSignWebhook | 2824 B | -8192 B | 102400 B | yes | PASS |
| paddleVerifyWebhook | -200 B | 0 B | 102400 B | yes | PASS |
| lemonSqueezySignWebhook | 6120 B | 0 B | 102400 B | yes | PASS |
| lemonSqueezyVerifyWebhook | 336 B | -114688 B | 102400 B | yes | PASS |
| dunningStart | -93344 B | 0 B | 102400 B | yes | PASS |
| retryStart | 1216 B | -16384 B | 102400 B | yes | PASS |
| retryBackoffMs | 6824 B | 0 B | 102400 B | yes | PASS |

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
| total | 0.66ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p50 | 0.00ms | 0.00ms | -0.00ms | -1.56% |
| p95 | 0.01ms | 0.01ms | -0.00ms | -28.92% |
| p99 | 0.01ms | 0.02ms | -0.00ms | -21.73% |
| mean | 0.00ms | 0.00ms | -0.00ms | -7.54% |
| min | 0.00ms | 0.00ms | +0.00ms | +1.73% |
| max | 0.03ms | 0.03ms | +0.00ms | +4.32% |
| total | 0.66ms | 0.71ms | -0.05ms | -7.54% |

### stripeVerifyWebhook

# Perf Report — stripeVerifyWebhook.serial

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
| max | 0.02ms |
| total | 0.73ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p50 | 0.00ms | 0.00ms | +0.00ms | +8.47% |
| p95 | 0.01ms | 0.01ms | -0.00ms | -5.98% |
| p99 | 0.01ms | 0.01ms | -0.00ms | -7.32% |
| mean | 0.00ms | 0.00ms | +0.00ms | +2.70% |
| min | 0.00ms | 0.00ms | +0.00ms | +10.58% |
| max | 0.02ms | 0.03ms | -0.01ms | -45.29% |
| total | 0.73ms | 0.71ms | +0.02ms | +2.70% |

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
| total | 0.72ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p50 | 0.00ms | 0.00ms | +0.00ms | +8.33% |
| p95 | 0.00ms | 0.00ms | +0.00ms | +10.73% |
| p99 | 0.01ms | 0.01ms | +0.01ms | +74.85% |
| mean | 0.00ms | 0.00ms | +0.00ms | +11.27% |
| min | 0.00ms | 0.00ms | +0.00ms | +7.23% |
| max | 0.02ms | 0.01ms | +0.00ms | +36.21% |
| total | 0.72ms | 0.65ms | +0.07ms | +11.27% |

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
| total | 0.72ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p50 | 0.00ms | 0.00ms | +0.00ms | +7.93% |
| p95 | 0.00ms | 0.00ms | +0.00ms | +8.58% |
| p99 | 0.01ms | 0.01ms | +0.00ms | +14.19% |
| mean | 0.00ms | 0.00ms | +0.00ms | +7.84% |
| min | 0.00ms | 0.00ms | +0.00ms | +8.45% |
| max | 0.01ms | 0.01ms | +0.00ms | +1.55% |
| total | 0.72ms | 0.67ms | +0.05ms | +7.84% |

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
| max | 0.02ms |
| total | 0.58ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p50 | 0.00ms | 0.00ms | 0.00ms | 0.00% |
| p95 | 0.00ms | 0.00ms | -0.00ms | -8.46% |
| p99 | 0.01ms | 0.01ms | +0.00ms | +31.34% |
| mean | 0.00ms | 0.00ms | +0.00ms | +1.46% |
| min | 0.00ms | 0.00ms | +0.00ms | +3.43% |
| max | 0.02ms | 0.01ms | +0.01ms | +78.00% |
| total | 0.58ms | 0.58ms | +0.01ms | +1.46% |

### lemonSqueezyVerifyWebhook

# Perf Report — lemonSqueezyVerifyWebhook.serial

| metric | value |
|---|---|
| iterations | 200 |
| warmup | 5 |
| p50 | 0.00ms |
| p95 | 0.01ms |
| p99 | 0.04ms |
| mean | 0.00ms |
| stdev | 0.01ms |
| min | 0.00ms |
| max | 0.11ms |
| total | 0.99ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p50 | 0.00ms | 0.00ms | +0.00ms | +9.34% |
| p95 | 0.01ms | 0.00ms | +0.01ms | +138.67% |
| p99 | 0.04ms | 0.00ms | +0.03ms | +725.92% |
| mean | 0.00ms | 0.00ms | +0.00ms | +52.57% |
| min | 0.00ms | 0.00ms | +0.00ms | +11.42% |
| max | 0.11ms | 0.01ms | +0.11ms | +1501.26% |
| total | 0.99ms | 0.65ms | +0.34ms | +52.57% |

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
| total | 0.09ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p50 | 0.00ms | 0.00ms | +0.00ms | +14.04% |
| p95 | 0.00ms | 0.00ms | -0.00ms | -64.21% |
| p99 | 0.00ms | 0.01ms | -0.00ms | -60.72% |
| mean | 0.00ms | 0.00ms | -0.00ms | -68.03% |
| min | 0.00ms | 0.00ms | +0.00ms | +16.40% |
| max | 0.01ms | 0.15ms | -0.14ms | -92.72% |
| total | 0.09ms | 0.29ms | -0.20ms | -68.03% |

### retryStart

# Perf Report — retryStart.serial

| metric | value |
|---|---|
| iterations | 200 |
| warmup | 5 |
| p50 | 0.00ms |
| p95 | 0.00ms |
| p99 | 0.02ms |
| mean | 0.01ms |
| stdev | 0.06ms |
| min | 0.00ms |
| max | 0.81ms |
| total | 1.44ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p50 | 0.00ms | 0.00ms | +0.00ms | +0.86% |
| p95 | 0.00ms | 0.01ms | -0.01ms | -57.53% |
| p99 | 0.02ms | 0.03ms | -0.01ms | -22.00% |
| mean | 0.01ms | 0.00ms | +0.00ms | +94.01% |
| min | 0.00ms | 0.00ms | +0.00ms | +1.90% |
| max | 0.81ms | 0.07ms | +0.74ms | +1122.33% |
| total | 1.44ms | 0.74ms | +0.70ms | +94.01% |

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
| total | 0.06ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p50 | 0.00ms | 0.00ms | -0.00ms | -54.59% |
| p95 | 0.00ms | 0.00ms | -0.00ms | -50.08% |
| p99 | 0.00ms | 0.01ms | -0.00ms | -63.92% |
| mean | 0.00ms | 0.00ms | -0.00ms | -68.34% |
| min | 0.00ms | 0.00ms | -0.00ms | -60.10% |
| max | 0.01ms | 0.05ms | -0.04ms | -84.69% |
| total | 0.06ms | 0.18ms | -0.12ms | -68.34% |

