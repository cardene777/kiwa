# Perf Suite — python-app-scenario

Threshold source: [docs/quality/perf-thresholds.md](../../quality/perf-thresholds)

測定系の分解能 = 0.00025ms (何もしない関数を同じ経路で呼んだ時の p10)。 回帰判定の絶対下限は既定でこの 2 倍 = 0.00050ms、 op ごとの実効値は下表の「下限」 列。

## Serial (concurrency = 1)

| op | p10 (回帰判定) | p95 (上限判定) | cap | 下限 | gate | regression |
|---|---|---|---|---|---|---|
| rest_workflow (10 dispatch across 4 frameworks) | 0.0073ms | 0.01ms | 100ms | 0.00050ms | PASS | improved — gate 無効 (regressionGate=false) |
| template_render_batch (5 Jinja2-like renders) | 0.0026ms | 0.0066ms | 100ms | 0.00050ms | PASS | stable (p10 -17% (閾値未満)、 p95 +25% (裾は実行間の振れ幅と区別できないため判定には使わない)) — gate 無効 (regressionGate=false) |
| middleware_chain_error_handling (5 throw + catch) | 0.01ms | 0.02ms | 100ms | 0.00050ms | PASS | stable — gate 無効 (regressionGate=false) |
| retry_recovery (5 flaky async retry to success) | 0.03ms | 0.03ms | 100ms | 0.00050ms | PASS | stable — gate 無効 (regressionGate=false) |
| concurrent_batch (5 batches of 4 items with error isolation) | 0.0094ms | 0.02ms | 100ms | 0.00050ms | PASS | stable — gate 無効 (regressionGate=false) |

## Concurrent p95 (concurrency = 4, 5 iter each)

| op | p95 | cap | gate |
|---|---|---|---|
| rest_workflow (10 dispatch across 4 frameworks) | 0.05ms | 200ms | PASS |
| template_render_batch (5 Jinja2-like renders) | 0.01ms | 200ms | PASS |
| middleware_chain_error_handling (5 throw + catch) | 0.06ms | 200ms | PASS |
| retry_recovery (5 flaky async retry to success) | 0.13ms | 200ms | PASS |
| concurrent_batch (5 batches of 4 items with error isolation) | 0.05ms | 200ms | PASS |

## Memory retention (20 iter, arrayBuffers axis is the gate; heap is informational)

| op | heapUsed Δ | arrayBuffers Δ | cap | gc exposed | verdict |
|---|---|---|---|---|---|
| rest_workflow (10 dispatch across 4 frameworks) | 5128 B | 0 B | 102400 B | yes | PASS |
| template_render_batch (5 Jinja2-like renders) | -2856 B | 0 B | 102400 B | yes | PASS |
| middleware_chain_error_handling (5 throw + catch) | 1168 B | 0 B | 102400 B | yes | PASS |
| retry_recovery (5 flaky async retry to success) | -247720 B | 0 B | 102400 B | yes | PASS |
| concurrent_batch (5 batches of 4 items with error isolation) | 3952 B | 0 B | 102400 B | yes | PASS |

## Detailed serial reports

### rest_workflow (10 dispatch across 4 frameworks)

# Perf Report — rest_workflow (10 dispatch across 4 frameworks).serial

| metric | value |
|---|---|
| iterations | 20 |
| warmup | 3 |
| p10 | 0.0073ms |
| p50 | 0.0077ms |
| p95 | 0.01ms |
| p99 | 0.01ms |
| mean | 0.0087ms |
| stdev | 0.0018ms |
| min | 0.0072ms |
| max | 0.01ms |
| total | 0.17ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.0073ms | 0.0097ms | -0.0024ms | -24.93% |
| p50 | 0.0077ms | 0.010ms | -0.0023ms | -23.17% |
| p95 | 0.01ms | 0.01ms | -0.00011ms | -0.88% |
| p99 | 0.01ms | 0.01ms | -0.0017ms | -12.12% |
| mean | 0.0087ms | 0.01ms | -0.0017ms | -16.00% |
| min | 0.0072ms | 0.0083ms | -0.0011ms | -13.51% |
| max | 0.01ms | 0.01ms | -0.0021ms | -14.41% |
| total | 0.17ms | 0.21ms | -0.03ms | -16.00% |

