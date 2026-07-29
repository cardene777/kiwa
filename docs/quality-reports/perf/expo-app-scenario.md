# Perf Suite — expo-app-scenario

Threshold source: [docs/quality/perf-thresholds.md](../../quality/perf-thresholds)

測定系の分解能 = 0.00025ms (何もしない関数を同じ経路で呼んだ時の p10)。 回帰判定の絶対下限は既定でこの 2 倍 = 0.00049ms、 op ごとの実効値は下表の「下限」 列。

## Serial (concurrency = 1)

| op | p10 (回帰判定) | p95 (上限判定) | cap | 下限 | gate | regression |
|---|---|---|---|---|---|---|
| onboarding_workflow (router + secureStore + notification x10 cycle) | 0.0090ms | 0.02ms | 100ms | 0.00049ms | PASS | stable — gate 無効 (regressionGate=false) |
| file_capture_batch (camera picture + fileSystem write x5) | 0.0047ms | 0.0061ms | 100ms | 0.00049ms | PASS | stable — gate 無効 (regressionGate=false) |
| permission_error_handling (5 denied camera + secureStore fail) | 0.02ms | 0.03ms | 100ms | 0.00049ms | PASS | stable — gate 無効 (regressionGate=false) |

## Concurrent p95 (concurrency = 4, 5 iter each)

| op | p95 | cap | gate |
|---|---|---|---|
| onboarding_workflow (router + secureStore + notification x10 cycle) | 0.07ms | 200ms | PASS |
| file_capture_batch (camera picture + fileSystem write x5) | 0.02ms | 200ms | PASS |
| permission_error_handling (5 denied camera + secureStore fail) | 0.09ms | 200ms | PASS |

## Memory retention (20 iter, arrayBuffers axis is the gate; heap is informational)

| op | heapUsed Δ | arrayBuffers Δ | cap | gc exposed | verdict |
|---|---|---|---|---|---|
| onboarding_workflow (router + secureStore + notification x10 cycle) | 23344 B | 0 B | 102400 B | yes | PASS |
| file_capture_batch (camera picture + fileSystem write x5) | 696 B | 0 B | 102400 B | yes | PASS |
| permission_error_handling (5 denied camera + secureStore fail) | 3600 B | 0 B | 102400 B | yes | PASS |

## Detailed serial reports

### onboarding_workflow (router + secureStore + notification x10 cycle)

# Perf Report — onboarding_workflow (router + secureStore + notification x10 cycle).serial

| metric | value |
|---|---|
| iterations | 20 |
| warmup | 3 |
| p10 | 0.0090ms |
| p50 | 0.0097ms |
| p95 | 0.02ms |
| p99 | 0.02ms |
| mean | 0.01ms |
| stdev | 0.0048ms |
| min | 0.0089ms |
| max | 0.03ms |
| total | 0.25ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.0090ms | 0.0096ms | -0.00062ms | -6.45% |
| p50 | 0.0097ms | 0.01ms | -0.00065ms | -6.23% |
| p95 | 0.02ms | 0.02ms | +0.0024ms | +13.42% |
| p99 | 0.02ms | 0.02ms | +0.0047ms | +23.28% |
| mean | 0.01ms | 0.01ms | +0.00012ms | +0.93% |
| min | 0.0089ms | 0.0095ms | -0.00063ms | -6.56% |
| max | 0.03ms | 0.02ms | +0.0052ms | +25.45% |
| total | 0.25ms | 0.25ms | +0.0023ms | +0.93% |

### file_capture_batch (camera picture + fileSystem write x5)

# Perf Report — file_capture_batch (camera picture + fileSystem write x5).serial

| metric | value |
|---|---|
| iterations | 20 |
| warmup | 3 |
| p10 | 0.0047ms |
| p50 | 0.0049ms |
| p95 | 0.0061ms |
| p99 | 0.0075ms |
| mean | 0.0051ms |
| stdev | 0.00073ms |
| min | 0.0047ms |
| max | 0.0079ms |
| total | 0.10ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.0047ms | 0.0047ms | -0.0000050ms | -0.11% |
| p50 | 0.0049ms | 0.0049ms | -0.000021ms | -0.43% |
| p95 | 0.0061ms | 0.0077ms | -0.0016ms | -20.41% |
| p99 | 0.0075ms | 0.01ms | -0.0027ms | -26.26% |
| mean | 0.0051ms | 0.0054ms | -0.00028ms | -5.25% |
| min | 0.0047ms | 0.0047ms | -0.0000010ms | -0.02% |
| max | 0.0079ms | 0.01ms | -0.0030ms | -27.31% |
| total | 0.10ms | 0.11ms | -0.0056ms | -5.25% |

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
| stdev | 0.0035ms |
| min | 0.02ms |
| max | 0.03ms |
| total | 0.40ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.02ms | 0.02ms | -0.00013ms | -0.73% |
| p50 | 0.02ms | 0.02ms | -0.00042ms | -2.24% |
| p95 | 0.03ms | 0.03ms | -0.00096ms | -3.54% |
| p99 | 0.03ms | 0.03ms | +0.0022ms | +8.12% |
| mean | 0.02ms | 0.02ms | +0.000015ms | +0.07% |
| min | 0.02ms | 0.02ms | +0.00046ms | +2.69% |
| max | 0.03ms | 0.03ms | +0.0030ms | +11.01% |
| total | 0.40ms | 0.40ms | +0.00029ms | +0.07% |

