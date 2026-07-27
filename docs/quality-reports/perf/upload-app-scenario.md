# Perf Suite — upload-app-scenario

Threshold source: [docs/quality/perf-thresholds.md](../../quality/perf-thresholds)

## Serial p95 (concurrency = 1)

| op | p95 | cap | gate | regression |
|---|---|---|---|---|
| upload_workflow (10 upload across 4 providers + multipart) | 0.04ms | 100ms | PASS | stable |
| presigned_batch (5 presigned URL PUT/GET across providers) | 0.02ms | 100ms | PASS | stable |
| size_error_handling (5 oversize + checksum verify) | 0.01ms | 100ms | PASS | stable |

## Concurrent p95 (concurrency = 4, 5 iter each)

| op | p95 | cap | gate |
|---|---|---|---|
| upload_workflow (10 upload across 4 providers + multipart) | 0.11ms | 200ms | PASS |
| presigned_batch (5 presigned URL PUT/GET across providers) | 0.04ms | 200ms | PASS |
| size_error_handling (5 oversize + checksum verify) | 0.05ms | 200ms | PASS |

## Memory retention (20 iter, arrayBuffers axis is the gate; heap is informational)

| op | heapUsed Δ | arrayBuffers Δ | cap | verdict |
|---|---|---|---|---|
| upload_workflow (10 upload across 4 providers + multipart) | 1361832 B | 8192 B | 102400 B | PASS |
| presigned_batch (5 presigned URL PUT/GET across providers) | 166000 B | 0 B | 102400 B | PASS |
| size_error_handling (5 oversize + checksum verify) | 210032 B | 69536 B | 102400 B | PASS |

## Detailed serial reports

### upload_workflow (10 upload across 4 providers + multipart)

# Perf Report — upload_workflow (10 upload across 4 providers + multipart).serial

| metric | value |
|---|---|
| iterations | 20 |
| warmup | 3 |
| p50 | 0.03ms |
| p95 | 0.04ms |
| p99 | 0.04ms |
| mean | 0.03ms |
| stdev | 0.01ms |
| min | 0.02ms |
| max | 0.04ms |
| total | 0.55ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p50 | 0.03ms | 0.03ms | -0.00ms | -6.64% |
| p95 | 0.04ms | 0.04ms | -0.00ms | -9.08% |
| p99 | 0.04ms | 0.05ms | -0.01ms | -20.72% |
| mean | 0.03ms | 0.03ms | -0.00ms | -8.01% |
| min | 0.02ms | 0.02ms | -0.00ms | -1.02% |
| max | 0.04ms | 0.05ms | -0.01ms | -23.03% |
| total | 0.55ms | 0.60ms | -0.05ms | -8.01% |

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
| total | 0.21ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p50 | 0.01ms | 0.01ms | +0.00ms | +7.29% |
| p95 | 0.02ms | 0.01ms | +0.00ms | +13.49% |
| p99 | 0.02ms | 0.02ms | -0.00ms | -3.14% |
| mean | 0.01ms | 0.01ms | +0.00ms | +7.68% |
| min | 0.01ms | 0.01ms | +0.00ms | +2.03% |
| max | 0.02ms | 0.02ms | -0.00ms | -6.48% |
| total | 0.21ms | 0.20ms | +0.02ms | +7.68% |

### size_error_handling (5 oversize + checksum verify)

# Perf Report — size_error_handling (5 oversize + checksum verify).serial

| metric | value |
|---|---|
| iterations | 20 |
| warmup | 3 |
| p50 | 0.01ms |
| p95 | 0.01ms |
| p99 | 0.01ms |
| mean | 0.01ms |
| stdev | 0.00ms |
| min | 0.01ms |
| max | 0.01ms |
| total | 0.18ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p50 | 0.01ms | 0.01ms | -0.00ms | -4.39% |
| p95 | 0.01ms | 0.01ms | -0.00ms | -1.85% |
| p99 | 0.01ms | 0.01ms | -0.00ms | -4.97% |
| mean | 0.01ms | 0.01ms | -0.00ms | -3.59% |
| min | 0.01ms | 0.01ms | 0.00ms | 0.00% |
| max | 0.01ms | 0.01ms | -0.00ms | -5.66% |
| total | 0.18ms | 0.18ms | -0.01ms | -3.59% |

