# Perf Suite — rust-lib-app-scenario

Threshold source: [docs/quality/perf-thresholds.md](../../quality/perf-thresholds)

測定系の分解能 = 0.00025ms (何もしない関数を同じ経路で呼んだ時の p10)。 回帰判定の絶対下限は既定でこの 2 倍 = 0.00050ms、 op ごとの実効値は下表の「下限」 列。

## Serial (concurrency = 1)

| op | p10 (回帰判定) | p95 (上限判定) | cap | 下限 | gate | regression |
|---|---|---|---|---|---|---|
| rest_handler_workflow (10 axum + actix + rocket mixed) | 0.0052ms | 0.02ms | 100ms | 0.00050ms | PASS | stable (p10 -0% (閾値未満)、 p95 +29% (裾は実行間の振れ幅と区別できないため判定には使わない)) — gate 無効 (regressionGate=false) |
| middleware_chain_batch (5 tower layer chains) | 0.0045ms | 0.0078ms | 100ms | 0.00050ms | PASS | stable (p10 +19% (閾値未満)、 p95 +51% (裾は実行間の振れ幅と区別できないため判定には使わない)) — gate 無効 (regressionGate=false) |
| route_error_handling (5 handler throw + catch) | 0.01ms | 0.02ms | 100ms | 0.00050ms | PASS | stable (p10 +16% (閾値未満)、 p95 +55% (裾は実行間の振れ幅と区別できないため判定には使わない)) — gate 無効 (regressionGate=false) |
| retry_recovery (5 flaky async retry to success) | 0.03ms | 0.23ms | 100ms | 0.00050ms | PASS | stable (p10 +14% (閾値未満)、 p95 +506% (裾は実行間の振れ幅と区別できないため判定には使わない)) — gate 無効 (regressionGate=false) |
| concurrent_batch (5 batches of 4 items with error isolation) | 0.0099ms | 0.04ms | 100ms | 0.00050ms | PASS | stable (p10 +5% (閾値未満)、 p95 +134% (裾は実行間の振れ幅と区別できないため判定には使わない)) — gate 無効 (regressionGate=false) |

## Concurrent p95 (concurrency = 4, 5 iter each)

| op | p95 | cap | gate |
|---|---|---|---|
| rest_handler_workflow (10 axum + actix + rocket mixed) | 0.03ms | 200ms | PASS |
| middleware_chain_batch (5 tower layer chains) | 0.04ms | 200ms | PASS |
| route_error_handling (5 handler throw + catch) | 0.07ms | 200ms | PASS |
| retry_recovery (5 flaky async retry to success) | 0.41ms | 200ms | PASS |
| concurrent_batch (5 batches of 4 items with error isolation) | 0.06ms | 200ms | PASS |

## Memory retention (20 iter, arrayBuffers axis is the gate; heap is informational)

| op | heapUsed Δ | arrayBuffers Δ | cap | gc exposed | verdict |
|---|---|---|---|---|---|
| rest_handler_workflow (10 axum + actix + rocket mixed) | -1368 B | -15100 B | 102400 B | yes | PASS |
| middleware_chain_batch (5 tower layer chains) | -200 B | 0 B | 102400 B | yes | PASS |
| route_error_handling (5 handler throw + catch) | 712 B | 0 B | 102400 B | yes | PASS |
| retry_recovery (5 flaky async retry to success) | 3816 B | 0 B | 102400 B | yes | PASS |
| concurrent_batch (5 batches of 4 items with error isolation) | 9240 B | 0 B | 102400 B | yes | PASS |

## Detailed serial reports

### rest_handler_workflow (10 axum + actix + rocket mixed)

# Perf Report — rest_handler_workflow (10 axum + actix + rocket mixed).serial

| metric | value |
|---|---|
| iterations | 20 |
| warmup | 3 |
| p10 | 0.0052ms |
| p50 | 0.0053ms |
| p95 | 0.02ms |
| p99 | 0.03ms |
| mean | 0.0087ms |
| stdev | 0.0069ms |
| min | 0.0052ms |
| max | 0.03ms |
| total | 0.17ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.0052ms | 0.0052ms | -0.0000084ms | -0.16% |
| p50 | 0.0053ms | 0.0057ms | -0.00035ms | -6.22% |
| p95 | 0.02ms | 0.02ms | +0.0054ms | +28.63% |
| p99 | 0.03ms | 0.03ms | +0.0018ms | +7.23% |
| mean | 0.0087ms | 0.0084ms | +0.00024ms | +2.84% |
| min | 0.0052ms | 0.0042ms | +0.0010ms | +24.00% |
| max | 0.03ms | 0.03ms | +0.00092ms | +3.44% |
| total | 0.17ms | 0.17ms | +0.0048ms | +2.84% |

