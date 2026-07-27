# Perf Suite — api

Threshold source: [docs/quality/perf-thresholds.md](../../quality/perf-thresholds)

## Serial p95 (concurrency = 1)

| op | p95 | cap | gate | regression |
|---|---|---|---|---|
| requestClientGet | 0.03ms | 5ms | PASS | stable |
| requestClientPost | 0.01ms | 5ms | PASS | stable |

## Concurrent p95 (concurrency = 10, 50 iter each)

| op | p95 | cap | gate |
|---|---|---|---|
| requestClientGet | 0.14ms | 10ms | PASS |
| requestClientPost | 0.07ms | 10ms | PASS |

## Memory retention (200 iter, arrayBuffers axis is the gate; heap is informational)

| op | heapUsed Δ | arrayBuffers Δ | cap | gc exposed | verdict |
|---|---|---|---|---|---|
| requestClientGet | 485200 B | 0 B | 102400 B | yes | PASS |
| requestClientPost | -126816 B | 0 B | 102400 B | yes | PASS |

## Detailed serial reports

### requestClientGet

# Perf Report — requestClientGet.serial

| metric | value |
|---|---|
| iterations | 200 |
| warmup | 5 |
| p50 | 0.01ms |
| p95 | 0.03ms |
| p99 | 0.06ms |
| mean | 0.02ms |
| stdev | 0.01ms |
| min | 0.01ms |
| max | 0.11ms |
| total | 3.09ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p50 | 0.01ms | 0.01ms | -0.00ms | -26.02% |
| p95 | 0.03ms | 0.06ms | -0.03ms | -43.94% |
| p99 | 0.06ms | 0.13ms | -0.07ms | -56.29% |
| mean | 0.02ms | 0.02ms | -0.01ms | -31.97% |
| min | 0.01ms | 0.01ms | -0.00ms | -15.94% |
| max | 0.11ms | 0.18ms | -0.07ms | -38.59% |
| total | 3.09ms | 4.54ms | -1.45ms | -31.97% |

### requestClientPost

# Perf Report — requestClientPost.serial

| metric | value |
|---|---|
| iterations | 200 |
| warmup | 5 |
| p50 | 0.01ms |
| p95 | 0.01ms |
| p99 | 0.02ms |
| mean | 0.01ms |
| stdev | 0.00ms |
| min | 0.01ms |
| max | 0.02ms |
| total | 1.19ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p50 | 0.01ms | 0.01ms | -0.00ms | -24.56% |
| p95 | 0.01ms | 0.01ms | -0.00ms | -5.59% |
| p99 | 0.02ms | 0.01ms | +0.00ms | +29.66% |
| mean | 0.01ms | 0.01ms | -0.00ms | -20.61% |
| min | 0.01ms | 0.01ms | -0.00ms | -27.27% |
| max | 0.02ms | 0.01ms | +0.01ms | +38.04% |
| total | 1.19ms | 1.50ms | -0.31ms | -20.61% |

