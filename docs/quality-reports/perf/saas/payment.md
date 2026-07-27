# Perf Suite — payment

Threshold source: [docs/quality/perf-thresholds.md](../../../quality/perf-thresholds)

## Serial p95 (concurrency = 1)

| op | p95 | cap | gate | regression |
|---|---|---|---|---|
| stripeSignWebhook | 0.01ms | 10ms | PASS | stable |
| stripeVerifyWebhook | 0.01ms | 10ms | PASS | stable |
| paddleSignWebhook | 0.00ms | 10ms | PASS | stable |
| paddleVerifyWebhook | 0.00ms | 10ms | PASS | stable |
| lemonSqueezySignWebhook | 0.00ms | 10ms | PASS | stable |
| lemonSqueezyVerifyWebhook | 0.00ms | 10ms | PASS | stable |
| dunningStart | 0.00ms | 5ms | PASS | stable |
| retryStart | 0.00ms | 5ms | PASS | stable |
| retryBackoffMs | 0.00ms | 5ms | PASS | stable |

## Concurrent p95 (concurrency = 10, 50 iter each)

| op | p95 | cap | gate |
|---|---|---|---|
| stripeSignWebhook | 0.04ms | 20ms | PASS |
| stripeVerifyWebhook | 0.04ms | 20ms | PASS |
| paddleSignWebhook | 0.04ms | 20ms | PASS |
| paddleVerifyWebhook | 0.04ms | 20ms | PASS |
| lemonSqueezySignWebhook | 0.03ms | 20ms | PASS |
| lemonSqueezyVerifyWebhook | 0.04ms | 20ms | PASS |
| dunningStart | 0.00ms | 10ms | PASS |
| retryStart | 0.03ms | 10ms | PASS |
| retryBackoffMs | 0.01ms | 10ms | PASS |

## Memory retention (200 iter, arrayBuffers axis is the gate; heap is informational)

| op | heapUsed Δ | arrayBuffers Δ | cap | gc exposed | verdict |
|---|---|---|---|---|---|
| stripeSignWebhook | -35880 B | 0 B | 102400 B | yes | PASS |
| stripeVerifyWebhook | -21776 B | 0 B | 102400 B | yes | PASS |
| paddleSignWebhook | 1328 B | 0 B | 102400 B | yes | PASS |
| paddleVerifyWebhook | 784 B | 0 B | 102400 B | yes | PASS |
| lemonSqueezySignWebhook | 5664 B | 0 B | 102400 B | yes | PASS |
| lemonSqueezyVerifyWebhook | 1304 B | 0 B | 102400 B | yes | PASS |
| dunningStart | 232 B | 0 B | 102400 B | yes | PASS |
| retryStart | 664 B | 0 B | 102400 B | yes | PASS |
| retryBackoffMs | -138888 B | 0 B | 102400 B | yes | PASS |

## Detailed serial reports

### stripeSignWebhook

# Perf Report — stripeSignWebhook.serial

