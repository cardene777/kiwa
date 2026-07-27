# Perf Suite — state-app-scenario

Threshold source: [docs/quality/perf-thresholds.md](../../quality/perf-thresholds)

## Serial p95 (concurrency = 1)

| op | p95 | cap | gate | regression |
|---|---|---|---|---|
| multi_provider_workflow (5 provider x 2 dispatch cycles) | 0.01ms | 100ms | PASS | stable |
| subscribe_batch (5 listener + 5 state updates) | 0.01ms | 100ms | PASS | stable |
| dispatch_error_handling (5 unknown action type dispatch) | 0.01ms | 100ms | PASS | stable |

## Concurrent p95 (concurrency = 4, 5 iter each)

| op | p95 | cap | gate |
|---|---|---|---|
| multi_provider_workflow (5 provider x 2 dispatch cycles) | 0.02ms | 200ms | PASS |
| subscribe_batch (5 listener + 5 state updates) | 0.01ms | 200ms | PASS |
| dispatch_error_handling (5 unknown action type dispatch) | 0.04ms | 200ms | PASS |

## Memory retention (20 iter, arrayBuffers axis is the gate; heap is informational)

| op | heapUsed Δ | arrayBuffers Δ | cap | gc exposed | verdict |
|---|---|---|---|---|---|
| multi_provider_workflow (5 provider x 2 dispatch cycles) | -4320 B | 0 B | 102400 B | yes | PASS |
| subscribe_batch (5 listener + 5 state updates) | 792 B | 0 B | 102400 B | yes | PASS |
| dispatch_error_handling (5 unknown action type dispatch) | 688 B | 0 B | 102400 B | yes | PASS |

## Detailed serial reports

### multi_provider_workflow (5 provider x 2 dispatch cycles)

# Perf Report — multi_provider_workflow (5 provider x 2 dispatch cycles).serial

| metric | value |
|---|---|
| iterations | 20 |
| warmup | 3 |
| p50 | 0.00ms |
| p95 | 0.01ms |
| p99 | 0.01ms |
| mean | 0.01ms |
| stdev | 0.00ms |
| min | 0.00ms |
| max | 0.01ms |
| total | 0.10ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p50 | 0.00ms | 0.00ms | +0.00ms | +41.97% |
| p95 | 0.01ms | 0.01ms | -0.00ms | -18.07% |
| p99 | 0.01ms | 0.01ms | +0.00ms | +18.65% |
| mean | 0.01ms | 0.00ms | +0.00ms | +9.25% |
| min | 0.00ms | 0.00ms | -0.00ms | -2.59% |
| max | 0.01ms | 0.01ms | +0.00ms | +26.69% |
| total | 0.10ms | 0.09ms | +0.01ms | +9.25% |

### subscribe_batch (5 listener + 5 state updates)

# Perf Report — subscribe_batch (5 listener + 5 state updates).serial

| metric | value |
|---|---|
| iterations | 20 |
| warmup | 3 |
| p50 | 0.00ms |
| p95 | 0.01ms |
| p99 | 0.02ms |
| mean | 0.00ms |
| stdev | 0.00ms |
| min | 0.00ms |
| max | 0.02ms |
| total | 0.09ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p50 | 0.00ms | 0.00ms | +0.00ms | +5.90% |
| p95 | 0.01ms | 0.01ms | +0.00ms | +5.63% |
| p99 | 0.02ms | 0.02ms | -0.00ms | -4.15% |
| mean | 0.00ms | 0.00ms | +0.00ms | +8.17% |
| min | 0.00ms | 0.00ms | -0.00ms | -17.21% |
| max | 0.02ms | 0.02ms | -0.00ms | -5.40% |
| total | 0.09ms | 0.08ms | +0.01ms | +8.17% |

### dispatch_error_handling (5 unknown action type dispatch)

# Perf Report — dispatch_error_handling (5 unknown action type dispatch).serial

| metric | value |
|---|---|
| iterations | 20 |
| warmup | 3 |
| p50 | 0.01ms |
| p95 | 0.01ms |
| p99 | 0.02ms |
| mean | 0.01ms |
| stdev | 0.00ms |
| min | 0.01ms |
| max | 0.02ms |
| total | 0.20ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p50 | 0.01ms | 0.01ms | +0.00ms | +9.19% |
| p95 | 0.01ms | 0.01ms | +0.00ms | +33.92% |
| p99 | 0.02ms | 0.01ms | +0.00ms | +22.23% |
| mean | 0.01ms | 0.01ms | +0.00ms | +10.40% |
| min | 0.01ms | 0.01ms | +0.00ms | +1.46% |
| max | 0.02ms | 0.01ms | +0.00ms | +20.00% |
| total | 0.20ms | 0.18ms | +0.02ms | +10.40% |

