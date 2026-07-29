# Perf Suite — rust-lib-app-scenario

Threshold source: [docs/quality/perf-thresholds.md](../../quality/perf-thresholds)

測定系の分解能 = 0.00025ms (何もしない関数を同じ経路で呼んだ時の p10)。 回帰判定の絶対下限は既定でこの 2 倍 = 0.00050ms、 op ごとの実効値は下表の「下限」 列。

## Serial (concurrency = 1)

| op | p10 (回帰判定) | p95 (上限判定) | cap | 下限 | gate | regression |
|---|---|---|---|---|---|---|
| rest_handler_workflow (10 axum + actix + rocket mixed) | 0.0051ms | 0.03ms | 100ms | 0.00050ms | PASS | stable (p10 -3% (閾値未満)、 p95 +38% (裾は実行間の振れ幅と区別できないため判定には使わない)) — gate 無効 (regressionGate=false) |
| middleware_chain_batch (5 tower layer chains) | 0.0034ms | 0.0073ms | 100ms | 0.00050ms | PASS | stable (p10 -9% (閾値未満)、 p95 +43% (裾は実行間の振れ幅と区別できないため判定には使わない)) — gate 無効 (regressionGate=false) |
| route_error_handling (5 handler throw + catch) | 0.01ms | 0.02ms | 100ms | 0.00050ms | PASS | stable — gate 無効 (regressionGate=false) |
| retry_recovery (5 flaky async retry to success) | 0.03ms | 0.08ms | 100ms | 0.00050ms | PASS | stable (p10 -1% (閾値未満)、 p95 +112% (裾は実行間の振れ幅と区別できないため判定には使わない)) — gate 無効 (regressionGate=false) |
| concurrent_batch (5 batches of 4 items with error isolation) | 0.0095ms | 0.02ms | 100ms | 0.00050ms | PASS | stable — gate 無効 (regressionGate=false) |

## Concurrent p95 (concurrency = 4, 5 iter each)

| op | p95 | cap | gate |
|---|---|---|---|
| rest_handler_workflow (10 axum + actix + rocket mixed) | 0.02ms | 200ms | PASS |
| middleware_chain_batch (5 tower layer chains) | 0.02ms | 200ms | PASS |
| route_error_handling (5 handler throw + catch) | 0.06ms | 200ms | PASS |
| retry_recovery (5 flaky async retry to success) | 0.12ms | 200ms | PASS |
| concurrent_batch (5 batches of 4 items with error isolation) | 0.04ms | 200ms | PASS |

## Memory retention (20 iter, arrayBuffers axis is the gate; heap is informational)

| op | heapUsed Δ | arrayBuffers Δ | cap | gc exposed | verdict |
|---|---|---|---|---|---|
| rest_handler_workflow (10 axum + actix + rocket mixed) | 4560 B | 0 B | 102400 B | yes | PASS |
| middleware_chain_batch (5 tower layer chains) | 6608 B | 0 B | 102400 B | yes | PASS |
| route_error_handling (5 handler throw + catch) | 4920 B | 0 B | 102400 B | yes | PASS |
| retry_recovery (5 flaky async retry to success) | -2328 B | 0 B | 102400 B | yes | PASS |
| concurrent_batch (5 batches of 4 items with error isolation) | 7224 B | 0 B | 102400 B | yes | PASS |

## Detailed serial reports

### rest_handler_workflow (10 axum + actix + rocket mixed)

# Perf Report — rest_handler_workflow (10 axum + actix + rocket mixed).serial

| metric | value |
|---|---|
| iterations | 20 |
| warmup | 3 |
| p10 | 0.0051ms |
| p50 | 0.0055ms |
| p95 | 0.03ms |
| p99 | 0.03ms |
| mean | 0.0085ms |
| stdev | 0.0069ms |
| min | 0.0040ms |
| max | 0.03ms |
| total | 0.17ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.0051ms | 0.0052ms | -0.00014ms | -2.63% |
| p50 | 0.0055ms | 0.0057ms | -0.00023ms | -4.03% |
| p95 | 0.03ms | 0.02ms | +0.0072ms | +38.01% |
| p99 | 0.03ms | 0.03ms | +0.0019ms | +7.70% |
| mean | 0.0085ms | 0.0084ms | +0.000021ms | +0.25% |
| min | 0.0040ms | 0.0042ms | -0.00013ms | -3.00% |
| max | 0.03ms | 0.03ms | +0.00063ms | +2.35% |
| total | 0.17ms | 0.17ms | +0.00042ms | +0.25% |

