# Perf Suite — rust-lib-app-scenario

Threshold source: [docs/quality/perf-thresholds.md](../../quality/perf-thresholds)

測定系の分解能 = 0.00025ms (何もしない関数を同じ経路で呼んだ時の p10)。 回帰判定の絶対下限は既定でこの 2 倍 = 0.00050ms、 op ごとの実効値は下表の「下限」 列。

## Serial (concurrency = 1)

| op | p10 (回帰判定) | p95 (上限判定) | cap | 下限 | gate | regression |
|---|---|---|---|---|---|---|
| rest_handler_workflow (10 axum + actix + rocket mixed) | 0.0056ms | 0.09ms | 100ms | 0.00050ms | PASS | stable (p10 +8% (閾値未満)、 p95 +404% (裾は実行間の振れ幅と区別できないため判定には使わない)) — gate 無効 (regressionGate=false) |
| middleware_chain_batch (5 tower layer chains) | 0.0050ms | 0.0087ms | 100ms | 0.00050ms | PASS | regressed — gate 無効 (regressionGate=false) |
| route_error_handling (5 handler throw + catch) | 0.01ms | 0.02ms | 100ms | 0.00050ms | PASS | stable (p10 +12% (閾値未満)、 p95 +37% (裾は実行間の振れ幅と区別できないため判定には使わない)) — gate 無効 (regressionGate=false) |
| retry_recovery (5 flaky async retry to success) | 0.03ms | 0.04ms | 100ms | 0.00050ms | PASS | stable — gate 無効 (regressionGate=false) |
| concurrent_batch (5 batches of 4 items with error isolation) | 0.01ms | 0.02ms | 100ms | 0.00050ms | PASS | stable — gate 無効 (regressionGate=false) |

## Concurrent p95 (concurrency = 4, 5 iter each)

| op | p95 | cap | gate |
|---|---|---|---|
| rest_handler_workflow (10 axum + actix + rocket mixed) | 0.26ms | 200ms | PASS |
| middleware_chain_batch (5 tower layer chains) | 0.03ms | 200ms | PASS |
| route_error_handling (5 handler throw + catch) | 0.06ms | 200ms | PASS |
| retry_recovery (5 flaky async retry to success) | 0.14ms | 200ms | PASS |
| concurrent_batch (5 batches of 4 items with error isolation) | 0.05ms | 200ms | PASS |

## Memory retention (20 iter, arrayBuffers axis is the gate; heap is informational)

| op | heapUsed Δ | arrayBuffers Δ | cap | gc exposed | verdict |
|---|---|---|---|---|---|
| rest_handler_workflow (10 axum + actix + rocket mixed) | -6112 B | -15090 B | 102400 B | yes | PASS |
| middleware_chain_batch (5 tower layer chains) | 5632 B | 0 B | 102400 B | yes | PASS |
| route_error_handling (5 handler throw + catch) | 6104 B | 0 B | 102400 B | yes | PASS |
| retry_recovery (5 flaky async retry to success) | -2152 B | 0 B | 102400 B | yes | PASS |
| concurrent_batch (5 batches of 4 items with error isolation) | 6952 B | 0 B | 102400 B | yes | PASS |

## Detailed serial reports

### rest_handler_workflow (10 axum + actix + rocket mixed)

# Perf Report — rest_handler_workflow (10 axum + actix + rocket mixed).serial

| metric | value |
|---|---|
| iterations | 20 |
| warmup | 3 |
| p10 | 0.0056ms |
| p50 | 0.0059ms |
| p95 | 0.09ms |
| p99 | 0.11ms |
| mean | 0.02ms |
| stdev | 0.03ms |
| min | 0.0055ms |
| max | 0.12ms |
| total | 0.44ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.0056ms | 0.0052ms | +0.00041ms | +7.83% |
| p50 | 0.0059ms | 0.0057ms | +0.00021ms | +3.66% |
| p95 | 0.09ms | 0.02ms | +0.08ms | +404.21% |
| p99 | 0.11ms | 0.03ms | +0.09ms | +345.18% |
| mean | 0.02ms | 0.0084ms | +0.01ms | +159.39% |
| min | 0.0055ms | 0.0042ms | +0.0014ms | +33.00% |
| max | 0.12ms | 0.03ms | +0.09ms | +334.74% |
| total | 0.44ms | 0.17ms | +0.27ms | +159.39% |

