# Perf Suite — upload-app-scenario

Threshold source: [docs/quality/perf-thresholds.md](../../quality/perf-thresholds)

測定系の分解能 = 0.00025ms (何もしない関数を同じ経路で呼んだ時の p10)。 回帰判定の絶対下限は既定でこの 2 倍 = 0.00050ms、 op ごとの実効値は下表の「下限」 列。

## Serial (concurrency = 1)

| op | p10 (回帰判定) | p95 (上限判定) | cap | 下限 | gate | regression |
|---|---|---|---|---|---|---|
| upload_workflow (10 upload across 4 providers + multipart) | 0.02ms | 0.04ms | 100ms | 0.00050ms | PASS | stable — gate 無効 (regressionGate=false) |
| presigned_batch (5 presigned URL PUT/GET across providers) | 0.0094ms | 0.01ms | 100ms | 0.00050ms | PASS | stable — gate 無効 (regressionGate=false) |
| size_error_handling (5 oversize + checksum verify) | 0.0087ms | 0.02ms | 100ms | 0.00050ms | PASS | stable — gate 無効 (regressionGate=false) |

## Concurrent p95 (concurrency = 4, 5 iter each)

| op | p95 | cap | gate |
|---|---|---|---|
| upload_workflow (10 upload across 4 providers + multipart) | 0.18ms | 200ms | PASS |
| presigned_batch (5 presigned URL PUT/GET across providers) | 0.04ms | 200ms | PASS |
| size_error_handling (5 oversize + checksum verify) | 0.04ms | 200ms | PASS |

## Memory retention (20 iter, arrayBuffers axis is the gate; heap is informational)

| op | heapUsed Δ | arrayBuffers Δ | cap | gc exposed | verdict |
|---|---|---|---|---|---|
| upload_workflow (10 upload across 4 providers + multipart) | 13504 B | 8192 B | 102400 B | yes | PASS |
| presigned_batch (5 presigned URL PUT/GET across providers) | -3848 B | 0 B | 102400 B | yes | PASS |
| size_error_handling (5 oversize + checksum verify) | -360 B | 0 B | 102400 B | yes | PASS |

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
| stdev | 0.0096ms |
| min | 0.02ms |
| max | 0.06ms |
| total | 0.59ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.02ms | 0.02ms | -0.0026ms | -11.29% |
| p50 | 0.03ms | 0.03ms | -0.0019ms | -6.25% |
| p95 | 0.04ms | 0.11ms | -0.07ms | -61.91% |
| p99 | 0.06ms | 0.22ms | -0.16ms | -72.76% |
| mean | 0.03ms | 0.05ms | -0.02ms | -37.05% |
| min | 0.02ms | 0.02ms | -0.0023ms | -10.06% |
| max | 0.06ms | 0.25ms | -0.18ms | -73.94% |
| total | 0.59ms | 0.93ms | -0.35ms | -37.05% |

### presigned_batch (5 presigned URL PUT/GET across providers)

# Perf Report — presigned_batch (5 presigned URL PUT/GET across providers).serial

| metric | value |
|---|---|
| iterations | 20 |
| warmup | 3 |
| p10 | 0.0094ms |
| p50 | 0.0096ms |
| p95 | 0.01ms |
| p99 | 0.02ms |
| mean | 0.01ms |
| stdev | 0.0016ms |
| min | 0.0093ms |
| max | 0.02ms |
| total | 0.20ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.0094ms | 0.0089ms | +0.00051ms | +5.73% |
| p50 | 0.0096ms | 0.0090ms | +0.00058ms | +6.47% |
| p95 | 0.01ms | 0.01ms | +0.0013ms | +9.68% |
| p99 | 0.02ms | 0.02ms | -0.0030ms | -16.87% |
| mean | 0.01ms | 0.0099ms | +0.00021ms | +2.14% |
| min | 0.0093ms | 0.0088ms | +0.00058ms | +6.66% |
| max | 0.02ms | 0.02ms | -0.0041ms | -21.34% |
| total | 0.20ms | 0.20ms | +0.0043ms | +2.14% |

### size_error_handling (5 oversize + checksum verify)

# Perf Report — size_error_handling (5 oversize + checksum verify).serial

| metric | value |
|---|---|
| iterations | 20 |
| warmup | 3 |
| p10 | 0.0087ms |
| p50 | 0.0096ms |
| p95 | 0.02ms |
| p99 | 0.02ms |
| mean | 0.01ms |
| stdev | 0.0028ms |
| min | 0.0087ms |
| max | 0.02ms |
| total | 0.21ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.0087ms | 0.0084ms | +0.00030ms | +3.56% |
| p50 | 0.0096ms | 0.0095ms | +0.000042ms | +0.44% |
| p95 | 0.02ms | 0.02ms | +0.00014ms | +0.85% |
| p99 | 0.02ms | 0.02ms | -0.00024ms | -1.25% |
| mean | 0.01ms | 0.01ms | -0.00012ms | -1.11% |
| min | 0.0087ms | 0.0083ms | +0.00042ms | +5.05% |
| max | 0.02ms | 0.02ms | -0.00033ms | -1.70% |
| total | 0.21ms | 0.22ms | -0.0024ms | -1.11% |

