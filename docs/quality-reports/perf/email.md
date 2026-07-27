# Perf Suite — email

Threshold source: [docs/quality/perf-thresholds.md](../../quality/perf-thresholds)

## Serial p95 (concurrency = 1)

| op | p95 | cap | gate | regression |
|---|---|---|---|---|
| sendEmail | 0.00ms | 5ms | PASS | stable |
| verifyWebhookSignature | 0.01ms | 5ms | PASS | stable |
| parseDeliveryEvent | 0.00ms | 5ms | PASS | stable |

## Concurrent p95 (concurrency = 10, 50 iter each)

| op | p95 | cap | gate |
|---|---|---|---|
| sendEmail | 0.01ms | 10ms | PASS |
| verifyWebhookSignature | 0.03ms | 10ms | PASS |
| parseDeliveryEvent | 0.01ms | 10ms | PASS |

## Memory retention (200 iter, arrayBuffers axis is the gate; heap is informational)

| op | heapUsed Δ | arrayBuffers Δ | cap | gc exposed | verdict |
|---|---|---|---|---|---|
| sendEmail | 35560 B | 0 B | 102400 B | yes | PASS |
| verifyWebhookSignature | -29552 B | 0 B | 102400 B | yes | PASS |
| parseDeliveryEvent | 912 B | 0 B | 102400 B | yes | PASS |

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
| max | 0.01ms |
| total | 0.12ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p50 | 0.00ms | 0.00ms | -0.00ms | -8.95% |
| p95 | 0.00ms | 0.00ms | +0.00ms | +2.93% |
| p99 | 0.00ms | 0.00ms | -0.00ms | -13.92% |
| mean | 0.00ms | 0.00ms | -0.00ms | -9.08% |
| min | 0.00ms | 0.00ms | -0.00ms | -11.20% |
| max | 0.01ms | 0.01ms | -0.00ms | -16.01% |
| total | 0.12ms | 0.13ms | -0.01ms | -9.08% |

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
| max | 0.02ms |
| total | 0.59ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p50 | 0.00ms | 0.00ms | -0.00ms | -12.72% |
| p95 | 0.01ms | 0.01ms | -0.00ms | -18.64% |
| p99 | 0.01ms | 0.01ms | +0.00ms | +8.58% |
| mean | 0.00ms | 0.00ms | -0.00ms | -10.73% |
| min | 0.00ms | 0.00ms | -0.00ms | -12.04% |
| max | 0.02ms | 0.01ms | +0.01ms | +58.78% |
| total | 0.59ms | 0.66ms | -0.07ms | -10.73% |

### parseDeliveryEvent

# Perf Report — parseDeliveryEvent.serial

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
| total | 0.12ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p50 | 0.00ms | 0.00ms | -0.00ms | -10.07% |
| p95 | 0.00ms | 0.00ms | +0.00ms | +33.07% |
| p99 | 0.00ms | 0.00ms | +0.00ms | +36.10% |
| mean | 0.00ms | 0.00ms | +0.00ms | +6.33% |
| min | 0.00ms | 0.00ms | -0.00ms | -12.61% |
| max | 0.01ms | 0.01ms | +0.00ms | +28.02% |
| total | 0.12ms | 0.11ms | +0.01ms | +6.33% |