### template_render_batch (5 Jinja2-like renders)

# Perf Report — template_render_batch (5 Jinja2-like renders).serial

| metric | value |
|---|---|
| iterations | 20 |
| warmup | 3 |
| p10 | 0.0026ms |
| p50 | 0.0033ms |
| p95 | 0.0066ms |
| p99 | 0.0067ms |
| mean | 0.0039ms |
| stdev | 0.0015ms |
| min | 0.0026ms |
| max | 0.0067ms |
| total | 0.08ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.0026ms | 0.0032ms | -0.00054ms | -17.11% |
| p50 | 0.0033ms | 0.0032ms | +0.00015ms | +4.59% |
| p95 | 0.0066ms | 0.0053ms | +0.0013ms | +25.28% |
| p99 | 0.0067ms | 0.0059ms | +0.00077ms | +13.01% |
| mean | 0.0039ms | 0.0036ms | +0.00032ms | +8.97% |
| min | 0.0026ms | 0.0030ms | -0.00046ms | -15.06% |
| max | 0.0067ms | 0.0060ms | +0.00062ms | +10.33% |
| total | 0.08ms | 0.07ms | +0.0064ms | +8.97% |

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
| mean | 0.01ms |
| stdev | 0.0020ms |
| min | 0.01ms |
| max | 0.02ms |
| total | 0.29ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.01ms | 0.01ms | +0.0010ms | +8.58% |
| p50 | 0.01ms | 0.01ms | +0.00094ms | +7.10% |
| p95 | 0.02ms | 0.02ms | -0.0038ms | -17.41% |
| p99 | 0.02ms | 0.02ms | -0.0031ms | -14.19% |
| mean | 0.01ms | 0.01ms | +0.00019ms | +1.31% |
| min | 0.01ms | 0.01ms | -0.000083ms | -0.71% |
| max | 0.02ms | 0.02ms | -0.0029ms | -13.39% |
| total | 0.29ms | 0.29ms | +0.0037ms | +1.31% |

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
| stdev | 0.0034ms |
| min | 0.03ms |
| max | 0.04ms |
| total | 0.58ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.03ms | 0.03ms | -0.0030ms | -10.10% |
| p50 | 0.03ms | 0.03ms | -0.0033ms | -10.67% |
| p95 | 0.03ms | 0.10ms | -0.06ms | -64.05% |
| p99 | 0.04ms | 0.19ms | -0.15ms | -79.51% |
| mean | 0.03ms | 0.04ms | -0.02ms | -34.78% |
| min | 0.03ms | 0.03ms | -0.0030ms | -10.30% |
| max | 0.04ms | 0.21ms | -0.17ms | -81.29% |
| total | 0.58ms | 0.89ms | -0.31ms | -34.78% |

### concurrent_batch (5 batches of 4 items with error isolation)

# Perf Report — concurrent_batch (5 batches of 4 items with error isolation).serial

| metric | value |
|---|---|
| iterations | 20 |
| warmup | 3 |
| p10 | 0.0094ms |
| p50 | 0.01ms |
| p95 | 0.02ms |
| p99 | 0.02ms |
| mean | 0.01ms |
| stdev | 0.0035ms |
| min | 0.0092ms |
| max | 0.02ms |
| total | 0.23ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.0094ms | 0.01ms | -0.0015ms | -13.39% |
| p50 | 0.01ms | 0.02ms | -0.0059ms | -36.91% |
| p95 | 0.02ms | 0.05ms | -0.03ms | -60.93% |
| p99 | 0.02ms | 0.09ms | -0.07ms | -76.80% |
| mean | 0.01ms | 0.02ms | -0.01ms | -52.04% |
| min | 0.0092ms | 0.01ms | -0.0014ms | -12.94% |
| max | 0.02ms | 0.11ms | -0.08ms | -78.70% |
| total | 0.23ms | 0.48ms | -0.25ms | -52.04% |

