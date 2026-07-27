# Perf Suite — state-app-scenario

Threshold source: [docs/quality/perf-thresholds.md](../../quality/perf-thresholds)

## Serial p95 (concurrency = 1)

| op | p95 | cap | gate | regression |
|---|---|---|---|---|
| multi_provider_workflow (5 provider x 2 dispatch cycles) | 0.04ms | 100ms | PASS | stable |
| subscribe_batch (5 listener + 5 state updates) | 0.01ms | 100ms | PASS | stable |
| dispatch_error_handling (5 unknown action type dispatch) | 0.01ms | 100ms | PASS | stable |

## Concurrent p95 (concurrency = 4, 5 iter each)

| op | p95 | cap | gate |
|---|---|---|---|
| multi_provider_workflow (5 provider x 2 dispatch cycles) | 0.12ms | 200ms | PASS |
| subscribe_batch (5 listener + 5 state updates) | 0.02ms | 200ms | PASS |
| dispatch_error_handling (5 unknown action type dispatch) | 0.04ms | 200ms | PASS |

## Memory retention (20 iter, arrayBuffers axis is the gate; heap is informational)

| op | heapUsed Δ | arrayBuffers Δ | cap | gc exposed | verdict |
|---|---|---|---|---|---|
| multi_provider_workflow (5 provider x 2 dispatch cycles) | 8224 B | 0 B | 102400 B | yes | PASS |
| subscribe_batch (5 listener + 5 state updates) | 1960 B | 0 B | 102400 B | yes | PASS |
| dispatch_error_handling (5 unknown action type dispatch) | 912 B | 0 B | 102400 B | yes | PASS |

## Detailed serial reports

### multi_provider_workflow (5 provider x 2 dispatch cycles)

# Perf Report — multi_provider_workflow (5 provider x 2 dispatch cycles).serial

| metric | value |
|---|---|
| iterations | 20 |
| warmup | 3 |
| p50 | 0.00ms |
| p95 | 0.04ms |
| p99 | 0.08ms |
| mean | 0.01ms |
| stdev | 0.02ms |
| min | 0.00ms |
| max | 0.09ms |
| total | 0.23ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p50 | 0.00ms | 0.00ms | +0.00ms | +45.05% |
| p95 | 0.04ms | 0.01ms | +0.03ms | +335.53% |
| p99 | 0.08ms | 0.01ms | +0.07ms | +623.13% |
| mean | 0.01ms | 0.00ms | +0.01ms | +142.63% |
| min | 0.00ms | 0.00ms | +0.00ms | +0.03% |
| max | 0.09ms | 0.01ms | +0.08ms | +686.04% |
| total | 0.23ms | 0.09ms | +0.13ms | +142.63% |

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
| p50 | 0.00ms | 0.00ms | +0.00ms | +30.36% |
| p95 | 0.01ms | 0.01ms | +0.00ms | +3.35% |
| p99 | 0.01ms | 0.02ms | -0.01ms | -28.69% |
| mean | 0.00ms | 0.00ms | +0.00ms | +10.92% |
| min | 0.00ms | 0.00ms | +0.00ms | +12.49% |
| max | 0.01ms | 0.02ms | -0.01ms | -32.78% |
| total | 0.09ms | 0.08ms | +0.01ms | +10.92% |

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
| p50 | 0.01ms | 0.01ms | +0.00ms | +9.42% |
| p95 | 0.01ms | 0.01ms | +0.00ms | +24.31% |
| p99 | 0.02ms | 0.01ms | +0.00ms | +15.00% |
| mean | 0.01ms | 0.01ms | +0.00ms | +9.81% |
| min | 0.01ms | 0.01ms | +0.00ms | +3.89% |
| max | 0.02ms | 0.01ms | +0.00ms | +13.23% |
| total | 0.20ms | 0.18ms | +0.02ms | +9.81% |

