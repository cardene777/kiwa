# Perf Suite — date

Threshold source: [docs/quality/perf-thresholds.md](../../quality/perf-thresholds)

## Serial p95 (concurrency = 1)

| op | p95 | cap | gate | regression |
|---|---|---|---|---|
| addDays | 0.00ms | 5ms | PASS | stable |
| formatDate | 0.00ms | 5ms | PASS | stable |
| createDateClient | 0.00ms | 5ms | PASS | improved |

## Concurrent p95 (concurrency = 10, 50 iter each)

| op | p95 | cap | gate |
|---|---|---|---|
| addDays | 0.01ms | 10ms | PASS |
| formatDate | 0.02ms | 10ms | PASS |
| createDateClient | 0.01ms | 10ms | PASS |

## Memory retention (200 iter, arrayBuffers axis is the gate; heap is informational)

| op | heapUsed Δ | arrayBuffers Δ | cap | verdict |
|---|---|---|---|---|
| addDays | 333440 B | 0 B | 102400 B | PASS |
| formatDate | 430856 B | 0 B | 102400 B | PASS |
| createDateClient | 152080 B | 0 B | 102400 B | PASS |

## Detailed serial reports

### addDays

# Perf Report — addDays.serial

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
| total | 0.08ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p50 | 0.00ms | 0.00ms | 0.00ms | 0.00% |
| p95 | 0.00ms | 0.00ms | -0.00ms | -4.66% |
| p99 | 0.00ms | 0.00ms | +0.00ms | +24.71% |
| mean | 0.00ms | 0.00ms | +0.00ms | +11.06% |
| min | 0.00ms | 0.00ms | +0.00ms | +20.19% |
| max | 0.01ms | 0.00ms | +0.00ms | +21.92% |
| total | 0.08ms | 0.08ms | +0.01ms | +11.06% |

### formatDate

# Perf Report — formatDate.serial

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
| total | 0.26ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p50 | 0.00ms | 0.00ms | +0.00ms | +12.50% |
| p95 | 0.00ms | 0.00ms | -0.00ms | -23.90% |
| p99 | 0.01ms | 0.01ms | +0.00ms | +31.74% |
| mean | 0.00ms | 0.00ms | +0.00ms | +10.50% |
| min | 0.00ms | 0.00ms | +0.00ms | +15.66% |
| max | 0.01ms | 0.01ms | +0.00ms | +51.45% |
| total | 0.26ms | 0.24ms | +0.03ms | +10.50% |

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
| total | 0.09ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p50 | 0.00ms | 0.00ms | -0.00ms | -0.30% |
| p95 | 0.00ms | 0.00ms | -0.00ms | -64.10% |
| p99 | 0.00ms | 0.00ms | -0.00ms | -20.81% |
| mean | 0.00ms | 0.00ms | -0.00ms | -14.32% |
| min | 0.00ms | 0.00ms | 0.00ms | 0.00% |
| max | 0.01ms | 0.01ms | +0.00ms | +5.75% |
| total | 0.09ms | 0.10ms | -0.01ms | -14.32% |

