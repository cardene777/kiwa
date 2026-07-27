# Perf Suite — upload-app-scenario

Threshold source: [docs/quality/perf-thresholds.md](../../quality/perf-thresholds)

## Serial p95 (concurrency = 1)

| op | p95 | cap | gate | regression |
|---|---|---|---|---|
| upload_workflow (10 upload across 4 providers + multipart) | 0.04ms | 100ms | PASS | stable |
| presigned_batch (5 presigned URL PUT/GET across providers) | 0.01ms | 100ms | PASS | stable |
| size_error_handling (5 oversize + checksum verify) | 0.01ms | 100ms | PASS | stable |

## Concurrent p95 (concurrency = 4, 5 iter each)

| op | p95 | cap | gate |
|---|---|---|---|
| upload_workflow (10 upload across 4 providers + multipart) | 0.12ms | 200ms | PASS |
| presigned_batch (5 presigned URL PUT/GET across providers) | 0.04ms | 200ms | PASS |
| size_error_handling (5 oversize + checksum verify) | 0.04ms | 200ms | PASS |

## Memory retention (20 iter, arrayBuffers axis is the gate; heap is informational)

| op | heapUsed Δ | arrayBuffers Δ | cap | gc exposed | verdict |
|---|---|---|---|---|---|
| upload_workflow (10 upload across 4 providers + multipart) | 9104 B | 8192 B | 102400 B | yes | PASS |
| presigned_batch (5 presigned URL PUT/GET across providers) | -3096 B | 0 B | 102400 B | yes | PASS |
| size_error_handling (5 oversize + checksum verify) | 832 B | 0 B | 102400 B | yes | PASS |

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
| max | 0.05ms |
| total | 0.58ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p50 | 0.03ms | 0.03ms | +0.00ms | +12.92% |
| p95 | 0.04ms | 0.04ms | -0.00ms | -6.71% |
| p99 | 0.05ms | 0.05ms | -0.00ms | -1.97% |
| mean | 0.03ms | 0.03ms | +0.00ms | +4.56% |
| min | 0.02ms | 0.02ms | -0.00ms | -4.72% |
| max | 0.05ms | 0.05ms | -0.00ms | -1.05% |
| total | 0.58ms | 0.55ms | +0.03ms | +4.56% |

### presigned_batch (5 presigned URL PUT/GET across providers)

# Perf Report — presigned_batch (5 presigned URL PUT/GET across providers).serial

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
| total | 0.20ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p50 | 0.01ms | 0.01ms | -0.00ms | -15.64% |
| p95 | 0.01ms | 0.01ms | -0.00ms | -6.13% |
| p99 | 0.02ms | 0.02ms | -0.00ms | -2.07% |
| mean | 0.01ms | 0.01ms | -0.00ms | -11.91% |
| min | 0.01ms | 0.01ms | -0.00ms | -13.56% |
| max | 0.02ms | 0.02ms | -0.00ms | -1.08% |
| total | 0.20ms | 0.22ms | -0.03ms | -11.91% |

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
| p50 | 0.01ms | 0.01ms | -0.00ms | -7.06% |
| p95 | 0.01ms | 0.01ms | -0.00ms | -11.32% |
| p99 | 0.01ms | 0.01ms | -0.00ms | -4.86% |
| mean | 0.01ms | 0.01ms | -0.00ms | -9.79% |
| min | 0.01ms | 0.01ms | -0.00ms | -2.53% |
| max | 0.01ms | 0.01ms | -0.00ms | -3.27% |
| total | 0.18ms | 0.20ms | -0.02ms | -9.79% |

