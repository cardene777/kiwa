# Perf Suite — trpc-app-scenario

Threshold source: [docs/quality/perf-thresholds.md](../../quality/perf-thresholds)

測定系の分解能 = 0.00025ms (何もしない関数を同じ経路で呼んだ時の p10)。 回帰判定の絶対下限は既定でこの 2 倍 = 0.00049ms、 op ごとの実効値は下表の「下限」 列。

## Serial (concurrency = 1)

| op | p10 (回帰判定) | p95 (上限判定) | cap | 下限 | gate | regression |
|---|---|---|---|---|---|---|
| router_dispatch_workflow (10 query mix via client) | 0.0041ms | 0.0084ms | 100ms | 0.00049ms | PASS | stable — gate 無効 (regressionGate=false) |
| mutation_batch (5 authenticated mutation) | 0.0033ms | 0.0062ms | 100ms | 0.00049ms | PASS | stable (p10 +20% (閾値未満)、 p95 +77% (裾は実行間の振れ幅と区別できないため判定には使わない)) — gate 無効 (regressionGate=false) |
| middleware_error_handling (5 UNAUTHORIZED + FORBIDDEN throw+catch) | 0.02ms | 0.02ms | 100ms | 0.00049ms | PASS | stable — gate 無効 (regressionGate=false) |
| retry_recovery (5 flaky handler retry to success) | 0.02ms | 0.02ms | 100ms | 0.00049ms | PASS | stable — gate 無効 (regressionGate=false) |
| concurrent_batch (5 batchInvoke of 4 procedures each) | 0.0074ms | 0.01ms | 100ms | 0.00049ms | PASS | stable — gate 無効 (regressionGate=false) |

## Concurrent p95 (concurrency = 4, 5 iter each)

| op | p95 | cap | gate |
|---|---|---|---|
| router_dispatch_workflow (10 query mix via client) | 0.03ms | 200ms | PASS |
| mutation_batch (5 authenticated mutation) | 0.02ms | 200ms | PASS |
| middleware_error_handling (5 UNAUTHORIZED + FORBIDDEN throw+catch) | 0.07ms | 200ms | PASS |
| retry_recovery (5 flaky handler retry to success) | 0.07ms | 200ms | PASS |
| concurrent_batch (5 batchInvoke of 4 procedures each) | 0.04ms | 200ms | PASS |

## Memory retention (20 iter, arrayBuffers axis is the gate; heap is informational)

| op | heapUsed Δ | arrayBuffers Δ | cap | gc exposed | verdict |
|---|---|---|---|---|---|
| router_dispatch_workflow (10 query mix via client) | 13064 B | 0 B | 102400 B | yes | PASS |
| mutation_batch (5 authenticated mutation) | -328 B | 0 B | 102400 B | yes | PASS |
| middleware_error_handling (5 UNAUTHORIZED + FORBIDDEN throw+catch) | 248 B | 0 B | 102400 B | yes | PASS |
| retry_recovery (5 flaky handler retry to success) | 1880 B | 0 B | 102400 B | yes | PASS |
| concurrent_batch (5 batchInvoke of 4 procedures each) | -3632 B | 0 B | 102400 B | yes | PASS |

## Detailed serial reports

### router_dispatch_workflow (10 query mix via client)

# Perf Report — router_dispatch_workflow (10 query mix via client).serial

| metric | value |
|---|---|
| iterations | 20 |
| warmup | 3 |
| p10 | 0.0041ms |
| p50 | 0.0055ms |
| p95 | 0.0084ms |
| p99 | 0.01ms |
| mean | 0.0055ms |
| stdev | 0.0016ms |
| min | 0.0040ms |
| max | 0.01ms |
| total | 0.11ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.0041ms | 0.0040ms | +0.000088ms | +2.21% |
| p50 | 0.0055ms | 0.0055ms | +0.000042ms | +0.77% |
| p95 | 0.0084ms | 0.0088ms | -0.00039ms | -4.47% |
| p99 | 0.01ms | 0.0098ms | +0.00062ms | +6.34% |
| mean | 0.0055ms | 0.0055ms | -0.000019ms | -0.34% |
| min | 0.0040ms | 0.0040ms | +0.000042ms | +1.06% |
| max | 0.01ms | 0.01ms | +0.00088ms | +8.69% |
| total | 0.11ms | 0.11ms | -0.00037ms | -0.34% |

