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
| dispatch | 0.02ms | 10ms | PASS |
| selectState | 0.01ms | 10ms | PASS |

## Memory retention (200 iter, arrayBuffers axis is the gate; heap is informational)

| op | heapUsed Δ | arrayBuffers Δ | cap | gc exposed | verdict |
|---|---|---|---|---|---|
| createStore | 248552 B | 0 B | 102400 B | yes | PASS |
| dispatch | -400 B | 0 B | 102400 B | yes | PASS |
| selectState | -10112 B | 0 B | 102400 B | yes | PASS |

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
| p50 | 0.00ms | 0.00ms | +0.00ms | +12.28% |
| p95 | 0.00ms | 0.00ms | -0.00ms | -17.36% |
| p99 | 0.00ms | 0.00ms | +0.00ms | +10.01% |
| mean | 0.00ms | 0.00ms | +0.00ms | +3.66% |
| min | 0.00ms | 0.00ms | +0.00ms | +33.20% |
| max | 0.01ms | 0.01ms | -0.00ms | -15.38% |
| total | 0.11ms | 0.11ms | +0.00ms | +3.66% |

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
| total | 0.14ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p50 | 0.00ms | 0.00ms | 0.00ms | 0.00% |
| p95 | 0.00ms | 0.00ms | +0.00ms | +112.05% |
| p99 | 0.00ms | 0.00ms | +0.00ms | +7.50% |
| mean | 0.00ms | 0.00ms | +0.00ms | +17.60% |
| min | 0.00ms | 0.00ms | 0.00ms | 0.00% |
| max | 0.01ms | 0.01ms | +0.00ms | +51.75% |
| total | 0.14ms | 0.12ms | +0.02ms | +17.60% |

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
| p99 | 0.00ms | 0.00ms | +0.00ms | +129.72% |
| mean | 0.00ms | 0.00ms | +0.00ms | +14.23% |
| min | 0.00ms | 0.00ms | +0.00ms | +25.30% |
| max | 0.01ms | 0.01ms | +0.00ms | +64.52% |
| total | 0.06ms | 0.06ms | +0.01ms | +14.23% |

