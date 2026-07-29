# Perf Suite — webhook

Threshold source: [docs/quality/perf-thresholds.md](../../quality/perf-thresholds)

## Serial p95 (concurrency = 1)

| op | p95 | cap | gate | regression |
|---|---|---|---|---|
| verifyIncoming | 0.01ms | 5ms | PASS | stable (差 0.01ms が下限 0.5ms 未満で判定を保留) — gate 無効 (regressionGate=false) |
| verifyWebhookSignature | 0.00ms | 5ms | PASS | stable (検知には +0.5ms (baseline 比 +18443%) 以上の悪化が必要) — gate 無効 (regressionGate=false) |
| parseWebhookPayload | 0.00ms | 5ms | PASS | stable (検知には +0.5ms (baseline 比 +78945%) 以上の悪化が必要) — gate 無効 (regressionGate=false) |

## Concurrent p95 (concurrency = 10, 50 iter each)

| op | p95 | cap | gate |
|---|---|---|---|
| verifyIncoming | 0.05ms | 10ms | PASS |
| verifyWebhookSignature | 0.03ms | 10ms | PASS |
| parseWebhookPayload | 0.01ms | 10ms | PASS |

## Memory retention (200 iter, arrayBuffers axis is the gate; heap is informational)

| op | heapUsed Δ | arrayBuffers Δ | cap | gc exposed | verdict |
|---|---|---|---|---|---|
| verifyIncoming | 46280 B | 0 B | 102400 B | yes | PASS |
| verifyWebhookSignature | -22672 B | -40960 B | 102400 B | yes | PASS |
| parseWebhookPayload | 2656 B | 0 B | 102400 B | yes | PASS |

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
| total | 0.95ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p50 | 0.00ms | 0.00ms | +0.00ms | +2.43% |
| p95 | 0.01ms | 0.03ms | -0.01ms | -52.56% |
| p99 | 0.02ms | 0.05ms | -0.03ms | -61.09% |
| mean | 0.00ms | 0.01ms | -0.00ms | -28.64% |
| min | 0.00ms | 0.00ms | +0.00ms | +1.31% |
| max | 0.02ms | 0.08ms | -0.06ms | -71.04% |
| total | 0.95ms | 1.33ms | -0.38ms | -28.64% |

### verifyWebhookSignature

# Perf Report — verifyWebhookSignature.serial

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
| total | 0.45ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p50 | 0.00ms | 0.00ms | +0.00ms | +2.01% |
| p95 | 0.00ms | 0.00ms | -0.00ms | -3.88% |
| p99 | 0.00ms | 0.01ms | -0.00ms | -14.76% |
| mean | 0.00ms | 0.00ms | +0.00ms | +1.39% |
| min | 0.00ms | 0.00ms | +0.00ms | +4.33% |
| max | 0.01ms | 0.01ms | +0.00ms | +0.38% |
| total | 0.45ms | 0.44ms | +0.01ms | +1.39% |

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
| p50 | 0.00ms | 0.00ms | 0.00ms | 0.00% |
| p95 | 0.00ms | 0.00ms | +0.00ms | +19.08% |
| p99 | 0.00ms | 0.00ms | -0.00ms | -3.88% |
| mean | 0.00ms | 0.00ms | +0.00ms | +7.06% |
| min | 0.00ms | 0.00ms | +0.00ms | +0.34% |
| max | 0.01ms | 0.00ms | +0.00ms | +50.01% |
| total | 0.09ms | 0.08ms | +0.01ms | +7.06% |

