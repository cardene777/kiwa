# Perf Suite — remix

Threshold source: [docs/quality/perf-thresholds.md](../../../quality/perf-thresholds)

## Serial p95 (concurrency = 1)

| op | p95 | cap | gate | regression |
|---|---|---|---|---|
| invokeLoader | 0.02ms | 5ms | PASS | stable |
| invokeAction | 0.00ms | 5ms | PASS | stable |

## Concurrent p95 (concurrency = 10, 50 iter each)

| op | p95 | cap | gate |
|---|---|---|---|
| invokeLoader | 0.06ms | 10ms | PASS |
| invokeAction | 0.04ms | 10ms | PASS |

## Memory retention (200 iter, arrayBuffers axis is the gate; heap is informational)

| op | heapUsed Δ | arrayBuffers Δ | cap | gc exposed | verdict |
|---|---|---|---|---|---|
| invokeLoader | -42368 B | 0 B | 102400 B | yes | PASS |
| invokeAction | -3736 B | 0 B | 102400 B | yes | PASS |

## Detailed serial reports

### invokeLoader

# Perf Report — invokeLoader.serial

| metric | value |
|---|---|
| iterations | 200 |
| warmup | 5 |
| p50 | 0.00ms |
| p95 | 0.02ms |
| p99 | 0.03ms |
| mean | 0.01ms |
| stdev | 0.01ms |
| min | 0.00ms |
| max | 0.05ms |
| total | 1.11ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p50 | 0.00ms | 0.00ms | -0.00ms | -0.03% |
| p95 | 0.02ms | 0.01ms | +0.01ms | +53.09% |
| p99 | 0.03ms | 0.03ms | +0.00ms | +0.45% |
| mean | 0.01ms | 0.01ms | +0.00ms | +6.59% |
| min | 0.00ms | 0.00ms | -0.00ms | -4.05% |
| max | 0.05ms | 0.04ms | +0.00ms | +6.48% |
| total | 1.11ms | 1.04ms | +0.07ms | +6.59% |

### invokeAction

# Perf Report — invokeAction.serial

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
| total | 0.60ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p50 | 0.00ms | 0.00ms | -0.00ms | -2.89% |
| p95 | 0.00ms | 0.00ms | -0.00ms | -10.89% |
| p99 | 0.01ms | 0.02ms | -0.01ms | -65.08% |
| mean | 0.00ms | 0.00ms | -0.00ms | -12.77% |
| min | 0.00ms | 0.00ms | -0.00ms | -1.51% |
| max | 0.01ms | 0.05ms | -0.04ms | -79.73% |
| total | 0.60ms | 0.68ms | -0.09ms | -12.77% |

