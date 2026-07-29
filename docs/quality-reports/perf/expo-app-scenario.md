# Perf Suite — expo-app-scenario

Threshold source: [docs/quality/perf-thresholds.md](../../quality/perf-thresholds)

測定系の分解能 = 0.00025ms (何もしない関数を同じ経路で呼んだ時の p10)。 回帰判定の絶対下限は既定でこの 2 倍 = 0.00050ms、 op ごとの実効値は下表の「下限」 列。

## Serial (concurrency = 1)

| op | p10 (回帰判定) | p95 (上限判定) | cap | 下限 | gate | regression |
|---|---|---|---|---|---|---|
| onboarding_workflow (router + secureStore + notification x10 cycle) | 0.01ms | 0.02ms | 100ms | 0.00050ms | PASS | stable — gate 無効 (regressionGate=false) |
| file_capture_batch (camera picture + fileSystem write x5) | 0.0043ms | 0.0088ms | 100ms | 0.00050ms | PASS | stable — gate 無効 (regressionGate=false) |
| permission_error_handling (5 denied camera + secureStore fail) | 0.02ms | 0.03ms | 100ms | 0.00050ms | PASS | stable — gate 無効 (regressionGate=false) |

## Concurrent p95 (concurrency = 4, 5 iter each)

| op | p95 | cap | gate |
|---|---|---|---|
| onboarding_workflow (router + secureStore + notification x10 cycle) | 0.10ms | 200ms | PASS |
| file_capture_batch (camera picture + fileSystem write x5) | 0.02ms | 200ms | PASS |
| permission_error_handling (5 denied camera + secureStore fail) | 0.08ms | 200ms | PASS |

## Memory retention (20 iter, arrayBuffers axis is the gate; heap is informational)

| op | heapUsed Δ | arrayBuffers Δ | cap | gc exposed | verdict |
|---|---|---|---|---|---|
| onboarding_workflow (router + secureStore + notification x10 cycle) | 28600 B | 0 B | 102400 B | yes | PASS |
| file_capture_batch (camera picture + fileSystem write x5) | 880 B | 0 B | 102400 B | yes | PASS |
| permission_error_handling (5 denied camera + secureStore fail) | 3600 B | 0 B | 102400 B | yes | PASS |

## Detailed serial reports

### onboarding_workflow (router + secureStore + notification x10 cycle)

# Perf Report — onboarding_workflow (router + secureStore + notification x10 cycle).serial

| metric | value |
|---|---|
| iterations | 20 |
| warmup | 3 |
| p10 | 0.01ms |
| p50 | 0.01ms |
| p95 | 0.02ms |
| p99 | 0.02ms |
| mean | 0.01ms |
| stdev | 0.0027ms |
| min | 0.0091ms |
| max | 0.02ms |
| total | 0.29ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.01ms | 0.0096ms | +0.00091ms | +9.48% |
| p50 | 0.01ms | 0.01ms | +0.0046ms | +44.38% |
| p95 | 0.02ms | 0.02ms | -0.00037ms | -2.05% |
| p99 | 0.02ms | 0.02ms | +0.00029ms | +1.45% |
| mean | 0.01ms | 0.01ms | +0.0019ms | +15.09% |
| min | 0.0091ms | 0.0095ms | -0.00046ms | -4.81% |
| max | 0.02ms | 0.02ms | +0.00046ms | +2.22% |
| total | 0.29ms | 0.25ms | +0.04ms | +15.09% |

### file_capture_batch (camera picture + fileSystem write x5)

# Perf Report — file_capture_batch (camera picture + fileSystem write x5).serial

| metric | value |
|---|---|
| iterations | 20 |
| warmup | 3 |
| p10 | 0.0043ms |
| p50 | 0.0044ms |
| p95 | 0.0088ms |
| p99 | 0.01ms |
| mean | 0.0054ms |
| stdev | 0.0020ms |
| min | 0.0043ms |
| max | 0.01ms |
| total | 0.11ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.0043ms | 0.0047ms | -0.00042ms | -8.94% |
| p50 | 0.0044ms | 0.0049ms | -0.00048ms | -9.84% |
| p95 | 0.0088ms | 0.0077ms | +0.0011ms | +14.24% |
| p99 | 0.01ms | 0.01ms | +0.0013ms | +12.93% |
| mean | 0.0054ms | 0.0054ms | -0.0000062ms | -0.12% |
| min | 0.0043ms | 0.0047ms | -0.00042ms | -8.94% |
| max | 0.01ms | 0.01ms | +0.0014ms | +12.69% |
| total | 0.11ms | 0.11ms | -0.00012ms | -0.12% |

### permission_error_handling (5 denied camera + secureStore fail)

# Perf Report — permission_error_handling (5 denied camera + secureStore fail).serial

| metric | value |
|---|---|
| iterations | 20 |
| warmup | 3 |
| p10 | 0.02ms |
| p50 | 0.02ms |
| p95 | 0.03ms |
| p99 | 0.04ms |
| mean | 0.02ms |
| stdev | 0.0064ms |
| min | 0.02ms |
| max | 0.05ms |
| total | 0.42ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.02ms | 0.02ms | +0.00025ms | +1.41% |
| p50 | 0.02ms | 0.02ms | +0.00015ms | +0.79% |
| p95 | 0.03ms | 0.03ms | +0.00059ms | +2.20% |
| p99 | 0.04ms | 0.03ms | +0.02ms | +56.42% |
| mean | 0.02ms | 0.02ms | +0.0011ms | +5.31% |
| min | 0.02ms | 0.02ms | +0.00079ms | +4.65% |
| max | 0.05ms | 0.03ms | +0.02ms | +69.88% |
| total | 0.42ms | 0.40ms | +0.02ms | +5.31% |

