# Perf Suite — state

Threshold source: [docs/quality/perf-thresholds.md](../../quality/perf-thresholds)

## Serial p95 (concurrency = 1)

| op | p95 | cap | gate | regression |
|---|---|---|---|---|
| createStore | 0.00ms | 5ms | PASS | stable |
| dispatch | 0.00ms | 5ms | PASS | stable |
| selectState | 0.00ms | 5ms | PASS | improved |

## Concurrent p95 (concurrency = 10, 50 iter each)

| op | p95 | cap | gate |
|---|---|---|---|
| createStore | 0.01ms | 10ms | PASS |
| dispatch | 0.02ms | 10ms | PASS |
| selectState | 0.01ms | 10ms | PASS |

## Memory retention (200 iter, arrayBuffers axis is the gate; heap is informational)

| op | heapUsed Δ | arrayBuffers Δ | cap | verdict |
|---|---|---|---|---|
| createStore | 318920 B | 0 B | 102400 B | PASS |
| dispatch | -8080816 B | 0 B | 102400 B | PASS |
| selectState | -106744 B | 0 B | 102400 B | PASS |

## Detailed serial reports

### createStore

# Perf Report — createStore.serial

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
| total | 0.10ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p50 | 0.00ms | 0.00ms | -0.00ms | -19.90% |
| p95 | 0.00ms | 0.00ms | -0.00ms | -16.63% |
| p99 | 0.01ms | 0.01ms | +0.00ms | +9.06% |
| mean | 0.00ms | 0.00ms | -0.00ms | -16.67% |
| min | 0.00ms | 0.00ms | -0.00ms | -37.54% |
| max | 0.01ms | 0.01ms | -0.00ms | -24.34% |
| total | 0.10ms | 0.12ms | -0.02ms | -16.67% |

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
| p50 | 0.00ms | 0.00ms | -0.00ms | -21.58% |
| p95 | 0.00ms | 0.00ms | +0.00ms | +154.25% |
| p99 | 0.00ms | 0.00ms | +0.00ms | +6.66% |
| mean | 0.00ms | 0.00ms | -0.00ms | -10.09% |
| min | 0.00ms | 0.00ms | -0.00ms | -46.21% |
| max | 0.01ms | 0.01ms | -0.00ms | -10.68% |
| total | 0.14ms | 0.15ms | -0.02ms | -10.09% |

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
| p50 | 0.00ms | 0.00ms | -0.00ms | -16.40% |
| p95 | 0.00ms | 0.00ms | -0.00ms | -69.62% |
| p99 | 0.00ms | 0.00ms | +0.00ms | +14.09% |
| mean | 0.00ms | 0.00ms | -0.00ms | -19.14% |
| min | 0.00ms | 0.00ms | -0.00ms | -16.80% |
| max | 0.01ms | 0.01ms | -0.00ms | -9.38% |
| total | 0.06ms | 0.07ms | -0.01ms | -19.14% |

