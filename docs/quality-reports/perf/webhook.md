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
| verifyWebhookSignature | 0.03ms | 10ms | PASS |
| parseWebhookPayload | 0.01ms | 10ms | PASS |

## Memory retention (200 iter, arrayBuffers axis is the gate; heap is informational)

| op | heapUsed Δ | arrayBuffers Δ | cap | gc exposed | verdict |
|---|---|---|---|---|---|
| verifyIncoming | 42912 B | 0 B | 102400 B | yes | PASS |
| verifyWebhookSignature | -480 B | 0 B | 102400 B | yes | PASS |
| parseWebhookPayload | 816 B | 0 B | 102400 B | yes | PASS |

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
| total | 0.86ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p50 | 0.00ms | 0.00ms | -0.00ms | -21.01% |
| p95 | 0.01ms | 0.01ms | -0.00ms | -16.48% |
| p99 | 0.02ms | 0.02ms | -0.00ms | -7.97% |
| mean | 0.00ms | 0.00ms | -0.00ms | -12.25% |
| min | 0.00ms | 0.00ms | -0.00ms | -7.79% |
| max | 0.02ms | 0.02ms | -0.00ms | -6.68% |
| total | 0.86ms | 0.98ms | -0.12ms | -12.25% |

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
| p50 | 0.00ms | 0.00ms | -0.00ms | -9.79% |
| p95 | 0.00ms | 0.00ms | +0.00ms | +3.12% |
| p99 | 0.01ms | 0.01ms | -0.00ms | -22.94% |
| mean | 0.00ms | 0.00ms | -0.00ms | -11.15% |
| min | 0.00ms | 0.00ms | -0.00ms | -10.45% |
| max | 0.01ms | 0.02ms | -0.00ms | -21.55% |
| total | 0.43ms | 0.48ms | -0.05ms | -11.15% |

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
| p50 | 0.00ms | 0.00ms | -0.00ms | -11.20% |
| p95 | 0.00ms | 0.00ms | -0.00ms | -5.70% |
| p99 | 0.00ms | 0.00ms | +0.00ms | +31.40% |
| mean | 0.00ms | 0.00ms | -0.00ms | -2.64% |
| min | 0.00ms | 0.00ms | -0.00ms | -12.61% |
| max | 0.01ms | 0.01ms | +0.00ms | +59.57% |
| total | 0.09ms | 0.09ms | -0.00ms | -2.64% |

