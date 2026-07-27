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
| formatDate | 0.02ms | 10ms | PASS |
| createDateClient | 0.01ms | 10ms | PASS |

## Memory retention (200 iter, arrayBuffers axis is the gate; heap is informational)

| op | heapUsed Δ | arrayBuffers Δ | cap | gc exposed | verdict |
|---|---|---|---|---|---|
| addDays | -4272 B | -45358 B | 102400 B | yes | PASS |
| formatDate | -2200 B | 0 B | 102400 B | yes | PASS |
| createDateClient | -14936 B | 0 B | 102400 B | yes | PASS |

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
| p95 | 0.00ms | 0.00ms | -0.00ms | -9.57% |
| p99 | 0.00ms | 0.00ms | -0.00ms | -7.37% |
| mean | 0.00ms | 0.00ms | -0.00ms | -3.67% |
| min | 0.00ms | 0.00ms | 0.00ms | 0.00% |
| max | 0.01ms | 0.01ms | -0.00ms | -16.58% |
| total | 0.08ms | 0.09ms | -0.00ms | -3.67% |

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
| total | 0.25ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p50 | 0.00ms | 0.00ms | +0.00ms | +3.88% |
| p95 | 0.00ms | 0.00ms | +0.00ms | +5.70% |
| p99 | 0.01ms | 0.00ms | +0.00ms | +94.07% |
| mean | 0.00ms | 0.00ms | +0.00ms | +4.14% |
| min | 0.00ms | 0.00ms | -0.00ms | -12.01% |
| max | 0.01ms | 0.01ms | +0.00ms | +7.82% |
| total | 0.25ms | 0.24ms | +0.01ms | +4.14% |

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
| total | 0.12ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p50 | 0.00ms | 0.00ms | -0.00ms | -11.20% |
| p95 | 0.00ms | 0.00ms | +0.00ms | +42.71% |
| p99 | 0.01ms | 0.00ms | +0.01ms | +212.28% |
| mean | 0.00ms | 0.00ms | +0.00ms | +21.42% |
| min | 0.00ms | 0.00ms | -0.00ms | -0.34% |
| max | 0.01ms | 0.01ms | +0.00ms | +34.94% |
| total | 0.12ms | 0.10ms | +0.02ms | +21.42% |

