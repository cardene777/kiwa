# Perf Suite — rust-lib-app-scenario

Threshold source: [docs/quality/perf-thresholds.md](../../quality/perf-thresholds)

測定系の分解能 = 0.00021ms (何もしない関数を同じ経路で呼んだ時の p10)。 回帰判定の絶対下限は既定でこの 2 倍 = 0.00042ms、 op ごとの実効値は下表の「下限」 列。

## Serial (concurrency = 1)

| op | p10 (回帰判定) | p95 (上限判定) | cap | 下限 | gate | regression |
|---|---|---|---|---|---|---|
| rest_handler_workflow (10 axum + actix + rocket mixed) | 0.0050ms | 0.02ms | 100ms | 0.00042ms | PASS | stable (p10 -5% (閾値未満)、 p95 +23% (裾は実行間の振れ幅と区別できないため判定には使わない)) — gate 無効 (regressionGate=false) |
| middleware_chain_batch (5 tower layer chains) | 0.0034ms | 0.0069ms | 100ms | 0.00042ms | PASS | stable (p10 -9% (閾値未満)、 p95 +35% (裾は実行間の振れ幅と区別できないため判定には使わない)) — gate 無効 (regressionGate=false) |
| route_error_handling (5 handler throw + catch) | 0.01ms | 0.02ms | 100ms | 0.00042ms | PASS | stable (p10 +2% (閾値未満)、 p95 +21% (裾は実行間の振れ幅と区別できないため判定には使わない)) — gate 無効 (regressionGate=false) |
| retry_recovery (5 flaky async retry to success) | 0.03ms | 0.03ms | 100ms | 0.00042ms | PASS | stable — gate 無効 (regressionGate=false) |
| concurrent_batch (5 batches of 4 items with error isolation) | 0.0092ms | 0.02ms | 100ms | 0.00042ms | PASS | stable — gate 無効 (regressionGate=false) |

## Concurrent p95 (concurrency = 4, 5 iter each)

| op | p95 | cap | gate |
|---|---|---|---|
| rest_handler_workflow (10 axum + actix + rocket mixed) | 0.03ms | 200ms | PASS |
| middleware_chain_batch (5 tower layer chains) | 0.02ms | 200ms | PASS |
| route_error_handling (5 handler throw + catch) | 0.06ms | 200ms | PASS |
| retry_recovery (5 flaky async retry to success) | 0.12ms | 200ms | PASS |
| concurrent_batch (5 batches of 4 items with error isolation) | 0.04ms | 200ms | PASS |

## Memory retention (20 iter, arrayBuffers axis is the gate; heap is informational)

| op | heapUsed Δ | arrayBuffers Δ | cap | gc exposed | verdict |
|---|---|---|---|---|---|
| rest_handler_workflow (10 axum + actix + rocket mixed) | 4120 B | 0 B | 102400 B | yes | PASS |
| middleware_chain_batch (5 tower layer chains) | 14792 B | 0 B | 102400 B | yes | PASS |
| route_error_handling (5 handler throw + catch) | 6392 B | 0 B | 102400 B | yes | PASS |
| retry_recovery (5 flaky async retry to success) | -2056 B | 0 B | 102400 B | yes | PASS |
| concurrent_batch (5 batches of 4 items with error isolation) | 3952 B | 0 B | 102400 B | yes | PASS |

## Detailed serial reports

### rest_handler_workflow (10 axum + actix + rocket mixed)

# Perf Report — rest_handler_workflow (10 axum + actix + rocket mixed).serial

| metric | value |
|---|---|
| iterations | 20 |
| warmup | 3 |
| p10 | 0.0050ms |
| p50 | 0.0052ms |
| p95 | 0.02ms |
| p99 | 0.03ms |
| mean | 0.0082ms |
| stdev | 0.0070ms |
| min | 0.0041ms |
| max | 0.03ms |
| total | 0.16ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.0050ms | 0.0052ms | -0.00026ms | -4.96% |
| p50 | 0.0052ms | 0.0057ms | -0.00052ms | -9.15% |
| p95 | 0.02ms | 0.02ms | +0.0043ms | +23.08% |
| p99 | 0.03ms | 0.03ms | +0.0039ms | +15.57% |
| mean | 0.0082ms | 0.0084ms | -0.00026ms | -3.11% |
| min | 0.0041ms | 0.0042ms | -0.000084ms | -2.02% |
| max | 0.03ms | 0.03ms | +0.0038ms | +14.24% |
| total | 0.16ms | 0.17ms | -0.0052ms | -3.11% |