### middleware_chain_batch (5 tower layer chains)

# Perf Report — middleware_chain_batch (5 tower layer chains).serial

| metric | value |
|---|---|
| iterations | 20 |
| warmup | 3 |
| p10 | 0.0050ms |
| p50 | 0.0057ms |
| p95 | 0.0087ms |
| p99 | 0.01ms |
| mean | 0.0062ms |
| stdev | 0.0016ms |
| min | 0.0043ms |
| max | 0.01ms |
| total | 0.12ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.0050ms | 0.0037ms | +0.0013ms | +34.21% |
| p50 | 0.0057ms | 0.0039ms | +0.0017ms | +44.68% |
| p95 | 0.0087ms | 0.0051ms | +0.0035ms | +68.89% |
| p99 | 0.01ms | 0.0078ms | +0.0028ms | +36.02% |
| mean | 0.0062ms | 0.0043ms | +0.0019ms | +45.15% |
| min | 0.0043ms | 0.0037ms | +0.00063ms | +16.86% |
| max | 0.01ms | 0.0085ms | +0.0026ms | +31.04% |
| total | 0.12ms | 0.09ms | +0.04ms | +45.15% |

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
| stdev | 0.0030ms |
| min | 0.01ms |
| max | 0.02ms |
| total | 0.28ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.01ms | 0.01ms | +0.0013ms | +12.39% |
| p50 | 0.01ms | 0.01ms | +0.0014ms | +12.39% |
| p95 | 0.02ms | 0.01ms | +0.0051ms | +37.48% |
| p99 | 0.02ms | 0.01ms | +0.0079ms | +52.61% |
| mean | 0.01ms | 0.01ms | +0.0020ms | +16.91% |
| min | 0.01ms | 0.01ms | +0.0012ms | +11.41% |
| max | 0.02ms | 0.02ms | +0.0085ms | +56.01% |
| total | 0.28ms | 0.24ms | +0.04ms | +16.91% |

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
| mean | 0.04ms |
| stdev | 0.0055ms |
| min | 0.03ms |
| max | 0.04ms |
| total | 0.70ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.03ms | 0.03ms | +0.0034ms | +13.00% |
| p50 | 0.03ms | 0.03ms | +0.0071ms | +25.62% |
| p95 | 0.04ms | 0.04ms | +0.0067ms | +17.88% |
| p99 | 0.04ms | 0.04ms | +0.0067ms | +17.68% |
| mean | 0.04ms | 0.03ms | +0.0064ms | +22.08% |
| min | 0.03ms | 0.03ms | +0.0030ms | +11.62% |
| max | 0.04ms | 0.04ms | +0.0067ms | +17.63% |
| total | 0.70ms | 0.58ms | +0.13ms | +22.08% |

### concurrent_batch (5 batches of 4 items with error isolation)

# Perf Report — concurrent_batch (5 batches of 4 items with error isolation).serial

| metric | value |
|---|---|
| iterations | 20 |
| warmup | 3 |
| p10 | 0.01ms |
| p50 | 0.01ms |
| p95 | 0.02ms |
| p99 | 0.02ms |
| mean | 0.01ms |
| stdev | 0.0029ms |
| min | 0.01ms |
| max | 0.02ms |
| total | 0.25ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.01ms | 0.0095ms | +0.0012ms | +12.30% |
| p50 | 0.01ms | 0.01ms | +0.0011ms | +11.18% |
| p95 | 0.02ms | 0.02ms | +0.0029ms | +18.36% |
| p99 | 0.02ms | 0.02ms | +0.0020ms | +11.07% |
| mean | 0.01ms | 0.01ms | +0.0014ms | +12.45% |
| min | 0.01ms | 0.0092ms | +0.0013ms | +14.47% |
| max | 0.02ms | 0.02ms | +0.0018ms | +9.56% |
| total | 0.25ms | 0.22ms | +0.03ms | +12.45% |

