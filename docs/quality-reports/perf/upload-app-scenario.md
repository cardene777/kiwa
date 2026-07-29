# Perf Suite — upload-app-scenario

Threshold source: [docs/quality/perf-thresholds.md](../../quality/perf-thresholds)

測定系の分解能 = 0.00025ms (何もしない関数を同じ経路で呼んだ時の p10)。 回帰判定の絶対下限は既定でこの 2 倍 = 0.00050ms、 op ごとの実効値は下表の「下限」 列。

## Serial (concurrency = 1)

| op | p10 (回帰判定) | p95 (上限判定) | cap | 下限 | gate | regression |
|---|---|---|---|---|---|---|
| upload_workflow (10 upload across 4 providers + multipart) | 0.02ms | 0.04ms | 100ms | 0.00050ms | PASS | stable — gate 無効 (regressionGate=false) |
| presigned_batch (5 presigned URL PUT/GET across providers) | 0.0090ms | 0.01ms | 100ms | 0.00050ms | PASS | stable — gate 無効 (regressionGate=false) |
| size_error_handling (5 oversize + checksum verify) | 0.0083ms | 0.01ms | 100ms | 0.00050ms | PASS | stable — gate 無効 (regressionGate=false) |

## Concurrent p95 (concurrency = 4, 5 iter each)

| op | p95 | cap | gate |
|---|---|---|---|
| upload_workflow (10 upload across 4 providers + multipart) | 0.11ms | 200ms | PASS |
| presigned_batch (5 presigned URL PUT/GET across providers) | 0.04ms | 200ms | PASS |
| size_error_handling (5 oversize + checksum verify) | 0.04ms | 200ms | PASS |

## Memory retention (20 iter, arrayBuffers axis is the gate; heap is informational)

| op | heapUsed Δ | arrayBuffers Δ | cap | gc exposed | verdict |
|---|---|---|---|---|---|
| upload_workflow (10 upload across 4 providers + multipart) | -145568 B | 8192 B | 102400 B | yes | PASS |
| presigned_batch (5 presigned URL PUT/GET across providers) | -3848 B | 0 B | 102400 B | yes | PASS |
| size_error_handling (5 oversize + checksum verify) | 88 B | 0 B | 102400 B | yes | PASS |

## Detailed serial reports

### upload_workflow (10 upload across 4 providers + multipart)

# Perf Report — upload_workflow (10 upload across 4 providers + multipart).serial

| metric | value |
|---|---|
| iterations | 20 |
| warmup | 3 |
| p10 | 0.02ms |
| p50 | 0.03ms |
| p95 | 0.04ms |
| p99 | 0.04ms |
| mean | 0.03ms |
| stdev | 0.0070ms |
| min | 0.02ms |
| max | 0.05ms |
| total | 0.53ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.02ms | 0.02ms | -0.0040ms | -16.92% |
| p50 | 0.03ms | 0.03ms | -0.0036ms | -11.62% |
| p95 | 0.04ms | 0.11ms | -0.07ms | -63.85% |
| p99 | 0.04ms | 0.22ms | -0.17ms | -79.72% |
| mean | 0.03ms | 0.05ms | -0.02ms | -43.12% |
| min | 0.02ms | 0.02ms | -0.0034ms | -14.99% |
| max | 0.05ms | 0.25ms | -0.20ms | -81.45% |
| total | 0.53ms | 0.93ms | -0.40ms | -43.12% |

### presigned_batch (5 presigned URL PUT/GET across providers)

# Perf Report — presigned_batch (5 presigned URL PUT/GET across providers).serial

| metric | value |
|---|---|
| iterations | 20 |
| warmup | 3 |
| p10 | 0.0090ms |
| p50 | 0.0091ms |
| p95 | 0.01ms |
| p99 | 0.01ms |
| mean | 0.0098ms |
| stdev | 0.0016ms |
| min | 0.0089ms |
| max | 0.02ms |
| total | 0.20ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.0090ms | 0.0089ms | +0.00013ms | +1.50% |
| p50 | 0.0091ms | 0.0090ms | +0.00013ms | +1.39% |
| p95 | 0.01ms | 0.01ms | +0.00022ms | +1.71% |
| p99 | 0.01ms | 0.02ms | -0.0034ms | -18.57% |
| mean | 0.0098ms | 0.0099ms | -0.00012ms | -1.22% |
| min | 0.0089ms | 0.0088ms | +0.00017ms | +1.90% |
| max | 0.02ms | 0.02ms | -0.0043ms | -21.98% |
| total | 0.20ms | 0.20ms | -0.0024ms | -1.22% |

### size_error_handling (5 oversize + checksum verify)

# Perf Report — size_error_handling (5 oversize + checksum verify).serial

| metric | value |
|---|---|
| iterations | 20 |
| warmup | 3 |
| p10 | 0.0083ms |
| p50 | 0.0088ms |
| p95 | 0.01ms |
| p99 | 0.01ms |
| mean | 0.0098ms |
| stdev | 0.0022ms |
| min | 0.0081ms |
| max | 0.02ms |
| total | 0.20ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.0083ms | 0.0084ms | -0.000059ms | -0.70% |
| p50 | 0.0088ms | 0.0095ms | -0.00071ms | -7.44% |
| p95 | 0.01ms | 0.02ms | -0.0024ms | -14.33% |
| p99 | 0.01ms | 0.02ms | -0.0040ms | -21.14% |
| mean | 0.0098ms | 0.01ms | -0.00092ms | -8.55% |
| min | 0.0081ms | 0.0083ms | -0.00017ms | -2.02% |
| max | 0.02ms | 0.02ms | -0.0044ms | -22.60% |
| total | 0.20ms | 0.22ms | -0.02ms | -8.55% |

