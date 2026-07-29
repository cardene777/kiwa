# Perf Suite — trpc-app-scenario

Threshold source: [docs/quality/perf-thresholds.md](../../quality/perf-thresholds)

測定系の分解能 = 0.00021ms (何もしない関数を同じ経路で呼んだ時の p10)。 回帰判定の絶対下限は既定でこの 2 倍 = 0.00042ms、 op ごとの実効値は下表の「下限」 列。

## Serial (concurrency = 1)

| op | p10 (回帰判定) | p95 (上限判定) | cap | 下限 | gate | regression |
|---|---|---|---|---|---|---|
| router_dispatch_workflow (10 query mix via client) | 0.0040ms | 0.0087ms | 100ms | 0.00042ms | PASS | stable — gate 無効 (regressionGate=false) |
| mutation_batch (5 authenticated mutation) | 0.0028ms | 0.0080ms | 100ms | 0.00042ms | PASS | stable (p10 +0% (閾値未満)、 p95 +128% (裾は実行間の振れ幅と区別できないため判定には使わない)) — gate 無効 (regressionGate=false) |
| middleware_error_handling (5 UNAUTHORIZED + FORBIDDEN throw+catch) | 0.02ms | 0.02ms | 100ms | 0.00042ms | PASS | stable — gate 無効 (regressionGate=false) |
| retry_recovery (5 flaky handler retry to success) | 0.02ms | 0.03ms | 100ms | 0.00042ms | PASS | stable — gate 無効 (regressionGate=false) |
| concurrent_batch (5 batchInvoke of 4 procedures each) | 0.0077ms | 0.01ms | 100ms | 0.00042ms | PASS | stable — gate 無効 (regressionGate=false) |

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
| router_dispatch_workflow (10 query mix via client) | -210992 B | 0 B | 102400 B | yes | PASS |
| mutation_batch (5 authenticated mutation) | 616 B | 0 B | 102400 B | yes | PASS |
| middleware_error_handling (5 UNAUTHORIZED + FORBIDDEN throw+catch) | 712 B | 0 B | 102400 B | yes | PASS |
| retry_recovery (5 flaky handler retry to success) | 10264 B | 0 B | 102400 B | yes | PASS |
| concurrent_batch (5 batchInvoke of 4 procedures each) | -2016 B | 0 B | 102400 B | yes | PASS |

## Detailed serial reports

### router_dispatch_workflow (10 query mix via client)

# Perf Report — router_dispatch_workflow (10 query mix via client).serial

| metric | value |
|---|---|
| iterations | 20 |
| warmup | 3 |
| p10 | 0.0040ms |
| p50 | 0.0054ms |
| p95 | 0.0087ms |
| p99 | 0.0095ms |
| mean | 0.0056ms |
| stdev | 0.0015ms |
| min | 0.0039ms |
| max | 0.0097ms |
| total | 0.11ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.0040ms | 0.0040ms | -0.000037ms | -0.92% |
| p50 | 0.0054ms | 0.0055ms | -0.000021ms | -0.38% |
| p95 | 0.0087ms | 0.0088ms | -0.000057ms | -0.64% |
| p99 | 0.0095ms | 0.0098ms | -0.00028ms | -2.83% |
| mean | 0.0056ms | 0.0055ms | +0.000029ms | +0.53% |
| min | 0.0039ms | 0.0040ms | -0.000041ms | -1.04% |
| max | 0.0097ms | 0.01ms | -0.00033ms | -3.30% |
| total | 0.11ms | 0.11ms | +0.00059ms | +0.53% |

### mutation_batch (5 authenticated mutation)

# Perf Report — mutation_batch (5 authenticated mutation).serial

| metric | value |
|---|---|
| iterations | 20 |
| warmup | 3 |
| p10 | 0.0028ms |
| p50 | 0.0037ms |
| p95 | 0.0080ms |
| p99 | 0.01ms |
| mean | 0.0044ms |
| stdev | 0.0025ms |
| min | 0.0027ms |
| max | 0.01ms |
| total | 0.09ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.0028ms | 0.0028ms | +0.0000051ms | +0.18% |
| p50 | 0.0037ms | 0.0029ms | +0.00090ms | +31.37% |
| p95 | 0.0080ms | 0.0035ms | +0.0045ms | +127.73% |
| p99 | 0.01ms | 0.0036ms | +0.0092ms | +256.28% |
| mean | 0.0044ms | 0.0029ms | +0.0015ms | +51.13% |
| min | 0.0027ms | 0.0027ms | +0.000042ms | +1.55% |
| max | 0.01ms | 0.0036ms | +0.01ms | +287.37% |
| total | 0.09ms | 0.06ms | +0.03ms | +51.13% |

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
| stdev | 0.0027ms |
| min | 0.02ms |
| max | 0.02ms |
| total | 0.36ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.02ms | 0.02ms | +0.00019ms | +1.19% |
| p50 | 0.02ms | 0.02ms | -0.0011ms | -5.93% |
| p95 | 0.02ms | 0.02ms | +0.0017ms | +8.04% |
| p99 | 0.02ms | 0.02ms | +0.0019ms | +8.76% |
| mean | 0.02ms | 0.02ms | -0.000090ms | -0.49% |
| min | 0.02ms | 0.02ms | +0.00042ms | +2.69% |
| max | 0.02ms | 0.02ms | +0.0020ms | +8.93% |
| total | 0.36ms | 0.36ms | -0.0018ms | -0.49% |

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
| stdev | 0.0034ms |
| min | 0.02ms |
| max | 0.03ms |
| total | 0.37ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.02ms | 0.01ms | +0.0013ms | +8.39% |
| p50 | 0.02ms | 0.02ms | +0.00073ms | +4.51% |
| p95 | 0.03ms | 0.02ms | +0.0013ms | +5.18% |
| p99 | 0.03ms | 0.02ms | +0.0027ms | +10.81% |
| mean | 0.02ms | 0.02ms | +0.0014ms | +8.44% |
| min | 0.02ms | 0.01ms | +0.0016ms | +11.05% |
| max | 0.03ms | 0.02ms | +0.0030ms | +12.18% |
| total | 0.37ms | 0.34ms | +0.03ms | +8.44% |

### concurrent_batch (5 batchInvoke of 4 procedures each)

# Perf Report — concurrent_batch (5 batchInvoke of 4 procedures each).serial

| metric | value |
|---|---|
| iterations | 20 |
| warmup | 3 |
| p10 | 0.0077ms |
| p50 | 0.0079ms |
| p95 | 0.01ms |
| p99 | 0.02ms |
| mean | 0.0090ms |
| stdev | 0.0026ms |
| min | 0.0076ms |
| max | 0.02ms |
| total | 0.18ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.0077ms | 0.0084ms | -0.00070ms | -8.41% |
| p50 | 0.0079ms | 0.0093ms | -0.0013ms | -14.38% |
| p95 | 0.01ms | 0.02ms | -0.0051ms | -26.50% |
| p99 | 0.02ms | 0.02ms | -0.0027ms | -13.50% |
| mean | 0.0090ms | 0.01ms | -0.0018ms | -16.57% |
| min | 0.0076ms | 0.0083ms | -0.00067ms | -8.08% |
| max | 0.02ms | 0.02ms | -0.0020ms | -10.32% |
| total | 0.18ms | 0.22ms | -0.04ms | -16.57% |

