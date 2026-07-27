# Perf Suite — state

Threshold source: [docs/quality/perf-thresholds.md](../../quality/perf-thresholds)

## Serial p95 (concurrency = 1)

| op | p95 | cap | gate | regression |
|---|---|---|---|---|
| createStore | 0.00ms | 5ms | PASS | stable |
| dispatch | 0.00ms | 5ms | PASS | stable |
| selectState | 0.00ms | 5ms | PASS | stable |

## Concurrent p95 (concurrency = 10, 50 iter each)

| op | p95 | cap | gate |
|---|---|---|---|
| createStore | 0.01ms | 10ms | PASS |
| dispatch | 0.01ms | 10ms | PASS |
| selectState | 0.01ms | 10ms | PASS |

## Memory retention (200 iter, arrayBuffers axis is the gate; heap is informational)

| op | heapUsed Δ | arrayBuffers Δ | cap | gc exposed | verdict |
|---|---|---|---|---|---|
| createStore | -17264 B | 0 B | 102400 B | yes | PASS |
| dispatch | 832 B | 0 B | 102400 B | yes | PASS |
| selectState | -14784 B | 0 B | 102400 B | yes | PASS |

## Detailed serial reports

### createStore

# Perf Report — createStore.serial

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
| total | 0.11ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p50 | 0.00ms | 0.00ms | 0.00ms | 0.00% |
| p95 | 0.00ms | 0.00ms | -0.00ms | -27.97% |
| p99 | 0.00ms | 0.00ms | -0.00ms | -5.40% |
| mean | 0.00ms | 0.00ms | -0.00ms | -1.40% |
| min | 0.00ms | 0.00ms | +0.00ms | +16.80% |
| max | 0.01ms | 0.01ms | +0.00ms | +14.06% |
| total | 0.11ms | 0.11ms | -0.00ms | -1.40% |

### dispatch

# Perf Report — dispatch.serial

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
| total | 0.13ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p50 | 0.00ms | 0.00ms | 0.00ms | 0.00% |
| p95 | 0.00ms | 0.00ms | +0.00ms | +10.20% |
| p99 | 0.00ms | 0.00ms | +0.00ms | +8.92% |
| mean | 0.00ms | 0.00ms | +0.00ms | +5.96% |
| min | 0.00ms | 0.00ms | 0.00ms | 0.00% |
| max | 0.01ms | 0.01ms | +0.00ms | +7.45% |
| total | 0.13ms | 0.12ms | +0.01ms | +5.96% |

### selectState

# Perf Report — selectState.serial

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
| total | 0.06ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p50 | 0.00ms | 0.00ms | 0.00ms | 0.00% |
| p95 | 0.00ms | 0.00ms | 0.00ms | 0.00% |
| p99 | 0.00ms | 0.00ms | +0.00ms | +130.26% |
| mean | 0.00ms | 0.00ms | +0.00ms | +10.51% |
| min | 0.00ms | 0.00ms | 0.00ms | 0.00% |
| max | 0.01ms | 0.01ms | +0.00ms | +36.79% |
| total | 0.06ms | 0.06ms | +0.01ms | +10.51% |

