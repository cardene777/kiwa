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
| sendEmail | 0.03ms | 10ms | PASS |
| verifyWebhookSignature | 0.18ms | 10ms | PASS |
| parseDeliveryEvent | 0.01ms | 10ms | PASS |

## Memory retention (200 iter, arrayBuffers axis is the gate; heap is informational)

| op | heapUsed Δ | arrayBuffers Δ | cap | gc exposed | verdict |
|---|---|---|---|---|---|
| sendEmail | 36088 B | -48041 B | 102400 B | yes | PASS |
| verifyWebhookSignature | -28008 B | 0 B | 102400 B | yes | PASS |
| parseDeliveryEvent | 816 B | 0 B | 102400 B | yes | PASS |

## Detailed serial reports

### sendEmail

# Perf Report — sendEmail.serial

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
| max | 0.03ms |
| total | 0.30ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p50 | 0.00ms | 0.00ms | +0.00ms | +154.80% |
| p95 | 0.00ms | 0.00ms | +0.00ms | +65.51% |
| p99 | 0.01ms | 0.00ms | +0.01ms | +174.07% |
| mean | 0.00ms | 0.00ms | +0.00ms | +139.58% |
| min | 0.00ms | 0.00ms | +0.00ms | +44.53% |
| max | 0.03ms | 0.01ms | +0.01ms | +74.72% |
| total | 0.30ms | 0.13ms | +0.18ms | +139.58% |

### verifyWebhookSignature

# Perf Report — verifyWebhookSignature.serial

| metric | value |
|---|---|
| iterations | 200 |
| warmup | 5 |
| p50 | 0.00ms |
| p95 | 0.01ms |
| p99 | 0.03ms |
| mean | 0.00ms |
| stdev | 0.01ms |
| min | 0.00ms |
| max | 0.13ms |
| total | 0.89ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p50 | 0.00ms | 0.00ms | +0.00ms | +1.60% |
| p95 | 0.01ms | 0.01ms | +0.00ms | +34.84% |
| p99 | 0.03ms | 0.01ms | +0.02ms | +152.61% |
| mean | 0.00ms | 0.00ms | +0.00ms | +34.73% |
| min | 0.00ms | 0.00ms | -0.00ms | -5.17% |
| max | 0.13ms | 0.01ms | +0.12ms | +772.16% |
| total | 0.89ms | 0.66ms | +0.23ms | +34.73% |

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
| total | 0.11ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p50 | 0.00ms | 0.00ms | -0.00ms | -10.07% |
| p95 | 0.00ms | 0.00ms | +0.00ms | +5.10% |
| p99 | 0.00ms | 0.00ms | +0.00ms | +16.84% |
| mean | 0.00ms | 0.00ms | +0.00ms | +3.13% |
| min | 0.00ms | 0.00ms | -0.00ms | -24.92% |
| max | 0.01ms | 0.01ms | +0.00ms | +52.17% |
| total | 0.11ms | 0.11ms | +0.00ms | +3.13% |

