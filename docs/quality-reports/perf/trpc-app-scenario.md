# Perf Suite — trpc-app-scenario

Threshold source: [docs/quality/perf-thresholds.md](../../quality/perf-thresholds)

測定系の分解能 = 0.00025ms (何もしない関数を同じ経路で呼んだ時の p10)。 回帰判定の絶対下限は既定でこの 2 倍 = 0.00050ms、 op ごとの実効値は下表の「下限」 列。

## Serial (concurrency = 1)

| op | p10 (回帰判定) | p95 (上限判定) | cap | 下限 | gate | regression |
|---|---|---|---|---|---|---|
| router_dispatch_workflow (10 query mix via client) | 0.0042ms | 0.0077ms | 100ms | 0.00050ms | PASS | stable — gate 無効 (regressionGate=false) |
| mutation_batch (5 authenticated mutation) | 0.0034ms | 0.0058ms | 100ms | 0.00050ms | PASS | stable (p10 +22% (閾値未満)、 p95 +64% (裾は実行間の振れ幅と区別できないため判定には使わない)) — gate 無効 (regressionGate=false) |
| middleware_error_handling (5 UNAUTHORIZED + FORBIDDEN throw+catch) | 0.02ms | 0.02ms | 100ms | 0.00050ms | PASS | stable — gate 無効 (regressionGate=false) |
| retry_recovery (5 flaky handler retry to success) | 0.02ms | 0.03ms | 100ms | 0.00050ms | PASS | stable — gate 無効 (regressionGate=false) |
| concurrent_batch (5 batchInvoke of 4 procedures each) | 0.0081ms | 0.02ms | 100ms | 0.00050ms | PASS | stable — gate 無効 (regressionGate=false) |

## Concurrent p95 (concurrency = 4, 5 iter each)

| op | p95 | cap | gate |
|---|---|---|---|
| router_dispatch_workflow (10 query mix via client) | 0.03ms | 200ms | PASS |
| mutation_batch (5 authenticated mutation) | 0.02ms | 200ms | PASS |
| middleware_error_handling (5 UNAUTHORIZED + FORBIDDEN throw+catch) | 0.08ms | 200ms | PASS |
| retry_recovery (5 flaky handler retry to success) | 0.10ms | 200ms | PASS |
| concurrent_batch (5 batchInvoke of 4 procedures each) | 0.04ms | 200ms | PASS |

## Memory retention (20 iter, arrayBuffers axis is the gate; heap is informational)

| op | heapUsed Δ | arrayBuffers Δ | cap | gc exposed | verdict |
|---|---|---|---|---|---|
| router_dispatch_workflow (10 query mix via client) | 91320 B | 0 B | 102400 B | yes | PASS |
| mutation_batch (5 authenticated mutation) | -328 B | 0 B | 102400 B | yes | PASS |
| middleware_error_handling (5 UNAUTHORIZED + FORBIDDEN throw+catch) | 328 B | 0 B | 102400 B | yes | PASS |
| retry_recovery (5 flaky handler retry to success) | 808 B | 0 B | 102400 B | yes | PASS |
| concurrent_batch (5 batchInvoke of 4 procedures each) | 8 B | 0 B | 102400 B | yes | PASS |

## Detailed serial reports

### router_dispatch_workflow (10 query mix via client)

# Perf Report — router_dispatch_workflow (10 query mix via client).serial

| metric | value |
|---|---|
| iterations | 20 |
| warmup | 3 |
| p10 | 0.0042ms |
| p50 | 0.0054ms |
| p95 | 0.0077ms |
| p99 | 0.01ms |
| mean | 0.0058ms |
| stdev | 0.0019ms |
| min | 0.0042ms |
| max | 0.01ms |
| total | 0.12ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.0042ms | 0.0040ms | +0.00025ms | +6.26% |
| p50 | 0.0054ms | 0.0055ms | -0.000021ms | -0.38% |
| p95 | 0.0077ms | 0.0088ms | -0.0011ms | -12.25% |
| p99 | 0.01ms | 0.0098ms | +0.0022ms | +22.59% |
| mean | 0.0058ms | 0.0055ms | +0.00026ms | +4.74% |
| min | 0.0042ms | 0.0040ms | +0.00025ms | +6.32% |
| max | 0.01ms | 0.01ms | +0.0030ms | +30.17% |
| total | 0.12ms | 0.11ms | +0.0052ms | +4.74% |

