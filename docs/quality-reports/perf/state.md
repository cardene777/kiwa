# Perf Suite — state

Threshold source: [docs/quality/perf-thresholds.md](../../quality/perf-thresholds)

## Serial p95 (concurrency = 1)

| op | p95 | cap | gate | regression |
|---|---|---|---|---|
| createStore | 0.00ms | 5ms | PASS | stable (検知には +0.5ms (baseline 比 +23083%) 以上の悪化が必要) |
| dispatch | 0.00ms | 5ms | PASS | stable (検知には +0.5ms (baseline 比 +70210%) 以上の悪化が必要) |
| selectState | 0.00ms | 5ms | PASS | stable (検知には +0.5ms (baseline 比 +149209%) 以上の悪化が必要) |

## Concurrent p95 (concurrency = 10, 50 iter each)

| op | p95 | cap | gate |
|---|---|---|---|
| createStore | 0.01ms | 10ms | PASS |
| dispatch | 0.02ms | 10ms | PASS |
| selectState | 0.01ms | 10ms | PASS |

## Memory retention (200 iter, arrayBuffers axis is the gate; heap is informational)

| op | heapUsed Δ | arrayBuffers Δ | cap | gc exposed | verdict |
|---|---|---|---|---|---|
| createStore | -4048 B | 0 B | 102400 B | yes | PASS |
| dispatch | -15472 B | 0 B | 102400 B | yes | PASS |
| selectState | 616 B | 0 B | 102400 B | yes | PASS |

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
| total | 0.10ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p50 | 0.00ms | 0.00ms | -0.00ms | -11.20% |
| p95 | 0.00ms | 0.00ms | -0.00ms | -55.48% |
| p99 | 0.00ms | 0.01ms | -0.00ms | -49.64% |
| mean | 0.00ms | 0.00ms | -0.00ms | -22.10% |
| min | 0.00ms | 0.00ms | +0.00ms | +16.40% |
| max | 0.01ms | 0.01ms | -0.00ms | -11.53% |
| total | 0.10ms | 0.13ms | -0.03ms | -22.10% |

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
| p50 | 0.00ms | 0.00ms | -0.00ms | -8.40% |
| p95 | 0.00ms | 0.00ms | +0.00ms | +48.66% |
| p99 | 0.00ms | 0.00ms | +0.00ms | +23.81% |
| mean | 0.00ms | 0.00ms | +0.00ms | +6.95% |
| min | 0.00ms | 0.00ms | -0.00ms | -12.61% |
| max | 0.01ms | 0.01ms | +0.00ms | +27.64% |
| total | 0.13ms | 0.12ms | +0.01ms | +6.95% |

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
| p50 | 0.00ms | 0.00ms | -0.00ms | -16.80% |
| p95 | 0.00ms | 0.00ms | -0.00ms | -24.78% |
| p99 | 0.00ms | 0.00ms | +0.00ms | +61.57% |
| mean | 0.00ms | 0.00ms | -0.00ms | -4.69% |
| min | 0.00ms | 0.00ms | 0.00ms | 0.00% |
| max | 0.01ms | 0.01ms | -0.00ms | -11.39% |
| total | 0.06ms | 0.06ms | -0.00ms | -4.69% |

