# Perf Suite — upload-app-scenario

Threshold source: [docs/quality/perf-thresholds.md](../../quality/perf-thresholds)

測定系の分解能 = 0.00025ms (何もしない関数を同じ経路で呼んだ時の p10)。 回帰判定の絶対下限は既定でこの 2 倍 = 0.00049ms、 op ごとの実効値は下表の「下限」 列。

## Serial (concurrency = 1)

| op | p10 (回帰判定) | p95 (上限判定) | cap | 下限 | gate | regression |
|---|---|---|---|---|---|---|
| upload_workflow (10 upload across 4 providers + multipart) | 0.02ms | 0.04ms | 100ms | 0.00049ms | PASS | stable — gate 無効 (regressionGate=false) |
| presigned_batch (5 presigned URL PUT/GET across providers) | 0.0094ms | 0.02ms | 100ms | 0.00049ms | PASS | stable (p10 +6% (閾値未満)、 p95 +33% (裾は実行間の振れ幅と区別できないため判定には使わない)) — gate 無効 (regressionGate=false) |
| size_error_handling (5 oversize + checksum verify) | 0.0083ms | 0.02ms | 100ms | 0.00049ms | PASS | stable — gate 無効 (regressionGate=false) |

## Concurrent p95 (concurrency = 4, 5 iter each)

| op | p95 | cap | gate |
|---|---|---|---|
| upload_workflow (10 upload across 4 providers + multipart) | 0.15ms | 200ms | PASS |
| presigned_batch (5 presigned URL PUT/GET across providers) | 0.04ms | 200ms | PASS |
| size_error_handling (5 oversize + checksum verify) | 0.08ms | 200ms | PASS |

## Memory retention (20 iter, arrayBuffers axis is the gate; heap is informational)

| op | heapUsed Δ | arrayBuffers Δ | cap | gc exposed | verdict |
|---|---|---|---|---|---|
| upload_workflow (10 upload across 4 providers + multipart) | 280752 B | 8192 B | 102400 B | yes | PASS |
| presigned_batch (5 presigned URL PUT/GET across providers) | -3768 B | 0 B | 102400 B | yes | PASS |
| size_error_handling (5 oversize + checksum verify) | 88 B | 0 B | 102400 B | yes | PASS |

## Detailed serial reports

### upload_workflow (10 upload across 4 providers + multipart)

# Perf Report — upload_workflow (10 upload across 4 providers + multipart).serial

| metric | value |
|---|---|
| iterations | 20 |
| warmup | 3 |
| p10 | 0.02ms |
| p50 | 0.02ms |
| p95 | 0.04ms |
| p99 | 0.04ms |
| mean | 0.03ms |
| stdev | 0.0076ms |
| min | 0.02ms |
| max | 0.04ms |
| total | 0.53ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.02ms | 0.02ms | -0.0042ms | -17.72% |
| p50 | 0.02ms | 0.03ms | -0.0069ms | -22.42% |
| p95 | 0.04ms | 0.11ms | -0.07ms | -62.56% |
| p99 | 0.04ms | 0.22ms | -0.18ms | -80.84% |
| mean | 0.03ms | 0.05ms | -0.02ms | -43.28% |
| min | 0.02ms | 0.02ms | -0.0038ms | -16.82% |
| max | 0.04ms | 0.25ms | -0.20ms | -82.82% |
| total | 0.53ms | 0.93ms | -0.40ms | -43.28% |

### presigned_batch (5 presigned URL PUT/GET across providers)

# Perf Report — presigned_batch (5 presigned URL PUT/GET across providers).serial

| metric | value |
|---|---|
| iterations | 20 |
| warmup | 3 |
| p10 | 0.0094ms |
| p50 | 0.0095ms |
| p95 | 0.02ms |
| p99 | 0.02ms |
| mean | 0.01ms |
| stdev | 0.0030ms |
| min | 0.0092ms |
| max | 0.02ms |
| total | 0.22ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.0094ms | 0.0089ms | +0.00050ms | +5.69% |
| p50 | 0.0095ms | 0.0090ms | +0.00046ms | +5.08% |
| p95 | 0.02ms | 0.01ms | +0.0043ms | +33.31% |
| p99 | 0.02ms | 0.02ms | +0.00050ms | +2.77% |
| mean | 0.01ms | 0.0099ms | +0.0012ms | +11.73% |
| min | 0.0092ms | 0.0088ms | +0.00050ms | +5.71% |
| max | 0.02ms | 0.02ms | -0.00046ms | -2.37% |
| total | 0.22ms | 0.20ms | +0.02ms | +11.73% |

### size_error_handling (5 oversize + checksum verify)

# Perf Report — size_error_handling (5 oversize + checksum verify).serial

| metric | value |
|---|---|
| iterations | 20 |
| warmup | 3 |
| p10 | 0.0083ms |
| p50 | 0.0096ms |
| p95 | 0.02ms |
| p99 | 0.02ms |
| mean | 0.01ms |
| stdev | 0.0032ms |
| min | 0.0083ms |
| max | 0.02ms |
| total | 0.22ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.0083ms | 0.0084ms | -0.000080ms | -0.95% |
| p50 | 0.0096ms | 0.0095ms | +0.000042ms | +0.44% |
| p95 | 0.02ms | 0.02ms | +0.0011ms | +6.37% |
| p99 | 0.02ms | 0.02ms | -0.0011ms | -5.90% |
| mean | 0.01ms | 0.01ms | +0.00014ms | +1.30% |
| min | 0.0083ms | 0.0083ms | 0.00ms | 0.00% |
| max | 0.02ms | 0.02ms | -0.0017ms | -8.53% |
| total | 0.22ms | 0.22ms | +0.0028ms | +1.30% |

