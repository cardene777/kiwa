# Perf Suite — email

Threshold source: [docs/quality/perf-thresholds.md](../../quality/perf-thresholds)

## Serial p95 (concurrency = 1)

| op | p95 | cap | gate | regression |
|---|---|---|---|---|
| sendEmail | 0.00ms | 5ms | PASS | stable (検知には +0.5ms (baseline 比 +41389%) 以上の悪化が必要) |
| verifyWebhookSignature | 0.01ms | 5ms | PASS | stable (検知には +0.5ms (baseline 比 +7306%) 以上の悪化が必要) |
| parseDeliveryEvent | 0.00ms | 5ms | PASS | stable (検知には +0.5ms (baseline 比 +10195%) 以上の悪化が必要) |

## Concurrent p95 (concurrency = 10, 50 iter each)

| op | p95 | cap | gate |
|---|---|---|---|
| sendEmail | 0.01ms | 10ms | PASS |
| verifyWebhookSignature | 0.03ms | 10ms | PASS |
| parseDeliveryEvent | 0.02ms | 10ms | PASS |

## Memory retention (200 iter, arrayBuffers axis is the gate; heap is informational)

| op | heapUsed Δ | arrayBuffers Δ | cap | gc exposed | verdict |
|---|---|---|---|---|---|
| sendEmail | 279192 B | 0 B | 102400 B | yes | PASS |
| verifyWebhookSignature | -29744 B | 0 B | 102400 B | yes | PASS |
| parseDeliveryEvent | -512 B | 0 B | 102400 B | yes | PASS |

## Detailed serial reports

### sendEmail

# Perf Report — sendEmail.serial

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
| max | 0.02ms |
| total | 0.13ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p50 | 0.00ms | 0.00ms | -0.00ms | -12.50% |
| p95 | 0.00ms | 0.00ms | +0.00ms | +13.99% |
| p99 | 0.00ms | 0.00ms | -0.00ms | -4.69% |
| mean | 0.00ms | 0.00ms | -0.00ms | -5.83% |
| min | 0.00ms | 0.00ms | -0.00ms | -27.29% |
| max | 0.02ms | 0.01ms | +0.00ms | +15.18% |
| total | 0.13ms | 0.13ms | -0.01ms | -5.83% |

### verifyWebhookSignature

# Perf Report — verifyWebhookSignature.serial

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
| total | 0.58ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p50 | 0.00ms | 0.00ms | -0.00ms | -27.04% |
| p95 | 0.01ms | 0.01ms | +0.00ms | +4.48% |
| p99 | 0.01ms | 0.01ms | -0.00ms | -34.24% |
| mean | 0.00ms | 0.00ms | -0.00ms | -21.54% |
| min | 0.00ms | 0.00ms | -0.00ms | -30.99% |
| max | 0.01ms | 0.02ms | -0.01ms | -33.40% |
| total | 0.58ms | 0.73ms | -0.16ms | -21.54% |

### parseDeliveryEvent

# Perf Report — parseDeliveryEvent.serial

| metric | value |
|---|---|
| iterations | 200 |
| warmup | 5 |
| p50 | 0.00ms |
| p95 | 0.00ms |
| p99 | 0.02ms |
| mean | 0.00ms |
| stdev | 0.01ms |
| min | 0.00ms |
| max | 0.07ms |
| total | 0.28ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p50 | 0.00ms | 0.00ms | -0.00ms | -0.24% |
| p95 | 0.00ms | 0.00ms | -0.00ms | -21.37% |
| p99 | 0.02ms | 0.02ms | +0.00ms | +8.48% |
| mean | 0.00ms | 0.00ms | -0.00ms | -53.99% |
| min | 0.00ms | 0.00ms | -0.00ms | -33.33% |
| max | 0.07ms | 0.40ms | -0.33ms | -83.43% |
| total | 0.28ms | 0.60ms | -0.33ms | -53.99% |

