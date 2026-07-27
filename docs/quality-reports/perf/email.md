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

| op | heapUsed Δ | arrayBuffers Δ | cap | verdict |
|---|---|---|---|---|
| sendEmail | 513736 B | 0 B | 102400 B | PASS |
| verifyWebhookSignature | 319320 B | 16384 B | 102400 B | PASS |
| parseDeliveryEvent | 213288 B | 0 B | 102400 B | PASS |

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
| total | 0.11ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p50 | 0.00ms | 0.00ms | +0.00ms | +0.24% |
| p95 | 0.00ms | 0.00ms | -0.00ms | -3.21% |
| p99 | 0.00ms | 0.00ms | -0.00ms | -3.87% |
| mean | 0.00ms | 0.00ms | +0.00ms | +4.61% |
| min | 0.00ms | 0.00ms | +0.00ms | +14.43% |
| max | 0.01ms | 0.01ms | +0.00ms | +35.53% |
| total | 0.11ms | 0.11ms | +0.01ms | +4.61% |

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
| total | 0.57ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p50 | 0.00ms | 0.00ms | +0.00ms | +1.87% |
| p95 | 0.01ms | 0.01ms | +0.00ms | +10.31% |
| p99 | 0.01ms | 0.01ms | +0.00ms | +38.21% |
| mean | 0.00ms | 0.00ms | +0.00ms | +3.74% |
| min | 0.00ms | 0.00ms | 0.00ms | 0.00% |
| max | 0.02ms | 0.01ms | +0.01ms | +59.23% |
| total | 0.57ms | 0.55ms | +0.02ms | +3.74% |

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
| p50 | 0.00ms | 0.00ms | +0.00ms | +12.28% |
| p95 | 0.00ms | 0.00ms | -0.00ms | -4.64% |
| p99 | 0.00ms | 0.00ms | +0.00ms | +31.71% |
| mean | 0.00ms | 0.00ms | +0.00ms | +3.44% |
| min | 0.00ms | 0.00ms | +0.00ms | +16.40% |
| max | 0.01ms | 0.01ms | +0.00ms | +11.06% |
| total | 0.11ms | 0.11ms | +0.00ms | +3.44% |

