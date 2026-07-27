# Perf Suite — upload-app-scenario

Threshold source: [docs/quality/perf-thresholds.md](../../quality/perf-thresholds)

## Serial p95 (concurrency = 1)

| op | p95 | cap | gate | regression |
|---|---|---|---|---|
| upload_workflow (10 upload across 4 providers + multipart) | 0.10ms | 100ms | PASS | stable |
| presigned_batch (5 presigned URL PUT/GET across providers) | 0.02ms | 100ms | PASS | stable |
| size_error_handling (5 oversize + checksum verify) | 0.02ms | 100ms | PASS | stable |

## Concurrent p95 (concurrency = 4, 5 iter each)

| op | p95 | cap | gate |
|---|---|---|---|
| upload_workflow (10 upload across 4 providers + multipart) | 0.13ms | 200ms | PASS |
| presigned_batch (5 presigned URL PUT/GET across providers) | 0.04ms | 200ms | PASS |
| size_error_handling (5 oversize + checksum verify) | 0.05ms | 200ms | PASS |

## Memory retention (20 iter, arrayBuffers axis is the gate; heap is informational)

| op | heapUsed Δ | arrayBuffers Δ | cap | gc exposed | verdict |
|---|---|---|---|---|---|
| upload_workflow (10 upload across 4 providers + multipart) | 28368 B | -18817 B | 102400 B | yes | PASS |
| presigned_batch (5 presigned URL PUT/GET across providers) | -4248 B | 0 B | 102400 B | yes | PASS |
| size_error_handling (5 oversize + checksum verify) | -15000 B | 0 B | 102400 B | yes | PASS |

## Detailed serial reports

### upload_workflow (10 upload across 4 providers + multipart)

# Perf Report — upload_workflow (10 upload across 4 providers + multipart).serial

| metric | value |
|---|---|
| iterations | 20 |
| warmup | 3 |
| p50 | 0.08ms |
| p95 | 0.10ms |
| p99 | 0.13ms |
| mean | 0.08ms |
| stdev | 0.02ms |
| min | 0.07ms |
| max | 0.14ms |
| total | 1.61ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p50 | 0.08ms | 0.03ms | +0.05ms | +209.69% |
| p95 | 0.10ms | 0.04ms | +0.06ms | +145.09% |
| p99 | 0.13ms | 0.05ms | +0.08ms | +165.92% |
| mean | 0.08ms | 0.03ms | +0.05ms | +191.64% |
| min | 0.07ms | 0.02ms | +0.04ms | +220.34% |
| max | 0.14ms | 0.05ms | +0.09ms | +169.95% |
| total | 1.61ms | 0.55ms | +1.06ms | +191.64% |

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
| total | 0.25ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p50 | 0.01ms | 0.01ms | +0.00ms | +6.93% |
| p95 | 0.02ms | 0.01ms | +0.00ms | +22.67% |
| p99 | 0.02ms | 0.02ms | +0.00ms | +32.41% |
| mean | 0.01ms | 0.01ms | +0.00ms | +11.45% |
| min | 0.01ms | 0.01ms | -0.00ms | -0.42% |
| max | 0.02ms | 0.02ms | +0.01ms | +34.77% |
| total | 0.25ms | 0.22ms | +0.03ms | +11.45% |

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
| total | 0.23ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p50 | 0.01ms | 0.01ms | +0.00ms | +13.21% |
| p95 | 0.02ms | 0.01ms | +0.00ms | +19.40% |
| p99 | 0.02ms | 0.01ms | +0.01ms | +61.92% |
| mean | 0.01ms | 0.01ms | +0.00ms | +15.80% |
| min | 0.01ms | 0.01ms | +0.00ms | +13.64% |
| max | 0.02ms | 0.01ms | +0.01ms | +72.40% |
| total | 0.23ms | 0.20ms | +0.03ms | +15.80% |

