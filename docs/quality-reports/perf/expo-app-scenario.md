# Perf Suite — expo-app-scenario

Threshold source: [docs/quality/perf-thresholds.md](../../quality/perf-thresholds)

測定系の分解能 = 0.00021ms (何もしない関数を同じ経路で呼んだ時の p10)。 回帰判定の絶対下限は既定でこの 2 倍 = 0.00042ms、 op ごとの実効値は下表の「下限」 列。

## Serial (concurrency = 1)

| op | p10 (回帰判定) | p95 (上限判定) | cap | 下限 | gate | regression |
|---|---|---|---|---|---|---|
| onboarding_workflow (router + secureStore + notification x10 cycle) | 0.0089ms | 0.02ms | 100ms | 0.00042ms | PASS | stable — gate 無効 (regressionGate=false) |
| file_capture_batch (camera picture + fileSystem write x5) | 0.0037ms | 0.0079ms | 100ms | 0.00042ms | PASS | improved — gate 無効 (regressionGate=false) |
| permission_error_handling (5 denied camera + secureStore fail) | 0.02ms | 0.03ms | 100ms | 0.00042ms | PASS | stable — gate 無効 (regressionGate=false) |

## Concurrent p95 (concurrency = 4, 5 iter each)

| op | p95 | cap | gate |
|---|---|---|---|
| onboarding_workflow (router + secureStore + notification x10 cycle) | 0.06ms | 200ms | PASS |
| file_capture_batch (camera picture + fileSystem write x5) | 0.02ms | 200ms | PASS |
| permission_error_handling (5 denied camera + secureStore fail) | 0.09ms | 200ms | PASS |

## Memory retention (20 iter, arrayBuffers axis is the gate; heap is informational)

| op | heapUsed Δ | arrayBuffers Δ | cap | gc exposed | verdict |
|---|---|---|---|---|---|
| onboarding_workflow (router + secureStore + notification x10 cycle) | 292880 B | 0 B | 102400 B | yes | PASS |
| file_capture_batch (camera picture + fileSystem write x5) | -104 B | 0 B | 102400 B | yes | PASS |
| permission_error_handling (5 denied camera + secureStore fail) | 3600 B | 0 B | 102400 B | yes | PASS |

## Detailed serial reports

### onboarding_workflow (router + secureStore + notification x10 cycle)

# Perf Report — onboarding_workflow (router + secureStore + notification x10 cycle).serial

| metric | value |
|---|---|
| iterations | 20 |
| warmup | 3 |
| p10 | 0.0089ms |
| p50 | 0.01ms |
| p95 | 0.02ms |
| p99 | 0.02ms |
| mean | 0.01ms |
| stdev | 0.0041ms |
| min | 0.0089ms |
| max | 0.03ms |
| total | 0.26ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.0089ms | 0.0096ms | -0.00067ms | -6.98% |
| p50 | 0.01ms | 0.01ms | +0.0020ms | +18.88% |
| p95 | 0.02ms | 0.02ms | -0.00016ms | -0.88% |
| p99 | 0.02ms | 0.02ms | +0.0037ms | +18.55% |
| mean | 0.01ms | 0.01ms | +0.00038ms | +3.04% |
| min | 0.0089ms | 0.0095ms | -0.00067ms | -6.99% |
| max | 0.03ms | 0.02ms | +0.0047ms | +22.83% |
| total | 0.26ms | 0.25ms | +0.0076ms | +3.04% |

### file_capture_batch (camera picture + fileSystem write x5)

# Perf Report — file_capture_batch (camera picture + fileSystem write x5).serial

| metric | value |
|---|---|
| iterations | 20 |
| warmup | 3 |
| p10 | 0.0037ms |
| p50 | 0.0046ms |
| p95 | 0.0079ms |
| p99 | 0.0094ms |
| mean | 0.0050ms |
| stdev | 0.0014ms |
| min | 0.0037ms |
| max | 0.0098ms |
| total | 0.10ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.0037ms | 0.0047ms | -0.00096ms | -20.36% |
| p50 | 0.0046ms | 0.0049ms | -0.00027ms | -5.56% |
| p95 | 0.0079ms | 0.0077ms | +0.00015ms | +1.92% |
| p99 | 0.0094ms | 0.01ms | -0.00077ms | -7.54% |
| mean | 0.0050ms | 0.0054ms | -0.00038ms | -7.04% |
| min | 0.0037ms | 0.0047ms | -0.00096ms | -20.55% |
| max | 0.0098ms | 0.01ms | -0.0010ms | -9.22% |
| total | 0.10ms | 0.11ms | -0.0075ms | -7.04% |

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
| stdev | 0.0032ms |
| min | 0.02ms |
| max | 0.03ms |
| total | 0.39ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.02ms | 0.02ms | -0.00016ms | -0.91% |
| p50 | 0.02ms | 0.02ms | -0.00033ms | -1.80% |
| p95 | 0.03ms | 0.03ms | -0.0015ms | -5.59% |
| p99 | 0.03ms | 0.03ms | +0.0015ms | +5.38% |
| mean | 0.02ms | 0.02ms | -0.00031ms | -1.57% |
| min | 0.02ms | 0.02ms | +0.00050ms | +2.93% |
| max | 0.03ms | 0.03ms | +0.0022ms | +8.10% |
| total | 0.39ms | 0.40ms | -0.0063ms | -1.57% |

