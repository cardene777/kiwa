# Perf Suite — expo-app-scenario

Threshold source: [docs/quality/perf-thresholds.md](../../quality/perf-thresholds)

## Serial p95 (concurrency = 1)

| op | p95 | cap | gate | regression |
|---|---|---|---|---|
| onboarding_workflow (router + secureStore + notification x10 cycle) | 0.02ms | 100ms | PASS | stable |
| file_capture_batch (camera picture + fileSystem write x5) | 0.01ms | 100ms | PASS | stable |
| permission_error_handling (5 denied camera + secureStore fail) | 0.03ms | 100ms | PASS | stable |

## Concurrent p95 (concurrency = 4, 5 iter each)

| op | p95 | cap | gate |
|---|---|---|---|
| onboarding_workflow (router + secureStore + notification x10 cycle) | 0.08ms | 200ms | PASS |
| file_capture_batch (camera picture + fileSystem write x5) | 0.02ms | 200ms | PASS |
| permission_error_handling (5 denied camera + secureStore fail) | 0.09ms | 200ms | PASS |

## Memory retention (20 iter, arrayBuffers axis is the gate; heap is informational)

| op | heapUsed Δ | arrayBuffers Δ | cap | gc exposed | verdict |
|---|---|---|---|---|---|
| onboarding_workflow (router + secureStore + notification x10 cycle) | -4584 B | 0 B | 102400 B | yes | PASS |
| file_capture_batch (camera picture + fileSystem write x5) | 3992 B | 0 B | 102400 B | yes | PASS |
| permission_error_handling (5 denied camera + secureStore fail) | 4120 B | 0 B | 102400 B | yes | PASS |

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
| total | 0.23ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p50 | 0.01ms | 0.01ms | -0.00ms | -0.40% |
| p95 | 0.02ms | 0.02ms | -0.00ms | -0.86% |
| p99 | 0.02ms | 0.02ms | +0.00ms | +18.14% |
| mean | 0.01ms | 0.01ms | -0.00ms | -1.59% |
| min | 0.01ms | 0.01ms | -0.00ms | -2.06% |
| max | 0.02ms | 0.02ms | +0.00ms | +22.49% |
| total | 0.23ms | 0.24ms | -0.00ms | -1.59% |

### file_capture_batch (camera picture + fileSystem write x5)

# Perf Report — file_capture_batch (camera picture + fileSystem write x5).serial

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
| total | 0.10ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p50 | 0.00ms | 0.01ms | -0.00ms | -9.79% |
| p95 | 0.01ms | 0.01ms | -0.00ms | -16.07% |
| p99 | 0.01ms | 0.01ms | -0.00ms | -15.31% |
| mean | 0.00ms | 0.01ms | -0.00ms | -10.66% |
| min | 0.00ms | 0.00ms | -0.00ms | -8.43% |
| max | 0.01ms | 0.01ms | -0.00ms | -15.17% |
| total | 0.10ms | 0.11ms | -0.01ms | -10.66% |

### permission_error_handling (5 denied camera + secureStore fail)

# Perf Report — permission_error_handling (5 denied camera + secureStore fail).serial

| metric | value |
|---|---|
| iterations | 20 |
| warmup | 3 |
| p50 | 0.02ms |
| p95 | 0.03ms |
| p99 | 0.03ms |
| mean | 0.02ms |
| stdev | 0.00ms |
| min | 0.02ms |
| max | 0.03ms |
| total | 0.44ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p50 | 0.02ms | 0.02ms | +0.00ms | +13.85% |
| p95 | 0.03ms | 0.02ms | +0.00ms | +15.96% |
| p99 | 0.03ms | 0.03ms | +0.00ms | +7.73% |
| mean | 0.02ms | 0.02ms | +0.00ms | +12.49% |
| min | 0.02ms | 0.02ms | +0.00ms | +19.18% |
| max | 0.03ms | 0.03ms | +0.00ms | +5.96% |
| total | 0.44ms | 0.39ms | +0.05ms | +12.49% |

