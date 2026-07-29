# Perf Suite — rust-lib-app-scenario

Threshold source: [docs/quality/perf-thresholds.md](../../quality/perf-thresholds)

測定系の分解能 = 0.00025ms (何もしない関数を同じ経路で呼んだ時の p10)。 回帰判定の絶対下限は既定でこの 2 倍 = 0.00050ms、 op ごとの実効値は下表の「下限」 列。

## Serial (concurrency = 1)

| op | p10 (回帰判定) | p95 (上限判定) | cap | 下限 | gate | regression |
|---|---|---|---|---|---|---|
| rest_handler_workflow (10 axum + actix + rocket mixed) | 0.0049ms | 0.03ms | 100ms | 0.00050ms | PASS | stable (p10 -5% (閾値未満)、 p95 +42% (裾は実行間の振れ幅と区別できないため判定には使わない)) — gate 無効 (regressionGate=false) |
| middleware_chain_batch (5 tower layer chains) | 0.0047ms | 0.0079ms | 100ms | 0.00050ms | PASS | regressed — gate 無効 (regressionGate=false) |
| route_error_handling (5 handler throw + catch) | 0.01ms | 0.01ms | 100ms | 0.00050ms | PASS | stable — gate 無効 (regressionGate=false) |
| retry_recovery (5 flaky async retry to success) | 0.03ms | 0.04ms | 100ms | 0.00050ms | PASS | stable — gate 無効 (regressionGate=false) |
| concurrent_batch (5 batches of 4 items with error isolation) | 0.0099ms | 0.02ms | 100ms | 0.00050ms | PASS | stable (p10 +5% (閾値未満)、 p95 +23% (裾は実行間の振れ幅と区別できないため判定には使わない)) — gate 無効 (regressionGate=false) |

## Concurrent p95 (concurrency = 4, 5 iter each)

| op | p95 | cap | gate |
|---|---|---|---|
| rest_handler_workflow (10 axum + actix + rocket mixed) | 0.02ms | 200ms | PASS |
| middleware_chain_batch (5 tower layer chains) | 0.03ms | 200ms | PASS |
| route_error_handling (5 handler throw + catch) | 0.06ms | 200ms | PASS |
| retry_recovery (5 flaky async retry to success) | 0.13ms | 200ms | PASS |
| concurrent_batch (5 batches of 4 items with error isolation) | 0.06ms | 200ms | PASS |

## Memory retention (20 iter, arrayBuffers axis is the gate; heap is informational)

| op | heapUsed Δ | arrayBuffers Δ | cap | gc exposed | verdict |
|---|---|---|---|---|---|
| rest_handler_workflow (10 axum + actix + rocket mixed) | 4992 B | 0 B | 102400 B | yes | PASS |
| middleware_chain_batch (5 tower layer chains) | 6176 B | 0 B | 102400 B | yes | PASS |
| route_error_handling (5 handler throw + catch) | 808 B | 0 B | 102400 B | yes | PASS |
| retry_recovery (5 flaky async retry to success) | -2152 B | 0 B | 102400 B | yes | PASS |
| concurrent_batch (5 batches of 4 items with error isolation) | 5208 B | 0 B | 102400 B | yes | PASS |

## Detailed serial reports

### rest_handler_workflow (10 axum + actix + rocket mixed)

# Perf Report — rest_handler_workflow (10 axum + actix + rocket mixed).serial

| metric | value |
|---|---|
| iterations | 20 |
| warmup | 3 |
| p10 | 0.0049ms |
| p50 | 0.0052ms |
| p95 | 0.03ms |
| p99 | 0.04ms |
| mean | 0.0097ms |
| stdev | 0.0099ms |
| min | 0.0040ms |
| max | 0.04ms |
| total | 0.19ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.0049ms | 0.0052ms | -0.00027ms | -5.26% |
| p50 | 0.0052ms | 0.0057ms | -0.00044ms | -7.70% |
| p95 | 0.03ms | 0.02ms | +0.0079ms | +41.82% |
| p99 | 0.04ms | 0.03ms | +0.01ms | +59.08% |
| mean | 0.0097ms | 0.0084ms | +0.0013ms | +15.57% |
| min | 0.0040ms | 0.0042ms | -0.00021ms | -5.02% |
| max | 0.04ms | 0.03ms | +0.02ms | +62.13% |
| total | 0.19ms | 0.17ms | +0.03ms | +15.57% |

### middleware_chain_batch (5 tower layer chains)

