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
| requestClientGet | 0.45ms | 10ms | PASS |
| requestClientPost | 0.06ms | 10ms | PASS |

## Memory retention (200 iter, arrayBuffers axis is the gate; heap is informational)

| op | heapUsed Δ | arrayBuffers Δ | cap | verdict |
|---|---|---|---|---|
| requestClientGet | 2183096 B | 2200 B | 102400 B | PASS |
| requestClientPost | -5644824 B | -4422 B | 102400 B | PASS |

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
| mean | 0.01ms |
| stdev | 0.01ms |
| min | 0.01ms |
| max | 0.10ms |
| total | 2.73ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p50 | 0.01ms | 0.01ms | +0.00ms | +0.85% |
| p95 | 0.03ms | 0.03ms | +0.00ms | +2.99% |
| p99 | 0.06ms | 0.06ms | +0.00ms | +5.52% |
| mean | 0.01ms | 0.01ms | -0.00ms | -2.24% |
| min | 0.01ms | 0.01ms | -0.00ms | -2.83% |
| max | 0.10ms | 0.10ms | -0.00ms | -2.67% |
| total | 2.73ms | 2.79ms | -0.06ms | -2.24% |

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
| stdev | 0.02ms |
| min | 0.01ms |
| max | 0.28ms |
| total | 1.68ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p50 | 0.01ms | 0.01ms | +0.00ms | +14.69% |
| p95 | 0.01ms | 0.01ms | +0.00ms | +15.10% |
| p99 | 0.02ms | 0.01ms | +0.00ms | +13.89% |
| mean | 0.01ms | 0.01ms | +0.00ms | +35.03% |
| min | 0.01ms | 0.00ms | +0.00ms | +14.04% |
| max | 0.28ms | 0.02ms | +0.26ms | +1359.91% |
| total | 1.68ms | 1.24ms | +0.44ms | +35.03% |

