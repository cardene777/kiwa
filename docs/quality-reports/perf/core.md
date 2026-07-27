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
| parseSpec | 0.16ms | 10ms | PASS |
| createPool | 0.02ms | 10ms | PASS |

## Memory retention (200 iter, arrayBuffers axis is the gate; heap is informational)

| op | heapUsed Δ | arrayBuffers Δ | cap | gc exposed | verdict |
|---|---|---|---|---|---|
| parseSpec | 2720 B | 0 B | 102400 B | yes | PASS |
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
| total | 1.43ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p50 | 0.01ms | 0.01ms | -0.00ms | -23.68% |
| p95 | 0.01ms | 0.02ms | -0.00ms | -11.05% |
| p99 | 0.02ms | 0.02ms | -0.00ms | -10.13% |
| mean | 0.01ms | 0.01ms | -0.00ms | -18.12% |
| min | 0.00ms | 0.01ms | -0.00ms | -18.12% |
| max | 0.03ms | 0.04ms | -0.01ms | -32.11% |
| total | 1.43ms | 1.74ms | -0.32ms | -18.12% |

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
| max | 0.08ms |
| total | 0.38ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p50 | 0.00ms | 0.00ms | -0.00ms | -17.61% |
| p95 | 0.00ms | 0.02ms | -0.01ms | -83.32% |
| p99 | 0.01ms | 0.05ms | -0.04ms | -77.22% |
| mean | 0.00ms | 0.01ms | -0.00ms | -71.66% |
| min | 0.00ms | 0.00ms | -0.00ms | -13.90% |
| max | 0.08ms | 0.40ms | -0.32ms | -80.79% |
| total | 0.38ms | 1.33ms | -0.95ms | -71.66% |