### mutation_batch (5 authenticated mutation)

# Perf Report — mutation_batch (5 authenticated mutation).serial

| metric | value |
|---|---|
| iterations | 20 |
| warmup | 3 |
| p10 | 0.0033ms |
| p50 | 0.0038ms |
| p95 | 0.0062ms |
| p99 | 0.0064ms |
| mean | 0.0041ms |
| stdev | 0.00094ms |
| min | 0.0027ms |
| max | 0.0065ms |
| total | 0.08ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.0033ms | 0.0028ms | +0.00056ms | +20.06% |
| p50 | 0.0038ms | 0.0029ms | +0.00094ms | +32.83% |
| p95 | 0.0062ms | 0.0035ms | +0.0027ms | +77.50% |
| p99 | 0.0064ms | 0.0036ms | +0.0028ms | +78.96% |
| mean | 0.0041ms | 0.0029ms | +0.0012ms | +40.32% |
| min | 0.0027ms | 0.0027ms | +0.000042ms | +1.55% |
| max | 0.0065ms | 0.0036ms | +0.0029ms | +79.31% |
| total | 0.08ms | 0.06ms | +0.02ms | +40.32% |

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
| total | 0.36ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.02ms | 0.02ms | -0.00040ms | -2.55% |
| p50 | 0.02ms | 0.02ms | -0.0010ms | -5.70% |
| p95 | 0.02ms | 0.02ms | +0.0024ms | +11.07% |
| p99 | 0.03ms | 0.02ms | +0.0030ms | +13.39% |
| mean | 0.02ms | 0.02ms | -0.00033ms | -1.82% |
| min | 0.02ms | 0.02ms | -0.00021ms | -1.35% |
| max | 0.03ms | 0.02ms | +0.0031ms | +13.95% |
| total | 0.36ms | 0.36ms | -0.0066ms | -1.82% |

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
| stdev | 0.0027ms |
| min | 0.02ms |
| max | 0.02ms |
| total | 0.35ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.02ms | 0.01ms | +0.00037ms | +2.50% |
| p50 | 0.02ms | 0.02ms | +0.00021ms | +1.29% |
| p95 | 0.02ms | 0.02ms | -0.0013ms | -5.43% |
| p99 | 0.02ms | 0.02ms | -0.0011ms | -4.56% |
| mean | 0.02ms | 0.02ms | +0.00041ms | +2.38% |
| min | 0.02ms | 0.01ms | +0.00092ms | +6.40% |
| max | 0.02ms | 0.02ms | -0.0011ms | -4.34% |
| total | 0.35ms | 0.34ms | +0.0082ms | +2.38% |

### concurrent_batch (5 batchInvoke of 4 procedures each)

# Perf Report — concurrent_batch (5 batchInvoke of 4 procedures each).serial

| metric | value |
|---|---|
| iterations | 20 |
| warmup | 3 |
| p10 | 0.0074ms |
| p50 | 0.0079ms |
| p95 | 0.01ms |
| p99 | 0.02ms |
| mean | 0.0090ms |
| stdev | 0.0026ms |
| min | 0.0073ms |
| max | 0.02ms |
| total | 0.18ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.0074ms | 0.0084ms | -0.00096ms | -11.44% |
| p50 | 0.0079ms | 0.0093ms | -0.0014ms | -15.05% |
| p95 | 0.01ms | 0.02ms | -0.0048ms | -24.91% |
| p99 | 0.02ms | 0.02ms | -0.0027ms | -13.86% |
| mean | 0.0090ms | 0.01ms | -0.0018ms | -17.00% |
| min | 0.0073ms | 0.0083ms | -0.00092ms | -11.12% |
| max | 0.02ms | 0.02ms | -0.0022ms | -11.16% |
| total | 0.18ms | 0.22ms | -0.04ms | -17.00% |