### middleware_chain_batch (5 tower layer chains)

# Perf Report — middleware_chain_batch (5 tower layer chains).serial

| metric | value |
|---|---|
| iterations | 20 |
| warmup | 3 |
| p10 | 0.0034ms |
| p50 | 0.0035ms |
| p95 | 0.0069ms |
| p99 | 0.0084ms |
| mean | 0.0042ms |
| stdev | 0.0014ms |
| min | 0.0034ms |
| max | 0.0088ms |
| total | 0.08ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.0034ms | 0.0037ms | -0.00033ms | -8.91% |
| p50 | 0.0035ms | 0.0039ms | -0.00040ms | -10.12% |
| p95 | 0.0069ms | 0.0051ms | +0.0018ms | +34.99% |
| p99 | 0.0084ms | 0.0078ms | +0.00059ms | +7.61% |
| mean | 0.0042ms | 0.0043ms | -0.000056ms | -1.32% |
| min | 0.0034ms | 0.0037ms | -0.00029ms | -7.87% |
| max | 0.0088ms | 0.0085ms | +0.00029ms | +3.45% |
| total | 0.08ms | 0.09ms | -0.0011ms | -1.32% |

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
| p10 | 0.01ms | 0.01ms | +0.00016ms | +1.53% |
| p50 | 0.01ms | 0.01ms | -0.000041ms | -0.36% |
| p95 | 0.02ms | 0.01ms | +0.0029ms | +21.01% |
| p99 | 0.02ms | 0.01ms | +0.0029ms | +19.70% |
| mean | 0.01ms | 0.01ms | +0.00022ms | +1.87% |
| min | 0.01ms | 0.01ms | +0.00017ms | +1.58% |
| max | 0.02ms | 0.02ms | +0.0030ms | +19.40% |
| total | 0.24ms | 0.24ms | +0.0044ms | +1.87% |

### retry_recovery (5 flaky async retry to success)

# Perf Report — retry_recovery (5 flaky async retry to success).serial

| metric | value |
|---|---|
| iterations | 20 |
| warmup | 3 |
| p10 | 0.03ms |
| p50 | 0.03ms |
| p95 | 0.03ms |
| p99 | 0.04ms |
| mean | 0.03ms |
| stdev | 0.0030ms |
| min | 0.03ms |
| max | 0.04ms |
| total | 0.57ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.03ms | 0.03ms | -0.00013ms | -0.49% |
| p50 | 0.03ms | 0.03ms | -0.00031ms | -1.13% |
| p95 | 0.03ms | 0.04ms | -0.0026ms | -7.01% |
| p99 | 0.04ms | 0.04ms | -0.0021ms | -5.52% |
| mean | 0.03ms | 0.03ms | -0.00021ms | -0.74% |
| min | 0.03ms | 0.03ms | -0.00033ms | -1.27% |
| max | 0.04ms | 0.04ms | -0.0020ms | -5.15% |
| total | 0.57ms | 0.58ms | -0.0042ms | -0.74% |

### concurrent_batch (5 batches of 4 items with error isolation)

# Perf Report — concurrent_batch (5 batches of 4 items with error isolation).serial

| metric | value |
|---|---|
| iterations | 20 |
| warmup | 3 |
| p10 | 0.0092ms |
| p50 | 0.0097ms |
| p95 | 0.02ms |
| p99 | 0.02ms |
| mean | 0.01ms |
| stdev | 0.0023ms |
| min | 0.0091ms |
| max | 0.02ms |
| total | 0.21ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.0092ms | 0.0095ms | -0.00025ms | -2.65% |
| p50 | 0.0097ms | 0.01ms | -0.00058ms | -5.69% |
| p95 | 0.02ms | 0.02ms | +0.00060ms | +3.82% |
| p99 | 0.02ms | 0.02ms | -0.00098ms | -5.30% |
| mean | 0.01ms | 0.01ms | -0.00061ms | -5.48% |
| min | 0.0091ms | 0.0092ms | -0.00013ms | -1.37% |
| max | 0.02ms | 0.02ms | -0.0014ms | -7.18% |
| total | 0.21ms | 0.22ms | -0.01ms | -5.48% |

