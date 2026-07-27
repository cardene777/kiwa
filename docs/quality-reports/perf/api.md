# Perf Suite — api

Threshold source: [docs/quality/perf-thresholds.md](../../quality/perf-thresholds)

## Serial p95 (concurrency = 1)

| op | p95 | cap | gate | regression |
|---|---|---|---|---|
| requestClientGet | 0.04ms | 5ms | PASS | stable |
| requestClientPost | 0.01ms | 5ms | PASS | stable |

## Concurrent p95 (concurrency = 10, 50 iter each)

| op | p95 | cap | gate |
|---|---|---|---|
| requestClientGet | 0.30ms | 10ms | PASS |
| requestClientPost | 0.08ms | 10ms | PASS |

## Memory retention (200 iter, arrayBuffers axis is the gate; heap is informational)

| op | heapUsed Δ | arrayBuffers Δ | cap | gc exposed | verdict |
|---|---|---|---|---|---|
| requestClientGet | -132056 B | 2200 B | 102400 B | yes | PASS |
| requestClientPost | 1888 B | 0 B | 102400 B | yes | PASS |

## Detailed serial reports

### requestClientGet

# Perf Report — requestClientGet.serial

| metric | value |
|---|---|
| iterations | 200 |
| warmup | 5 |
| p50 | 0.01ms |
| p95 | 0.04ms |
| p99 | 0.08ms |
| mean | 0.02ms |
| stdev | 0.02ms |
| min | 0.01ms |
| max | 0.14ms |
| total | 3.75ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p50 | 0.01ms | 0.01ms | -0.00ms | -4.07% |
| p95 | 0.04ms | 0.06ms | -0.03ms | -41.38% |
| p99 | 0.08ms | 0.13ms | -0.05ms | -40.90% |
| mean | 0.02ms | 0.02ms | -0.00ms | -17.52% |
| min | 0.01ms | 0.01ms | -0.00ms | -0.41% |
| max | 0.14ms | 0.18ms | -0.04ms | -22.16% |
| total | 3.75ms | 4.54ms | -0.80ms | -17.52% |

### requestClientPost

# Perf Report — requestClientPost.serial

| metric | value |
|---|---|
| iterations | 200 |
| warmup | 5 |
| p50 | 0.01ms |
| p95 | 0.01ms |
| p99 | 0.01ms |
| mean | 0.01ms |
| stdev | 0.00ms |
| min | 0.01ms |
| max | 0.02ms |
| total | 1.50ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p50 | 0.01ms | 0.01ms | -0.00ms | -0.56% |
| p95 | 0.01ms | 0.01ms | +0.00ms | +2.98% |
| p99 | 0.01ms | 0.01ms | -0.00ms | -6.68% |
| mean | 0.01ms | 0.01ms | +0.00ms | +0.13% |
| min | 0.01ms | 0.01ms | +0.00ms | +0.61% |
| max | 0.02ms | 0.01ms | +0.00ms | +27.67% |
| total | 1.50ms | 1.50ms | +0.00ms | +0.13% |

