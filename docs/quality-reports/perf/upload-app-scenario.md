# Perf Suite — upload-app-scenario

Threshold source: [docs/quality/perf-thresholds.md](../../quality/perf-thresholds)

測定系の分解能 = 0.00025ms (何もしない関数を同じ経路で呼んだ時の p10)。 回帰判定の絶対下限は既定でこの 2 倍 = 0.00050ms、 op ごとの実効値は下表の「下限」 列。

## Serial (concurrency = 1)

| op | p10 (回帰判定) | p95 (上限判定) | cap | 下限 | gate | regression |
|---|---|---|---|---|---|---|
| upload_workflow (10 upload across 4 providers + multipart) | 0.02ms | 0.04ms | 100ms | 0.00050ms | PASS | stable — gate 無効 (regressionGate=false) |
| presigned_batch (5 presigned URL PUT/GET across providers) | 0.0089ms | 0.01ms | 100ms | 0.00050ms | PASS | stable — gate 無効 (regressionGate=false) |
| size_error_handling (5 oversize + checksum verify) | 0.0082ms | 0.01ms | 100ms | 0.00050ms | PASS | stable — gate 無効 (regressionGate=false) |

## Concurrent p95 (concurrency = 4, 5 iter each)

| op | p95 | cap | gate |
|---|---|---|---|
| upload_workflow (10 upload across 4 providers + multipart) | 0.13ms | 200ms | PASS |
| presigned_batch (5 presigned URL PUT/GET across providers) | 0.05ms | 200ms | PASS |
| size_error_handling (5 oversize + checksum verify) | 0.04ms | 200ms | PASS |

## Memory retention (20 iter, arrayBuffers axis is the gate; heap is informational)

| op | heapUsed Δ | arrayBuffers Δ | cap | gc exposed | verdict |
|---|---|---|---|---|---|
| upload_workflow (10 upload across 4 providers + multipart) | 11760 B | 8192 B | 102400 B | yes | PASS |
| presigned_batch (5 presigned URL PUT/GET across providers) | -4808 B | 0 B | 102400 B | yes | PASS |
| size_error_handling (5 oversize + checksum verify) | -440 B | 0 B | 102400 B | yes | PASS |

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
| p99 | 0.05ms |
| mean | 0.03ms |
| stdev | 0.0087ms |
| min | 0.02ms |
| max | 0.05ms |
| total | 0.55ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.02ms | 0.02ms | -0.0034ms | -14.60% |
| p50 | 0.03ms | 0.03ms | -0.0035ms | -11.28% |
| p95 | 0.04ms | 0.11ms | -0.07ms | -64.01% |
| p99 | 0.05ms | 0.22ms | -0.17ms | -76.32% |
| mean | 0.03ms | 0.05ms | -0.02ms | -40.68% |
| min | 0.02ms | 0.02ms | -0.0034ms | -14.99% |
| max | 0.05ms | 0.25ms | -0.19ms | -77.66% |
| total | 0.55ms | 0.93ms | -0.38ms | -40.68% |

### presigned_batch (5 presigned URL PUT/GET across providers)

# Perf Report — presigned_batch (5 presigned URL PUT/GET across providers).serial

| metric | value |
|---|---|
| iterations | 20 |
| warmup | 3 |
| p10 | 0.0089ms |
| p50 | 0.0092ms |
| p95 | 0.01ms |
| p99 | 0.02ms |
| mean | 0.0099ms |
| stdev | 0.0020ms |
| min | 0.0089ms |
| max | 0.02ms |
| total | 0.20ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.0089ms | 0.0089ms | +0.000083ms | +0.94% |
| p50 | 0.0092ms | 0.0090ms | +0.00019ms | +2.08% |
| p95 | 0.01ms | 0.01ms | +0.0010ms | +7.88% |
| p99 | 0.02ms | 0.02ms | -0.0018ms | -9.75% |
| mean | 0.0099ms | 0.0099ms | -0.000071ms | -0.71% |
| min | 0.0089ms | 0.0088ms | +0.00012ms | +1.43% |
| max | 0.02ms | 0.02ms | -0.0025ms | -12.71% |
| total | 0.20ms | 0.20ms | -0.0014ms | -0.71% |

### size_error_handling (5 oversize + checksum verify)

# Perf Report — size_error_handling (5 oversize + checksum verify).serial

| metric | value |
|---|---|
| iterations | 20 |
| warmup | 3 |
| p10 | 0.0082ms |
| p50 | 0.0086ms |
| p95 | 0.01ms |
| p99 | 0.01ms |
| mean | 0.0095ms |
| stdev | 0.0018ms |
| min | 0.0080ms |
| max | 0.01ms |
| total | 0.19ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.0082ms | 0.0084ms | -0.00024ms | -2.87% |
| p50 | 0.0086ms | 0.0095ms | -0.00092ms | -9.62% |
| p95 | 0.01ms | 0.02ms | -0.0040ms | -24.09% |
| p99 | 0.01ms | 0.02ms | -0.0051ms | -27.08% |
| mean | 0.0095ms | 0.01ms | -0.0013ms | -11.80% |
| min | 0.0080ms | 0.0083ms | -0.00025ms | -3.03% |
| max | 0.01ms | 0.02ms | -0.0054ms | -27.72% |
| total | 0.19ms | 0.22ms | -0.03ms | -11.80% |