### middleware_chain_batch (5 tower layer chains)

# Perf Report — middleware_chain_batch (5 tower layer chains).serial

| metric | value |
|---|---|
| iterations | 20 |
| warmup | 3 |
| p10 | 0.0034ms |
| p50 | 0.0049ms |
| p95 | 0.0073ms |
| p99 | 0.0090ms |
| mean | 0.0050ms |
| stdev | 0.0017ms |
| min | 0.0034ms |
| max | 0.0094ms |
| total | 0.10ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.0034ms | 0.0037ms | -0.00033ms | -8.88% |
| p50 | 0.0049ms | 0.0039ms | +0.0010ms | +26.04% |
| p95 | 0.0073ms | 0.0051ms | +0.0022ms | +42.59% |
| p99 | 0.0090ms | 0.0078ms | +0.0012ms | +15.45% |
| mean | 0.0050ms | 0.0043ms | +0.00072ms | +16.95% |
| min | 0.0034ms | 0.0037ms | -0.00029ms | -7.87% |
| max | 0.0094ms | 0.0085ms | +0.00096ms | +11.33% |
| total | 0.10ms | 0.09ms | +0.01ms | +16.95% |

### route_error_handling (5 handler throw + catch)

# Perf Report — route_error_handling (5 handler throw + catch).serial

| metric | value |
|---|---|
| iterations | 20 |
| warmup | 3 |
| p10 | 0.01ms |
| p50 | 0.01ms |
| p95 | 0.02ms |
| p99 | 0.02ms |
| mean | 0.01ms |
| stdev | 0.0020ms |
| min | 0.01ms |
| max | 0.02ms |
| total | 0.24ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.01ms | 0.01ms | +0.000058ms | +0.55% |
| p50 | 0.01ms | 0.01ms | -0.00010ms | -0.92% |
| p95 | 0.02ms | 0.01ms | +0.0026ms | +19.16% |
| p99 | 0.02ms | 0.01ms | +0.0020ms | +13.56% |
| mean | 0.01ms | 0.01ms | +0.000081ms | +0.69% |
| min | 0.01ms | 0.01ms | -0.00013ms | -1.18% |
| max | 0.02ms | 0.02ms | +0.0019ms | +12.30% |
| total | 0.24ms | 0.24ms | +0.0016ms | +0.69% |

### retry_recovery (5 flaky async retry to success)

# Perf Report — retry_recovery (5 flaky async retry to success).serial

| metric | value |
|---|---|
| iterations | 20 |
| warmup | 3 |
| p10 | 0.03ms |
| p50 | 0.03ms |
| p95 | 0.08ms |
| p99 | 0.16ms |
| mean | 0.04ms |
| stdev | 0.03ms |
| min | 0.03ms |
| max | 0.17ms |
| total | 0.82ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.03ms | 0.03ms | -0.00024ms | -0.91% |
| p50 | 0.03ms | 0.03ms | +0.00067ms | +2.41% |
| p95 | 0.08ms | 0.04ms | +0.04ms | +112.19% |
| p99 | 0.16ms | 0.04ms | +0.12ms | +310.29% |
| mean | 0.04ms | 0.03ms | +0.01ms | +42.61% |
| min | 0.03ms | 0.03ms | -0.00067ms | -2.55% |
| max | 0.17ms | 0.04ms | +0.14ms | +359.14% |
| total | 0.82ms | 0.58ms | +0.25ms | +42.61% |

### concurrent_batch (5 batches of 4 items with error isolation)

# Perf Report — concurrent_batch (5 batches of 4 items with error isolation).serial

| metric | value |
|---|---|
| iterations | 20 |
| warmup | 3 |
| p10 | 0.0095ms |
| p50 | 0.01ms |
| p95 | 0.02ms |
| p99 | 0.02ms |
| mean | 0.01ms |
| stdev | 0.0021ms |
| min | 0.0094ms |
| max | 0.02ms |
| total | 0.21ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.0095ms | 0.0095ms | +0.0000050ms | +0.05% |
| p50 | 0.01ms | 0.01ms | -0.00019ms | -1.83% |
| p95 | 0.02ms | 0.02ms | +0.00076ms | +4.84% |
| p99 | 0.02ms | 0.02ms | -0.0015ms | -8.37% |
| mean | 0.01ms | 0.01ms | -0.00033ms | -3.00% |
| min | 0.0094ms | 0.0092ms | +0.00021ms | +2.25% |
| max | 0.02ms | 0.02ms | -0.0021ms | -11.09% |
| total | 0.21ms | 0.22ms | -0.0066ms | -3.00% |

