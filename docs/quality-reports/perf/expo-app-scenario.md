# Perf Suite — expo-app-scenario

Threshold source: [docs/quality/perf-thresholds.md](../../quality/perf-thresholds)

測定系の分解能 = 0.00025ms (何もしない関数を同じ経路で呼んだ時の p10)。 回帰判定の絶対下限は既定でこの 2 倍 = 0.00050ms、 op ごとの実効値は下表の「下限」 列。

## Serial (concurrency = 1)

| op | p10 (回帰判定) | p95 (上限判定) | cap | 下限 | gate | regression |
|---|---|---|---|---|---|---|
| onboarding_workflow (router + secureStore + notification x10 cycle) | 0.0091ms | 0.02ms | 100ms | 0.00050ms | PASS | stable — gate 無効 (regressionGate=false) |
| file_capture_batch (camera picture + fileSystem write x5) | 0.0043ms | 0.01ms | 100ms | 0.00050ms | PASS | stable (p10 -9% (閾値未満)、 p95 +48% (裾は実行間の振れ幅と区別できないため判定には使わない)) — gate 無効 (regressionGate=false) |
| permission_error_handling (5 denied camera + secureStore fail) | 0.02ms | 0.03ms | 100ms | 0.00050ms | PASS | stable — gate 無効 (regressionGate=false) |

## Concurrent p95 (concurrency = 4, 5 iter each)

| op | p95 | cap | gate |
|---|---|---|---|
| onboarding_workflow (router + secureStore + notification x10 cycle) | 0.09ms | 200ms | PASS |
| file_capture_batch (camera picture + fileSystem write x5) | 0.02ms | 200ms | PASS |
| permission_error_handling (5 denied camera + secureStore fail) | 0.11ms | 200ms | PASS |

## Memory retention (20 iter, arrayBuffers axis is the gate; heap is informational)

| op | heapUsed Δ | arrayBuffers Δ | cap | gc exposed | verdict |
|---|---|---|---|---|---|
| onboarding_workflow (router + secureStore + notification x10 cycle) | 22784 B | 0 B | 102400 B | yes | PASS |
| file_capture_batch (camera picture + fileSystem write x5) | 2320 B | 0 B | 102400 B | yes | PASS |
| permission_error_handling (5 denied camera + secureStore fail) | 3656 B | 0 B | 102400 B | yes | PASS |

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
| stdev | 0.0043ms |
| min | 0.0090ms |
| max | 0.03ms |
| total | 0.23ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.0091ms | 0.0096ms | -0.00050ms | -5.20% |
| p50 | 0.0096ms | 0.01ms | -0.00073ms | -7.03% |
| p95 | 0.02ms | 0.02ms | -0.0013ms | -7.00% |
| p99 | 0.02ms | 0.02ms | +0.0041ms | +20.42% |
| mean | 0.01ms | 0.01ms | -0.00086ms | -6.86% |
| min | 0.0090ms | 0.0095ms | -0.00050ms | -5.25% |
| max | 0.03ms | 0.02ms | +0.0055ms | +26.46% |
| total | 0.23ms | 0.25ms | -0.02ms | -6.86% |

### file_capture_batch (camera picture + fileSystem write x5)

# Perf Report — file_capture_batch (camera picture + fileSystem write x5).serial

| metric | value |
|---|---|
| iterations | 20 |
| warmup | 3 |
| p10 | 0.0043ms |
| p50 | 0.0053ms |
| p95 | 0.01ms |
| p99 | 0.02ms |
| mean | 0.0064ms |
| stdev | 0.0029ms |
| min | 0.0040ms |
| max | 0.02ms |
| total | 0.13ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.0043ms | 0.0047ms | -0.00044ms | -9.40% |
| p50 | 0.0053ms | 0.0049ms | +0.00040ms | +8.11% |
| p95 | 0.01ms | 0.0077ms | +0.0037ms | +48.31% |
| p99 | 0.02ms | 0.01ms | +0.0052ms | +51.05% |
| mean | 0.0064ms | 0.0054ms | +0.0010ms | +19.01% |
| min | 0.0040ms | 0.0047ms | -0.00063ms | -13.41% |
| max | 0.02ms | 0.01ms | +0.0056ms | +51.54% |
| total | 0.13ms | 0.11ms | +0.02ms | +19.01% |

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
| stdev | 0.0031ms |
| min | 0.02ms |
| max | 0.03ms |
| total | 0.40ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.02ms | 0.02ms | +0.000079ms | +0.44% |
| p50 | 0.02ms | 0.02ms | +0.00054ms | +2.92% |
| p95 | 0.03ms | 0.03ms | +0.00091ms | +3.36% |
| p99 | 0.03ms | 0.03ms | +0.00082ms | +3.00% |
| mean | 0.02ms | 0.02ms | +0.00015ms | +0.73% |
| min | 0.02ms | 0.02ms | +0.00063ms | +3.67% |
| max | 0.03ms | 0.03ms | +0.00079ms | +2.91% |
| total | 0.40ms | 0.40ms | +0.0029ms | +0.73% |

