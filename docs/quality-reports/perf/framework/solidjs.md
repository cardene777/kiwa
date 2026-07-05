# Perf Suite — solidjs

Threshold source: [docs/quality/perf-thresholds.md](../../quality/perf-thresholds)

## Serial p95 (concurrency = 1)

| op | p95 | cap | gate | regression |
|---|---|---|---|---|
| renderSolid | 0.00ms | 5ms | PASS | improved |
| mockSignalEffect | 0.00ms | 5ms | PASS | stable |

## Concurrent p95 (concurrency = 10, 50 iter each)

| op | p95 | cap | gate |
|---|---|---|---|
| renderSolid | 0.02ms | 10ms | PASS |
| mockSignalEffect | 0.02ms | 10ms | PASS |

## Memory retention (200 iter, arrayBuffers axis is the gate; heap is informational)

| op | heapUsed Δ | arrayBuffers Δ | cap | verdict |
|---|---|---|---|---|
| renderSolid | 262856 B | 0 B | 102400 B | PASS |
| mockSignalEffect | 542832 B | 0 B | 102400 B | PASS |

## Detailed serial reports

### renderSolid

# Perf Report — renderSolid.serial

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
| max | 0.02ms |
| total | 0.24ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p50 | 0.00ms | 0.00ms | -0.00ms | -45.02% |
| p95 | 0.00ms | 0.00ms | -0.00ms | -42.54% |
| p99 | 0.01ms | 0.01ms | -0.00ms | -29.39% |
| mean | 0.00ms | 0.00ms | -0.00ms | -40.47% |
| min | 0.00ms | 0.00ms | -0.00ms | -50.03% |
| max | 0.02ms | 0.02ms | -0.00ms | -8.47% |
| total | 0.24ms | 0.41ms | -0.17ms | -40.47% |

### mockSignalEffect

# Perf Report — mockSignalEffect.serial

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
| total | 0.33ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p50 | 0.00ms | 0.00ms | +0.00ms | +33.30% |
| p95 | 0.00ms | 0.00ms | +0.00ms | +15.72% |
| p99 | 0.01ms | 0.01ms | -0.00ms | -6.29% |
| mean | 0.00ms | 0.00ms | +0.00ms | +25.87% |
| min | 0.00ms | 0.00ms | +0.00ms | +31.73% |
| max | 0.01ms | 0.01ms | -0.00ms | -4.00% |
| total | 0.33ms | 0.26ms | +0.07ms | +25.87% |

