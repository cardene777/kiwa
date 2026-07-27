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
| dispatch_error_handling (5 unknown action type dispatch) | 0.05ms | 200ms | PASS |

## Memory retention (20 iter, arrayBuffers axis is the gate; heap is informational)

| op | heapUsed Δ | arrayBuffers Δ | cap | gc exposed | verdict |
|---|---|---|---|---|---|
| multi_provider_workflow (5 provider x 2 dispatch cycles) | 73832 B | -11186 B | 102400 B | yes | PASS |
| subscribe_batch (5 listener + 5 state updates) | 944 B | 0 B | 102400 B | yes | PASS |
| dispatch_error_handling (5 unknown action type dispatch) | -832 B | 0 B | 102400 B | yes | PASS |

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
| total | 0.11ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p50 | 0.00ms | 0.00ms | +0.00ms | +38.27% |
| p95 | 0.01ms | 0.01ms | -0.00ms | -31.13% |
| p99 | 0.01ms | 0.01ms | +0.00ms | +22.17% |
| mean | 0.01ms | 0.00ms | +0.00ms | +13.31% |
| min | 0.00ms | 0.00ms | +0.00ms | +40.27% |
| max | 0.01ms | 0.01ms | +0.00ms | +33.82% |
| total | 0.11ms | 0.09ms | +0.01ms | +13.31% |

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
| p50 | 0.00ms | 0.00ms | +0.00ms | +14.06% |
| p95 | 0.01ms | 0.01ms | -0.00ms | -2.88% |
| p99 | 0.01ms | 0.02ms | -0.01ms | -29.95% |
| mean | 0.00ms | 0.00ms | +0.00ms | +4.42% |
| min | 0.00ms | 0.00ms | +0.00ms | +7.80% |
| max | 0.01ms | 0.02ms | -0.01ms | -33.40% |
| total | 0.09ms | 0.08ms | +0.00ms | +4.42% |

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
| total | 0.24ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p50 | 0.01ms | 0.01ms | +0.00ms | +31.60% |
| p95 | 0.01ms | 0.01ms | +0.00ms | +28.92% |
| p99 | 0.02ms | 0.01ms | +0.00ms | +27.60% |
| mean | 0.01ms | 0.01ms | +0.00ms | +31.24% |
| min | 0.01ms | 0.01ms | +0.00ms | +30.11% |
| max | 0.02ms | 0.01ms | +0.00ms | +27.35% |
| total | 0.24ms | 0.18ms | +0.06ms | +31.24% |

