# Perf Suite — state-app-scenario

Threshold source: [docs/quality/perf-thresholds.md](../../quality/perf-thresholds)

## Serial p95 (concurrency = 1)

| op | p95 | cap | gate | regression |
|---|---|---|---|---|
| multi_provider_workflow (5 provider x 2 dispatch cycles) | 0.01ms | 100ms | PASS | stable (検知には +0.5ms (baseline 比 +4187%) 以上の悪化が必要) |
| subscribe_batch (5 listener + 5 state updates) | 0.02ms | 100ms | PASS | stable (検知には +0.5ms (baseline 比 +3917%) 以上の悪化が必要) |
| dispatch_error_handling (5 unknown action type dispatch) | 0.02ms | 100ms | PASS | stable (検知には +0.5ms (baseline 比 +4423%) 以上の悪化が必要) |

## Concurrent p95 (concurrency = 4, 5 iter each)

| op | p95 | cap | gate |
|---|---|---|---|
| multi_provider_workflow (5 provider x 2 dispatch cycles) | 0.03ms | 200ms | PASS |
| subscribe_batch (5 listener + 5 state updates) | 0.07ms | 200ms | PASS |
| dispatch_error_handling (5 unknown action type dispatch) | 0.05ms | 200ms | PASS |

## Memory retention (20 iter, arrayBuffers axis is the gate; heap is informational)

| op | heapUsed Δ | arrayBuffers Δ | cap | gc exposed | verdict |
|---|---|---|---|---|---|
| multi_provider_workflow (5 provider x 2 dispatch cycles) | -278680 B | 0 B | 102400 B | yes | PASS |
| subscribe_batch (5 listener + 5 state updates) | -104 B | 0 B | 102400 B | yes | PASS |
| dispatch_error_handling (5 unknown action type dispatch) | -19048 B | 0 B | 102400 B | yes | PASS |

## Detailed serial reports

### multi_provider_workflow (5 provider x 2 dispatch cycles)

# Perf Report — multi_provider_workflow (5 provider x 2 dispatch cycles).serial

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
| max | 0.03ms |
| total | 0.11ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p50 | 0.00ms | 0.00ms | +0.00ms | +2.84% |
| p95 | 0.01ms | 0.01ms | -0.00ms | -37.59% |
| p99 | 0.02ms | 0.02ms | +0.00ms | +26.09% |
| mean | 0.01ms | 0.01ms | +0.00ms | +2.88% |
| min | 0.00ms | 0.00ms | 0.00ms | 0.00% |
| max | 0.03ms | 0.02ms | +0.01ms | +36.22% |
| total | 0.11ms | 0.11ms | +0.00ms | +2.88% |

### subscribe_batch (5 listener + 5 state updates)

# Perf Report — subscribe_batch (5 listener + 5 state updates).serial

| metric | value |
|---|---|
| iterations | 20 |
| warmup | 3 |
| p50 | 0.00ms |
| p95 | 0.02ms |
| p99 | 0.02ms |
| mean | 0.01ms |
| stdev | 0.01ms |
| min | 0.00ms |
| max | 0.02ms |
| total | 0.10ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p50 | 0.00ms | 0.00ms | +0.00ms | +15.39% |
| p95 | 0.02ms | 0.01ms | +0.01ms | +49.10% |
| p99 | 0.02ms | 0.02ms | +0.00ms | +28.60% |
| mean | 0.01ms | 0.00ms | +0.00ms | +14.70% |
| min | 0.00ms | 0.00ms | -0.00ms | -3.56% |
| max | 0.02ms | 0.02ms | +0.00ms | +24.75% |
| total | 0.10ms | 0.09ms | +0.01ms | +14.70% |

### dispatch_error_handling (5 unknown action type dispatch)

# Perf Report — dispatch_error_handling (5 unknown action type dispatch).serial

| metric | value |
|---|---|
| iterations | 20 |
| warmup | 3 |
| p50 | 0.01ms |
| p95 | 0.02ms |
| p99 | 0.02ms |
| mean | 0.01ms |
| stdev | 0.00ms |
| min | 0.01ms |
| max | 0.02ms |
| total | 0.22ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p50 | 0.01ms | 0.01ms | -0.00ms | -1.33% |
| p95 | 0.02ms | 0.01ms | +0.01ms | +57.23% |
| p99 | 0.02ms | 0.01ms | +0.01ms | +65.31% |
| mean | 0.01ms | 0.01ms | +0.00ms | +10.71% |
| min | 0.01ms | 0.01ms | +0.00ms | +0.46% |
| max | 0.02ms | 0.01ms | +0.01ms | +66.86% |
| total | 0.22ms | 0.20ms | +0.02ms | +10.71% |

