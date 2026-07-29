# Perf Suite — upload-app-scenario

Threshold source: [docs/quality/perf-thresholds.md](../../quality/perf-thresholds)

測定系の分解能 = 0.00025ms (何もしない関数を同じ経路で呼んだ時の p10)。 回帰判定の絶対下限は既定でこの 2 倍 = 0.00050ms、 op ごとの実効値は下表の「下限」 列。

## Serial (concurrency = 1)

| op | p10 (回帰判定) | p95 (上限判定) | cap | 下限 | gate | regression |
|---|---|---|---|---|---|---|
| upload_workflow (10 upload across 4 providers + multipart) | 0.02ms | 0.04ms | 100ms | 0.00050ms | PASS | stable — gate 無効 (regressionGate=false) |
| presigned_batch (5 presigned URL PUT/GET across providers) | 0.0092ms | 0.01ms | 100ms | 0.00050ms | PASS | stable — gate 無効 (regressionGate=false) |
| size_error_handling (5 oversize + checksum verify) | 0.0085ms | 0.02ms | 100ms | 0.00050ms | PASS | stable — gate 無効 (regressionGate=false) |

## Concurrent p95 (concurrency = 4, 5 iter each)

| op | p95 | cap | gate |
|---|---|---|---|
| upload_workflow (10 upload across 4 providers + multipart) | 0.11ms | 200ms | PASS |
| presigned_batch (5 presigned URL PUT/GET across providers) | 0.04ms | 200ms | PASS |
| size_error_handling (5 oversize + checksum verify) | 0.04ms | 200ms | PASS |

## Memory retention (20 iter, arrayBuffers axis is the gate; heap is informational)

| op | heapUsed Δ | arrayBuffers Δ | cap | gc exposed | verdict |
|---|---|---|---|---|---|
| upload_workflow (10 upload across 4 providers + multipart) | -12952 B | 8192 B | 102400 B | yes | PASS |
| presigned_batch (5 presigned URL PUT/GET across providers) | -5192 B | 0 B | 102400 B | yes | PASS |
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
| max | 0.04ms |
| total | 0.54ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.02ms | 0.02ms | -0.0041ms | -17.49% |
| p50 | 0.03ms | 0.03ms | -0.0039ms | -12.64% |
| p95 | 0.04ms | 0.11ms | -0.07ms | -64.57% |
| p99 | 0.04ms | 0.22ms | -0.18ms | -81.95% |
| mean | 0.03ms | 0.05ms | -0.02ms | -41.75% |
| min | 0.02ms | 0.02ms | -0.0038ms | -16.82% |
| max | 0.04ms | 0.25ms | -0.21ms | -83.84% |
| total | 0.54ms | 0.93ms | -0.39ms | -41.75% |

### presigned_batch (5 presigned URL PUT/GET across providers)

# Perf Report — presigned_batch (5 presigned URL PUT/GET across providers).serial

| metric | value |
|---|---|
| iterations | 20 |
| warmup | 3 |
| p10 | 0.0092ms |
| p50 | 0.0093ms |
| p95 | 0.01ms |
| p99 | 0.02ms |
| mean | 0.01ms |
| stdev | 0.0020ms |
| min | 0.0091ms |
| max | 0.02ms |
| total | 0.20ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.0092ms | 0.0089ms | +0.00030ms | +3.33% |
| p50 | 0.0093ms | 0.0090ms | +0.00029ms | +3.24% |
| p95 | 0.01ms | 0.01ms | +0.0016ms | +12.21% |
| p99 | 0.02ms | 0.02ms | -0.0015ms | -8.39% |
| mean | 0.01ms | 0.0099ms | +0.000096ms | +0.96% |
| min | 0.0091ms | 0.0088ms | +0.00033ms | +3.81% |
| max | 0.02ms | 0.02ms | -0.0023ms | -11.85% |
| total | 0.20ms | 0.20ms | +0.0019ms | +0.96% |

### size_error_handling (5 oversize + checksum verify)

# Perf Report — size_error_handling (5 oversize + checksum verify).serial

| metric | value |
|---|---|
| iterations | 20 |
| warmup | 3 |
| p10 | 0.0085ms |
| p50 | 0.0091ms |
| p95 | 0.02ms |
| p99 | 0.02ms |
| mean | 0.01ms |
| stdev | 0.0034ms |
| min | 0.0081ms |
| max | 0.02ms |
| total | 0.21ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.0085ms | 0.0084ms | +0.000075ms | +0.89% |
| p50 | 0.0091ms | 0.0095ms | -0.00042ms | -4.37% |
| p95 | 0.02ms | 0.02ms | +0.0016ms | +9.59% |
| p99 | 0.02ms | 0.02ms | +0.0013ms | +6.79% |
| mean | 0.01ms | 0.01ms | -0.00029ms | -2.67% |
| min | 0.0081ms | 0.0083ms | -0.00013ms | -1.52% |
| max | 0.02ms | 0.02ms | +0.0012ms | +6.19% |
| total | 0.21ms | 0.22ms | -0.0057ms | -2.67% |

