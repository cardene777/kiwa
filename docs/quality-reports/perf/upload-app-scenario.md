# Perf Suite — upload-app-scenario

Threshold source: [docs/quality/perf-thresholds.md](../../quality/perf-thresholds)

## Serial p95 (concurrency = 1)

| op | p95 | cap | gate | regression |
|---|---|---|---|---|
| upload_workflow (10 upload across 4 providers + multipart) | 0.05ms | 100ms | PASS | stable (検知には +0.5ms (baseline 比 +785%) 以上の悪化が必要) — gate 無効 (regressionGate=false) |
| presigned_batch (5 presigned URL PUT/GET across providers) | 0.02ms | 100ms | PASS | stable (検知には +0.5ms (baseline 比 +3762%) 以上の悪化が必要) — gate 無効 (regressionGate=false) |
| size_error_handling (5 oversize + checksum verify) | 0.01ms | 100ms | PASS | stable (検知には +0.5ms (baseline 比 +3574%) 以上の悪化が必要) — gate 無効 (regressionGate=false) |

## Concurrent p95 (concurrency = 4, 5 iter each)

| op | p95 | cap | gate |
|---|---|---|---|
| upload_workflow (10 upload across 4 providers + multipart) | 0.14ms | 200ms | PASS |
| presigned_batch (5 presigned URL PUT/GET across providers) | 0.04ms | 200ms | PASS |
| size_error_handling (5 oversize + checksum verify) | 0.05ms | 200ms | PASS |

## Memory retention (20 iter, arrayBuffers axis is the gate; heap is informational)

| op | heapUsed Δ | arrayBuffers Δ | cap | gc exposed | verdict |
|---|---|---|---|---|---|
| upload_workflow (10 upload across 4 providers + multipart) | 12664 B | 8192 B | 102400 B | yes | PASS |
| presigned_batch (5 presigned URL PUT/GET across providers) | -4296 B | -8192 B | 102400 B | yes | PASS |
| size_error_handling (5 oversize + checksum verify) | -16080 B | 0 B | 102400 B | yes | PASS |

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
| mean | 0.04ms |
| stdev | 0.01ms |
| min | 0.02ms |
| max | 0.05ms |
| total | 0.71ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p50 | 0.03ms | 0.03ms | +0.00ms | +5.64% |
| p95 | 0.05ms | 0.06ms | -0.02ms | -23.62% |
| p99 | 0.05ms | 0.20ms | -0.15ms | -74.26% |
| mean | 0.04ms | 0.04ms | -0.01ms | -15.35% |
| min | 0.02ms | 0.02ms | +0.00ms | +9.94% |
| max | 0.05ms | 0.24ms | -0.18ms | -77.67% |
| total | 0.71ms | 0.84ms | -0.13ms | -15.35% |

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
| p50 | 0.01ms | 0.01ms | -0.00ms | -16.69% |
| p95 | 0.02ms | 0.01ms | +0.00ms | +21.74% |
| p99 | 0.02ms | 0.02ms | +0.00ms | +7.10% |
| mean | 0.01ms | 0.01ms | -0.00ms | -8.08% |
| min | 0.01ms | 0.01ms | -0.00ms | -15.08% |
| max | 0.02ms | 0.02ms | +0.00ms | +4.40% |
| total | 0.21ms | 0.23ms | -0.02ms | -8.08% |

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
| total | 0.19ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p50 | 0.01ms | 0.01ms | -0.00ms | -10.91% |
| p95 | 0.01ms | 0.01ms | -0.00ms | -5.88% |
| p99 | 0.01ms | 0.01ms | -0.00ms | -8.76% |
| mean | 0.01ms | 0.01ms | -0.00ms | -10.89% |
| min | 0.01ms | 0.01ms | -0.00ms | -10.44% |
| max | 0.01ms | 0.01ms | -0.00ms | -9.46% |
| total | 0.19ms | 0.21ms | -0.02ms | -10.89% |

