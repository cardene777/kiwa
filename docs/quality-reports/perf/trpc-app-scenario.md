# Perf Suite — trpc-app-scenario

Threshold source: [docs/quality/perf-thresholds.md](../../quality/perf-thresholds)

測定系の分解能 = 0.00021ms (何もしない関数を同じ経路で呼んだ時の p10)。 回帰判定の絶対下限は既定でこの 2 倍 = 0.00042ms、 op ごとの実効値は下表の「下限」 列。

## Serial (concurrency = 1)

| op | p10 (回帰判定) | p95 (上限判定) | cap | 下限 | gate | regression |
|---|---|---|---|---|---|---|
| router_dispatch_workflow (10 query mix via client) | 0.0050ms | 0.03ms | 100ms | 0.00042ms | PASS | stable (p10 +24% (閾値未満)、 p95 +192% (裾は実行間の振れ幅と区別できないため判定には使わない)) — gate 無効 (regressionGate=false) |
| mutation_batch (5 authenticated mutation) | 0.0028ms | 0.0063ms | 100ms | 0.00042ms | PASS | stable (p10 +2% (閾値未満)、 p95 +80% (裾は実行間の振れ幅と区別できないため判定には使わない)) — gate 無効 (regressionGate=false) |
| middleware_error_handling (5 UNAUTHORIZED + FORBIDDEN throw+catch) | 0.02ms | 0.02ms | 100ms | 0.00042ms | PASS | stable — gate 無効 (regressionGate=false) |
| retry_recovery (5 flaky handler retry to success) | 0.02ms | 0.03ms | 100ms | 0.00042ms | PASS | stable — gate 無効 (regressionGate=false) |
| concurrent_batch (5 batchInvoke of 4 procedures each) | 0.0092ms | 0.02ms | 100ms | 0.00042ms | PASS | stable — gate 無効 (regressionGate=false) |

## Concurrent p95 (concurrency = 4, 5 iter each)

| op | p95 | cap | gate |
|---|---|---|---|
| router_dispatch_workflow (10 query mix via client) | 0.11ms | 200ms | PASS |
| mutation_batch (5 authenticated mutation) | 0.02ms | 200ms | PASS |
| middleware_error_handling (5 UNAUTHORIZED + FORBIDDEN throw+catch) | 0.08ms | 200ms | PASS |
| retry_recovery (5 flaky handler retry to success) | 0.07ms | 200ms | PASS |
| concurrent_batch (5 batchInvoke of 4 procedures each) | 0.05ms | 200ms | PASS |

## Memory retention (20 iter, arrayBuffers axis is the gate; heap is informational)

| op | heapUsed Δ | arrayBuffers Δ | cap | gc exposed | verdict |
|---|---|---|---|---|---|
| router_dispatch_workflow (10 query mix via client) | 10432 B | 0 B | 102400 B | yes | PASS |
| mutation_batch (5 authenticated mutation) | 616 B | 0 B | 102400 B | yes | PASS |
| middleware_error_handling (5 UNAUTHORIZED + FORBIDDEN throw+catch) | 712 B | 0 B | 102400 B | yes | PASS |
| retry_recovery (5 flaky handler retry to success) | 7008 B | 0 B | 102400 B | yes | PASS |
| concurrent_batch (5 batchInvoke of 4 procedures each) | 7648 B | 0 B | 102400 B | yes | PASS |

## Detailed serial reports

### router_dispatch_workflow (10 query mix via client)

# Perf Report — router_dispatch_workflow (10 query mix via client).serial

| metric | value |
|---|---|
| iterations | 20 |
| warmup | 3 |
| p10 | 0.0050ms |
| p50 | 0.0064ms |
| p95 | 0.03ms |
| p99 | 0.03ms |
| mean | 0.0088ms |
| stdev | 0.0066ms |
| min | 0.0050ms |
| max | 0.03ms |
| total | 0.18ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.0050ms | 0.0040ms | +0.00096ms | +24.08% |
| p50 | 0.0064ms | 0.0055ms | +0.00090ms | +16.42% |
| p95 | 0.03ms | 0.0088ms | +0.02ms | +191.55% |
| p99 | 0.03ms | 0.0098ms | +0.02ms | +161.85% |
| mean | 0.0088ms | 0.0055ms | +0.0033ms | +58.72% |
| min | 0.0050ms | 0.0040ms | +0.0010ms | +25.27% |
| max | 0.03ms | 0.01ms | +0.02ms | +155.38% |
| total | 0.18ms | 0.11ms | +0.07ms | +58.72% |

