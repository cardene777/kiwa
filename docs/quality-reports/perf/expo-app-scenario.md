# Perf Suite — expo-app-scenario

Threshold source: [docs/quality/perf-thresholds.md](../../quality/perf-thresholds)

## Serial p95 (concurrency = 1)

| op | p95 | cap | gate | regression |
|---|---|---|---|---|
| onboarding_workflow (router + secureStore + notification x10 cycle) | 0.02ms | 100ms | PASS | stable |
| file_capture_batch (camera picture + fileSystem write x5) | 0.01ms | 100ms | PASS | stable |
| permission_error_handling (5 denied camera + secureStore fail) | 0.04ms | 100ms | PASS | stable |

## Concurrent p95 (concurrency = 4, 5 iter each)

| op | p95 | cap | gate |
|---|---|---|---|
| onboarding_workflow (router + secureStore + notification x10 cycle) | 0.08ms | 200ms | PASS |
| file_capture_batch (camera picture + fileSystem write x5) | 0.02ms | 200ms | PASS |
| permission_error_handling (5 denied camera + secureStore fail) | 0.11ms | 200ms | PASS |

## Memory retention (20 iter, arrayBuffers axis is the gate; heap is informational)

| op | heapUsed Δ | arrayBuffers Δ | cap | gc exposed | verdict |
|---|---|---|---|---|---|
| onboarding_workflow (router + secureStore + notification x10 cycle) | 8840 B | -11830 B | 102400 B | yes | PASS |
| file_capture_batch (camera picture + fileSystem write x5) | 256328 B | 0 B | 102400 B | yes | PASS |
| permission_error_handling (5 denied camera + secureStore fail) | 1216 B | 0 B | 102400 B | yes | PASS |

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
| total | 0.25ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p50 | 0.01ms | 0.01ms | +0.00ms | +2.79% |
| p95 | 0.02ms | 0.02ms | +0.00ms | +0.23% |
| p99 | 0.02ms | 0.02ms | +0.00ms | +10.37% |
| mean | 0.01ms | 0.01ms | +0.00ms | +4.55% |
| min | 0.01ms | 0.01ms | +0.00ms | +0.42% |
| max | 0.02ms | 0.02ms | +0.00ms | +12.69% |
| total | 0.25ms | 0.24ms | +0.01ms | +4.55% |

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
| total | 0.11ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p50 | 0.00ms | 0.01ms | -0.00ms | -4.49% |
| p95 | 0.01ms | 0.01ms | +0.00ms | +31.29% |
| p99 | 0.01ms | 0.01ms | +0.00ms | +42.46% |
| mean | 0.01ms | 0.01ms | -0.00ms | -0.11% |
| min | 0.00ms | 0.00ms | -0.00ms | -23.55% |
| max | 0.01ms | 0.01ms | +0.00ms | +44.55% |
| total | 0.11ms | 0.11ms | -0.00ms | -0.11% |

### permission_error_handling (5 denied camera + secureStore fail)

# Perf Report — permission_error_handling (5 denied camera + secureStore fail).serial

| metric | value |
|---|---|
| iterations | 20 |
| warmup | 3 |
| p50 | 0.03ms |
| p95 | 0.04ms |
| p99 | 0.04ms |
| mean | 0.03ms |
| stdev | 0.00ms |
| min | 0.02ms |
| max | 0.04ms |
| total | 0.60ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p50 | 0.03ms | 0.02ms | +0.01ms | +57.87% |
| p95 | 0.04ms | 0.02ms | +0.01ms | +60.97% |
| p99 | 0.04ms | 0.03ms | +0.01ms | +42.74% |
| mean | 0.03ms | 0.02ms | +0.01ms | +54.74% |
| min | 0.02ms | 0.02ms | +0.01ms | +42.95% |
| max | 0.04ms | 0.03ms | +0.01ms | +38.84% |
| total | 0.60ms | 0.39ms | +0.21ms | +54.74% |

