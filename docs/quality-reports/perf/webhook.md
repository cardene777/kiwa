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
| verifyIncoming | 0.12ms | 10ms | PASS |
| verifyWebhookSignature | 0.03ms | 10ms | PASS |
| parseWebhookPayload | 0.01ms | 10ms | PASS |

## Memory retention (200 iter, arrayBuffers axis is the gate; heap is informational)

| op | heapUsed Δ | arrayBuffers Δ | cap | gc exposed | verdict |
|---|---|---|---|---|---|
| verifyIncoming | 46800 B | -98301 B | 102400 B | yes | PASS |
| verifyWebhookSignature | 5984 B | -57344 B | 102400 B | yes | PASS |
| parseWebhookPayload | -14688 B | 0 B | 102400 B | yes | PASS |

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
| total | 0.96ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p50 | 0.00ms | 0.00ms | -0.00ms | -12.00% |
| p95 | 0.01ms | 0.01ms | +0.00ms | +5.28% |
| p99 | 0.02ms | 0.02ms | -0.01ms | -25.48% |
| mean | 0.00ms | 0.00ms | -0.00ms | -2.01% |
| min | 0.00ms | 0.00ms | +0.00ms | +7.79% |
| max | 0.02ms | 0.02ms | +0.00ms | +4.15% |
| total | 0.96ms | 0.98ms | -0.02ms | -2.01% |

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
| total | 0.47ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p50 | 0.00ms | 0.00ms | +0.00ms | +3.91% |
| p95 | 0.00ms | 0.00ms | +0.00ms | +1.45% |
| p99 | 0.01ms | 0.01ms | -0.00ms | -40.62% |
| mean | 0.00ms | 0.00ms | -0.00ms | -2.17% |
| min | 0.00ms | 0.00ms | +0.00ms | +2.10% |
| max | 0.01ms | 0.02ms | -0.01ms | -38.50% |
| total | 0.47ms | 0.48ms | -0.01ms | -2.17% |

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
| total | 0.10ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p50 | 0.00ms | 0.00ms | -0.00ms | -10.93% |
| p95 | 0.00ms | 0.00ms | +0.00ms | +10.55% |
| p99 | 0.00ms | 0.00ms | +0.00ms | +27.32% |
| mean | 0.00ms | 0.00ms | +0.00ms | +3.85% |
| min | 0.00ms | 0.00ms | 0.00ms | 0.00% |
| max | 0.01ms | 0.01ms | -0.00ms | -4.92% |
| total | 0.10ms | 0.09ms | +0.00ms | +3.85% |

