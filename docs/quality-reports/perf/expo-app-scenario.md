# Perf Suite — expo-app-scenario

Threshold source: [docs/quality/perf-thresholds.md](../../quality/perf-thresholds)

測定系の分解能 = 0.00025ms (何もしない関数を同じ経路で呼んだ時の p10)。 回帰判定の絶対下限は既定でこの 2 倍 = 0.00050ms、 op ごとの実効値は下表の「下限」 列。

## Serial (concurrency = 1)

| op | p10 (回帰判定) | p95 (上限判定) | cap | 下限 | gate | regression |
|---|---|---|---|---|---|---|
| onboarding_workflow (router + secureStore + notification x10 cycle) | 0.01ms | 0.02ms | 100ms | 0.00050ms | PASS | stable (p10 +4% (閾値未満)、 p95 +37% (裾は実行間の振れ幅と区別できないため判定には使わない)) — gate 無効 (regressionGate=false) |
| file_capture_batch (camera picture + fileSystem write x5) | 0.0043ms | 0.0086ms | 100ms | 0.00050ms | PASS | stable — gate 無効 (regressionGate=false) |
| permission_error_handling (5 denied camera + secureStore fail) | 0.02ms | 0.03ms | 100ms | 0.00050ms | PASS | stable — gate 無効 (regressionGate=false) |

## Concurrent p95 (concurrency = 4, 5 iter each)

| op | p95 | cap | gate |
|---|---|---|---|
| onboarding_workflow (router + secureStore + notification x10 cycle) | 0.11ms | 200ms | PASS |
| file_capture_batch (camera picture + fileSystem write x5) | 0.02ms | 200ms | PASS |
| permission_error_handling (5 denied camera + secureStore fail) | 0.09ms | 200ms | PASS |

## Memory retention (20 iter, arrayBuffers axis is the gate; heap is informational)

| op | heapUsed Δ | arrayBuffers Δ | cap | gc exposed | verdict |
|---|---|---|---|---|---|
| onboarding_workflow (router + secureStore + notification x10 cycle) | -6520 B | 0 B | 102400 B | yes | PASS |
| file_capture_batch (camera picture + fileSystem write x5) | 1864 B | 0 B | 102400 B | yes | PASS |
| permission_error_handling (5 denied camera + secureStore fail) | 4544 B | 0 B | 102400 B | yes | PASS |

## Detailed serial reports

### onboarding_workflow (router + secureStore + notification x10 cycle)

# Perf Report — onboarding_workflow (router + secureStore + notification x10 cycle).serial

| metric | value |
|---|---|
| iterations | 20 |
| warmup | 3 |
| p10 | 0.01ms |
| p50 | 0.02ms |
| p95 | 0.02ms |
| p99 | 0.03ms |
| mean | 0.02ms |
| stdev | 0.0043ms |
| min | 0.0099ms |
| max | 0.03ms |
| total | 0.33ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.01ms | 0.0096ms | +0.00041ms | +4.24% |
| p50 | 0.02ms | 0.01ms | +0.0061ms | +58.43% |
| p95 | 0.02ms | 0.02ms | +0.0068ms | +37.47% |
| p99 | 0.03ms | 0.02ms | +0.0064ms | +31.93% |
| mean | 0.02ms | 0.01ms | +0.0038ms | +29.95% |
| min | 0.0099ms | 0.0095ms | +0.00037ms | +3.92% |
| max | 0.03ms | 0.02ms | +0.0063ms | +30.71% |
| total | 0.33ms | 0.25ms | +0.08ms | +29.95% |

### file_capture_batch (camera picture + fileSystem write x5)

# Perf Report — file_capture_batch (camera picture + fileSystem write x5).serial

| metric | value |
|---|---|
| iterations | 20 |
| warmup | 3 |
| p10 | 0.0043ms |
| p50 | 0.0064ms |
| p95 | 0.0086ms |
| p99 | 0.01ms |
| mean | 0.0067ms |
| stdev | 0.0021ms |
| min | 0.0040ms |
| max | 0.01ms |
| total | 0.13ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.0043ms | 0.0047ms | -0.00040ms | -8.42% |
| p50 | 0.0064ms | 0.0049ms | +0.0015ms | +30.77% |
| p95 | 0.0086ms | 0.0077ms | +0.00088ms | +11.43% |
| p99 | 0.01ms | 0.01ms | +0.0022ms | +21.97% |
| mean | 0.0067ms | 0.0054ms | +0.0013ms | +24.38% |
| min | 0.0040ms | 0.0047ms | -0.00067ms | -14.29% |
| max | 0.01ms | 0.01ms | +0.0026ms | +23.84% |
| total | 0.13ms | 0.11ms | +0.03ms | +24.38% |

### permission_error_handling (5 denied camera + secureStore fail)

# Perf Report — permission_error_handling (5 denied camera + secureStore fail).serial

| metric | value |
|---|---|
| iterations | 20 |
| warmup | 3 |
| p10 | 0.02ms |
| p50 | 0.02ms |
| p95 | 0.03ms |
| p99 | 0.03ms |
| mean | 0.02ms |
| stdev | 0.0030ms |
| min | 0.02ms |
| max | 0.03ms |
| total | 0.41ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.02ms | 0.02ms | +0.0010ms | +5.90% |
| p50 | 0.02ms | 0.02ms | +0.0010ms | +5.61% |
| p95 | 0.03ms | 0.03ms | -0.0019ms | -7.05% |
| p99 | 0.03ms | 0.03ms | +0.0021ms | +7.54% |
| mean | 0.02ms | 0.02ms | +0.00072ms | +3.61% |
| min | 0.02ms | 0.02ms | +0.0017ms | +9.78% |
| max | 0.03ms | 0.03ms | +0.0030ms | +11.16% |
| total | 0.41ms | 0.40ms | +0.01ms | +3.61% |