### mutation_batch (5 authenticated mutation)

# Perf Report — mutation_batch (5 authenticated mutation).serial

| metric | value |
|---|---|
| iterations | 20 |
| warmup | 3 |
| p10 | 0.0028ms |
| p50 | 0.0035ms |
| p95 | 0.0063ms |
| p99 | 0.01ms |
| mean | 0.0042ms |
| stdev | 0.0028ms |
| min | 0.0028ms |
| max | 0.02ms |
| total | 0.08ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.0028ms | 0.0028ms | +0.000046ms | +1.65% |
| p50 | 0.0035ms | 0.0029ms | +0.00062ms | +21.88% |
| p95 | 0.0063ms | 0.0035ms | +0.0028ms | +80.17% |
| p99 | 0.01ms | 0.0036ms | +0.01ms | +279.41% |
| mean | 0.0042ms | 0.0029ms | +0.0012ms | +42.39% |
| min | 0.0028ms | 0.0027ms | +0.00013ms | +4.62% |
| max | 0.02ms | 0.0036ms | +0.01ms | +327.59% |
| total | 0.08ms | 0.06ms | +0.02ms | +42.39% |

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
| stdev | 0.0026ms |
| min | 0.02ms |
| max | 0.02ms |
| total | 0.38ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.02ms | 0.02ms | +0.00085ms | +5.41% |
| p50 | 0.02ms | 0.02ms | +0.00065ms | +3.61% |
| p95 | 0.02ms | 0.02ms | +0.0019ms | +9.09% |
| p99 | 0.02ms | 0.02ms | +0.0024ms | +10.91% |
| mean | 0.02ms | 0.02ms | +0.00096ms | +5.27% |
| min | 0.02ms | 0.02ms | +0.0011ms | +7.01% |
| max | 0.02ms | 0.02ms | +0.0025ms | +11.34% |
| total | 0.38ms | 0.36ms | +0.02ms | +5.27% |

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
| total | 0.40ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.02ms | 0.01ms | +0.0027ms | +18.26% |
| p50 | 0.02ms | 0.02ms | +0.0025ms | +15.46% |
| p95 | 0.03ms | 0.02ms | +0.0012ms | +5.07% |
| p99 | 0.03ms | 0.02ms | +0.0035ms | +14.15% |
| mean | 0.02ms | 0.02ms | +0.0029ms | +17.06% |
| min | 0.02ms | 0.01ms | +0.0031ms | +21.80% |
| max | 0.03ms | 0.02ms | +0.0041ms | +16.36% |
| total | 0.40ms | 0.34ms | +0.06ms | +17.06% |

### concurrent_batch (5 batchInvoke of 4 procedures each)

# Perf Report — concurrent_batch (5 batchInvoke of 4 procedures each).serial

| metric | value |
|---|---|
| iterations | 20 |
| warmup | 3 |
| p10 | 0.0092ms |
| p50 | 0.0099ms |
| p95 | 0.02ms |
| p99 | 0.02ms |
| mean | 0.01ms |
| stdev | 0.0036ms |
| min | 0.0088ms |
| max | 0.02ms |
| total | 0.22ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.0092ms | 0.0084ms | +0.00082ms | +9.85% |
| p50 | 0.0099ms | 0.0093ms | +0.00067ms | +7.20% |
| p95 | 0.02ms | 0.02ms | +0.0016ms | +8.06% |
| p99 | 0.02ms | 0.02ms | +0.0018ms | +9.36% |
| mean | 0.01ms | 0.01ms | +0.00045ms | +4.15% |
| min | 0.0088ms | 0.0083ms | +0.00058ms | +7.07% |
| max | 0.02ms | 0.02ms | +0.0019ms | +9.68% |
| total | 0.22ms | 0.22ms | +0.0090ms | +4.15% |

