# Perf Suite — upload

Threshold source: [docs/quality/perf-thresholds.md](../../quality/perf-thresholds)

## Serial p95 (concurrency = 1)

| op | p95 | cap | gate | regression |
|---|---|---|---|---|
| uploadFile | 0.01ms | 5ms | PASS | stable |
| createPresignedUrl | 0.00ms | 5ms | PASS | stable |
| verifyUpload | 0.00ms | 5ms | PASS | stable |

## Concurrent p95 (concurrency = 10, 50 iter each)

| op | p95 | cap | gate |
|---|---|---|---|
| uploadFile | 0.03ms | 10ms | PASS |
| createPresignedUrl | 0.03ms | 10ms | PASS |
| verifyUpload | 0.02ms | 10ms | PASS |

## Memory retention (200 iter, arrayBuffers axis is the gate; heap is informational)

| op | heapUsed Δ | arrayBuffers Δ | cap | verdict |
|---|---|---|---|---|
| uploadFile | 474368 B | 8192 B | 102400 B | PASS |
| createPresignedUrl | -7892184 B | 0 B | 102400 B | PASS |
| verifyUpload | 273112 B | 8192 B | 102400 B | PASS |

## Detailed serial reports

### uploadFile

# Perf Report — uploadFile.serial

| metric | value |
|---|---|
| iterations | 200 |
| warmup | 5 |
| p50 | 0.00ms |
| p95 | 0.01ms |
| p99 | 0.01ms |
| mean | 0.00ms |
| stdev | 0.00ms |
| min | 0.00ms |
| max | 0.02ms |
| total | 0.54ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p50 | 0.00ms | 0.00ms | +0.00ms | +4.45% |
| p95 | 0.01ms | 0.01ms | -0.00ms | -9.55% |
| p99 | 0.01ms | 0.01ms | -0.00ms | -2.09% |
| mean | 0.00ms | 0.00ms | +0.00ms | +1.51% |
| min | 0.00ms | 0.00ms | +0.00ms | +2.52% |
| max | 0.02ms | 0.02ms | +0.00ms | +6.22% |
| total | 0.54ms | 0.53ms | +0.01ms | +1.51% |

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
| max | 0.01ms |
| total | 0.47ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p50 | 0.00ms | 0.00ms | +0.00ms | +0.05% |
| p95 | 0.00ms | 0.00ms | -0.00ms | -14.51% |
| p99 | 0.01ms | 0.02ms | -0.01ms | -50.28% |
| mean | 0.00ms | 0.01ms | -0.00ms | -56.38% |
| min | 0.00ms | 0.00ms | -0.00ms | -0.05% |
| max | 0.01ms | 0.61ms | -0.59ms | -97.60% |
| total | 0.47ms | 1.07ms | -0.60ms | -56.38% |

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
| total | 0.25ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p50 | 0.00ms | 0.00ms | 0.00ms | 0.00% |
| p95 | 0.00ms | 0.00ms | -0.00ms | -3.59% |
| p99 | 0.01ms | 0.01ms | -0.00ms | -10.12% |
| mean | 0.00ms | 0.00ms | -0.00ms | -3.64% |
| min | 0.00ms | 0.00ms | 0.00ms | 0.00% |
| max | 0.01ms | 0.01ms | +0.00ms | +14.52% |
| total | 0.25ms | 0.26ms | -0.01ms | -3.64% |

