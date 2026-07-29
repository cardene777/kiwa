# Perf Suite — rust-lib-app-scenario

Threshold source: [docs/quality/perf-thresholds.md](../../quality/perf-thresholds)

測定系の分解能 = 0.00025ms (何もしない関数を同じ経路で呼んだ時の p10)。 回帰判定の絶対下限は既定でこの 2 倍 = 0.00050ms、 op ごとの実効値は下表の「下限」 列。

## Serial (concurrency = 1)

| op | p10 (回帰判定) | p95 (上限判定) | cap | 下限 | gate | regression |
|---|---|---|---|---|---|---|
| rest_handler_workflow (10 axum + actix + rocket mixed) | 0.0044ms | 0.02ms | 100ms | 0.00050ms | PASS | stable — gate 無効 (regressionGate=false) |
| middleware_chain_batch (5 tower layer chains) | 0.0043ms | 0.0071ms | 100ms | 0.00050ms | PASS | stable (p10 +13% (閾値未満)、 p95 +37% (裾は実行間の振れ幅と区別できないため判定には使わない)) — gate 無効 (regressionGate=false) |
| route_error_handling (5 handler throw + catch) | 0.01ms | 0.02ms | 100ms | 0.00050ms | PASS | stable (p10 +1% (閾値未満)、 p95 +24% (裾は実行間の振れ幅と区別できないため判定には使わない)) — gate 無効 (regressionGate=false) |
| retry_recovery (5 flaky async retry to success) | 0.03ms | 0.04ms | 100ms | 0.00050ms | PASS | stable — gate 無効 (regressionGate=false) |
| concurrent_batch (5 batches of 4 items with error isolation) | 0.0095ms | 0.02ms | 100ms | 0.00050ms | PASS | stable — gate 無効 (regressionGate=false) |

## Concurrent p95 (concurrency = 4, 5 iter each)

| op | p95 | cap | gate |
|---|---|---|---|
| rest_handler_workflow (10 axum + actix + rocket mixed) | 0.02ms | 200ms | PASS |
| middleware_chain_batch (5 tower layer chains) | 0.03ms | 200ms | PASS |
| route_error_handling (5 handler throw + catch) | 0.06ms | 200ms | PASS |
| retry_recovery (5 flaky async retry to success) | 0.12ms | 200ms | PASS |
| concurrent_batch (5 batches of 4 items with error isolation) | 0.04ms | 200ms | PASS |

## Memory retention (20 iter, arrayBuffers axis is the gate; heap is informational)

| op | heapUsed Δ | arrayBuffers Δ | cap | gc exposed | verdict |
|---|---|---|---|---|---|
| rest_handler_workflow (10 axum + actix + rocket mixed) | 4232 B | 0 B | 102400 B | yes | PASS |
| middleware_chain_batch (5 tower layer chains) | 6528 B | 0 B | 102400 B | yes | PASS |
| route_error_handling (5 handler throw + catch) | 768 B | 0 B | 102400 B | yes | PASS |
| retry_recovery (5 flaky async retry to success) | -3064 B | 0 B | 102400 B | yes | PASS |
| concurrent_batch (5 batches of 4 items with error isolation) | 5888 B | 0 B | 102400 B | yes | PASS |

## Detailed serial reports

### rest_handler_workflow (10 axum + actix + rocket mixed)

# Perf Report — rest_handler_workflow (10 axum + actix + rocket mixed).serial

| metric | value |
|---|---|
| iterations | 20 |
| warmup | 3 |
| p10 | 0.0044ms |
| p50 | 0.0054ms |
| p95 | 0.02ms |
| p99 | 0.02ms |
| mean | 0.0082ms |
| stdev | 0.0059ms |
| min | 0.0040ms |
| max | 0.03ms |
| total | 0.16ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.0044ms | 0.0052ms | -0.00077ms | -14.69% |
| p50 | 0.0054ms | 0.0057ms | -0.00033ms | -5.86% |
| p95 | 0.02ms | 0.02ms | -0.00057ms | -3.02% |
| p99 | 0.02ms | 0.03ms | -0.00035ms | -1.38% |
| mean | 0.0082ms | 0.0084ms | -0.00020ms | -2.42% |
| min | 0.0040ms | 0.0042ms | -0.00021ms | -5.02% |
| max | 0.03ms | 0.03ms | -0.00029ms | -1.09% |
| total | 0.16ms | 0.17ms | -0.0041ms | -2.42% |

