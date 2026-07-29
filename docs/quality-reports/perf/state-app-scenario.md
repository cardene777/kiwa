# Perf Suite — state-app-scenario

Threshold source: [docs/quality/perf-thresholds.md](../../quality/perf-thresholds)

## Serial p95 (concurrency = 1)

| op | p95 | cap | gate | regression |
|---|---|---|---|---|
| multi_provider_workflow (5 provider x 2 dispatch cycles) | 0.01ms | 100ms | PASS | stable (検知には +0.5ms (baseline 比 +4187%) 以上の悪化が必要) — gate 無効 (regressionGate=false) |
| subscribe_batch (5 listener + 5 state updates) | 0.01ms | 100ms | PASS | stable (検知には +0.5ms (baseline 比 +3917%) 以上の悪化が必要) — gate 無効 (regressionGate=false) |
| dispatch_error_handling (5 unknown action type dispatch) | 0.01ms | 100ms | PASS | stable (検知には +0.5ms (baseline 比 +4423%) 以上の悪化が必要) — gate 無効 (regressionGate=false) |

## Concurrent p95 (concurrency = 4, 5 iter each)

| op | p95 | cap | gate |
|---|---|---|---|
| multi_provider_workflow (5 provider x 2 dispatch cycles) | 0.02ms | 200ms | PASS |
| subscribe_batch (5 listener + 5 state updates) | 0.03ms | 200ms | PASS |
| dispatch_error_handling (5 unknown action type dispatch) | 0.05ms | 200ms | PASS |

## Memory retention (20 iter, arrayBuffers axis is the gate; heap is informational)

| op | heapUsed Δ | arrayBuffers Δ | cap | gc exposed | verdict |
|---|---|---|---|---|---|
| multi_provider_workflow (5 provider x 2 dispatch cycles) | 7024 B | 0 B | 102400 B | yes | PASS |
| subscribe_batch (5 listener + 5 state updates) | -504 B | 0 B | 102400 B | yes | PASS |
| dispatch_error_handling (5 unknown action type dispatch) | 1384 B | 0 B | 102400 B | yes | PASS |

## Detailed serial reports

### multi_provider_workflow (5 provider x 2 dispatch cycles)

# Perf Report — multi_provider_workflow (5 provider x 2 dispatch cycles).serial

| metric | value |
|---|---|
| iterations | 20 |
| warmup | 3 |
| p50 | 0.01ms |
| p95 | 0.01ms |
| p99 | 0.02ms |
| mean | 0.01ms |
| stdev | 0.00ms |
| min | 0.00ms |
| max | 0.02ms |
| total | 0.13ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p50 | 0.01ms | 0.00ms | +0.00ms | +26.41% |
| p95 | 0.01ms | 0.01ms | -0.00ms | -26.46% |
| p99 | 0.02ms | 0.02ms | +0.00ms | +4.22% |
| mean | 0.01ms | 0.01ms | +0.00ms | +23.21% |
| min | 0.00ms | 0.00ms | +0.00ms | +57.31% |
| max | 0.02ms | 0.02ms | +0.00ms | +9.11% |
| total | 0.13ms | 0.11ms | +0.02ms | +23.21% |

### subscribe_batch (5 listener + 5 state updates)

# Perf Report — subscribe_batch (5 listener + 5 state updates).serial

| metric | value |
|---|---|
| iterations | 20 |
| warmup | 3 |
| p50 | 0.00ms |
| p95 | 0.01ms |
| p99 | 0.02ms |
| mean | 0.01ms |
| stdev | 0.00ms |
| min | 0.00ms |
| max | 0.02ms |
| total | 0.10ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p50 | 0.00ms | 0.00ms | +0.00ms | +25.16% |
| p95 | 0.01ms | 0.01ms | -0.00ms | -2.60% |
| p99 | 0.02ms | 0.02ms | -0.00ms | -2.06% |
| mean | 0.01ms | 0.00ms | +0.00ms | +16.16% |
| min | 0.00ms | 0.00ms | +0.00ms | +14.27% |
| max | 0.02ms | 0.02ms | -0.00ms | -1.96% |
| total | 0.10ms | 0.09ms | +0.01ms | +16.16% |

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
| total | 0.21ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p50 | 0.01ms | 0.01ms | +0.00ms | +3.33% |
| p95 | 0.01ms | 0.01ms | +0.00ms | +5.40% |
| p99 | 0.02ms | 0.01ms | +0.00ms | +16.31% |
| mean | 0.01ms | 0.01ms | +0.00ms | +5.40% |
| min | 0.01ms | 0.01ms | +0.00ms | +5.60% |
| max | 0.02ms | 0.01ms | +0.00ms | +18.41% |
| total | 0.21ms | 0.20ms | +0.01ms | +5.40% |

