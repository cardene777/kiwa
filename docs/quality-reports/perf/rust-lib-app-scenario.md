# Perf Suite — rust-lib-app-scenario

Threshold source: [docs/quality/perf-thresholds.md](../../quality/perf-thresholds)

測定系の分解能 = 0.00025ms (何もしない関数を同じ経路で呼んだ時の p10)。 回帰判定の絶対下限は既定でこの 2 倍 = 0.00050ms、 op ごとの実効値は下表の「下限」 列。

## Serial (concurrency = 1)

| op | p10 (回帰判定) | p95 (上限判定) | cap | 下限 | gate | regression |
|---|---|---|---|---|---|---|
| rest_handler_workflow (10 axum + actix + rocket mixed) | 0.0050ms | 0.02ms | 100ms | 0.00050ms | PASS | stable (p10 -5% (閾値未満)、 p95 +24% (裾は実行間の振れ幅と区別できないため判定には使わない)) — gate 無効 (regressionGate=false) |
| middleware_chain_batch (5 tower layer chains) | 0.0033ms | 0.0059ms | 100ms | 0.00050ms | PASS | stable — gate 無効 (regressionGate=false) |
| route_error_handling (5 handler throw + catch) | 0.01ms | 0.02ms | 100ms | 0.00050ms | PASS | stable (p10 -0% (閾値未満)、 p95 +30% (裾は実行間の振れ幅と区別できないため判定には使わない)) — gate 無効 (regressionGate=false) |
| retry_recovery (5 flaky async retry to success) | 0.03ms | 0.04ms | 100ms | 0.00050ms | PASS | stable — gate 無効 (regressionGate=false) |
| concurrent_batch (5 batches of 4 items with error isolation) | 0.0098ms | 0.02ms | 100ms | 0.00050ms | PASS | stable — gate 無効 (regressionGate=false) |

## Concurrent p95 (concurrency = 4, 5 iter each)

| op | p95 | cap | gate |
|---|---|---|---|
| rest_handler_workflow (10 axum + actix + rocket mixed) | 0.02ms | 200ms | PASS |
| middleware_chain_batch (5 tower layer chains) | 0.02ms | 200ms | PASS |
| route_error_handling (5 handler throw + catch) | 0.06ms | 200ms | PASS |
| retry_recovery (5 flaky async retry to success) | 0.13ms | 200ms | PASS |
| concurrent_batch (5 batches of 4 items with error isolation) | 0.06ms | 200ms | PASS |

## Memory retention (20 iter, arrayBuffers axis is the gate; heap is informational)

| op | heapUsed Δ | arrayBuffers Δ | cap | gc exposed | verdict |
|---|---|---|---|---|---|
| rest_handler_workflow (10 axum + actix + rocket mixed) | 5760 B | 0 B | 102400 B | yes | PASS |
| middleware_chain_batch (5 tower layer chains) | 14872 B | 0 B | 102400 B | yes | PASS |
| route_error_handling (5 handler throw + catch) | 2552 B | 0 B | 102400 B | yes | PASS |
| retry_recovery (5 flaky async retry to success) | 5088 B | 0 B | 102400 B | yes | PASS |
| concurrent_batch (5 batches of 4 items with error isolation) | 4704 B | 0 B | 102400 B | yes | PASS |

## Detailed serial reports

### rest_handler_workflow (10 axum + actix + rocket mixed)

# Perf Report — rest_handler_workflow (10 axum + actix + rocket mixed).serial

| metric | value |
|---|---|
| iterations | 20 |
| warmup | 3 |
| p10 | 0.0050ms |
| p50 | 0.0053ms |
| p95 | 0.02ms |
| p99 | 0.03ms |
| mean | 0.0086ms |
| stdev | 0.0067ms |
| min | 0.0042ms |
| max | 0.03ms |
| total | 0.17ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.0050ms | 0.0052ms | -0.00025ms | -4.86% |
| p50 | 0.0053ms | 0.0057ms | -0.00042ms | -7.33% |
| p95 | 0.02ms | 0.02ms | +0.0045ms | +23.93% |
| p99 | 0.03ms | 0.03ms | +0.0014ms | +5.72% |
| mean | 0.0086ms | 0.0084ms | +0.00018ms | +2.10% |
| min | 0.0042ms | 0.0042ms | +0.000041ms | +0.98% |
| max | 0.03ms | 0.03ms | +0.00067ms | +2.51% |
| total | 0.17ms | 0.17ms | +0.0035ms | +2.10% |