### middleware_chain_batch (5 tower layer chains)

# Perf Report — middleware_chain_batch (5 tower layer chains).serial

| metric | value |
|---|---|
| iterations | 20 |
| warmup | 3 |
| p10 | 0.0043ms |
| p50 | 0.0047ms |
| p95 | 0.0071ms |
| p99 | 0.01ms |
| mean | 0.0054ms |
| stdev | 0.0026ms |
| min | 0.0040ms |
| max | 0.02ms |
| total | 0.11ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.0043ms | 0.0037ms | +0.00050ms | +13.33% |
| p50 | 0.0047ms | 0.0039ms | +0.00077ms | +19.68% |
| p95 | 0.0071ms | 0.0051ms | +0.0019ms | +37.40% |
| p99 | 0.01ms | 0.0078ms | +0.0064ms | +81.92% |
| mean | 0.0054ms | 0.0043ms | +0.0011ms | +25.38% |
| min | 0.0040ms | 0.0037ms | +0.00029ms | +7.87% |
| max | 0.02ms | 0.0085ms | +0.0075ms | +88.67% |
| total | 0.11ms | 0.09ms | +0.02ms | +25.38% |

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
| stdev | 0.0021ms |
| min | 0.01ms |
| max | 0.02ms |
| total | 0.24ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.01ms | 0.01ms | +0.000075ms | +0.70% |
| p50 | 0.01ms | 0.01ms | -0.00021ms | -1.85% |
| p95 | 0.02ms | 0.01ms | +0.0033ms | +23.83% |
| p99 | 0.02ms | 0.01ms | +0.0023ms | +15.08% |
| mean | 0.01ms | 0.01ms | +0.00020ms | +1.67% |
| min | 0.01ms | 0.01ms | -0.00013ms | -1.18% |
| max | 0.02ms | 0.02ms | +0.0020ms | +13.11% |
| total | 0.24ms | 0.24ms | +0.0040ms | +1.67% |

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
| stdev | 0.0050ms |
| min | 0.03ms |
| max | 0.05ms |
| total | 0.59ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.03ms | 0.03ms | +0.00011ms | +0.41% |
| p50 | 0.03ms | 0.03ms | -0.00044ms | -1.58% |
| p95 | 0.04ms | 0.04ms | +0.0011ms | +2.81% |
| p99 | 0.04ms | 0.04ms | +0.0063ms | +16.54% |
| mean | 0.03ms | 0.03ms | +0.00049ms | +1.71% |
| min | 0.03ms | 0.03ms | 0.00ms | 0.00% |
| max | 0.05ms | 0.04ms | +0.0076ms | +19.93% |
| total | 0.59ms | 0.58ms | +0.0098ms | +1.71% |

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
| stdev | 0.0026ms |
| min | 0.0093ms |
| max | 0.02ms |
| total | 0.23ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.0095ms | 0.0095ms | +0.000034ms | +0.36% |
| p50 | 0.01ms | 0.01ms | -0.00010ms | -1.02% |
| p95 | 0.02ms | 0.02ms | +0.00094ms | +5.94% |
| p99 | 0.02ms | 0.02ms | -0.0013ms | -6.92% |
| mean | 0.01ms | 0.01ms | +0.00036ms | +3.26% |
| min | 0.0093ms | 0.0092ms | +0.00012ms | +1.35% |
| max | 0.02ms | 0.02ms | -0.0018ms | -9.57% |
| total | 0.23ms | 0.22ms | +0.0072ms | +3.26% |

