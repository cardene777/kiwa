# Perf Suite — webhook

Threshold source: [docs/quality/perf-thresholds.md](../../quality/perf-thresholds)

## Serial p95 (concurrency = 1)

| op | p95 | cap | gate | regression |
|---|---|---|---|---|
| verifyIncoming | 0.01ms | 5ms | PASS | stable |
| verifyWebhookSignature | 0.00ms | 5ms | PASS | stable |
| parseWebhookPayload | 0.00ms | 5ms | PASS | stable |

## Concurrent p95 (concurrency = 10, 50 iter each)

| op | p95 | cap | gate |
|---|---|---|---|
| verifyIncoming | 0.05ms | 10ms | PASS |
| verifyWebhookSignature | 0.02ms | 10ms | PASS |
| parseWebhookPayload | 0.01ms | 10ms | PASS |

## Memory retention (200 iter, arrayBuffers axis is the gate; heap is informational)

| op | heapUsed Δ | arrayBuffers Δ | cap | verdict |
|---|---|---|---|---|
| verifyIncoming | 460520 B | 16384 B | 102400 B | PASS |
| verifyWebhookSignature | 329304 B | 16384 B | 102400 B | PASS |
| parseWebhookPayload | 230864 B | 0 B | 102400 B | PASS |

## Detailed serial reports

### verifyIncoming

# Perf Report — verifyIncoming.serial

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
| max | 0.02ms |
| total | 0.83ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p50 | 0.00ms | 0.00ms | -0.00ms | -4.98% |
| p95 | 0.01ms | 0.01ms | -0.00ms | -10.82% |
| p99 | 0.02ms | 0.02ms | -0.00ms | -10.26% |
| mean | 0.00ms | 0.00ms | -0.00ms | -8.81% |
| min | 0.00ms | 0.00ms | +0.00ms | +1.39% |
| max | 0.02ms | 0.03ms | -0.01ms | -35.55% |
| total | 0.83ms | 0.91ms | -0.08ms | -8.81% |

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
| total | 0.39ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p50 | 0.00ms | 0.00ms | 0.00ms | 0.00% |
| p95 | 0.00ms | 0.00ms | -0.00ms | -16.67% |
| p99 | 0.01ms | 0.01ms | +0.00ms | +66.43% |
| mean | 0.00ms | 0.00ms | -0.00ms | -2.39% |
| min | 0.00ms | 0.00ms | 0.00ms | 0.00% |
| max | 0.01ms | 0.01ms | +0.00ms | +20.32% |
| total | 0.39ms | 0.40ms | -0.01ms | -2.39% |

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
| total | 0.08ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p50 | 0.00ms | 0.00ms | -0.00ms | -12.31% |
| p95 | 0.00ms | 0.00ms | -0.00ms | -41.79% |
| p99 | 0.00ms | 0.00ms | +0.00ms | +81.19% |
| mean | 0.00ms | 0.00ms | -0.00ms | -7.70% |
| min | 0.00ms | 0.00ms | 0.00ms | 0.00% |
| max | 0.01ms | 0.01ms | +0.00ms | +39.68% |
| total | 0.08ms | 0.09ms | -0.01ms | -7.70% |

