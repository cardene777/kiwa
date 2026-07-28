# Perf Suite — upload

Threshold source: [docs/quality/perf-thresholds.md](../../quality/perf-thresholds)

## Serial p95 (concurrency = 1)

| op | p95 | cap | gate | regression |
|---|---|---|---|---|
| uploadFile | 0.01ms | 5ms | PASS | stable (検知には +0.5ms (baseline 比 +4101%) 以上の悪化が必要) |
| createPresignedUrl | 0.00ms | 5ms | PASS | stable (検知には +0.5ms (baseline 比 +14286%) 以上の悪化が必要) |
| verifyUpload | 0.00ms | 5ms | PASS | stable (検知には +0.5ms (baseline 比 +25362%) 以上の悪化が必要) |

## Concurrent p95 (concurrency = 10, 50 iter each)

| op | p95 | cap | gate |
|---|---|---|---|
| uploadFile | 0.04ms | 10ms | PASS |
| createPresignedUrl | 0.03ms | 10ms | PASS |
| verifyUpload | 0.02ms | 10ms | PASS |

## Memory retention (200 iter, arrayBuffers axis is the gate; heap is informational)

| op | heapUsed Δ | arrayBuffers Δ | cap | gc exposed | verdict |
|---|---|---|---|---|---|
| uploadFile | 77640 B | 8192 B | 102400 B | yes | PASS |
| createPresignedUrl | -26640 B | 0 B | 102400 B | yes | PASS |
| verifyUpload | -5160 B | 0 B | 102400 B | yes | PASS |

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
| total | 0.58ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p50 | 0.00ms | 0.00ms | -0.00ms | -21.68% |
| p95 | 0.01ms | 0.01ms | -0.00ms | -34.59% |
| p99 | 0.02ms | 0.04ms | -0.02ms | -56.28% |
| mean | 0.00ms | 0.01ms | -0.00ms | -53.67% |
| min | 0.00ms | 0.00ms | -0.00ms | -20.80% |
| max | 0.02ms | 0.30ms | -0.28ms | -91.97% |
| total | 0.58ms | 1.25ms | -0.67ms | -53.67% |

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
| p50 | 0.00ms | 0.00ms | -0.00ms | -6.00% |
| p95 | 0.00ms | 0.00ms | -0.00ms | -15.01% |
| p99 | 0.01ms | 0.01ms | -0.00ms | -3.60% |
| mean | 0.00ms | 0.00ms | -0.00ms | -7.44% |
| min | 0.00ms | 0.00ms | -0.00ms | -6.38% |
| max | 0.01ms | 0.02ms | -0.00ms | -6.01% |
| total | 0.45ms | 0.49ms | -0.04ms | -7.44% |

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
| p50 | 0.00ms | 0.00ms | -0.00ms | -7.38% |
| p95 | 0.00ms | 0.00ms | -0.00ms | -23.81% |
| p99 | 0.01ms | 0.01ms | -0.00ms | -1.81% |
| mean | 0.00ms | 0.00ms | -0.00ms | -8.12% |
| min | 0.00ms | 0.00ms | -0.00ms | -7.97% |
| max | 0.01ms | 0.01ms | -0.00ms | -16.67% |
| total | 0.24ms | 0.27ms | -0.02ms | -8.12% |

