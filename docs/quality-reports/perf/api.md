# Perf Suite — api

Threshold source: [docs/quality/perf-thresholds.md](../../quality/perf-thresholds)

## Serial p95 (concurrency = 1)

| op | p95 | cap | gate | regression |
|---|---|---|---|---|
| requestClientGet | 0.05ms | 5ms | PASS | stable (検知には +0.5ms (baseline 比 +901%) 以上の悪化が必要) |
| requestClientPost | 0.01ms | 5ms | PASS | stable (検知には +0.5ms (baseline 比 +3487%) 以上の悪化が必要) |

## Concurrent p95 (concurrency = 10, 50 iter each)

| op | p95 | cap | gate |
|---|---|---|---|
| requestClientGet | 0.29ms | 10ms | PASS |
| requestClientPost | 0.14ms | 10ms | PASS |

## Memory retention (200 iter, arrayBuffers axis is the gate; heap is informational)

| op | heapUsed Δ | arrayBuffers Δ | cap | gc exposed | verdict |
|---|---|---|---|---|---|
| requestClientGet | -127728 B | 0 B | 102400 B | yes | PASS |
| requestClientPost | 1664 B | -9281 B | 102400 B | yes | PASS |

## Detailed serial reports

### requestClientGet

# Perf Report — requestClientGet.serial

| metric | value |
|---|---|
| iterations | 200 |
| warmup | 5 |
| p50 | 0.01ms |
| p95 | 0.05ms |
| p99 | 0.12ms |
| mean | 0.02ms |
| stdev | 0.04ms |
| min | 0.01ms |
| max | 0.44ms |
| total | 3.62ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p50 | 0.01ms | 0.01ms | -0.00ms | -32.77% |
| p95 | 0.05ms | 0.06ms | -0.01ms | -18.67% |
| p99 | 0.12ms | 0.15ms | -0.03ms | -21.92% |
| mean | 0.02ms | 0.03ms | -0.01ms | -27.77% |
| min | 0.01ms | 0.01ms | -0.00ms | -4.17% |
| max | 0.44ms | 0.48ms | -0.05ms | -9.71% |
| total | 3.62ms | 5.01ms | -1.39ms | -27.77% |

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
| stdev | 0.01ms |
| min | 0.01ms |
| max | 0.07ms |
| total | 1.64ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p50 | 0.01ms | 0.01ms | +0.00ms | +44.65% |
| p95 | 0.01ms | 0.01ms | -0.00ms | -33.85% |
| p99 | 0.02ms | 0.21ms | -0.19ms | -88.38% |
| mean | 0.01ms | 0.01ms | -0.01ms | -43.25% |
| min | 0.01ms | 0.00ms | +0.00ms | +60.80% |
| max | 0.07ms | 1.23ms | -1.15ms | -94.14% |
| total | 1.64ms | 2.90ms | -1.25ms | -43.25% |

