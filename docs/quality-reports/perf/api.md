# Perf Suite — api

Threshold source: [docs/quality/perf-thresholds.md](../../quality/perf-thresholds)

## Serial p95 (concurrency = 1)

| op | p95 | cap | gate | regression |
|---|---|---|---|---|
| requestClientGet | 0.03ms | 5ms | PASS | stable (検知には +0.5ms (baseline 比 +901%) 以上の悪化が必要) — gate 無効 (regressionGate=false) |
| requestClientPost | 0.01ms | 5ms | PASS | stable (検知には +0.5ms (baseline 比 +3487%) 以上の悪化が必要) — gate 無効 (regressionGate=false) |

## Concurrent p95 (concurrency = 10, 50 iter each)

| op | p95 | cap | gate |
|---|---|---|---|
| requestClientGet | 0.43ms | 10ms | PASS |
| requestClientPost | 0.08ms | 10ms | PASS |

## Memory retention (200 iter, arrayBuffers axis is the gate; heap is informational)

| op | heapUsed Δ | arrayBuffers Δ | cap | gc exposed | verdict |
|---|---|---|---|---|---|
| requestClientGet | -9936 B | -16870 B | 102400 B | yes | PASS |
| requestClientPost | 2008 B | -4081 B | 102400 B | yes | PASS |

## Detailed serial reports

### requestClientGet

# Perf Report — requestClientGet.serial

| metric | value |
|---|---|
| iterations | 200 |
| warmup | 5 |
| p50 | 0.01ms |
| p95 | 0.03ms |
| p99 | 0.07ms |
| mean | 0.02ms |
| stdev | 0.01ms |
| min | 0.01ms |
| max | 0.12ms |
| total | 3.11ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p50 | 0.01ms | 0.01ms | -0.00ms | -20.18% |
| p95 | 0.03ms | 0.06ms | -0.02ms | -39.30% |
| p99 | 0.07ms | 0.15ms | -0.08ms | -52.43% |
| mean | 0.02ms | 0.03ms | -0.01ms | -37.93% |
| min | 0.01ms | 0.01ms | +0.00ms | +2.78% |
| max | 0.12ms | 0.48ms | -0.37ms | -75.76% |
| total | 3.11ms | 5.01ms | -1.90ms | -37.93% |

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
| total | 1.68ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p50 | 0.01ms | 0.01ms | +0.00ms | +58.70% |
| p95 | 0.01ms | 0.01ms | -0.00ms | -28.75% |
| p99 | 0.02ms | 0.21ms | -0.20ms | -92.44% |
| mean | 0.01ms | 0.01ms | -0.01ms | -41.97% |
| min | 0.01ms | 0.00ms | +0.00ms | +77.46% |
| max | 0.02ms | 1.23ms | -1.20ms | -98.15% |
| total | 1.68ms | 2.90ms | -1.22ms | -41.97% |

