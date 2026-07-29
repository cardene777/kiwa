# Perf Suite — date

Threshold source: [docs/quality/perf-thresholds.md](../../quality/perf-thresholds)

## Serial p95 (concurrency = 1)

| op | p95 | cap | gate | regression |
|---|---|---|---|---|
| addDays | 0.00ms | 5ms | PASS | stable (検知には +0.5ms (baseline 比 +80000%) 以上の悪化が必要) — gate 無効 (regressionGate=false) |
| formatDate | 0.00ms | 5ms | PASS | stable (検知には +0.5ms (baseline 比 +38148%) 以上の悪化が必要) — gate 無効 (regressionGate=false) |
| createDateClient | 0.00ms | 5ms | PASS | stable (検知には +0.5ms (baseline 比 +90326%) 以上の悪化が必要) — gate 無効 (regressionGate=false) |

## Concurrent p95 (concurrency = 10, 50 iter each)

| op | p95 | cap | gate |
|---|---|---|---|
| addDays | 0.01ms | 10ms | PASS |
| formatDate | 0.02ms | 10ms | PASS |
| createDateClient | 0.01ms | 10ms | PASS |

## Memory retention (200 iter, arrayBuffers axis is the gate; heap is informational)

| op | heapUsed Δ | arrayBuffers Δ | cap | gc exposed | verdict |
|---|---|---|---|---|---|
| addDays | -4760 B | 0 B | 102400 B | yes | PASS |
| formatDate | -2672 B | 0 B | 102400 B | yes | PASS |
| createDateClient | 7528 B | 0 B | 102400 B | yes | PASS |

## Detailed serial reports

### addDays

# Perf Report — addDays.serial

| metric | value |
|---|---|
| iterations | 200 |
| warmup | 5 |
| p50 | 0.00ms |
| p95 | 0.00ms |
| p99 | 0.01ms |
| mean | 0.00ms |
| stdev | 0.05ms |
| min | 0.00ms |
| max | 0.70ms |
| total | 0.84ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p50 | 0.00ms | 0.00ms | -0.00ms | -12.46% |
| p95 | 0.00ms | 0.00ms | +0.00ms | +260.00% |
| p99 | 0.01ms | 0.00ms | +0.01ms | +343.63% |
| mean | 0.00ms | 0.00ms | +0.00ms | +848.68% |
| min | 0.00ms | 0.00ms | -0.00ms | -28.52% |
| max | 0.70ms | 0.01ms | +0.69ms | +7889.05% |
| total | 0.84ms | 0.09ms | +0.75ms | +848.68% |

### formatDate

# Perf Report — formatDate.serial

| metric | value |
|---|---|
| iterations | 200 |
| warmup | 5 |
| p50 | 0.00ms |
| p95 | 0.00ms |
| p99 | 0.00ms |
| mean | 0.00ms |
| stdev | 0.00ms |
| min | 0.00ms |
| max | 0.01ms |
| total | 0.25ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p50 | 0.00ms | 0.00ms | -0.00ms | -0.09% |
| p95 | 0.00ms | 0.00ms | +0.00ms | +5.54% |
| p99 | 0.00ms | 0.00ms | +0.00ms | +17.80% |
| mean | 0.00ms | 0.00ms | +0.00ms | +2.66% |
| min | 0.00ms | 0.00ms | 0.00ms | 0.00% |
| max | 0.01ms | 0.01ms | +0.00ms | +21.34% |
| total | 0.25ms | 0.25ms | +0.01ms | +2.66% |

### createDateClient

# Perf Report — createDateClient.serial

| metric | value |
|---|---|
| iterations | 200 |
| warmup | 5 |
| p50 | 0.00ms |
| p95 | 0.00ms |
| p99 | 0.00ms |
| mean | 0.00ms |
| stdev | 0.00ms |
| min | 0.00ms |
| max | 0.01ms |
| total | 0.10ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p50 | 0.00ms | 0.00ms | +0.00ms | +12.28% |
| p95 | 0.00ms | 0.00ms | +0.00ms | +5.70% |
| p99 | 0.00ms | 0.00ms | +0.00ms | +63.97% |
| mean | 0.00ms | 0.00ms | +0.00ms | +7.09% |
| min | 0.00ms | 0.00ms | 0.00ms | 0.00% |
| max | 0.01ms | 0.01ms | -0.00ms | -0.59% |
| total | 0.10ms | 0.09ms | +0.01ms | +7.09% |

