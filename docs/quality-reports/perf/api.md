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
| requestClientGet | 0.22ms | 10ms | PASS |
| requestClientPost | 0.06ms | 10ms | PASS |

## Memory retention (200 iter, arrayBuffers axis is the gate; heap is informational)

| op | heapUsed Δ | arrayBuffers Δ | cap | gc exposed | verdict |
|---|---|---|---|---|---|
| requestClientGet | 12840 B | -15650 B | 102400 B | yes | PASS |
| requestClientPost | -132184 B | 8203 B | 102400 B | yes | PASS |

## Detailed serial reports

### requestClientGet

# Perf Report — requestClientGet.serial

| metric | value |
|---|---|
| iterations | 200 |
| warmup | 5 |
| p50 | 0.01ms |
| p95 | 0.04ms |
| p99 | 0.07ms |
| mean | 0.02ms |
| stdev | 0.01ms |
| min | 0.01ms |
| max | 0.12ms |
| total | 3.86ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p50 | 0.01ms | 0.01ms | +0.00ms | +1.09% |
| p95 | 0.04ms | 0.06ms | -0.03ms | -41.33% |
| p99 | 0.07ms | 0.13ms | -0.06ms | -43.71% |
| mean | 0.02ms | 0.02ms | -0.00ms | -15.01% |
| min | 0.01ms | 0.01ms | +0.00ms | +7.16% |
| max | 0.12ms | 0.18ms | -0.07ms | -35.60% |
| total | 3.86ms | 4.54ms | -0.68ms | -15.01% |

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
| min | 0.00ms |
| max | 0.03ms |
| total | 1.13ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p50 | 0.01ms | 0.01ms | -0.00ms | -30.27% |
| p95 | 0.01ms | 0.01ms | -0.00ms | -13.85% |
| p99 | 0.02ms | 0.01ms | +0.00ms | +27.14% |
| mean | 0.01ms | 0.01ms | -0.00ms | -24.65% |
| min | 0.00ms | 0.01ms | -0.00ms | -31.51% |
| max | 0.03ms | 0.01ms | +0.01ms | +97.70% |
| total | 1.13ms | 1.50ms | -0.37ms | -24.65% |

