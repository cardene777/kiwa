# Perf Suite — expo-app-scenario

Threshold source: [docs/quality/perf-thresholds.md](../../quality/perf-thresholds)

測定系の分解能 = 0.00025ms (何もしない関数を同じ経路で呼んだ時の p10)。 回帰判定の絶対下限は既定でこの 2 倍 = 0.00050ms、 op ごとの実効値は下表の「下限」 列。

## Serial (concurrency = 1)

| op | p10 (回帰判定) | p95 (上限判定) | cap | 下限 | gate | regression |
|---|---|---|---|---|---|---|
| onboarding_workflow (router + secureStore + notification x10 cycle) | 0.0091ms | 0.02ms | 100ms | 0.00050ms | PASS | stable — gate 無効 (regressionGate=false) |
| file_capture_batch (camera picture + fileSystem write x5) | 0.0038ms | 0.01ms | 100ms | 0.00050ms | PASS | stable (p10 -19% (閾値未満)、 p95 +54% (裾は実行間の振れ幅と区別できないため判定には使わない)) — gate 無効 (regressionGate=false) |
| permission_error_handling (5 denied camera + secureStore fail) | 0.02ms | 0.02ms | 100ms | 0.00050ms | PASS | stable — gate 無効 (regressionGate=false) |

## Concurrent p95 (concurrency = 4, 5 iter each)

| op | p95 | cap | gate |
|---|---|---|---|
| onboarding_workflow (router + secureStore + notification x10 cycle) | 0.11ms | 200ms | PASS |
| file_capture_batch (camera picture + fileSystem write x5) | 0.02ms | 200ms | PASS |
| permission_error_handling (5 denied camera + secureStore fail) | 0.10ms | 200ms | PASS |

## Memory retention (20 iter, arrayBuffers axis is the gate; heap is informational)

| op | heapUsed Δ | arrayBuffers Δ | cap | gc exposed | verdict |
|---|---|---|---|---|---|
| onboarding_workflow (router + secureStore + notification x10 cycle) | 28800 B | 0 B | 102400 B | yes | PASS |
| file_capture_batch (camera picture + fileSystem write x5) | 3256 B | 0 B | 102400 B | yes | PASS |
| permission_error_handling (5 denied camera + secureStore fail) | 3600 B | 0 B | 102400 B | yes | PASS |

## Detailed serial reports

### onboarding_workflow (router + secureStore + notification x10 cycle)

# Perf Report — onboarding_workflow (router + secureStore + notification x10 cycle).serial

| metric | value |
|---|---|
| iterations | 20 |
| warmup | 3 |
| p10 | 0.0091ms |
| p50 | 0.0096ms |
| p95 | 0.02ms |
| p99 | 0.02ms |
| mean | 0.01ms |
| stdev | 0.0036ms |
| min | 0.0090ms |
| max | 0.02ms |
| total | 0.23ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.0091ms | 0.0096ms | -0.00054ms | -5.63% |
| p50 | 0.0096ms | 0.01ms | -0.00077ms | -7.43% |
| p95 | 0.02ms | 0.02ms | -0.0017ms | -9.12% |
| p99 | 0.02ms | 0.02ms | +0.0010ms | +4.97% |
| mean | 0.01ms | 0.01ms | -0.0013ms | -10.07% |
| min | 0.0090ms | 0.0095ms | -0.00054ms | -5.68% |
| max | 0.02ms | 0.02ms | +0.0017ms | +8.08% |
| total | 0.23ms | 0.25ms | -0.03ms | -10.07% |

### file_capture_batch (camera picture + fileSystem write x5)

# Perf Report — file_capture_batch (camera picture + fileSystem write x5).serial

| metric | value |
|---|---|
| iterations | 20 |
| warmup | 3 |
| p10 | 0.0038ms |
| p50 | 0.0040ms |
| p95 | 0.01ms |
| p99 | 0.03ms |
| mean | 0.0068ms |
| stdev | 0.0077ms |
| min | 0.0038ms |
| max | 0.04ms |
| total | 0.14ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.0038ms | 0.0047ms | -0.00092ms | -19.47% |
| p50 | 0.0040ms | 0.0049ms | -0.00085ms | -17.52% |
| p95 | 0.01ms | 0.0077ms | +0.0042ms | +54.00% |
| p99 | 0.03ms | 0.01ms | +0.02ms | +226.29% |
| mean | 0.0068ms | 0.0054ms | +0.0014ms | +26.01% |
| min | 0.0038ms | 0.0047ms | -0.00088ms | -18.77% |
| max | 0.04ms | 0.01ms | +0.03ms | +256.93% |
| total | 0.14ms | 0.11ms | +0.03ms | +26.01% |

### permission_error_handling (5 denied camera + secureStore fail)

# Perf Report — permission_error_handling (5 denied camera + secureStore fail).serial

| metric | value |
|---|---|
| iterations | 20 |
| warmup | 3 |
| p10 | 0.02ms |
| p50 | 0.02ms |
| p95 | 0.02ms |
| p99 | 0.03ms |
| mean | 0.02ms |
| stdev | 0.0030ms |
| min | 0.02ms |
| max | 0.03ms |
| total | 0.38ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.02ms | 0.02ms | -0.00049ms | -2.77% |
| p50 | 0.02ms | 0.02ms | -0.00054ms | -2.92% |
| p95 | 0.02ms | 0.03ms | -0.0036ms | -13.27% |
| p99 | 0.03ms | 0.03ms | +0.00075ms | +2.75% |
| mean | 0.02ms | 0.02ms | -0.00082ms | -4.10% |
| min | 0.02ms | 0.02ms | +0.000084ms | +0.49% |
| max | 0.03ms | 0.03ms | +0.0018ms | +6.73% |
| total | 0.38ms | 0.40ms | -0.02ms | -4.10% |