### middleware_chain_batch (5 tower layer chains)

# Perf Report — middleware_chain_batch (5 tower layer chains).serial

| metric | value |
|---|---|
| iterations | 20 |
| warmup | 3 |
| p10 | 0.0033ms |
| p50 | 0.0036ms |
| p95 | 0.0059ms |
| p99 | 0.0089ms |
| mean | 0.0042ms |
| stdev | 0.0015ms |
| min | 0.0033ms |
| max | 0.0097ms |
| total | 0.08ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.0033ms | 0.0037ms | -0.00046ms | -12.21% |
| p50 | 0.0036ms | 0.0039ms | -0.00035ms | -9.05% |
| p95 | 0.0059ms | 0.0051ms | +0.00073ms | +14.28% |
| p99 | 0.0089ms | 0.0078ms | +0.0011ms | +14.28% |
| mean | 0.0042ms | 0.0043ms | -0.000042ms | -0.97% |
| min | 0.0033ms | 0.0037ms | -0.00042ms | -11.22% |
| max | 0.0097ms | 0.0085ms | +0.0012ms | +14.28% |
| total | 0.08ms | 0.09ms | -0.00083ms | -0.97% |

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
| stdev | 0.0048ms |
| min | 0.01ms |
| max | 0.03ms |
| total | 0.26ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.01ms | 0.01ms | -0.0000042ms | -0.04% |
| p50 | 0.01ms | 0.01ms | -0.00027ms | -2.40% |
| p95 | 0.02ms | 0.01ms | +0.0041ms | +30.22% |
| p99 | 0.03ms | 0.01ms | +0.01ms | +93.00% |
| mean | 0.01ms | 0.01ms | +0.00095ms | +7.99% |
| min | 0.01ms | 0.01ms | -0.000041ms | -0.39% |
| max | 0.03ms | 0.02ms | +0.02ms | +107.11% |
| total | 0.26ms | 0.24ms | +0.02ms | +7.99% |

### retry_recovery (5 flaky async retry to success)

# Perf Report — retry_recovery (5 flaky async retry to success).serial

| metric | value |
|---|---|
| iterations | 20 |
| warmup | 3 |
| p10 | 0.03ms |
| p50 | 0.03ms |
| p95 | 0.04ms |
| p99 | 0.05ms |
| mean | 0.03ms |
| stdev | 0.0051ms |
| min | 0.03ms |
| max | 0.05ms |
| total | 0.59ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.03ms | 0.03ms | +0.00015ms | +0.56% |
| p50 | 0.03ms | 0.03ms | +0.00038ms | +1.36% |
| p95 | 0.04ms | 0.04ms | +0.0026ms | +6.95% |
| p99 | 0.05ms | 0.04ms | +0.0075ms | +19.65% |
| mean | 0.03ms | 0.03ms | +0.00081ms | +2.81% |
| min | 0.03ms | 0.03ms | -0.000084ms | -0.32% |
| max | 0.05ms | 0.04ms | +0.0087ms | +22.78% |
| total | 0.59ms | 0.58ms | +0.02ms | +2.81% |

### concurrent_batch (5 batches of 4 items with error isolation)

# Perf Report — concurrent_batch (5 batches of 4 items with error isolation).serial

| metric | value |
|---|---|
| iterations | 20 |
| warmup | 3 |
| p10 | 0.0098ms |
| p50 | 0.01ms |
| p95 | 0.02ms |
| p99 | 0.02ms |
| mean | 0.01ms |
| stdev | 0.0027ms |
| min | 0.0097ms |
| max | 0.02ms |
| total | 0.22ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.0098ms | 0.0095ms | +0.00033ms | +3.49% |
| p50 | 0.01ms | 0.01ms | +0.000020ms | +0.20% |
| p95 | 0.02ms | 0.02ms | +0.0028ms | +17.68% |
| p99 | 0.02ms | 0.02ms | +0.00029ms | +1.58% |
| mean | 0.01ms | 0.01ms | +0.00013ms | +1.21% |
| min | 0.0097ms | 0.0092ms | +0.00050ms | +5.43% |
| max | 0.02ms | 0.02ms | -0.00033ms | -1.74% |
| total | 0.22ms | 0.22ms | +0.0027ms | +1.21% |

