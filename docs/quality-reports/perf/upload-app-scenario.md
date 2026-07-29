# Perf Suite — upload-app-scenario

Threshold source: [docs/quality/perf-thresholds.md](../../quality/perf-thresholds)

測定系の分解能 = 0.00025ms (何もしない関数を同じ経路で呼んだ時の p10)。 回帰判定の絶対下限は既定でこの 2 倍 = 0.00050ms、 op ごとの実効値は下表の「下限」 列。

## Serial (concurrency = 1)

| op | p10 (回帰判定) | p95 (上限判定) | cap | 下限 | gate | regression |
|---|---|---|---|---|---|---|
| upload_workflow (10 upload across 4 providers + multipart) | 0.02ms | 0.04ms | 100ms | 0.00050ms | PASS | stable — gate 無効 (regressionGate=false) |
| presigned_batch (5 presigned URL PUT/GET across providers) | 0.0085ms | 0.01ms | 100ms | 0.00050ms | PASS | stable — gate 無効 (regressionGate=false) |
| size_error_handling (5 oversize + checksum verify) | 0.0085ms | 0.02ms | 100ms | 0.00050ms | PASS | stable — gate 無効 (regressionGate=false) |

## Concurrent p95 (concurrency = 4, 5 iter each)

| op | p95 | cap | gate |
|---|---|---|---|
| upload_workflow (10 upload across 4 providers + multipart) | 0.50ms | 200ms | PASS |
| presigned_batch (5 presigned URL PUT/GET across providers) | 0.04ms | 200ms | PASS |
| size_error_handling (5 oversize + checksum verify) | 0.04ms | 200ms | PASS |

## Memory retention (20 iter, arrayBuffers axis is the gate; heap is informational)

| op | heapUsed Δ | arrayBuffers Δ | cap | gc exposed | verdict |
|---|---|---|---|---|---|
| upload_workflow (10 upload across 4 providers + multipart) | -2096 B | 0 B | 102400 B | yes | PASS |
| presigned_batch (5 presigned URL PUT/GET across providers) | 728 B | 0 B | 102400 B | yes | PASS |
| size_error_handling (5 oversize + checksum verify) | 184 B | 0 B | 102400 B | yes | PASS |

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
| p99 | 0.06ms |
| mean | 0.03ms |
| stdev | 0.0099ms |
| min | 0.02ms |
| max | 0.06ms |
| total | 0.57ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.02ms | 0.02ms | -0.0038ms | -16.27% |
| p50 | 0.03ms | 0.03ms | -0.0042ms | -13.59% |
| p95 | 0.04ms | 0.11ms | -0.07ms | -61.95% |
| p99 | 0.06ms | 0.22ms | -0.16ms | -73.97% |
| mean | 0.03ms | 0.05ms | -0.02ms | -39.53% |
| min | 0.02ms | 0.02ms | -0.0037ms | -16.09% |
| max | 0.06ms | 0.25ms | -0.18ms | -75.28% |
| total | 0.57ms | 0.93ms | -0.37ms | -39.53% |

### presigned_batch (5 presigned URL PUT/GET across providers)

# Perf Report — presigned_batch (5 presigned URL PUT/GET across providers).serial

| metric | value |
|---|---|
| iterations | 20 |
| warmup | 3 |
| p10 | 0.0085ms |
| p50 | 0.0087ms |
| p95 | 0.01ms |
| p99 | 0.01ms |
| mean | 0.0095ms |
| stdev | 0.0016ms |
| min | 0.0085ms |
| max | 0.01ms |
| total | 0.19ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.0085ms | 0.0089ms | -0.00037ms | -4.18% |
| p50 | 0.0087ms | 0.0090ms | -0.00029ms | -3.23% |
| p95 | 0.01ms | 0.01ms | -0.00022ms | -1.70% |
| p99 | 0.01ms | 0.02ms | -0.0042ms | -23.31% |
| mean | 0.0095ms | 0.0099ms | -0.00044ms | -4.38% |
| min | 0.0085ms | 0.0088ms | -0.00029ms | -3.34% |
| max | 0.01ms | 0.02ms | -0.0052ms | -26.94% |
| total | 0.19ms | 0.20ms | -0.0087ms | -4.38% |

### size_error_handling (5 oversize + checksum verify)

# Perf Report — size_error_handling (5 oversize + checksum verify).serial

| metric | value |
|---|---|
| iterations | 20 |
| warmup | 3 |
| p10 | 0.0085ms |
| p50 | 0.0099ms |
| p95 | 0.02ms |
| p99 | 0.02ms |
| mean | 0.01ms |
| stdev | 0.0027ms |
| min | 0.0082ms |
| max | 0.02ms |
| total | 0.22ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.0085ms | 0.0084ms | +0.00013ms | +1.49% |
| p50 | 0.0099ms | 0.0095ms | +0.00035ms | +3.72% |
| p95 | 0.02ms | 0.02ms | +0.00029ms | +1.76% |
| p99 | 0.02ms | 0.02ms | -0.0016ms | -8.29% |
| mean | 0.01ms | 0.01ms | +0.000021ms | +0.19% |
| min | 0.0082ms | 0.0083ms | -0.000042ms | -0.51% |
| max | 0.02ms | 0.02ms | -0.0020ms | -10.44% |
| total | 0.22ms | 0.22ms | +0.00042ms | +0.19% |

