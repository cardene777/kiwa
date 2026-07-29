# Perf Suite — expo-app-scenario

Threshold source: [docs/quality/perf-thresholds.md](../../quality/perf-thresholds)

## Serial p95 (concurrency = 1)

| op | p95 | cap | gate | regression |
|---|---|---|---|---|
| onboarding_workflow (router + secureStore + notification x10 cycle) | 0.29ms | 100ms | PASS | stable (差 0.27ms が下限 0.5ms 未満で判定を保留) — gate 無効 (regressionGate=false) |
| file_capture_batch (camera picture + fileSystem write x5) | 0.01ms | 100ms | PASS | stable (検知には +0.5ms (baseline 比 +4807%) 以上の悪化が必要) — gate 無効 (regressionGate=false) |
| permission_error_handling (5 denied camera + secureStore fail) | 0.03ms | 100ms | PASS | stable (差 0.03ms が下限 0.5ms 未満で判定を保留) — gate 無効 (regressionGate=false) |

## Concurrent p95 (concurrency = 4, 5 iter each)

| op | p95 | cap | gate |
|---|---|---|---|
| onboarding_workflow (router + secureStore + notification x10 cycle) | 0.10ms | 200ms | PASS |
| file_capture_batch (camera picture + fileSystem write x5) | 0.03ms | 200ms | PASS |
| permission_error_handling (5 denied camera + secureStore fail) | 0.09ms | 200ms | PASS |

## Memory retention (20 iter, arrayBuffers axis is the gate; heap is informational)

| op | heapUsed Δ | arrayBuffers Δ | cap | gc exposed | verdict |
|---|---|---|---|---|---|
| onboarding_workflow (router + secureStore + notification x10 cycle) | 14728 B | -11316 B | 102400 B | yes | PASS |
| file_capture_batch (camera picture + fileSystem write x5) | 5424 B | 8192 B | 102400 B | yes | PASS |
| permission_error_handling (5 denied camera + secureStore fail) | 3600 B | 0 B | 102400 B | yes | PASS |

## Detailed serial reports

### onboarding_workflow (router + secureStore + notification x10 cycle)

# Perf Report — onboarding_workflow (router + secureStore + notification x10 cycle).serial

| metric | value |
|---|---|
| iterations | 20 |
| warmup | 3 |
| p50 | 0.03ms |
| p95 | 0.29ms |
| p99 | 0.32ms |
| mean | 0.05ms |
| stdev | 0.09ms |
| min | 0.01ms |
| max | 0.32ms |
| total | 0.99ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p50 | 0.03ms | 0.01ms | +0.01ms | +90.21% |
| p95 | 0.29ms | 0.02ms | +0.27ms | +1417.10% |
| p99 | 0.32ms | 0.02ms | +0.29ms | +1196.46% |
| mean | 0.05ms | 0.01ms | +0.04ms | +238.22% |
| min | 0.01ms | 0.01ms | +0.00ms | +3.44% |
| max | 0.32ms | 0.03ms | +0.30ms | +1156.20% |
| total | 0.99ms | 0.29ms | +0.70ms | +238.22% |

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
| total | 0.11ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p50 | 0.01ms | 0.01ms | -0.00ms | -4.00% |
| p95 | 0.01ms | 0.01ms | -0.00ms | -40.54% |
| p99 | 0.01ms | 0.01ms | -0.00ms | -37.29% |
| mean | 0.01ms | 0.01ms | -0.00ms | -14.91% |
| min | 0.00ms | 0.00ms | -0.00ms | -0.83% |
| max | 0.01ms | 0.01ms | -0.01ms | -36.69% |
| total | 0.11ms | 0.12ms | -0.02ms | -14.91% |

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
| total | 0.40ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p50 | 0.02ms | 0.02ms | -0.00ms | -9.58% |
| p95 | 0.03ms | 0.05ms | -0.03ms | -50.82% |
| p99 | 0.03ms | 0.09ms | -0.06ms | -69.37% |
| mean | 0.02ms | 0.03ms | -0.01ms | -30.05% |
| min | 0.02ms | 0.02ms | -0.00ms | -2.82% |
| max | 0.03ms | 0.10ms | -0.07ms | -71.94% |
| total | 0.40ms | 0.57ms | -0.17ms | -30.05% |

