# Perf Suite — email

Threshold source: [docs/quality/perf-thresholds.md](../../quality/perf-thresholds)

## Serial p95 (concurrency = 1)

| op | p95 | cap | gate | regression |
|---|---|---|---|---|
| sendEmail | 0.00ms | 5ms | PASS | stable (検知には +0.5ms (baseline 比 +41389%) 以上の悪化が必要) — gate 無効 (regressionGate=false) |
| verifyWebhookSignature | 0.01ms | 5ms | PASS | stable (検知には +0.5ms (baseline 比 +7306%) 以上の悪化が必要) — gate 無効 (regressionGate=false) |
| parseDeliveryEvent | 0.00ms | 5ms | PASS | stable (検知には +0.5ms (baseline 比 +10195%) 以上の悪化が必要) — gate 無効 (regressionGate=false) |

## Concurrent p95 (concurrency = 10, 50 iter each)

| op | p95 | cap | gate |
|---|---|---|---|
| sendEmail | 0.01ms | 10ms | PASS |
| verifyWebhookSignature | 0.04ms | 10ms | PASS |
| parseDeliveryEvent | 0.19ms | 10ms | PASS |

## Memory retention (200 iter, arrayBuffers axis is the gate; heap is informational)

| op | heapUsed Δ | arrayBuffers Δ | cap | gc exposed | verdict |
|---|---|---|---|---|---|
| sendEmail | 29960 B | -48597 B | 102400 B | yes | PASS |
| verifyWebhookSignature | 616 B | 8192 B | 102400 B | yes | PASS |
| parseDeliveryEvent | -8976 B | 0 B | 102400 B | yes | PASS |

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
| total | 0.15ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p50 | 0.00ms | 0.00ms | 0.00ms | 0.00% |
| p95 | 0.00ms | 0.00ms | -0.00ms | -8.80% |
| p99 | 0.00ms | 0.00ms | +0.00ms | +7.83% |
| mean | 0.00ms | 0.00ms | +0.00ms | +12.41% |
| min | 0.00ms | 0.00ms | -0.00ms | -8.95% |
| max | 0.02ms | 0.01ms | +0.00ms | +19.38% |
| total | 0.15ms | 0.13ms | +0.02ms | +12.41% |

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
| total | 0.73ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p50 | 0.00ms | 0.00ms | +0.00ms | +2.69% |
| p95 | 0.01ms | 0.01ms | +0.00ms | +7.92% |
| p99 | 0.01ms | 0.01ms | -0.00ms | -20.22% |
| mean | 0.00ms | 0.00ms | -0.00ms | -0.17% |
| min | 0.00ms | 0.00ms | -0.00ms | -0.03% |
| max | 0.02ms | 0.02ms | -0.00ms | -21.66% |
| total | 0.73ms | 0.73ms | -0.00ms | -0.17% |

### parseDeliveryEvent

# Perf Report — parseDeliveryEvent.serial

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
| total | 0.14ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p50 | 0.00ms | 0.00ms | 0.00ms | 0.00% |
| p95 | 0.00ms | 0.00ms | -0.00ms | -74.69% |
| p99 | 0.01ms | 0.02ms | -0.01ms | -48.18% |
| mean | 0.00ms | 0.00ms | -0.00ms | -77.02% |
| min | 0.00ms | 0.00ms | 0.00ms | 0.00% |
| max | 0.01ms | 0.40ms | -0.38ms | -96.26% |
| total | 0.14ms | 0.60ms | -0.46ms | -77.02% |

