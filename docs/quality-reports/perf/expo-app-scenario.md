# Perf Suite — expo-app-scenario

Threshold source: [docs/quality/perf-thresholds.md](../../quality/perf-thresholds)

## Serial p95 (concurrency = 1)

| op | p95 | cap | gate | regression |
|---|---|---|---|---|
| onboarding_workflow (router + secureStore + notification x10 cycle) | 0.02ms | 100ms | PASS | stable (検知には +0.5ms (baseline 比 +2656%) 以上の悪化が必要) |
| file_capture_batch (camera picture + fileSystem write x5) | 0.01ms | 100ms | PASS | stable (検知には +0.5ms (baseline 比 +4807%) 以上の悪化が必要) |
| permission_error_handling (5 denied camera + secureStore fail) | 0.03ms | 100ms | PASS | stable (検知には +0.5ms (baseline 比 +944%) 以上の悪化が必要) |

## Concurrent p95 (concurrency = 4, 5 iter each)

| op | p95 | cap | gate |
|---|---|---|---|
| onboarding_workflow (router + secureStore + notification x10 cycle) | 0.08ms | 200ms | PASS |
| file_capture_batch (camera picture + fileSystem write x5) | 0.02ms | 200ms | PASS |
| permission_error_handling (5 denied camera + secureStore fail) | 0.11ms | 200ms | PASS |

## Memory retention (20 iter, arrayBuffers axis is the gate; heap is informational)

| op | heapUsed Δ | arrayBuffers Δ | cap | gc exposed | verdict |
|---|---|---|---|---|---|
| onboarding_workflow (router + secureStore + notification x10 cycle) | 19912 B | 0 B | 102400 B | yes | PASS |
| file_capture_batch (camera picture + fileSystem write x5) | -328 B | 0 B | 102400 B | yes | PASS |
| permission_error_handling (5 denied camera + secureStore fail) | 3600 B | 0 B | 102400 B | yes | PASS |

## Detailed serial reports

### onboarding_workflow (router + secureStore + notification x10 cycle)

# Perf Report — onboarding_workflow (router + secureStore + notification x10 cycle).serial

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
| total | 0.24ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p50 | 0.01ms | 0.01ms | -0.00ms | -28.47% |
| p95 | 0.02ms | 0.02ms | -0.00ms | -13.47% |
| p99 | 0.02ms | 0.02ms | -0.00ms | -7.41% |
| mean | 0.01ms | 0.01ms | -0.00ms | -18.18% |
| min | 0.01ms | 0.01ms | -0.00ms | -8.78% |
| max | 0.02ms | 0.03ms | -0.00ms | -6.30% |
| total | 0.24ms | 0.29ms | -0.05ms | -18.18% |

### file_capture_batch (camera picture + fileSystem write x5)

# Perf Report — file_capture_batch (camera picture + fileSystem write x5).serial

| metric | value |
|---|---|
| iterations | 20 |
| warmup | 3 |
| p50 | 0.01ms |
| p95 | 0.01ms |
| p99 | 0.01ms |
| mean | 0.01ms |
| stdev | 0.00ms |
| min | 0.00ms |
| max | 0.01ms |
| total | 0.12ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p50 | 0.01ms | 0.01ms | +0.00ms | +11.99% |
| p95 | 0.01ms | 0.01ms | -0.00ms | -11.03% |
| p99 | 0.01ms | 0.01ms | -0.00ms | -1.73% |
| mean | 0.01ms | 0.01ms | +0.00ms | +0.20% |
| min | 0.00ms | 0.00ms | -0.00ms | -16.92% |
| max | 0.01ms | 0.01ms | -0.00ms | -0.01% |
| total | 0.12ms | 0.12ms | +0.00ms | +0.20% |

### permission_error_handling (5 denied camera + secureStore fail)

# Perf Report — permission_error_handling (5 denied camera + secureStore fail).serial

| metric | value |
|---|---|
| iterations | 20 |
| warmup | 3 |
| p50 | 0.02ms |
| p95 | 0.03ms |
| p99 | 0.04ms |
| mean | 0.02ms |
| stdev | 0.01ms |
| min | 0.02ms |
| max | 0.04ms |
| total | 0.47ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p50 | 0.02ms | 0.02ms | -0.00ms | -1.46% |
| p95 | 0.03ms | 0.05ms | -0.02ms | -34.00% |
| p99 | 0.04ms | 0.09ms | -0.05ms | -59.33% |
| mean | 0.02ms | 0.03ms | -0.01ms | -17.63% |
| min | 0.02ms | 0.02ms | -0.00ms | -4.56% |
| max | 0.04ms | 0.10ms | -0.06ms | -62.83% |
| total | 0.47ms | 0.57ms | -0.10ms | -17.63% |

