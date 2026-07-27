# Perf Suite — payment

Threshold source: [docs/quality/perf-thresholds.md](../../quality/perf-thresholds)

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
| paddleVerifyWebhook | 0.03ms | 20ms | PASS |
| lemonSqueezySignWebhook | 0.03ms | 20ms | PASS |
| lemonSqueezyVerifyWebhook | 0.04ms | 20ms | PASS |
| dunningStart | 0.00ms | 10ms | PASS |
| retryStart | 0.05ms | 10ms | PASS |
| retryBackoffMs | 0.00ms | 10ms | PASS |

## Memory retention (200 iter, arrayBuffers axis is the gate; heap is informational)

| op | heapUsed Δ | arrayBuffers Δ | cap | gc exposed | verdict |
|---|---|---|---|---|---|
| stripeSignWebhook | -37040 B | 0 B | 102400 B | yes | PASS |
| stripeVerifyWebhook | -5560 B | 0 B | 102400 B | yes | PASS |
| paddleSignWebhook | -16120 B | 0 B | 102400 B | yes | PASS |
| paddleVerifyWebhook | 880 B | 0 B | 102400 B | yes | PASS |
| lemonSqueezySignWebhook | -259944 B | 0 B | 102400 B | yes | PASS |
| lemonSqueezyVerifyWebhook | 1400 B | 0 B | 102400 B | yes | PASS |
| dunningStart | 312 B | 0 B | 102400 B | yes | PASS |
| retryStart | 216 B | 0 B | 102400 B | yes | PASS |
| retryBackoffMs | 7024 B | 0 B | 102400 B | yes | PASS |

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
| total | 0.64ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p50 | 0.00ms | 0.00ms | +0.00ms | +1.77% |
| p95 | 0.01ms | 0.01ms | -0.00ms | -12.06% |
| p99 | 0.01ms | 0.02ms | -0.00ms | -2.85% |
| mean | 0.00ms | 0.00ms | +0.00ms | +0.52% |
| min | 0.00ms | 0.00ms | 0.00ms | 0.00% |
| max | 0.03ms | 0.03ms | +0.00ms | +10.14% |
| total | 0.64ms | 0.63ms | +0.00ms | +0.52% |

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
| max | 0.01ms |
| total | 0.65ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p50 | 0.00ms | 0.00ms | +0.00ms | +4.48% |
| p95 | 0.01ms | 0.00ms | +0.00ms | +18.21% |
| p99 | 0.01ms | 0.01ms | +0.00ms | +24.74% |
| mean | 0.00ms | 0.00ms | +0.00ms | +6.96% |
| min | 0.00ms | 0.00ms | +0.00ms | +1.54% |
| max | 0.01ms | 0.01ms | +0.00ms | +34.25% |
| total | 0.65ms | 0.61ms | +0.04ms | +6.96% |

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
| total | 0.71ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p50 | 0.00ms | 0.00ms | +0.00ms | +8.70% |
| p95 | 0.00ms | 0.01ms | -0.00ms | -43.50% |
| p99 | 0.01ms | 0.02ms | -0.01ms | -33.61% |
| mean | 0.00ms | 0.00ms | -0.00ms | -16.43% |
| min | 0.00ms | 0.00ms | +0.00ms | +9.38% |
| max | 0.02ms | 0.12ms | -0.10ms | -84.80% |
| total | 0.71ms | 0.84ms | -0.14ms | -16.43% |

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
| max | 0.02ms |
| total | 0.67ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p50 | 0.00ms | 0.00ms | +0.00ms | +2.80% |
| p95 | 0.00ms | 0.00ms | +0.00ms | +14.78% |
| p99 | 0.01ms | 0.01ms | +0.00ms | +64.99% |
| mean | 0.00ms | 0.00ms | +0.00ms | +5.42% |
| min | 0.00ms | 0.00ms | +0.00ms | +2.93% |
| max | 0.02ms | 0.01ms | +0.00ms | +15.69% |
| total | 0.67ms | 0.64ms | +0.03ms | +5.42% |

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
| p95 | 0.00ms | 0.00ms | -0.00ms | -11.54% |
| p99 | 0.01ms | 0.01ms | -0.00ms | -7.72% |
| mean | 0.00ms | 0.00ms | +0.00ms | +1.25% |
| min | 0.00ms | 0.00ms | +0.00ms | +1.89% |
| max | 0.01ms | 0.01ms | +0.00ms | +33.06% |
| total | 0.51ms | 0.51ms | +0.01ms | +1.25% |

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
| total | 0.68ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p50 | 0.00ms | 0.00ms | +0.00ms | +9.87% |
| p95 | 0.00ms | 0.00ms | +0.00ms | +7.80% |
| p99 | 0.01ms | 0.00ms | +0.00ms | +16.72% |
| mean | 0.00ms | 0.00ms | +0.00ms | +9.53% |
| min | 0.00ms | 0.00ms | +0.00ms | +10.46% |
| max | 0.01ms | 0.01ms | +0.00ms | +8.45% |
| total | 0.68ms | 0.62ms | +0.06ms | +9.53% |

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
| p95 | 0.00ms | 0.00ms | +0.00ms | +15.39% |
| p99 | 0.00ms | 0.00ms | +0.00ms | +44.28% |
| mean | 0.00ms | 0.00ms | +0.00ms | +10.77% |
| min | 0.00ms | 0.00ms | -0.00ms | -16.80% |
| max | 0.01ms | 0.01ms | +0.00ms | +72.59% |
| total | 0.08ms | 0.07ms | +0.01ms | +10.77% |

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
| total | 0.48ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p50 | 0.00ms | 0.00ms | -0.00ms | -1.87% |
| p95 | 0.00ms | 0.00ms | +0.00ms | +1.55% |
| p99 | 0.01ms | 0.01ms | +0.00ms | +51.56% |
| mean | 0.00ms | 0.00ms | +0.00ms | +0.11% |
| min | 0.00ms | 0.00ms | +0.00ms | +2.01% |
| max | 0.01ms | 0.01ms | -0.00ms | -14.53% |
| total | 0.48ms | 0.48ms | +0.00ms | +0.11% |

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
| p95 | 0.00ms | 0.00ms | 0.00ms | 0.00% |
| p99 | 0.00ms | 0.00ms | +0.00ms | +7.82% |
| mean | 0.00ms | 0.00ms | +0.00ms | +0.42% |
| min | 0.00ms | 0.00ms | 0.00ms | 0.00% |
| max | 0.01ms | 0.01ms | -0.00ms | -7.15% |
| total | 0.05ms | 0.05ms | +0.00ms | +0.42% |

