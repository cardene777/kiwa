# Perf Suite — trpc-app-scenario

Threshold source: [docs/quality/perf-thresholds.md](../../quality/perf-thresholds)

測定系の分解能 = 0.00025ms (何もしない関数を同じ経路で呼んだ時の p10)。 回帰判定の絶対下限は既定でこの 2 倍 = 0.00050ms、 op ごとの実効値は下表の「下限」 列。

## Serial (concurrency = 1)

| op | p10 (回帰判定) | p95 (上限判定) | cap | 下限 | gate | regression |
|---|---|---|---|---|---|---|
| router_dispatch_workflow (10 query mix via client) | 0.0040ms | 0.0093ms | 100ms | 0.00050ms | PASS | stable — gate 無効 (regressionGate=false) |
| mutation_batch (5 authenticated mutation) | 0.0025ms | 0.0032ms | 100ms | 0.00050ms | PASS | stable — gate 無効 (regressionGate=false) |
| middleware_error_handling (5 UNAUTHORIZED + FORBIDDEN throw+catch) | 0.02ms | 0.02ms | 100ms | 0.00050ms | PASS | stable — gate 無効 (regressionGate=false) |
| retry_recovery (5 flaky handler retry to success) | 0.02ms | 0.02ms | 100ms | 0.00050ms | PASS | stable — gate 無効 (regressionGate=false) |
| concurrent_batch (5 batchInvoke of 4 procedures each) | 0.0075ms | 0.02ms | 100ms | 0.00050ms | PASS | stable — gate 無効 (regressionGate=false) |

## Concurrent p95 (concurrency = 4, 5 iter each)

| op | p95 | cap | gate |
|---|---|---|---|
| router_dispatch_workflow (10 query mix via client) | 0.03ms | 200ms | PASS |
| mutation_batch (5 authenticated mutation) | 0.01ms | 200ms | PASS |
| middleware_error_handling (5 UNAUTHORIZED + FORBIDDEN throw+catch) | 0.07ms | 200ms | PASS |
| retry_recovery (5 flaky handler retry to success) | 0.06ms | 200ms | PASS |
| concurrent_batch (5 batchInvoke of 4 procedures each) | 0.04ms | 200ms | PASS |

## Memory retention (20 iter, arrayBuffers axis is the gate; heap is informational)

| op | heapUsed Δ | arrayBuffers Δ | cap | gc exposed | verdict |
|---|---|---|---|---|---|
| router_dispatch_workflow (10 query mix via client) | 4328 B | 0 B | 102400 B | yes | PASS |
| mutation_batch (5 authenticated mutation) | 136 B | 0 B | 102400 B | yes | PASS |
| middleware_error_handling (5 UNAUTHORIZED + FORBIDDEN throw+catch) | 248 B | 0 B | 102400 B | yes | PASS |
| retry_recovery (5 flaky handler retry to success) | 1784 B | 0 B | 102400 B | yes | PASS |
| concurrent_batch (5 batchInvoke of 4 procedures each) | -928 B | 0 B | 102400 B | yes | PASS |

## Detailed serial reports

### router_dispatch_workflow (10 query mix via client)

# Perf Report — router_dispatch_workflow (10 query mix via client).serial

| metric | value |
|---|---|
| iterations | 20 |
| warmup | 3 |
| p10 | 0.0040ms |
| p50 | 0.0055ms |
| p95 | 0.0093ms |
| p99 | 0.01ms |
| mean | 0.0056ms |
| stdev | 0.0017ms |
| min | 0.0040ms |
| max | 0.01ms |
| total | 0.11ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.0040ms | 0.0040ms | +0.000041ms | +1.03% |
| p50 | 0.0055ms | 0.0055ms | +0.000042ms | +0.77% |
| p95 | 0.0093ms | 0.0088ms | +0.00055ms | +6.21% |
| p99 | 0.01ms | 0.0098ms | +0.00061ms | +6.20% |
| mean | 0.0056ms | 0.0055ms | +0.000087ms | +1.58% |
| min | 0.0040ms | 0.0040ms | +0.000042ms | +1.06% |
| max | 0.01ms | 0.01ms | +0.00063ms | +6.20% |
| total | 0.11ms | 0.11ms | +0.0018ms | +1.58% |

### mutation_batch (5 authenticated mutation)

# Perf Report — mutation_batch (5 authenticated mutation).serial

