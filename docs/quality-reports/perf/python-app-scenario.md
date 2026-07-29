# Perf Suite — python-app-scenario

Threshold source: [docs/quality/perf-thresholds.md](../../quality/perf-thresholds)

測定系の分解能 = 0.00025ms (何もしない関数を同じ経路で呼んだ時の p10)。 回帰判定の絶対下限は既定でこの 2 倍 = 0.00050ms、 op ごとの実効値は下表の「下限」 列。

## Serial (concurrency = 1)

| op | p10 (回帰判定) | p95 (上限判定) | cap | 下限 | gate | regression |
|---|---|---|---|---|---|---|
| rest_workflow (10 dispatch across 4 frameworks) | 0.0095ms | 0.01ms | 100ms | 0.00050ms | PASS | stable — gate 無効 (regressionGate=false) |
| template_render_batch (5 Jinja2-like renders) | 0.0030ms | 0.0070ms | 100ms | 0.00050ms | PASS | stable (p10 -5% (閾値未満)、 p95 +33% (裾は実行間の振れ幅と区別できないため判定には使わない)) — gate 無効 (regressionGate=false) |
| middleware_chain_error_handling (5 throw + catch) | 0.01ms | 0.02ms | 100ms | 0.00050ms | PASS | stable — gate 無効 (regressionGate=false) |
| retry_recovery (5 flaky async retry to success) | 0.03ms | 0.04ms | 100ms | 0.00050ms | PASS | stable — gate 無効 (regressionGate=false) |
| concurrent_batch (5 batches of 4 items with error isolation) | 0.01ms | 0.01ms | 100ms | 0.00050ms | PASS | stable — gate 無効 (regressionGate=false) |

## Concurrent p95 (concurrency = 4, 5 iter each)

| op | p95 | cap | gate |
|---|---|---|---|
| rest_workflow (10 dispatch across 4 frameworks) | 0.05ms | 200ms | PASS |
| template_render_batch (5 Jinja2-like renders) | 0.02ms | 200ms | PASS |
| middleware_chain_error_handling (5 throw + catch) | 0.07ms | 200ms | PASS |
| retry_recovery (5 flaky async retry to success) | 0.16ms | 200ms | PASS |
| concurrent_batch (5 batches of 4 items with error isolation) | 0.05ms | 200ms | PASS |

## Memory retention (20 iter, arrayBuffers axis is the gate; heap is informational)

| op | heapUsed Δ | arrayBuffers Δ | cap | gc exposed | verdict |
|---|---|---|---|---|---|
| rest_workflow (10 dispatch across 4 frameworks) | 12456 B | 0 B | 102400 B | yes | PASS |
| template_render_batch (5 Jinja2-like renders) | -3280 B | 0 B | 102400 B | yes | PASS |
| middleware_chain_error_handling (5 throw + catch) | 848 B | 0 B | 102400 B | yes | PASS |
| retry_recovery (5 flaky async retry to success) | 12168 B | 0 B | 102400 B | yes | PASS |
| concurrent_batch (5 batches of 4 items with error isolation) | 3944 B | 0 B | 102400 B | yes | PASS |

## Detailed serial reports

### rest_workflow (10 dispatch across 4 frameworks)

# Perf Report — rest_workflow (10 dispatch across 4 frameworks).serial

| metric | value |
|---|---|
| iterations | 20 |
| warmup | 3 |
| p10 | 0.0095ms |
| p50 | 0.0099ms |
| p95 | 0.01ms |
| p99 | 0.02ms |
| mean | 0.01ms |
| stdev | 0.0018ms |
| min | 0.0080ms |
| max | 0.02ms |
| total | 0.21ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.0095ms | 0.0097ms | -0.00022ms | -2.23% |
| p50 | 0.0099ms | 0.010ms | -0.00013ms | -1.25% |
| p95 | 0.01ms | 0.01ms | +0.00095ms | +7.92% |
| p99 | 0.02ms | 0.01ms | +0.0021ms | +14.95% |
| mean | 0.01ms | 0.01ms | +0.000019ms | +0.18% |
| min | 0.0080ms | 0.0083ms | -0.00037ms | -4.50% |
| max | 0.02ms | 0.01ms | +0.0024ms | +16.38% |
| total | 0.21ms | 0.21ms | +0.00038ms | +0.18% |

