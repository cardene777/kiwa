# Perf Suite — upload-app-scenario

Threshold source: [docs/quality/perf-thresholds.md](../../quality/perf-thresholds)

## Serial p95 (concurrency = 1)

| op | p95 | cap | gate | regression |
|---|---|---|---|---|
| upload_workflow (10 upload across 4 providers + multipart) | 0.04ms | 100ms | PASS | stable (検知には +0.5ms (baseline 比 +785%) 以上の悪化が必要) |
| presigned_batch (5 presigned URL PUT/GET across providers) | 0.02ms | 100ms | PASS | stable (検知には +0.5ms (baseline 比 +3762%) 以上の悪化が必要) |
| size_error_handling (5 oversize + checksum verify) | 0.01ms | 100ms | PASS | stable (検知には +0.5ms (baseline 比 +3574%) 以上の悪化が必要) |

## Concurrent p95 (concurrency = 4, 5 iter each)

| op | p95 | cap | gate |
|---|---|---|---|
| upload_workflow (10 upload across 4 providers + multipart) | 0.12ms | 200ms | PASS |
| presigned_batch (5 presigned URL PUT/GET across providers) | 0.04ms | 200ms | PASS |
| size_error_handling (5 oversize + checksum verify) | 0.05ms | 200ms | PASS |

## Memory retention (20 iter, arrayBuffers axis is the gate; heap is informational)

| op | heapUsed Δ | arrayBuffers Δ | cap | gc exposed | verdict |
|---|---|---|---|---|---|
| upload_workflow (10 upload across 4 providers + multipart) | 6072 B | 8192 B | 102400 B | yes | PASS |
| presigned_batch (5 presigned URL PUT/GET across providers) | -3848 B | 0 B | 102400 B | yes | PASS |
| size_error_handling (5 oversize + checksum verify) | -15200 B | 0 B | 102400 B | yes | PASS |

## Detailed serial reports

### upload_workflow (10 upload across 4 providers + multipart)

# Perf Report — upload_workflow (10 upload across 4 providers + multipart).serial

| metric | value |
|---|---|
| iterations | 20 |
| warmup | 3 |
| p50 | 0.03ms |
| p95 | 0.04ms |
| p99 | 0.05ms |
| mean | 0.03ms |
| stdev | 0.01ms |
| min | 0.02ms |
| max | 0.06ms |
| total | 0.61ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p50 | 0.03ms | 0.03ms | -0.00ms | -9.18% |
| p95 | 0.04ms | 0.06ms | -0.02ms | -31.77% |
| p99 | 0.05ms | 0.20ms | -0.15ms | -72.98% |
| mean | 0.03ms | 0.04ms | -0.01ms | -27.58% |
| min | 0.02ms | 0.02ms | -0.00ms | -3.57% |
| max | 0.06ms | 0.24ms | -0.18ms | -75.75% |
| total | 0.61ms | 0.84ms | -0.23ms | -27.58% |

### presigned_batch (5 presigned URL PUT/GET across providers)

# Perf Report — presigned_batch (5 presigned URL PUT/GET across providers).serial

| metric | value |
|---|---|
| iterations | 20 |
| warmup | 3 |
| p50 | 0.01ms |
| p95 | 0.02ms |
| p99 | 0.02ms |
| mean | 0.01ms |
| stdev | 0.00ms |
| min | 0.01ms |
| max | 0.02ms |
| total | 0.20ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p50 | 0.01ms | 0.01ms | -0.00ms | -20.59% |
| p95 | 0.02ms | 0.01ms | +0.00ms | +13.23% |
| p99 | 0.02ms | 0.02ms | -0.00ms | -0.09% |
| mean | 0.01ms | 0.01ms | -0.00ms | -12.14% |
| min | 0.01ms | 0.01ms | -0.00ms | -18.65% |
| max | 0.02ms | 0.02ms | -0.00ms | -2.55% |
| total | 0.20ms | 0.23ms | -0.03ms | -12.14% |

### size_error_handling (5 oversize + checksum verify)

# Perf Report — size_error_handling (5 oversize + checksum verify).serial

| metric | value |
|---|---|
| iterations | 20 |
| warmup | 3 |
| p50 | 0.01ms |
| p95 | 0.01ms |
| p99 | 0.02ms |
| mean | 0.01ms |
| stdev | 0.00ms |
| min | 0.01ms |
| max | 0.02ms |
| total | 0.19ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p50 | 0.01ms | 0.01ms | -0.00ms | -15.64% |
| p95 | 0.01ms | 0.01ms | -0.00ms | -2.09% |
| p99 | 0.02ms | 0.01ms | +0.00ms | +15.53% |
| mean | 0.01ms | 0.01ms | -0.00ms | -9.90% |
| min | 0.01ms | 0.01ms | -0.00ms | -14.99% |
| max | 0.02ms | 0.01ms | +0.00ms | +19.77% |
| total | 0.19ms | 0.21ms | -0.02ms | -9.90% |

