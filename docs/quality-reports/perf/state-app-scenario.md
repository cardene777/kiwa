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

| op | heapUsed Δ | arrayBuffers Δ | cap | verdict |
|---|---|---|---|---|
| multi_provider_workflow (5 provider x 2 dispatch cycles) | 202288 B | 0 B | 102400 B | PASS |
| subscribe_batch (5 listener + 5 state updates) | 128152 B | 0 B | 102400 B | PASS |
| dispatch_error_handling (5 unknown action type dispatch) | 113064 B | 0 B | 102400 B | PASS |

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
| mean | 0.00ms |
| stdev | 0.00ms |
| min | 0.00ms |
| max | 0.01ms |
| total | 0.09ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p50 | 0.00ms | 0.01ms | -0.00ms | -37.18% |
| p95 | 0.01ms | 0.01ms | +0.00ms | +20.27% |
| p99 | 0.01ms | 0.02ms | -0.01ms | -34.46% |
| mean | 0.00ms | 0.01ms | -0.00ms | -29.49% |
| min | 0.00ms | 0.01ms | -0.00ms | -41.67% |
| max | 0.01ms | 0.02ms | -0.01ms | -40.46% |
| total | 0.09ms | 0.13ms | -0.04ms | -29.49% |

### subscribe_batch (5 listener + 5 state updates)

# Perf Report — subscribe_batch (5 listener + 5 state updates).serial

| metric | value |
|---|---|
| iterations | 20 |
| warmup | 3 |
| p50 | 0.00ms |
| p95 | 0.01ms |
| p99 | 0.01ms |
| mean | 0.00ms |
| stdev | 0.00ms |
| min | 0.00ms |
| max | 0.01ms |
| total | 0.09ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p50 | 0.00ms | 0.00ms | +0.00ms | +11.16% |
| p95 | 0.01ms | 0.01ms | -0.00ms | -10.05% |
| p99 | 0.01ms | 0.02ms | -0.01ms | -42.86% |
| mean | 0.00ms | 0.01ms | -0.00ms | -10.50% |
| min | 0.00ms | 0.00ms | -0.00ms | -29.51% |
| max | 0.01ms | 0.02ms | -0.01ms | -47.14% |
| total | 0.09ms | 0.10ms | -0.01ms | -10.50% |

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
| p50 | 0.01ms | 0.01ms | -0.00ms | -9.75% |
| p95 | 0.01ms | 0.01ms | +0.00ms | +11.81% |
| p99 | 0.02ms | 0.01ms | +0.00ms | +14.09% |
| mean | 0.01ms | 0.01ms | -0.00ms | -5.54% |
| min | 0.01ms | 0.01ms | -0.00ms | -8.99% |
| max | 0.02ms | 0.01ms | +0.00ms | +14.57% |
| total | 0.20ms | 0.21ms | -0.01ms | -5.54% |