### template_render_batch (5 Jinja2-like renders)

# Perf Report — template_render_batch (5 Jinja2-like renders).serial

| metric | value |
|---|---|
| iterations | 20 |
| warmup | 3 |
| p10 | 0.0030ms |
| p50 | 0.0042ms |
| p95 | 0.0070ms |
| p99 | 0.0084ms |
| mean | 0.0043ms |
| stdev | 0.0015ms |
| min | 0.0028ms |
| max | 0.0088ms |
| total | 0.09ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.0030ms | 0.0032ms | -0.00016ms | -5.12% |
| p50 | 0.0042ms | 0.0032ms | +0.0010ms | +31.58% |
| p95 | 0.0070ms | 0.0053ms | +0.0018ms | +33.27% |
| p99 | 0.0084ms | 0.0059ms | +0.0026ms | +43.30% |
| mean | 0.0043ms | 0.0036ms | +0.00071ms | +19.88% |
| min | 0.0028ms | 0.0030ms | -0.00021ms | -6.81% |
| max | 0.0088ms | 0.0060ms | +0.0027ms | +45.50% |
| total | 0.09ms | 0.07ms | +0.01ms | +19.88% |

### middleware_chain_error_handling (5 throw + catch)

# Perf Report — middleware_chain_error_handling (5 throw + catch).serial

| metric | value |
|---|---|
| iterations | 20 |
| warmup | 3 |
| p10 | 0.01ms |
| p50 | 0.01ms |
| p95 | 0.02ms |
| p99 | 0.02ms |
| mean | 0.02ms |
| stdev | 0.0021ms |
| min | 0.01ms |
| max | 0.02ms |
| total | 0.31ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.01ms | 0.01ms | +0.0018ms | +15.21% |
| p50 | 0.01ms | 0.01ms | +0.0013ms | +9.94% |
| p95 | 0.02ms | 0.02ms | -0.0023ms | -10.79% |
| p99 | 0.02ms | 0.02ms | -0.0019ms | -8.89% |
| mean | 0.02ms | 0.01ms | +0.0010ms | +7.22% |
| min | 0.01ms | 0.01ms | +0.00071ms | +6.10% |
| max | 0.02ms | 0.02ms | -0.0018ms | -8.42% |
| total | 0.31ms | 0.29ms | +0.02ms | +7.22% |

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
| stdev | 0.0037ms |
| min | 0.03ms |
| max | 0.04ms |
| total | 0.61ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.03ms | 0.03ms | -0.0028ms | -9.49% |
| p50 | 0.03ms | 0.03ms | -0.0010ms | -3.33% |
| p95 | 0.04ms | 0.10ms | -0.06ms | -60.78% |
| p99 | 0.04ms | 0.19ms | -0.15ms | -79.14% |
| mean | 0.03ms | 0.04ms | -0.01ms | -32.06% |
| min | 0.03ms | 0.03ms | -0.0027ms | -9.16% |
| max | 0.04ms | 0.21ms | -0.17ms | -81.25% |
| total | 0.61ms | 0.89ms | -0.29ms | -32.06% |

### concurrent_batch (5 batches of 4 items with error isolation)

# Perf Report — concurrent_batch (5 batches of 4 items with error isolation).serial

| metric | value |
|---|---|
| iterations | 20 |
| warmup | 3 |
| p10 | 0.01ms |
| p50 | 0.01ms |
| p95 | 0.01ms |
| p99 | 0.01ms |
| mean | 0.01ms |
| stdev | 0.00067ms |
| min | 0.01ms |
| max | 0.01ms |
| total | 0.22ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.01ms | 0.01ms | -0.00062ms | -5.71% |
| p50 | 0.01ms | 0.02ms | -0.0056ms | -34.59% |
| p95 | 0.01ms | 0.05ms | -0.04ms | -76.55% |
| p99 | 0.01ms | 0.09ms | -0.08ms | -86.55% |
| mean | 0.01ms | 0.02ms | -0.01ms | -54.63% |
| min | 0.01ms | 0.01ms | -0.00050ms | -4.71% |
| max | 0.01ms | 0.11ms | -0.09ms | -87.74% |
| total | 0.22ms | 0.48ms | -0.26ms | -54.63% |