| metric | value |
|---|---|
| iterations | 20 |
| warmup | 3 |
| p10 | 0.0025ms |
| p50 | 0.0027ms |
| p95 | 0.0032ms |
| p99 | 0.0047ms |
| mean | 0.0028ms |
| stdev | 0.00056ms |
| min | 0.0025ms |
| max | 0.0051ms |
| total | 0.06ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.0025ms | 0.0028ms | -0.00029ms | -10.45% |
| p50 | 0.0027ms | 0.0029ms | -0.00017ms | -5.87% |
| p95 | 0.0032ms | 0.0035ms | -0.00032ms | -9.19% |
| p99 | 0.0047ms | 0.0036ms | +0.0011ms | +30.62% |
| mean | 0.0028ms | 0.0029ms | -0.00012ms | -3.99% |
| min | 0.0025ms | 0.0027ms | -0.00025ms | -9.23% |
| max | 0.0051ms | 0.0036ms | +0.0015ms | +40.25% |
| total | 0.06ms | 0.06ms | -0.0023ms | -3.99% |

### middleware_error_handling (5 UNAUTHORIZED + FORBIDDEN throw+catch)

# Perf Report — middleware_error_handling (5 UNAUTHORIZED + FORBIDDEN throw+catch).serial

| metric | value |
|---|---|
| iterations | 20 |
| warmup | 3 |
| p10 | 0.02ms |
| p50 | 0.02ms |
| p95 | 0.02ms |
| p99 | 0.02ms |
| mean | 0.02ms |
| stdev | 0.0029ms |
| min | 0.02ms |
| max | 0.03ms |
| total | 0.36ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.02ms | 0.02ms | -0.00023ms | -1.45% |
| p50 | 0.02ms | 0.02ms | -0.0012ms | -6.86% |
| p95 | 0.02ms | 0.02ms | +0.0016ms | +7.66% |
| p99 | 0.02ms | 0.02ms | +0.0025ms | +11.38% |
| mean | 0.02ms | 0.02ms | -0.00020ms | -1.08% |
| min | 0.02ms | 0.02ms | +0.000041ms | +0.27% |
| max | 0.03ms | 0.02ms | +0.0028ms | +12.27% |
| total | 0.36ms | 0.36ms | -0.0039ms | -1.08% |

### retry_recovery (5 flaky handler retry to success)

# Perf Report — retry_recovery (5 flaky handler retry to success).serial

| metric | value |
|---|---|
| iterations | 20 |
| warmup | 3 |
| p10 | 0.02ms |
| p50 | 0.02ms |
| p95 | 0.02ms |
| p99 | 0.02ms |
| mean | 0.02ms |
| stdev | 0.0026ms |
| min | 0.02ms |
| max | 0.02ms |
| total | 0.36ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.02ms | 0.01ms | +0.00084ms | +5.58% |
| p50 | 0.02ms | 0.02ms | +0.00090ms | +5.54% |
| p95 | 0.02ms | 0.02ms | -0.00082ms | -3.36% |
| p99 | 0.02ms | 0.02ms | -0.00056ms | -2.27% |
| mean | 0.02ms | 0.02ms | +0.00082ms | +4.77% |
| min | 0.02ms | 0.01ms | +0.0014ms | +9.59% |
| max | 0.02ms | 0.02ms | -0.00050ms | -2.00% |
| total | 0.36ms | 0.34ms | +0.02ms | +4.77% |

### concurrent_batch (5 batchInvoke of 4 procedures each)

# Perf Report — concurrent_batch (5 batchInvoke of 4 procedures each).serial

| metric | value |
|---|---|
| iterations | 20 |
| warmup | 3 |
| p10 | 0.0075ms |
| p50 | 0.0081ms |
| p95 | 0.02ms |
| p99 | 0.02ms |
| mean | 0.0091ms |
| stdev | 0.0029ms |
| min | 0.0075ms |
| max | 0.02ms |
| total | 0.18ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.0075ms | 0.0084ms | -0.00083ms | -9.90% |
| p50 | 0.0081ms | 0.0093ms | -0.0012ms | -12.81% |
| p95 | 0.02ms | 0.02ms | -0.0040ms | -20.82% |
| p99 | 0.02ms | 0.02ms | -0.0019ms | -9.84% |
| mean | 0.0091ms | 0.01ms | -0.0017ms | -15.42% |
| min | 0.0075ms | 0.0083ms | -0.00079ms | -9.59% |
| max | 0.02ms | 0.02ms | -0.0014ms | -7.16% |
| total | 0.18ms | 0.22ms | -0.03ms | -15.42% |