| metric | value |
|---|---|
| iterations | 200 |
| warmup | 5 |
| p50 | 0.00ms |
| p95 | 0.01ms |
| p99 | 0.02ms |
| mean | 0.00ms |
| stdev | 0.00ms |
| min | 0.00ms |
| max | 0.03ms |
| total | 0.64ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p50 | 0.00ms | 0.00ms | +0.00ms | +2.63% |
| p95 | 0.01ms | 0.01ms | -0.00ms | -10.48% |
| p99 | 0.02ms | 0.02ms | +0.00ms | +18.35% |
| mean | 0.00ms | 0.00ms | +0.00ms | +0.90% |
| min | 0.00ms | 0.00ms | +0.00ms | +0.05% |
| max | 0.03ms | 0.03ms | +0.00ms | +3.86% |
| total | 0.64ms | 0.63ms | +0.01ms | +0.90% |

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
| max | 0.03ms |
| total | 0.71ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p50 | 0.00ms | 0.00ms | +0.00ms | +5.95% |
| p95 | 0.01ms | 0.00ms | +0.00ms | +36.58% |
| p99 | 0.01ms | 0.01ms | +0.00ms | +52.19% |
| mean | 0.00ms | 0.00ms | +0.00ms | +16.17% |
| min | 0.00ms | 0.00ms | +0.00ms | +1.57% |
| max | 0.03ms | 0.01ms | +0.02ms | +229.15% |
| total | 0.71ms | 0.61ms | +0.10ms | +16.17% |

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
| total | 0.66ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p50 | 0.00ms | 0.00ms | -0.00ms | -1.43% |
| p95 | 0.00ms | 0.01ms | -0.00ms | -48.96% |
| p99 | 0.01ms | 0.02ms | -0.01ms | -37.31% |
| mean | 0.00ms | 0.00ms | -0.00ms | -22.36% |
| min | 0.00ms | 0.00ms | +0.00ms | +0.04% |
| max | 0.02ms | 0.12ms | -0.10ms | -80.86% |
| total | 0.66ms | 0.84ms | -0.19ms | -22.36% |

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
| total | 0.65ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p50 | 0.00ms | 0.00ms | -0.00ms | -1.37% |
| p95 | 0.00ms | 0.00ms | +0.00ms | +27.98% |
| p99 | 0.01ms | 0.01ms | +0.00ms | +28.55% |
| mean | 0.00ms | 0.00ms | +0.00ms | +1.21% |
| min | 0.00ms | 0.00ms | 0.00ms | 0.00% |
| max | 0.01ms | 0.01ms | -0.00ms | -36.01% |
| total | 0.65ms | 0.64ms | +0.01ms | +1.21% |

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
| total | 0.51ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p50 | 0.00ms | 0.00ms | +0.00ms | +1.83% |
| p95 | 0.00ms | 0.00ms | -0.00ms | -14.01% |
| p99 | 0.01ms | 0.01ms | +0.00ms | +8.90% |
| mean | 0.00ms | 0.00ms | +0.00ms | +1.15% |
| min | 0.00ms | 0.00ms | +0.00ms | +3.83% |
| max | 0.01ms | 0.01ms | +0.00ms | +23.22% |
| total | 0.51ms | 0.51ms | +0.01ms | +1.15% |

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
| total | 0.66ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p50 | 0.00ms | 0.00ms | +0.00ms | +2.84% |
| p95 | 0.00ms | 0.00ms | +0.00ms | +14.79% |
| p99 | 0.01ms | 0.00ms | +0.00ms | +20.50% |
| mean | 0.00ms | 0.00ms | +0.00ms | +6.81% |
| min | 0.00ms | 0.00ms | +0.00ms | +3.01% |
| max | 0.01ms | 0.01ms | +0.00ms | +17.91% |
| total | 0.66ms | 0.62ms | +0.04ms | +6.81% |

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
| p50 | 0.00ms | 0.00ms | -0.00ms | -0.34% |
| p95 | 0.00ms | 0.00ms | +0.00ms | +12.28% |
| p99 | 0.00ms | 0.00ms | +0.00ms | +46.22% |
| mean | 0.00ms | 0.00ms | +0.00ms | +9.41% |
| min | 0.00ms | 0.00ms | -0.00ms | -16.80% |
| max | 0.01ms | 0.01ms | +0.00ms | +54.83% |
| total | 0.08ms | 0.07ms | +0.01ms | +9.41% |

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
| total | 0.49ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p50 | 0.00ms | 0.00ms | -0.00ms | -5.56% |
| p95 | 0.00ms | 0.00ms | +0.00ms | +26.88% |
| p99 | 0.01ms | 0.01ms | +0.00ms | +53.27% |
| mean | 0.00ms | 0.00ms | +0.00ms | +0.49% |
| min | 0.00ms | 0.00ms | -0.00ms | -4.11% |
| max | 0.01ms | 0.01ms | -0.00ms | -7.12% |
| total | 0.49ms | 0.48ms | +0.00ms | +0.49% |

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
| p50 | 0.00ms | 0.00ms | -0.00ms | -19.71% |
| p95 | 0.00ms | 0.00ms | +0.00ms | +16.40% |
| p99 | 0.00ms | 0.00ms | +0.00ms | +7.60% |
| mean | 0.00ms | 0.00ms | -0.00ms | -2.22% |
| min | 0.00ms | 0.00ms | 0.00ms | 0.00% |
| max | 0.01ms | 0.01ms | -0.00ms | -17.05% |
| total | 0.05ms | 0.05ms | -0.00ms | -2.22% |