### mutation_batch (5 authenticated mutation)

# Perf Report — mutation_batch (5 authenticated mutation).serial

| metric | value |
|---|---|
| iterations | 20 |
| warmup | 3 |
| p10 | 0.0034ms |
| p50 | 0.0037ms |
| p95 | 0.0058ms |
| p99 | 0.02ms |
| mean | 0.0046ms |
| stdev | 0.0039ms |
| min | 0.0027ms |
| max | 0.02ms |
| total | 0.09ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.0034ms | 0.0028ms | +0.00061ms | +22.02% |
| p50 | 0.0037ms | 0.0029ms | +0.00090ms | +31.37% |
| p95 | 0.0058ms | 0.0035ms | +0.0022ms | +64.13% |
| p99 | 0.02ms | 0.0036ms | +0.01ms | +395.69% |
| mean | 0.0046ms | 0.0029ms | +0.0017ms | +58.25% |
| min | 0.0027ms | 0.0027ms | -0.000041ms | -1.51% |
| max | 0.02ms | 0.0036ms | +0.02ms | +475.86% |
| total | 0.09ms | 0.06ms | +0.03ms | +58.25% |

### middleware_error_handling (5 UNAUTHORIZED + FORBIDDEN throw+catch)

# Perf Report — middleware_error_handling (5 UNAUTHORIZED + FORBIDDEN throw+catch).serial

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
| total | 0.37ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.02ms | 0.02ms | -0.000028ms | -0.18% |
| p50 | 0.02ms | 0.02ms | -0.00010ms | -0.58% |
| p95 | 0.02ms | 0.02ms | +0.0022ms | +10.20% |
| p99 | 0.03ms | 0.02ms | +0.0037ms | +16.82% |
| mean | 0.02ms | 0.02ms | +0.00021ms | +1.13% |
| min | 0.02ms | 0.02ms | +0.00025ms | +1.61% |
| max | 0.03ms | 0.02ms | +0.0041ms | +18.40% |
| total | 0.37ms | 0.36ms | +0.0041ms | +1.13% |

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
| stdev | 0.0033ms |
| min | 0.02ms |
| max | 0.03ms |
| total | 0.37ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.02ms | 0.01ms | +0.0011ms | +7.03% |
| p50 | 0.02ms | 0.02ms | +0.00069ms | +4.25% |
| p95 | 0.03ms | 0.02ms | +0.00082ms | +3.37% |
| p99 | 0.03ms | 0.02ms | +0.0013ms | +5.09% |
| mean | 0.02ms | 0.02ms | +0.0013ms | +7.71% |
| min | 0.02ms | 0.01ms | +0.0016ms | +11.34% |
| max | 0.03ms | 0.02ms | +0.0014ms | +5.51% |
| total | 0.37ms | 0.34ms | +0.03ms | +7.71% |

### concurrent_batch (5 batchInvoke of 4 procedures each)

# Perf Report — concurrent_batch (5 batchInvoke of 4 procedures each).serial

| metric | value |
|---|---|
| iterations | 20 |
| warmup | 3 |
| p10 | 0.0081ms |
| p50 | 0.0085ms |
| p95 | 0.02ms |
| p99 | 0.02ms |
| mean | 0.0099ms |
| stdev | 0.0034ms |
| min | 0.0081ms |
| max | 0.02ms |
| total | 0.20ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.0081ms | 0.0084ms | -0.00025ms | -2.94% |
| p50 | 0.0085ms | 0.0093ms | -0.00073ms | -7.86% |
| p95 | 0.02ms | 0.02ms | -0.00041ms | -2.09% |
| p99 | 0.02ms | 0.02ms | -0.00021ms | -1.09% |
| mean | 0.0099ms | 0.01ms | -0.00087ms | -8.09% |
| min | 0.0081ms | 0.0083ms | -0.00013ms | -1.52% |
| max | 0.02ms | 0.02ms | -0.00017ms | -0.84% |
| total | 0.20ms | 0.22ms | -0.02ms | -8.09% |

