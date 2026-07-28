# Perf Suite — webhook

Threshold source: [docs/quality/perf-thresholds.md](../../quality/perf-thresholds)

## Serial p95 (concurrency = 1)

| op | p95 | cap | gate | regression |
|---|---|---|---|---|
| verifyIncoming | 0.02ms | 5ms | PASS | stable (検知には +0.5ms (baseline 比 +2000%) 以上の悪化が必要) |
| verifyWebhookSignature | 0.00ms | 5ms | PASS | stable (検知には +0.5ms (baseline 比 +18443%) 以上の悪化が必要) |
| parseWebhookPayload | 0.00ms | 5ms | PASS | stable (検知には +0.5ms (baseline 比 +78945%) 以上の悪化が必要) |

## Concurrent p95 (concurrency = 10, 50 iter each)

| op | p95 | cap | gate |
|---|---|---|---|
| verifyIncoming | 0.05ms | 10ms | PASS |
| verifyWebhookSignature | 0.03ms | 10ms | PASS |
| parseWebhookPayload | 0.01ms | 10ms | PASS |

## Memory retention (200 iter, arrayBuffers axis is the gate; heap is informational)

| op | heapUsed Δ | arrayBuffers Δ | cap | gc exposed | verdict |
|---|---|---|---|---|---|
| verifyIncoming | 46720 B | 0 B | 102400 B | yes | PASS |
| verifyWebhookSignature | -17472 B | 0 B | 102400 B | yes | PASS |
| parseWebhookPayload | 616 B | 0 B | 102400 B | yes | PASS |

## Detailed serial reports

### verifyIncoming

# Perf Report — verifyIncoming.serial

| metric | value |
|---|---|
| iterations | 200 |
| warmup | 5 |
| p50 | 0.00ms |
| p95 | 0.02ms |
| p99 | 0.06ms |
| mean | 0.01ms |
| stdev | 0.01ms |
| min | 0.00ms |
| max | 0.08ms |
| total | 1.27ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p50 | 0.00ms | 0.00ms | -0.00ms | -3.61% |
| p95 | 0.02ms | 0.03ms | -0.01ms | -36.16% |
| p99 | 0.06ms | 0.05ms | +0.01ms | +13.73% |
| mean | 0.01ms | 0.01ms | -0.00ms | -3.89% |
| min | 0.00ms | 0.00ms | -0.00ms | -9.34% |
| max | 0.08ms | 0.08ms | -0.00ms | -4.14% |
| total | 1.27ms | 1.33ms | -0.05ms | -3.89% |

### verifyWebhookSignature

# Perf Report — verifyWebhookSignature.serial

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
| total | 0.43ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p50 | 0.00ms | 0.00ms | -0.00ms | -6.12% |
| p95 | 0.00ms | 0.00ms | 0.00ms | 0.00% |
| p99 | 0.01ms | 0.01ms | +0.00ms | +69.36% |
| mean | 0.00ms | 0.00ms | -0.00ms | -2.24% |
| min | 0.00ms | 0.00ms | -0.00ms | -4.38% |
| max | 0.01ms | 0.01ms | +0.00ms | +28.90% |
| total | 0.43ms | 0.44ms | -0.01ms | -2.24% |

### parseWebhookPayload

# Perf Report — parseWebhookPayload.serial

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
| p50 | 0.00ms | 0.00ms | -0.00ms | -0.30% |
| p95 | 0.00ms | 0.00ms | -0.00ms | -12.93% |
| p99 | 0.00ms | 0.00ms | +0.00ms | +46.39% |
| mean | 0.00ms | 0.00ms | +0.00ms | +14.27% |
| min | 0.00ms | 0.00ms | 0.00ms | 0.00% |
| max | 0.01ms | 0.00ms | +0.01ms | +226.55% |
| total | 0.09ms | 0.08ms | +0.01ms | +14.27% |

