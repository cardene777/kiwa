# Perf Suite — expo-app-scenario

Threshold source: [docs/quality/perf-thresholds.md](../../quality/perf-thresholds)

測定系の分解能 = 0.00021ms (何もしない関数を同じ経路で呼んだ時の p10)。 回帰判定の絶対下限は既定でこの 2 倍 = 0.00042ms、 op ごとの実効値は下表の「下限」 列。

## Serial (concurrency = 1)

| op | p10 (回帰判定) | p95 (上限判定) | cap | 下限 | gate | regression |
|---|---|---|---|---|---|---|
| onboarding_workflow (router + secureStore + notification x10 cycle) | 0.0094ms | 0.02ms | 100ms | 0.00042ms | PASS | stable — gate 無効 (regressionGate=false) |
| file_capture_batch (camera picture + fileSystem write x5) | 0.0044ms | 0.0088ms | 100ms | 0.00042ms | PASS | stable — gate 無効 (regressionGate=false) |
| permission_error_handling (5 denied camera + secureStore fail) | 0.02ms | 0.02ms | 100ms | 0.00042ms | PASS | stable — gate 無効 (regressionGate=false) |

## Concurrent p95 (concurrency = 4, 5 iter each)

| op | p95 | cap | gate |
|---|---|---|---|
| onboarding_workflow (router + secureStore + notification x10 cycle) | 0.08ms | 200ms | PASS |
| file_capture_batch (camera picture + fileSystem write x5) | 0.02ms | 200ms | PASS |
| permission_error_handling (5 denied camera + secureStore fail) | 0.27ms | 200ms | PASS |

## Memory retention (20 iter, arrayBuffers axis is the gate; heap is informational)

| op | heapUsed Δ | arrayBuffers Δ | cap | gc exposed | verdict |
|---|---|---|---|---|---|
| onboarding_workflow (router + secureStore + notification x10 cycle) | 10336 B | 0 B | 102400 B | yes | PASS |
| file_capture_batch (camera picture + fileSystem write x5) | 880 B | 0 B | 102400 B | yes | PASS |
| permission_error_handling (5 denied camera + secureStore fail) | 3680 B | 0 B | 102400 B | yes | PASS |

## Detailed serial reports

### onboarding_workflow (router + secureStore + notification x10 cycle)

# Perf Report — onboarding_workflow (router + secureStore + notification x10 cycle).serial

| metric | value |
|---|---|
| iterations | 20 |
| warmup | 3 |
| p10 | 0.0094ms |
| p50 | 0.01ms |
| p95 | 0.02ms |
| p99 | 0.02ms |
| mean | 0.01ms |
| stdev | 0.0035ms |
| min | 0.0092ms |
| max | 0.02ms |
| total | 0.26ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.0094ms | 0.0096ms | -0.00025ms | -2.60% |
| p50 | 0.01ms | 0.01ms | +0.0021ms | +20.48% |
| p95 | 0.02ms | 0.02ms | -0.00086ms | -4.75% |
| p99 | 0.02ms | 0.02ms | +0.0019ms | +9.24% |
| mean | 0.01ms | 0.01ms | +0.00032ms | +2.56% |
| min | 0.0092ms | 0.0095ms | -0.00029ms | -3.06% |
| max | 0.02ms | 0.02ms | +0.0025ms | +12.32% |
| total | 0.26ms | 0.25ms | +0.0064ms | +2.56% |

### file_capture_batch (camera picture + fileSystem write x5)

# Perf Report — file_capture_batch (camera picture + fileSystem write x5).serial

| metric | value |
|---|---|
| iterations | 20 |
| warmup | 3 |
| p10 | 0.0044ms |
| p50 | 0.0051ms |
| p95 | 0.0088ms |
| p99 | 0.01ms |
| mean | 0.0058ms |
| stdev | 0.0017ms |
| min | 0.0039ms |
| max | 0.01ms |
| total | 0.12ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.0044ms | 0.0047ms | -0.00032ms | -6.73% |
| p50 | 0.0051ms | 0.0049ms | +0.00027ms | +5.56% |
| p95 | 0.0088ms | 0.0077ms | +0.0011ms | +13.88% |
| p99 | 0.01ms | 0.01ms | +0.00025ms | +2.43% |
| mean | 0.0058ms | 0.0054ms | +0.00042ms | +7.78% |
| min | 0.0039ms | 0.0047ms | -0.00075ms | -16.07% |
| max | 0.01ms | 0.01ms | +0.000042ms | +0.39% |
| total | 0.12ms | 0.11ms | +0.0083ms | +7.78% |

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
| total | 0.39ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.02ms | 0.02ms | -0.00014ms | -0.78% |
| p50 | 0.02ms | 0.02ms | -0.00063ms | -3.37% |
| p95 | 0.02ms | 0.03ms | -0.0024ms | -8.84% |
| p99 | 0.03ms | 0.03ms | +0.00052ms | +1.92% |
| mean | 0.02ms | 0.02ms | -0.00036ms | -1.79% |
| min | 0.02ms | 0.02ms | +0.00038ms | +2.21% |
| max | 0.03ms | 0.03ms | +0.0013ms | +4.59% |
| total | 0.39ms | 0.40ms | -0.0072ms | -1.79% |

