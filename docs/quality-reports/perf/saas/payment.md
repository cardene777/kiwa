# Perf Suite — payment

Threshold source: [docs/quality/perf-thresholds.md](../../../quality/perf-thresholds)

## Serial p95 (concurrency = 1)

| op | p95 | cap | gate | regression |
|---|---|---|---|---|
| stripeSignWebhook | 0.01ms | 10ms | PASS | stable |
| stripeVerifyWebhook | 0.00ms | 10ms | PASS | stable |
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
| stripeVerifyWebhook | 0.05ms | 20ms | PASS |
| paddleSignWebhook | 0.04ms | 20ms | PASS |
| paddleVerifyWebhook | 0.03ms | 20ms | PASS |
| lemonSqueezySignWebhook | 0.03ms | 20ms | PASS |
| lemonSqueezyVerifyWebhook | 0.03ms | 20ms | PASS |
| dunningStart | 0.01ms | 10ms | PASS |
| retryStart | 0.03ms | 10ms | PASS |
| retryBackoffMs | 0.00ms | 10ms | PASS |

## Memory retention (200 iter, arrayBuffers axis is the gate; heap is informational)

| op | heapUsed Δ | arrayBuffers Δ | cap | gc exposed | verdict |
|---|---|---|---|---|---|
| stripeSignWebhook | -35440 B | 0 B | 102400 B | yes | PASS |
| stripeVerifyWebhook | -21328 B | -106496 B | 102400 B | yes | PASS |
| paddleSignWebhook | 1304 B | 0 B | 102400 B | yes | PASS |
| paddleVerifyWebhook | 784 B | 0 B | 102400 B | yes | PASS |
| lemonSqueezySignWebhook | -4248 B | 0 B | 102400 B | yes | PASS |
| lemonSqueezyVerifyWebhook | 2288 B | 0 B | 102400 B | yes | PASS |
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
| p99 | 0.02ms |
| mean | 0.00ms |
| stdev | 0.00ms |
| min | 0.00ms |
| max | 0.03ms |
| total | 0.64ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p50 | 0.00ms | 0.00ms | +0.00ms | +1.77% |
| p95 | 0.01ms | 0.01ms | -0.00ms | -6.49% |
| p99 | 0.02ms | 0.02ms | +0.00ms | +4.83% |
| mean | 0.00ms | 0.00ms | +0.00ms | +1.26% |
| min | 0.00ms | 0.00ms | -0.00ms | -1.90% |
| max | 0.03ms | 0.03ms | +0.00ms | +9.18% |
| total | 0.64ms | 0.63ms | +0.01ms | +1.26% |

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
| max | 0.02ms |
| total | 0.68ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p50 | 0.00ms | 0.00ms | +0.00ms | +7.45% |
| p95 | 0.00ms | 0.00ms | +0.00ms | +13.50% |
| p99 | 0.01ms | 0.01ms | +0.00ms | +44.59% |
| mean | 0.00ms | 0.00ms | +0.00ms | +10.66% |
| min | 0.00ms | 0.00ms | +0.00ms | +4.65% |
| max | 0.02ms | 0.01ms | +0.01ms | +118.51% |
| total | 0.68ms | 0.61ms | +0.07ms | +10.66% |

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
| total | 0.65ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p50 | 0.00ms | 0.00ms | +0.00ms | +2.89% |
| p95 | 0.00ms | 0.01ms | -0.00ms | -47.30% |
| p99 | 0.01ms | 0.02ms | -0.01ms | -54.24% |
| mean | 0.00ms | 0.00ms | -0.00ms | -23.01% |
| min | 0.00ms | 0.00ms | +0.00ms | +4.73% |
| max | 0.02ms | 0.12ms | -0.11ms | -86.25% |
| total | 0.65ms | 0.84ms | -0.19ms | -23.01% |

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
| total | 0.66ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p50 | 0.00ms | 0.00ms | +0.00ms | +2.77% |
| p95 | 0.00ms | 0.00ms | +0.00ms | +5.26% |
| p99 | 0.01ms | 0.01ms | +0.00ms | +42.74% |
| mean | 0.00ms | 0.00ms | +0.00ms | +3.34% |
| min | 0.00ms | 0.00ms | +0.00ms | +1.48% |
| max | 0.01ms | 0.01ms | -0.00ms | -4.31% |
| total | 0.66ms | 0.64ms | +0.02ms | +3.34% |

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
| p50 | 0.00ms | 0.00ms | 0.00ms | 0.00% |
| p95 | 0.00ms | 0.00ms | -0.00ms | -11.75% |
| p99 | 0.01ms | 0.01ms | -0.00ms | -0.42% |
| mean | 0.00ms | 0.00ms | -0.00ms | -0.53% |
| min | 0.00ms | 0.00ms | 0.00ms | 0.00% |
| max | 0.01ms | 0.01ms | +0.00ms | +18.49% |
| total | 0.50ms | 0.51ms | -0.00ms | -0.53% |

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
| total | 0.62ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p50 | 0.00ms | 0.00ms | -0.00ms | -1.39% |
| p95 | 0.00ms | 0.00ms | +0.00ms | +1.92% |
| p99 | 0.01ms | 0.00ms | +0.00ms | +7.51% |
| mean | 0.00ms | 0.00ms | -0.00ms | -0.41% |
| min | 0.00ms | 0.00ms | -0.00ms | -1.47% |
| max | 0.01ms | 0.01ms | +0.00ms | +8.96% |
| total | 0.62ms | 0.62ms | -0.00ms | -0.41% |

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
| total | 0.07ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p50 | 0.00ms | 0.00ms | -0.00ms | -0.34% |
| p95 | 0.00ms | 0.00ms | -0.00ms | -0.30% |
| p99 | 0.00ms | 0.00ms | +0.00ms | +44.36% |
| mean | 0.00ms | 0.00ms | +0.00ms | +5.93% |
| min | 0.00ms | 0.00ms | 0.00ms | 0.00% |
| max | 0.01ms | 0.01ms | +0.00ms | +51.86% |
| total | 0.07ms | 0.07ms | +0.00ms | +5.93% |

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
| p95 | 0.00ms | 0.00ms | +0.00ms | +1.86% |
| p99 | 0.01ms | 0.01ms | +0.00ms | +52.99% |
| mean | 0.00ms | 0.00ms | +0.00ms | +0.23% |
| min | 0.00ms | 0.00ms | -0.00ms | -0.05% |
| max | 0.01ms | 0.01ms | -0.00ms | -14.24% |
| total | 0.48ms | 0.48ms | +0.00ms | +0.23% |

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
| p50 | 0.00ms | 0.00ms | 0.00ms | 0.00% |
| p95 | 0.00ms | 0.00ms | +0.00ms | +16.40% |
| p99 | 0.00ms | 0.00ms | -0.00ms | -3.78% |
| mean | 0.00ms | 0.00ms | +0.00ms | +5.74% |
| min | 0.00ms | 0.00ms | 0.00ms | 0.00% |
| max | 0.01ms | 0.01ms | -0.00ms | -1.11% |
| total | 0.05ms | 0.05ms | +0.00ms | +5.74% |

