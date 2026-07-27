# Perf Suite — upload-app-scenario

Threshold source: [docs/quality/perf-thresholds.md](../../quality/perf-thresholds)

## Serial p95 (concurrency = 1)

| op | p95 | cap | gate | regression |
|---|---|---|---|---|
| upload_workflow (10 upload across 4 providers + multipart) | 0.05ms | 100ms | PASS | stable |
| presigned_batch (5 presigned URL PUT/GET across providers) | 0.02ms | 100ms | PASS | stable |
| size_error_handling (5 oversize + checksum verify) | 0.02ms | 100ms | PASS | stable |

## Concurrent p95 (concurrency = 4, 5 iter each)

| op | p95 | cap | gate |
|---|---|---|---|
| upload_workflow (10 upload across 4 providers + multipart) | 0.13ms | 200ms | PASS |
| presigned_batch (5 presigned URL PUT/GET across providers) | 0.05ms | 200ms | PASS |
| size_error_handling (5 oversize + checksum verify) | 0.05ms | 200ms | PASS |

## Memory retention (20 iter, arrayBuffers axis is the gate; heap is informational)

| op | heapUsed Δ | arrayBuffers Δ | cap | gc exposed | verdict |
|---|---|---|---|---|---|
| upload_workflow (10 upload across 4 providers + multipart) | 23400 B | 0 B | 102400 B | yes | PASS |
| presigned_batch (5 presigned URL PUT/GET across providers) | 520 B | 0 B | 102400 B | yes | PASS |
| size_error_handling (5 oversize + checksum verify) | 832 B | 0 B | 102400 B | yes | PASS |

## Detailed serial reports

### upload_workflow (10 upload across 4 providers + multipart)

# Perf Report — upload_workflow (10 upload across 4 providers + multipart).serial

| metric | value |
|---|---|
| iterations | 20 |
| warmup | 3 |
| p50 | 0.03ms |
| p95 | 0.05ms |
| p99 | 0.05ms |
| mean | 0.03ms |
| stdev | 0.01ms |
| min | 0.02ms |
| max | 0.05ms |
| total | 0.62ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p50 | 0.03ms | 0.03ms | +0.00ms | +14.05% |
| p95 | 0.05ms | 0.04ms | +0.01ms | +13.48% |
| p99 | 0.05ms | 0.05ms | +0.00ms | +7.26% |
| mean | 0.03ms | 0.03ms | +0.00ms | +12.63% |
| min | 0.02ms | 0.02ms | +0.00ms | +6.17% |
| max | 0.05ms | 0.05ms | +0.00ms | +6.06% |
| total | 0.62ms | 0.55ms | +0.07ms | +12.63% |

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
| total | 0.23ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p50 | 0.01ms | 0.01ms | +0.00ms | +1.98% |
| p95 | 0.02ms | 0.01ms | +0.00ms | +9.41% |
| p99 | 0.02ms | 0.02ms | +0.00ms | +12.47% |
| mean | 0.01ms | 0.01ms | +0.00ms | +3.32% |
| min | 0.01ms | 0.01ms | -0.00ms | -2.96% |
| max | 0.02ms | 0.02ms | +0.00ms | +13.21% |
| total | 0.23ms | 0.22ms | +0.01ms | +3.32% |

### size_error_handling (5 oversize + checksum verify)

# Perf Report — size_error_handling (5 oversize + checksum verify).serial

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
| total | 0.21ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p50 | 0.01ms | 0.01ms | +0.00ms | +7.97% |
| p95 | 0.02ms | 0.01ms | +0.00ms | +9.74% |
| p99 | 0.02ms | 0.01ms | +0.00ms | +24.77% |
| mean | 0.01ms | 0.01ms | +0.00ms | +6.57% |
| min | 0.01ms | 0.01ms | +0.00ms | +5.55% |
| max | 0.02ms | 0.01ms | +0.00ms | +28.48% |
| total | 0.21ms | 0.20ms | +0.01ms | +6.57% |

