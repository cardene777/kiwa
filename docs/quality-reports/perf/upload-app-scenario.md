# Perf Suite — upload-app-scenario

Threshold source: [docs/quality/perf-thresholds.md](../../quality/perf-thresholds)

測定系の分解能 = 0.00021ms (何もしない関数を同じ経路で呼んだ時の p10)。 回帰判定の絶対下限は既定でこの 2 倍 = 0.00042ms、 op ごとの実効値は下表の「下限」 列。

## Serial (concurrency = 1)

| op | p10 (回帰判定) | p95 (上限判定) | cap | 下限 | gate | regression |
|---|---|---|---|---|---|---|
| upload_workflow (10 upload across 4 providers + multipart) | 0.02ms | 0.05ms | 100ms | 0.00042ms | PASS | stable — gate 無効 (regressionGate=false) |
| presigned_batch (5 presigned URL PUT/GET across providers) | 0.0088ms | 0.01ms | 100ms | 0.00042ms | PASS | stable — gate 無効 (regressionGate=false) |
| size_error_handling (5 oversize + checksum verify) | 0.0083ms | 0.02ms | 100ms | 0.00042ms | PASS | stable (p10 -1% (閾値未満)、 p95 +20% (裾は実行間の振れ幅と区別できないため判定には使わない)) — gate 無効 (regressionGate=false) |

## Concurrent p95 (concurrency = 4, 5 iter each)

| op | p95 | cap | gate |
|---|---|---|---|
| upload_workflow (10 upload across 4 providers + multipart) | 0.12ms | 200ms | PASS |
| presigned_batch (5 presigned URL PUT/GET across providers) | 0.04ms | 200ms | PASS |
| size_error_handling (5 oversize + checksum verify) | 0.04ms | 200ms | PASS |

## Memory retention (20 iter, arrayBuffers axis is the gate; heap is informational)

| op | heapUsed Δ | arrayBuffers Δ | cap | gc exposed | verdict |
|---|---|---|---|---|---|
| upload_workflow (10 upload across 4 providers + multipart) | 33944 B | 8192 B | 102400 B | yes | PASS |
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
| p95 | 0.05ms |
| p99 | 0.05ms |
| mean | 0.03ms |
| stdev | 0.0085ms |
| min | 0.02ms |
| max | 0.05ms |
| total | 0.57ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.02ms | 0.02ms | -0.0036ms | -15.49% |
| p50 | 0.03ms | 0.03ms | -0.0024ms | -7.95% |
| p95 | 0.05ms | 0.11ms | -0.06ms | -55.21% |
| p99 | 0.05ms | 0.22ms | -0.17ms | -76.96% |
| mean | 0.03ms | 0.05ms | -0.02ms | -39.15% |
| min | 0.02ms | 0.02ms | -0.0039ms | -17.19% |
| max | 0.05ms | 0.25ms | -0.19ms | -79.32% |
| total | 0.57ms | 0.93ms | -0.37ms | -39.15% |

### presigned_batch (5 presigned URL PUT/GET across providers)

# Perf Report — presigned_batch (5 presigned URL PUT/GET across providers).serial

| metric | value |
|---|---|
| iterations | 20 |
| warmup | 3 |
| p10 | 0.0088ms |
| p50 | 0.0091ms |
| p95 | 0.01ms |
| p99 | 0.01ms |
| mean | 0.0097ms |
| stdev | 0.0015ms |
| min | 0.0087ms |
| max | 0.01ms |
| total | 0.19ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.0088ms | 0.0089ms | -0.000038ms | -0.43% |
| p50 | 0.0091ms | 0.0090ms | +0.000084ms | +0.93% |
| p95 | 0.01ms | 0.01ms | +0.000062ms | +0.48% |
| p99 | 0.01ms | 0.02ms | -0.0047ms | -25.95% |
| mean | 0.0097ms | 0.0099ms | -0.00025ms | -2.53% |
| min | 0.0087ms | 0.0088ms | -0.000041ms | -0.47% |
| max | 0.01ms | 0.02ms | -0.0059ms | -30.39% |
| total | 0.19ms | 0.20ms | -0.0050ms | -2.53% |

### size_error_handling (5 oversize + checksum verify)

# Perf Report — size_error_handling (5 oversize + checksum verify).serial

| metric | value |
|---|---|
| iterations | 20 |
| warmup | 3 |
| p10 | 0.0083ms |
| p50 | 0.0092ms |
| p95 | 0.02ms |
| p99 | 0.05ms |
| mean | 0.01ms |
| stdev | 0.01ms |
| min | 0.0083ms |
| max | 0.06ms |
| total | 0.26ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.0083ms | 0.0084ms | -0.000079ms | -0.94% |
| p50 | 0.0092ms | 0.0095ms | -0.00031ms | -3.28% |
| p95 | 0.02ms | 0.02ms | +0.0034ms | +20.24% |
| p99 | 0.05ms | 0.02ms | +0.04ms | +188.86% |
| mean | 0.01ms | 0.01ms | +0.0022ms | +20.50% |
| min | 0.0083ms | 0.0083ms | 0.00ms | 0.00% |
| max | 0.06ms | 0.02ms | +0.04ms | +224.96% |
| total | 0.26ms | 0.22ms | +0.04ms | +20.50% |

