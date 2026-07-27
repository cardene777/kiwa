# Perf Suite — core

Threshold source: [docs/quality/perf-thresholds.md](../../quality/perf-thresholds)

## Serial p95 (concurrency = 1)

| op | p95 | cap | gate | regression |
|---|---|---|---|---|
| parseSpec | 0.01ms | 5ms | PASS | stable |
| createPool | 0.00ms | 5ms | PASS | stable |

## Concurrent p95 (concurrency = 10, 50 iter each)

| op | p95 | cap | gate |
|---|---|---|---|
| parseSpec | 0.07ms | 10ms | PASS |
| createPool | 0.02ms | 10ms | PASS |

## Memory retention (200 iter, arrayBuffers axis is the gate; heap is informational)

| op | heapUsed Δ | arrayBuffers Δ | cap | gc exposed | verdict |
|---|---|---|---|---|---|
| parseSpec | 2304 B | 0 B | 102400 B | yes | PASS |
| createPool | -15968 B | 0 B | 102400 B | yes | PASS |

## Detailed serial reports

### parseSpec

# Perf Report — parseSpec.serial

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
| total | 1.45ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p50 | 0.01ms | 0.01ms | -0.00ms | -22.22% |
| p95 | 0.01ms | 0.02ms | -0.00ms | -5.43% |
| p99 | 0.02ms | 0.02ms | -0.00ms | -3.89% |
| mean | 0.01ms | 0.01ms | -0.00ms | -16.84% |
| min | 0.00ms | 0.01ms | -0.00ms | -18.83% |
| max | 0.03ms | 0.04ms | -0.00ms | -10.96% |
| total | 1.45ms | 1.74ms | -0.29ms | -16.84% |

### createPool

# Perf Report — createPool.serial

| metric | value |
|---|---|
| iterations | 200 |
| warmup | 5 |
| p50 | 0.00ms |
| p95 | 0.00ms |
| p99 | 0.01ms |
| mean | 0.00ms |
| stdev | 0.01ms |
| min | 0.00ms |
| max | 0.07ms |
| total | 0.39ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p50 | 0.00ms | 0.00ms | -0.00ms | -17.61% |
| p95 | 0.00ms | 0.02ms | -0.01ms | -76.90% |
| p99 | 0.01ms | 0.05ms | -0.04ms | -76.82% |
| mean | 0.00ms | 0.01ms | -0.00ms | -70.84% |
| min | 0.00ms | 0.00ms | -0.00ms | -13.81% |
| max | 0.07ms | 0.40ms | -0.33ms | -82.00% |
| total | 0.39ms | 1.33ms | -0.94ms | -70.84% |

