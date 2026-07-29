# Perf Suite — trpc-app-scenario

Threshold source: [docs/quality/perf-thresholds.md](../../quality/perf-thresholds)

測定系の分解能 = 0.00025ms (何もしない関数を同じ経路で呼んだ時の p10)。 回帰判定の絶対下限は既定でこの 2 倍 = 0.00050ms、 op ごとの実効値は下表の「下限」 列。

## Serial (concurrency = 1)

| op | p10 (回帰判定) | p95 (上限判定) | cap | 下限 | gate | regression |
|---|---|---|---|---|---|---|
| router_dispatch_workflow (10 query mix via client) | 0.0045ms | 0.0085ms | 100ms | 0.00050ms | PASS | stable — gate 無効 (regressionGate=false) |
| mutation_batch (5 authenticated mutation) | 0.0030ms | 0.0041ms | 100ms | 0.00050ms | PASS | stable — gate 無効 (regressionGate=false) |
| middleware_error_handling (5 UNAUTHORIZED + FORBIDDEN throw+catch) | 0.02ms | 0.03ms | 100ms | 0.00050ms | PASS | stable (p10 +1% (閾値未満)、 p95 +36% (裾は実行間の振れ幅と区別できないため判定には使わない)) — gate 無効 (regressionGate=false) |
| retry_recovery (5 flaky handler retry to success) | 0.01ms | 0.02ms | 100ms | 0.00050ms | PASS | stable — gate 無効 (regressionGate=false) |
| concurrent_batch (5 batchInvoke of 4 procedures each) | 0.0079ms | 0.02ms | 100ms | 0.00050ms | PASS | stable — gate 無効 (regressionGate=false) |

## Concurrent p95 (concurrency = 4, 5 iter each)

| op | p95 | cap | gate |
|---|---|---|---|
| router_dispatch_workflow (10 query mix via client) | 0.06ms | 200ms | PASS |
| mutation_batch (5 authenticated mutation) | 0.01ms | 200ms | PASS |
| middleware_error_handling (5 UNAUTHORIZED + FORBIDDEN throw+catch) | 0.20ms | 200ms | PASS |
| retry_recovery (5 flaky handler retry to success) | 0.07ms | 200ms | PASS |
| concurrent_batch (5 batchInvoke of 4 procedures each) | 0.05ms | 200ms | PASS |

## Memory retention (20 iter, arrayBuffers axis is the gate; heap is informational)

| op | heapUsed Δ | arrayBuffers Δ | cap | gc exposed | verdict |
|---|---|---|---|---|---|
| router_dispatch_workflow (10 query mix via client) | 4232 B | 0 B | 102400 B | yes | PASS |
| mutation_batch (5 authenticated mutation) | -328 B | 0 B | 102400 B | yes | PASS |
| middleware_error_handling (5 UNAUTHORIZED + FORBIDDEN throw+catch) | 248 B | 0 B | 102400 B | yes | PASS |
| retry_recovery (5 flaky handler retry to success) | 12664 B | 0 B | 102400 B | yes | PASS |
| concurrent_batch (5 batchInvoke of 4 procedures each) | -4000 B | 0 B | 102400 B | yes | PASS |

## Detailed serial reports

### router_dispatch_workflow (10 query mix via client)

# Perf Report — router_dispatch_workflow (10 query mix via client).serial

| metric | value |
|---|---|
| iterations | 20 |
| warmup | 3 |
| p10 | 0.0045ms |
| p50 | 0.0062ms |
| p95 | 0.0085ms |
| p99 | 0.01ms |
| mean | 0.0062ms |
| stdev | 0.0020ms |
| min | 0.0045ms |
| max | 0.01ms |
| total | 0.12ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.0045ms | 0.0040ms | +0.00054ms | +13.56% |
| p50 | 0.0062ms | 0.0055ms | +0.00073ms | +13.36% |
| p95 | 0.0085ms | 0.0088ms | -0.00028ms | -3.19% |
| p99 | 0.01ms | 0.0098ms | +0.0024ms | +24.89% |
| mean | 0.0062ms | 0.0055ms | +0.00066ms | +11.99% |
| min | 0.0045ms | 0.0040ms | +0.00050ms | +12.63% |
| max | 0.01ms | 0.01ms | +0.0031ms | +31.00% |
| total | 0.12ms | 0.11ms | +0.01ms | +11.99% |

### mutation_batch (5 authenticated mutation)

# Perf Report — mutation_batch (5 authenticated mutation).serial

