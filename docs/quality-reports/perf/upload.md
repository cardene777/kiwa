# Perf Suite — upload

Threshold source: [docs/quality/perf-thresholds.md](../../quality/perf-thresholds)

## Serial p95 (concurrency = 1)

| op | p95 | cap | gate | regression |
|---|---|---|---|---|
| uploadFile | 0.01ms | 5ms | PASS | stable (差 0.01ms が下限 0.5ms 未満で判定を保留) — gate 無効 (regressionGate=false) |
| createPresignedUrl | 0.00ms | 5ms | PASS | stable (検知には +0.5ms (baseline 比 +14286%) 以上の悪化が必要) — gate 無効 (regressionGate=false) |
| verifyUpload | 0.00ms | 5ms | PASS | stable (検知には +0.5ms (baseline 比 +25362%) 以上の悪化が必要) — gate 無効 (regressionGate=false) |

## Concurrent p95 (concurrency = 10, 50 iter each)

| op | p95 | cap | gate |
|---|---|---|---|
| uploadFile | 0.04ms | 10ms | PASS |
| createPresignedUrl | 0.04ms | 10ms | PASS |
| verifyUpload | 0.02ms | 10ms | PASS |

## Memory retention (200 iter, arrayBuffers axis is the gate; heap is informational)

| op | heapUsed Δ | arrayBuffers Δ | cap | gc exposed | verdict |
|---|---|---|---|---|---|
| uploadFile | 76656 B | 8192 B | 102400 B | yes | PASS |
| createPresignedUrl | -27856 B | 0 B | 102400 B | yes | PASS |
| verifyUpload | 11664 B | 0 B | 102400 B | yes | PASS |

## Detailed serial reports

### uploadFile

# Perf Report — uploadFile.serial

| metric | value |
|---|---|
| iterations | 200 |
| warmup | 5 |
| p50 | 0.00ms |
| p95 | 0.01ms |
| p99 | 0.02ms |
| mean | 0.00ms |
| stdev | 0.00ms |
| min | 0.00ms |
| max | 0.02ms |
| total | 0.59ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p50 | 0.00ms | 0.00ms | -0.00ms | -15.00% |
| p95 | 0.01ms | 0.01ms | -0.01ms | -44.31% |
| p99 | 0.02ms | 0.04ms | -0.02ms | -59.53% |
| mean | 0.00ms | 0.01ms | -0.00ms | -52.87% |
| min | 0.00ms | 0.00ms | -0.00ms | -10.40% |
| max | 0.02ms | 0.30ms | -0.28ms | -92.47% |
| total | 0.59ms | 1.25ms | -0.66ms | -52.87% |

### createPresignedUrl

# Perf Report — createPresignedUrl.serial

| metric | value |
|---|---|
| iterations | 200 |
| warmup | 5 |
| p50 | 0.00ms |
| p95 | 0.00ms |
| p99 | 0.01ms |
| mean | 0.00ms |
| stdev | 0.00ms |
| min | 0.00ms |
| max | 0.02ms |
| total | 0.47ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p50 | 0.00ms | 0.00ms | -0.00ms | -3.98% |
| p95 | 0.00ms | 0.00ms | -0.00ms | -3.45% |
| p99 | 0.01ms | 0.01ms | -0.00ms | -1.04% |
| mean | 0.00ms | 0.00ms | -0.00ms | -3.42% |
| min | 0.00ms | 0.00ms | -0.00ms | -2.15% |
| max | 0.02ms | 0.02ms | +0.00ms | +4.92% |
| total | 0.47ms | 0.49ms | -0.02ms | -3.42% |

### verifyUpload

# Perf Report — verifyUpload.serial

| metric | value |
|---|---|
| iterations | 200 |
| warmup | 5 |
| p50 | 0.00ms |
| p95 | 0.00ms |
| p99 | 0.01ms |
| mean | 0.00ms |
| stdev | 0.00ms |
| min | 0.00ms |
| max | 0.01ms |
| total | 0.27ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p50 | 0.00ms | 0.00ms | +0.00ms | +3.64% |
| p95 | 0.00ms | 0.00ms | -0.00ms | -21.68% |
| p99 | 0.01ms | 0.01ms | +0.00ms | +12.38% |
| mean | 0.00ms | 0.00ms | +0.00ms | +1.72% |
| min | 0.00ms | 0.00ms | 0.00ms | 0.00% |
| max | 0.01ms | 0.01ms | -0.00ms | -15.98% |
| total | 0.27ms | 0.27ms | +0.00ms | +1.72% |