# Perf Report — middleware_chain_batch (5 tower layer chains).serial

| metric | value |
|---|---|
| iterations | 20 |
| warmup | 3 |
| p10 | 0.0047ms |
| p50 | 0.0052ms |
| p95 | 0.0079ms |
| p99 | 0.01ms |
| mean | 0.0056ms |
| stdev | 0.0015ms |
| min | 0.0043ms |
| max | 0.01ms |
| total | 0.11ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.0047ms | 0.0037ms | +0.00091ms | +24.34% |
| p50 | 0.0052ms | 0.0039ms | +0.0012ms | +31.90% |
| p95 | 0.0079ms | 0.0051ms | +0.0028ms | +54.76% |
| p99 | 0.01ms | 0.0078ms | +0.0025ms | +31.60% |
| mean | 0.0056ms | 0.0043ms | +0.0013ms | +31.32% |
| min | 0.0043ms | 0.0037ms | +0.00054ms | +14.62% |
| max | 0.01ms | 0.0085ms | +0.0024ms | +28.08% |
| total | 0.11ms | 0.09ms | +0.03ms | +31.32% |

### route_error_handling (5 handler throw + catch)

# Perf Report — route_error_handling (5 handler throw + catch).serial

| metric | value |
|---|---|
| iterations | 20 |
| warmup | 3 |
| p10 | 0.01ms |
| p50 | 0.01ms |
| p95 | 0.01ms |
| p99 | 0.02ms |
| mean | 0.01ms |
| stdev | 0.0018ms |
| min | 0.01ms |
| max | 0.02ms |
| total | 0.24ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.01ms | 0.01ms | +0.00012ms | +1.14% |
| p50 | 0.01ms | 0.01ms | +0.000063ms | +0.55% |
| p95 | 0.01ms | 0.01ms | +0.0010ms | +7.37% |
| p99 | 0.02ms | 0.01ms | +0.0024ms | +16.30% |
| mean | 0.01ms | 0.01ms | +0.00012ms | +0.99% |
| min | 0.01ms | 0.01ms | +0.000083ms | +0.78% |
| max | 0.02ms | 0.02ms | +0.0028ms | +18.30% |
| total | 0.24ms | 0.24ms | +0.0023ms | +0.99% |

### retry_recovery (5 flaky async retry to success)

# Perf Report — retry_recovery (5 flaky async retry to success).serial

| metric | value |
|---|---|
| iterations | 20 |
| warmup | 3 |
| p10 | 0.03ms |
| p50 | 0.03ms |
| p95 | 0.04ms |
| p99 | 0.04ms |
| mean | 0.03ms |
| stdev | 0.0038ms |
| min | 0.03ms |
| max | 0.04ms |
| total | 0.58ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.03ms | 0.03ms | -0.00035ms | -1.34% |
| p50 | 0.03ms | 0.03ms | -0.00075ms | -2.71% |
| p95 | 0.04ms | 0.04ms | -0.0012ms | -3.26% |
| p99 | 0.04ms | 0.04ms | -0.00081ms | -2.14% |
| mean | 0.03ms | 0.03ms | +0.00022ms | +0.77% |
| min | 0.03ms | 0.03ms | -0.00046ms | -1.75% |
| max | 0.04ms | 0.04ms | -0.00071ms | -1.86% |
| total | 0.58ms | 0.58ms | +0.0044ms | +0.77% |

### concurrent_batch (5 batches of 4 items with error isolation)

# Perf Report — concurrent_batch (5 batches of 4 items with error isolation).serial

| metric | value |
|---|---|
| iterations | 20 |
| warmup | 3 |
| p10 | 0.0099ms |
| p50 | 0.01ms |
| p95 | 0.02ms |
| p99 | 0.02ms |
| mean | 0.01ms |
| stdev | 0.0033ms |
| min | 0.0098ms |
| max | 0.02ms |
| total | 0.27ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.0099ms | 0.0095ms | +0.00045ms | +4.81% |
| p50 | 0.01ms | 0.01ms | +0.0028ms | +27.23% |
| p95 | 0.02ms | 0.02ms | +0.0036ms | +22.92% |
| p99 | 0.02ms | 0.02ms | +0.0010ms | +5.54% |
| mean | 0.01ms | 0.01ms | +0.0024ms | +21.58% |
| min | 0.0098ms | 0.0092ms | +0.00062ms | +6.78% |
| max | 0.02ms | 0.02ms | +0.00038ms | +1.96% |
| total | 0.27ms | 0.22ms | +0.05ms | +21.58% |

