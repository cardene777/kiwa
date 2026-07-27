# Perf Suite — upload

Threshold source: [docs/quality/perf-thresholds.md](../../quality/perf-thresholds)

## Serial p95 (concurrency = 1)

| op | p95 | cap | gate | regression |
|---|---|---|---|---|
| uploadFile | 0.01ms | 5ms | PASS | stable |
| createPresignedUrl | 0.00ms | 5ms | PASS | stable |
| verifyUpload | 0.00ms | 5ms | PASS | stable |

## Concurrent p95 (concurrency = 10, 50 iter each)

| op | p95 | cap | gate |
|---|---|---|---|
| uploadFile | 0.03ms | 10ms | PASS |
| createPresignedUrl | 0.04ms | 10ms | PASS |
| verifyUpload | 0.02ms | 10ms | PASS |

## Memory retention (200 iter, arrayBuffers axis is the gate; heap is informational)

| op | heapUsed Δ | arrayBuffers Δ | cap | gc exposed | verdict |
|---|---|---|---|---|---|
| uploadFile | 102952 B | 8192 B | 102400 B | yes | PASS |
| createPresignedUrl | -26288 B | 0 B | 102400 B | yes | PASS |
| verifyUpload | -21568 B | 0 B | 102400 B | yes | PASS |

## Detailed serial reports

### uploadFile

# Perf Report — uploadFile.serial

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
| max | 0.03ms |
| total | 0.65ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p50 | 0.00ms | 0.00ms | +0.00ms | +26.86% |
| p95 | 0.01ms | 0.01ms | +0.00ms | +13.52% |
| p99 | 0.02ms | 0.01ms | +0.00ms | +2.77% |
| mean | 0.00ms | 0.00ms | +0.00ms | +15.42% |
| min | 0.00ms | 0.00ms | +0.00ms | +15.72% |
| max | 0.03ms | 0.02ms | +0.00ms | +16.42% |
| total | 0.65ms | 0.56ms | +0.09ms | +15.42% |

### createPresignedUrl

# Perf Report — createPresignedUrl.serial

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
| max | 0.02ms |
| total | 0.57ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p50 | 0.00ms | 0.00ms | +0.00ms | +18.89% |
| p95 | 0.00ms | 0.00ms | -0.00ms | -4.39% |
| p99 | 0.01ms | 0.01ms | +0.00ms | +6.77% |
| mean | 0.00ms | 0.00ms | +0.00ms | +17.34% |
| min | 0.00ms | 0.00ms | +0.00ms | +36.39% |
| max | 0.02ms | 0.01ms | +0.00ms | +10.89% |
| total | 0.57ms | 0.49ms | +0.08ms | +17.34% |

### verifyUpload

# Perf Report — verifyUpload.serial

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
| total | 0.29ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p50 | 0.00ms | 0.00ms | +0.00ms | +19.96% |
| p95 | 0.00ms | 0.00ms | +0.00ms | +24.86% |
| p99 | 0.01ms | 0.00ms | +0.00ms | +34.48% |
| mean | 0.00ms | 0.00ms | +0.00ms | +12.99% |
| min | 0.00ms | 0.00ms | +0.00ms | +17.43% |
| max | 0.01ms | 0.01ms | -0.01ms | -41.34% |
| total | 0.29ms | 0.25ms | +0.03ms | +12.99% |

