# Perf Suite — trpc-app-scenario

Threshold source: [docs/quality/perf-thresholds.md](../../quality/perf-thresholds)

測定系の分解能 = 0.00025ms (何もしない関数を同じ経路で呼んだ時の p10)。 回帰判定の絶対下限は既定でこの 2 倍 = 0.00050ms、 op ごとの実効値は下表の「下限」 列。

## Serial (concurrency = 1)

| op | p10 (回帰判定) | p95 (上限判定) | cap | 下限 | gate | regression |
|---|---|---|---|---|---|---|
| router_dispatch_workflow (10 query mix via client) | 0.0059ms | 0.09ms | 100ms | 0.00050ms | PASS | regressed — gate 無効 (regressionGate=false) |
| mutation_batch (5 authenticated mutation) | 0.0042ms | 0.0056ms | 100ms | 0.00050ms | PASS | regressed — gate 無効 (regressionGate=false) |
| middleware_error_handling (5 UNAUTHORIZED + FORBIDDEN throw+catch) | 0.02ms | 0.03ms | 100ms | 0.00050ms | PASS | stable — gate 無効 (regressionGate=false) |
| retry_recovery (5 flaky handler retry to success) | 0.02ms | 0.03ms | 100ms | 0.00050ms | PASS | stable — gate 無効 (regressionGate=false) |
| concurrent_batch (5 batchInvoke of 4 procedures each) | 0.0090ms | 0.02ms | 100ms | 0.00050ms | PASS | stable — gate 無効 (regressionGate=false) |

## Concurrent p95 (concurrency = 4, 5 iter each)

| op | p95 | cap | gate |
|---|---|---|---|
| router_dispatch_workflow (10 query mix via client) | 0.04ms | 200ms | PASS |
| mutation_batch (5 authenticated mutation) | 0.02ms | 200ms | PASS |
| middleware_error_handling (5 UNAUTHORIZED + FORBIDDEN throw+catch) | 0.09ms | 200ms | PASS |
| retry_recovery (5 flaky handler retry to success) | 0.08ms | 200ms | PASS |
| concurrent_batch (5 batchInvoke of 4 procedures each) | 0.04ms | 200ms | PASS |

## Memory retention (20 iter, arrayBuffers axis is the gate; heap is informational)

| op | heapUsed Δ | arrayBuffers Δ | cap | gc exposed | verdict |
|---|---|---|---|---|---|
| router_dispatch_workflow (10 query mix via client) | 12912 B | -15246 B | 102400 B | yes | PASS |
| mutation_batch (5 authenticated mutation) | -328 B | 0 B | 102400 B | yes | PASS |
| middleware_error_handling (5 UNAUTHORIZED + FORBIDDEN throw+catch) | -792 B | 0 B | 102400 B | yes | PASS |
| retry_recovery (5 flaky handler retry to success) | 12568 B | 0 B | 102400 B | yes | PASS |
| concurrent_batch (5 batchInvoke of 4 procedures each) | 2856 B | 0 B | 102400 B | yes | PASS |

## Detailed serial reports

### router_dispatch_workflow (10 query mix via client)

# Perf Report — router_dispatch_workflow (10 query mix via client).serial

| metric | value |
|---|---|
| iterations | 20 |
| warmup | 3 |
| p10 | 0.0059ms |
| p50 | 0.0061ms |
| p95 | 0.09ms |
| p99 | 0.19ms |
| mean | 0.02ms |
| stdev | 0.05ms |
| min | 0.0059ms |
| max | 0.21ms |
| total | 0.41ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.0059ms | 0.0040ms | +0.0019ms | +47.95% |
| p50 | 0.0061ms | 0.0055ms | +0.00063ms | +11.46% |
| p95 | 0.09ms | 0.0088ms | +0.08ms | +872.64% |
| p99 | 0.19ms | 0.0098ms | +0.18ms | +1813.83% |
| mean | 0.02ms | 0.0055ms | +0.02ms | +274.06% |
| min | 0.0059ms | 0.0040ms | +0.0019ms | +48.43% |
| max | 0.21ms | 0.01ms | +0.20ms | +2018.67% |
| total | 0.41ms | 0.11ms | +0.30ms | +274.06% |

### mutation_batch (5 authenticated mutation)

