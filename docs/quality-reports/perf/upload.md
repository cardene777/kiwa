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
| createPresignedUrl | 0.03ms | 10ms | PASS |
| verifyUpload | 0.02ms | 10ms | PASS |

## Memory retention (200 iter, arrayBuffers axis is the gate; heap is informational)

| op | heapUsed Δ | arrayBuffers Δ | cap | gc exposed | verdict |
|---|---|---|---|---|---|
| uploadFile | -190528 B | 8192 B | 102400 B | yes | PASS |
| createPresignedUrl | -10880 B | 0 B | 102400 B | yes | PASS |
| verifyUpload | 253776 B | 0 B | 102400 B | yes | PASS |

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
| max | 0.02ms |
| total | 0.54ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p50 | 0.00ms | 0.00ms | -0.00ms | -1.06% |
| p95 | 0.01ms | 0.01ms | -0.00ms | -6.36% |
| p99 | 0.02ms | 0.01ms | +0.00ms | +1.79% |
| mean | 0.00ms | 0.00ms | -0.00ms | -4.14% |
| min | 0.00ms | 0.00ms | +0.00ms | +2.59% |
| max | 0.02ms | 0.02ms | -0.00ms | -2.45% |
| total | 0.54ms | 0.56ms | -0.02ms | -4.14% |

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
| max | 0.01ms |
| total | 0.45ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p50 | 0.00ms | 0.00ms | -0.00ms | -13.22% |
| p95 | 0.00ms | 0.00ms | -0.00ms | -3.97% |
| p99 | 0.01ms | 0.01ms | -0.00ms | -12.61% |
| mean | 0.00ms | 0.00ms | -0.00ms | -8.49% |
| min | 0.00ms | 0.00ms | -0.00ms | -2.29% |
| max | 0.01ms | 0.01ms | -0.00ms | -5.74% |
| total | 0.45ms | 0.49ms | -0.04ms | -8.49% |

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
| total | 0.24ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p50 | 0.00ms | 0.00ms | -0.00ms | -0.10% |
| p95 | 0.00ms | 0.00ms | -0.00ms | -13.11% |
| p99 | 0.01ms | 0.00ms | +0.00ms | +38.10% |
| mean | 0.00ms | 0.00ms | -0.00ms | -5.00% |
| min | 0.00ms | 0.00ms | 0.00ms | 0.00% |
| max | 0.01ms | 0.01ms | -0.01ms | -36.31% |
| total | 0.24ms | 0.25ms | -0.01ms | -5.00% |