### middleware_chain_batch (5 tower layer chains)

# Perf Report — middleware_chain_batch (5 tower layer chains).serial

| metric | value |
|---|---|
| iterations | 20 |
| warmup | 3 |
| p10 | 0.0045ms |
| p50 | 0.0056ms |
| p95 | 0.0078ms |
| p99 | 0.0080ms |
| mean | 0.0056ms |
| stdev | 0.0011ms |
| min | 0.0044ms |
| max | 0.0080ms |
| total | 0.11ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.0045ms | 0.0037ms | +0.00070ms | +18.77% |
| p50 | 0.0056ms | 0.0039ms | +0.0017ms | +44.14% |
| p95 | 0.0078ms | 0.0051ms | +0.0026ms | +51.23% |
| p99 | 0.0080ms | 0.0078ms | +0.00016ms | +2.05% |
| mean | 0.0056ms | 0.0043ms | +0.0013ms | +31.23% |
| min | 0.0044ms | 0.0037ms | +0.00071ms | +19.09% |
| max | 0.0080ms | 0.0085ms | -0.00046ms | -5.41% |
| total | 0.11ms | 0.09ms | +0.03ms | +31.23% |

### route_error_handling (5 handler throw + catch)

# Perf Report — route_error_handling (5 handler throw + catch).serial

| metric | value |
|---|---|
| iterations | 20 |
| warmup | 3 |
| p10 | 0.01ms |
| p50 | 0.01ms |
| p95 | 0.02ms |
| p99 | 0.03ms |
| mean | 0.01ms |
| stdev | 0.0044ms |
| min | 0.01ms |
| max | 0.03ms |
| total | 0.29ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.01ms | 0.01ms | +0.0017ms | +16.04% |
| p50 | 0.01ms | 0.01ms | +0.0020ms | +17.38% |
| p95 | 0.02ms | 0.01ms | +0.0075ms | +54.96% |
| p99 | 0.03ms | 0.01ms | +0.01ms | +91.96% |
| mean | 0.01ms | 0.01ms | +0.0029ms | +24.20% |
| min | 0.01ms | 0.01ms | +0.0017ms | +15.75% |
| max | 0.03ms | 0.02ms | +0.02ms | +100.28% |
| total | 0.29ms | 0.24ms | +0.06ms | +24.20% |

### retry_recovery (5 flaky async retry to success)

# Perf Report — retry_recovery (5 flaky async retry to success).serial

| metric | value |
|---|---|
| iterations | 20 |
| warmup | 3 |
| p10 | 0.03ms |
| p50 | 0.05ms |
| p95 | 0.23ms |
| p99 | 0.24ms |
| mean | 0.08ms |
| stdev | 0.07ms |
| min | 0.03ms |
| max | 0.25ms |
| total | 1.63ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.03ms | 0.03ms | +0.0038ms | +14.45% |
| p50 | 0.05ms | 0.03ms | +0.02ms | +68.72% |
| p95 | 0.23ms | 0.04ms | +0.19ms | +505.61% |
| p99 | 0.24ms | 0.04ms | +0.21ms | +543.10% |
| mean | 0.08ms | 0.03ms | +0.05ms | +182.95% |
| min | 0.03ms | 0.03ms | +0.0027ms | +10.35% |
| max | 0.25ms | 0.04ms | +0.21ms | +552.35% |
| total | 1.63ms | 0.58ms | +1.06ms | +182.95% |

### concurrent_batch (5 batches of 4 items with error isolation)

# Perf Report — concurrent_batch (5 batches of 4 items with error isolation).serial

| metric | value |
|---|---|
| iterations | 20 |
| warmup | 3 |
| p10 | 0.0099ms |
| p50 | 0.01ms |
| p95 | 0.04ms |
| p99 | 0.04ms |
| mean | 0.01ms |
| stdev | 0.0097ms |
| min | 0.0098ms |
| max | 0.05ms |
| total | 0.29ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.0099ms | 0.0095ms | +0.00049ms | +5.20% |
| p50 | 0.01ms | 0.01ms | +0.00050ms | +4.88% |
| p95 | 0.04ms | 0.02ms | +0.02ms | +134.41% |
| p99 | 0.04ms | 0.02ms | +0.03ms | +137.96% |
| mean | 0.01ms | 0.01ms | +0.0034ms | +30.45% |
| min | 0.0098ms | 0.0092ms | +0.00058ms | +6.32% |
| max | 0.05ms | 0.02ms | +0.03ms | +138.69% |
| total | 0.29ms | 0.22ms | +0.07ms | +30.45% |