# Perf Report — mutation_batch (5 authenticated mutation).serial

| metric | value |
|---|---|
| iterations | 20 |
| warmup | 3 |
| p10 | 0.0042ms |
| p50 | 0.0044ms |
| p95 | 0.0056ms |
| p99 | 0.01ms |
| mean | 0.0048ms |
| stdev | 0.0016ms |
| min | 0.0034ms |
| max | 0.01ms |
| total | 0.10ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.0042ms | 0.0028ms | +0.0014ms | +49.37% |
| p50 | 0.0044ms | 0.0029ms | +0.0016ms | +55.46% |
| p95 | 0.0056ms | 0.0035ms | +0.0020ms | +58.29% |
| p99 | 0.01ms | 0.0036ms | +0.0065ms | +180.74% |
| mean | 0.0048ms | 0.0029ms | +0.0018ms | +62.72% |
| min | 0.0034ms | 0.0027ms | +0.00071ms | +26.14% |
| max | 0.01ms | 0.0036ms | +0.0076ms | +210.34% |
| total | 0.10ms | 0.06ms | +0.04ms | +62.72% |

### middleware_error_handling (5 UNAUTHORIZED + FORBIDDEN throw+catch)

# Perf Report — middleware_error_handling (5 UNAUTHORIZED + FORBIDDEN throw+catch).serial

| metric | value |
|---|---|
| iterations | 20 |
| warmup | 3 |
| p10 | 0.02ms |
| p50 | 0.02ms |
| p95 | 0.03ms |
| p99 | 0.03ms |
| mean | 0.02ms |
| stdev | 0.0024ms |
| min | 0.02ms |
| max | 0.03ms |
| total | 0.43ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.02ms | 0.02ms | +0.0030ms | +19.03% |
| p50 | 0.02ms | 0.02ms | +0.0035ms | +19.54% |
| p95 | 0.03ms | 0.02ms | +0.0037ms | +17.10% |
| p99 | 0.03ms | 0.02ms | +0.0036ms | +16.35% |
| mean | 0.02ms | 0.02ms | +0.0032ms | +17.76% |
| min | 0.02ms | 0.02ms | +0.0030ms | +19.67% |
| max | 0.03ms | 0.02ms | +0.0036ms | +16.18% |
| total | 0.43ms | 0.36ms | +0.06ms | +17.76% |

### retry_recovery (5 flaky handler retry to success)

# Perf Report — retry_recovery (5 flaky handler retry to success).serial

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
| total | 0.39ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.02ms | 0.01ms | +0.0013ms | +8.95% |
| p50 | 0.02ms | 0.02ms | +0.0024ms | +14.95% |
| p95 | 0.03ms | 0.02ms | +0.0012ms | +5.08% |
| p99 | 0.03ms | 0.02ms | +0.0029ms | +11.73% |
| mean | 0.02ms | 0.02ms | +0.0022ms | +12.57% |
| min | 0.02ms | 0.01ms | +0.0018ms | +12.50% |
| max | 0.03ms | 0.02ms | +0.0033ms | +13.35% |
| total | 0.39ms | 0.34ms | +0.04ms | +12.57% |

### concurrent_batch (5 batchInvoke of 4 procedures each)

# Perf Report — concurrent_batch (5 batchInvoke of 4 procedures each).serial

| metric | value |
|---|---|
| iterations | 20 |
| warmup | 3 |
| p10 | 0.0090ms |
| p50 | 0.0093ms |
| p95 | 0.02ms |
| p99 | 0.03ms |
| mean | 0.01ms |
| stdev | 0.0044ms |
| min | 0.0089ms |
| max | 0.03ms |
| total | 0.22ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.0090ms | 0.0084ms | +0.00063ms | +7.52% |
| p50 | 0.0093ms | 0.0093ms | +0.000063ms | +0.68% |
| p95 | 0.02ms | 0.02ms | -0.0013ms | -6.58% |
| p99 | 0.03ms | 0.02ms | +0.0060ms | +30.34% |
| mean | 0.01ms | 0.01ms | -0.000012ms | -0.11% |
| min | 0.0089ms | 0.0083ms | +0.00067ms | +8.08% |
| max | 0.03ms | 0.02ms | +0.0078ms | +39.36% |
| total | 0.22ms | 0.22ms | -0.00025ms | -0.11% |

