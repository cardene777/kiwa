# Perf Suite — date

Threshold source: [docs/quality/perf-thresholds.md](../../quality/perf-thresholds)

## Serial p95 (concurrency = 1)

| op | p95 | cap | gate | regression |
|---|---|---|---|---|
| addDays | 0.00ms | 5ms | PASS | stable |
| formatDate | 0.00ms | 5ms | PASS | stable |
| createDateClient | 0.00ms | 5ms | PASS | stable |

## Concurrent p95 (concurrency = 10, 50 iter each)

| op | p95 | cap | gate |
|---|---|---|---|
| addDays | 0.01ms | 10ms | PASS |
| formatDate | 0.01ms | 10ms | PASS |
| createDateClient | 0.01ms | 10ms | PASS |

## Memory retention (200 iter, arrayBuffers axis is the gate; heap is informational)

| op | heapUsed Δ | arrayBuffers Δ | cap | gc exposed | verdict |
|---|---|---|---|---|---|
| addDays | -3200 B | -47005 B | 102400 B | yes | PASS |
| formatDate | -3576 B | 0 B | 102400 B | yes | PASS |
| createDateClient | 4512 B | 0 B | 102400 B | yes | PASS |

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
| p50 | 0.00ms | 0.00ms | -0.00ms | -12.31% |
| p95 | 0.00ms | 0.00ms | -0.00ms | -37.73% |
| p99 | 0.00ms | 0.00ms | -0.00ms | -1.36% |
| mean | 0.00ms | 0.00ms | -0.00ms | -8.46% |
| min | 0.00ms | 0.00ms | +0.00ms | +20.19% |
| max | 0.01ms | 0.01ms | -0.00ms | -8.29% |
| total | 0.08ms | 0.09ms | -0.01ms | -8.46% |

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
| total | 0.22ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p50 | 0.00ms | 0.00ms | -0.00ms | -7.66% |
| p95 | 0.00ms | 0.00ms | +0.00ms | +2.74% |
| p99 | 0.01ms | 0.00ms | +0.00ms | +51.21% |
| mean | 0.00ms | 0.00ms | -0.00ms | -7.70% |
| min | 0.00ms | 0.00ms | -0.00ms | -24.02% |
| max | 0.01ms | 0.01ms | +0.00ms | +8.39% |
| total | 0.22ms | 0.24ms | -0.02ms | -7.70% |

### createDateClient

# Perf Report — createDateClient.serial

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
| total | 0.10ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p50 | 0.00ms | 0.00ms | -0.00ms | -11.20% |
| p95 | 0.00ms | 0.00ms | +0.00ms | +15.13% |
| p99 | 0.01ms | 0.00ms | +0.00ms | +127.73% |
| mean | 0.00ms | 0.00ms | +0.00ms | +8.72% |
| min | 0.00ms | 0.00ms | -0.00ms | -0.34% |
| max | 0.01ms | 0.01ms | +0.00ms | +33.73% |
| total | 0.10ms | 0.10ms | +0.01ms | +8.72% |

