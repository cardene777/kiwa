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
| permission_error_handling (5 denied camera + secureStore fail) | 0.10ms | 200ms | PASS |

## Memory retention (20 iter, arrayBuffers axis is the gate; heap is informational)

| op | heapUsed Δ | arrayBuffers Δ | cap | verdict |
|---|---|---|---|---|
| onboarding_workflow (router + secureStore + notification x10 cycle) | 1935304 B | 0 B | 102400 B | PASS |
| file_capture_batch (camera picture + fileSystem write x5) | 248336 B | 8192 B | 102400 B | PASS |
| permission_error_handling (5 denied camera + secureStore fail) | 376288 B | 0 B | 102400 B | PASS |

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
| total | 0.22ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p50 | 0.01ms | 0.01ms | +0.00ms | +4.26% |
| p95 | 0.02ms | 0.02ms | -0.00ms | -6.02% |
| p99 | 0.02ms | 0.03ms | -0.01ms | -30.73% |
| mean | 0.01ms | 0.01ms | -0.00ms | -3.73% |
| min | 0.01ms | 0.01ms | +0.00ms | +6.34% |
| max | 0.02ms | 0.03ms | -0.01ms | -34.92% |
| total | 0.22ms | 0.23ms | -0.01ms | -3.73% |

### file_capture_batch (camera picture + fileSystem write x5)

# Perf Report — file_capture_batch (camera picture + fileSystem write x5).serial

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
| p50 | 0.00ms | 0.01ms | -0.00ms | -15.27% |
| p95 | 0.01ms | 0.01ms | -0.00ms | -6.44% |
| p99 | 0.01ms | 0.01ms | -0.00ms | -16.99% |
| mean | 0.01ms | 0.01ms | -0.00ms | -15.51% |
| min | 0.00ms | 0.00ms | -0.00ms | -22.02% |
| max | 0.01ms | 0.01ms | -0.00ms | -18.73% |
| total | 0.10ms | 0.12ms | -0.02ms | -15.51% |

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
| total | 0.46ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p50 | 0.02ms | 0.02ms | +0.00ms | +15.28% |
| p95 | 0.03ms | 0.02ms | +0.01ms | +25.83% |
| p99 | 0.03ms | 0.03ms | +0.00ms | +13.48% |
| mean | 0.02ms | 0.02ms | +0.00ms | +15.62% |
| min | 0.02ms | 0.02ms | +0.00ms | +16.02% |
| max | 0.03ms | 0.03ms | +0.00ms | +10.80% |
| total | 0.46ms | 0.39ms | +0.06ms | +15.62% |