| metric | value |
|---|---|
| iterations | 20 |
| warmup | 3 |
| p10 | 0.0030ms |
| p50 | 0.0031ms |
| p95 | 0.0041ms |
| p99 | 0.01ms |
| mean | 0.0037ms |
| stdev | 0.0023ms |
| min | 0.0030ms |
| max | 0.01ms |
| total | 0.07ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.0030ms | 0.0028ms | +0.00021ms | +7.65% |
| p50 | 0.0031ms | 0.0029ms | +0.00027ms | +9.48% |
| p95 | 0.0041ms | 0.0035ms | +0.00061ms | +17.47% |
| p99 | 0.01ms | 0.0036ms | +0.0080ms | +222.77% |
| mean | 0.0037ms | 0.0029ms | +0.00073ms | +24.96% |
| min | 0.0030ms | 0.0027ms | +0.00029ms | +10.78% |
| max | 0.01ms | 0.0036ms | +0.0099ms | +272.41% |
| total | 0.07ms | 0.06ms | +0.01ms | +24.96% |

### middleware_error_handling (5 UNAUTHORIZED + FORBIDDEN throw+catch)

# Perf Report — middleware_error_handling (5 UNAUTHORIZED + FORBIDDEN throw+catch).serial

| metric | value |
|---|---|
| iterations | 20 |
| warmup | 3 |
| p10 | 0.02ms |
| p50 | 0.02ms |
| p95 | 0.03ms |
| p99 | 0.05ms |
| mean | 0.02ms |
| stdev | 0.0090ms |
| min | 0.02ms |
| max | 0.06ms |
| total | 0.41ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.02ms | 0.02ms | +0.00013ms | +0.82% |
| p50 | 0.02ms | 0.02ms | -0.00017ms | -0.93% |
| p95 | 0.03ms | 0.02ms | +0.0076ms | +35.63% |
| p99 | 0.05ms | 0.02ms | +0.03ms | +129.00% |
| mean | 0.02ms | 0.02ms | +0.0022ms | +11.82% |
| min | 0.02ms | 0.02ms | +0.00021ms | +1.34% |
| max | 0.06ms | 0.02ms | +0.03ms | +151.31% |
| total | 0.41ms | 0.36ms | +0.04ms | +11.82% |

### retry_recovery (5 flaky handler retry to success)

# Perf Report — retry_recovery (5 flaky handler retry to success).serial

| metric | value |
|---|---|
| iterations | 20 |
| warmup | 3 |
| p10 | 0.01ms |
| p50 | 0.02ms |
| p95 | 0.02ms |
| p99 | 0.02ms |
| mean | 0.02ms |
| stdev | 0.0028ms |
| min | 0.01ms |
| max | 0.02ms |
| total | 0.33ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.01ms | 0.01ms | -0.0011ms | -7.51% |
| p50 | 0.02ms | 0.02ms | -0.00079ms | -4.90% |
| p95 | 0.02ms | 0.02ms | -0.0014ms | -5.79% |
| p99 | 0.02ms | 0.02ms | -0.0013ms | -5.16% |
| mean | 0.02ms | 0.02ms | -0.00088ms | -5.12% |
| min | 0.01ms | 0.01ms | -0.00079ms | -5.53% |
| max | 0.02ms | 0.02ms | -0.0013ms | -5.01% |
| total | 0.33ms | 0.34ms | -0.02ms | -5.12% |

### concurrent_batch (5 batchInvoke of 4 procedures each)

# Perf Report — concurrent_batch (5 batchInvoke of 4 procedures each).serial

| metric | value |
|---|---|
| iterations | 20 |
| warmup | 3 |
| p10 | 0.0079ms |
| p50 | 0.0082ms |
| p95 | 0.02ms |
| p99 | 0.02ms |
| mean | 0.0096ms |
| stdev | 0.0034ms |
| min | 0.0078ms |
| max | 0.02ms |
| total | 0.19ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.0079ms | 0.0084ms | -0.00050ms | -5.92% |
| p50 | 0.0082ms | 0.0093ms | -0.0010ms | -11.23% |
| p95 | 0.02ms | 0.02ms | -0.00066ms | -3.41% |
| p99 | 0.02ms | 0.02ms | -0.00057ms | -2.87% |
| mean | 0.0096ms | 0.01ms | -0.0012ms | -10.88% |
| min | 0.0078ms | 0.0083ms | -0.00042ms | -5.04% |
| max | 0.02ms | 0.02ms | -0.00054ms | -2.74% |
| total | 0.19ms | 0.22ms | -0.02ms | -10.88% |

