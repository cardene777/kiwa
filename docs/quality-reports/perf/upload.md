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
| uploadFile | 0.04ms | 10ms | PASS |
| createPresignedUrl | 0.03ms | 10ms | PASS |
| verifyUpload | 0.02ms | 10ms | PASS |

## Memory retention (200 iter, arrayBuffers axis is the gate; heap is informational)

| op | heapUsed Δ | arrayBuffers Δ | cap | gc exposed | verdict |
|---|---|---|---|---|---|
| uploadFile | 100872 B | -38595 B | 102400 B | yes | PASS |
| createPresignedUrl | -14208 B | 0 B | 102400 B | yes | PASS |
| verifyUpload | -7408 B | 0 B | 102400 B | yes | PASS |

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
| total | 0.62ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p50 | 0.00ms | 0.00ms | +0.00ms | +11.82% |
| p95 | 0.01ms | 0.01ms | -0.00ms | -4.59% |
| p99 | 0.02ms | 0.01ms | +0.00ms | +31.28% |
| mean | 0.00ms | 0.00ms | +0.00ms | +10.19% |
| min | 0.00ms | 0.00ms | +0.00ms | +13.07% |
| max | 0.03ms | 0.02ms | +0.01ms | +54.15% |
| total | 0.62ms | 0.56ms | +0.06ms | +10.19% |

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
| total | 0.52ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p50 | 0.00ms | 0.00ms | -0.00ms | -1.86% |
| p95 | 0.00ms | 0.00ms | +0.00ms | +14.78% |
| p99 | 0.01ms | 0.01ms | +0.00ms | +58.72% |
| mean | 0.00ms | 0.00ms | +0.00ms | +5.50% |
| min | 0.00ms | 0.00ms | +0.00ms | +6.87% |
| max | 0.02ms | 0.01ms | +0.00ms | +16.61% |
| total | 0.52ms | 0.49ms | +0.03ms | +5.50% |

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
| total | 0.28ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p50 | 0.00ms | 0.00ms | +0.00ms | +12.00% |
| p95 | 0.00ms | 0.00ms | +0.00ms | +24.19% |
| p99 | 0.01ms | 0.00ms | +0.00ms | +38.45% |
| mean | 0.00ms | 0.00ms | +0.00ms | +10.88% |
| min | 0.00ms | 0.00ms | +0.00ms | +13.15% |
| max | 0.01ms | 0.01ms | -0.00ms | -22.63% |
| total | 0.28ms | 0.25ms | +0.03ms | +10.88% |

