# Perf Suite — python-app-scenario

Threshold source: [docs/quality/perf-thresholds.md](../../quality/perf-thresholds)

測定系の分解能 = 0.00025ms (何もしない関数を同じ経路で呼んだ時の p10)。 回帰判定の絶対下限は既定でこの 2 倍 = 0.00050ms、 op ごとの実効値は下表の「下限」 列。

## Serial (concurrency = 1)

| op | p10 (回帰判定) | p95 (上限判定) | cap | 下限 | gate | regression |
|---|---|---|---|---|---|---|
| rest_workflow (10 dispatch across 4 frameworks) | 0.0073ms | 0.01ms | 100ms | 0.00050ms | PASS | improved — gate 無効 (regressionGate=false) |
| template_render_batch (5 Jinja2-like renders) | 0.0026ms | 0.0056ms | 100ms | 0.00050ms | PASS | stable — gate 無効 (regressionGate=false) |
| middleware_chain_error_handling (5 throw + catch) | 0.01ms | 0.02ms | 100ms | 0.00050ms | PASS | stable — gate 無効 (regressionGate=false) |
| retry_recovery (5 flaky async retry to success) | 0.03ms | 0.05ms | 100ms | 0.00050ms | PASS | stable — gate 無効 (regressionGate=false) |
| concurrent_batch (5 batches of 4 items with error isolation) | 0.0096ms | 0.01ms | 100ms | 0.00050ms | PASS | stable — gate 無効 (regressionGate=false) |

## Concurrent p95 (concurrency = 4, 5 iter each)

| op | p95 | cap | gate |
|---|---|---|---|
| rest_workflow (10 dispatch across 4 frameworks) | 0.05ms | 200ms | PASS |
| template_render_batch (5 Jinja2-like renders) | 0.01ms | 200ms | PASS |
| middleware_chain_error_handling (5 throw + catch) | 0.06ms | 200ms | PASS |
| retry_recovery (5 flaky async retry to success) | 0.14ms | 200ms | PASS |
| concurrent_batch (5 batches of 4 items with error isolation) | 0.05ms | 200ms | PASS |

## Memory retention (20 iter, arrayBuffers axis is the gate; heap is informational)

| op | heapUsed Δ | arrayBuffers Δ | cap | gc exposed | verdict |
|---|---|---|---|---|---|
| rest_workflow (10 dispatch across 4 frameworks) | -186672 B | 0 B | 102400 B | yes | PASS |
| template_render_batch (5 Jinja2-like renders) | -3816 B | 0 B | 102400 B | yes | PASS |
| middleware_chain_error_handling (5 throw + catch) | 1064 B | 0 B | 102400 B | yes | PASS |
| retry_recovery (5 flaky async retry to success) | 2736 B | 0 B | 102400 B | yes | PASS |
| concurrent_batch (5 batches of 4 items with error isolation) | 3344 B | 0 B | 102400 B | yes | PASS |

## Detailed serial reports

### rest_workflow (10 dispatch across 4 frameworks)

# Perf Report — rest_workflow (10 dispatch across 4 frameworks).serial

| metric | value |
|---|---|
| iterations | 20 |
| warmup | 3 |
| p10 | 0.0073ms |
| p50 | 0.0085ms |
| p95 | 0.01ms |
| p99 | 0.01ms |
| mean | 0.0090ms |
| stdev | 0.0021ms |
| min | 0.0073ms |
| max | 0.02ms |
| total | 0.18ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.0073ms | 0.0097ms | -0.0024ms | -24.51% |
| p50 | 0.0085ms | 0.010ms | -0.0015ms | -14.61% |
| p95 | 0.01ms | 0.01ms | -0.00027ms | -2.29% |
| p99 | 0.01ms | 0.01ms | +0.00061ms | +4.30% |
| mean | 0.0090ms | 0.01ms | -0.0014ms | -13.14% |
| min | 0.0073ms | 0.0083ms | -0.0011ms | -13.01% |
| max | 0.02ms | 0.01ms | +0.00083ms | +5.65% |
| total | 0.18ms | 0.21ms | -0.03ms | -13.14% |

### template_render_batch (5 Jinja2-like renders)

# Perf Report — template_render_batch (5 Jinja2-like renders).serial

| metric | value |
|---|---|
| iterations | 20 |
| warmup | 3 |
| p10 | 0.0026ms |
| p50 | 0.0026ms |
| p95 | 0.0056ms |
| p99 | 0.0064ms |
| mean | 0.0032ms |
| stdev | 0.0011ms |
| min | 0.0025ms |
| max | 0.0066ms |
| total | 0.06ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.0026ms | 0.0032ms | -0.00058ms | -18.28% |
| p50 | 0.0026ms | 0.0032ms | -0.00052ms | -16.47% |
| p95 | 0.0056ms | 0.0053ms | +0.00027ms | +5.04% |
| p99 | 0.0064ms | 0.0059ms | +0.00052ms | +8.82% |
| mean | 0.0032ms | 0.0036ms | -0.00038ms | -10.72% |
| min | 0.0025ms | 0.0030ms | -0.00050ms | -16.44% |
| max | 0.0066ms | 0.0060ms | +0.00058ms | +9.65% |
| total | 0.06ms | 0.07ms | -0.0076ms | -10.72% |

### middleware_chain_error_handling (5 throw + catch)

# Perf Report — middleware_chain_error_handling (5 throw + catch).serial

| metric | value |
|---|---|
| iterations | 20 |
| warmup | 3 |
| p10 | 0.01ms |
| p50 | 0.01ms |
| p95 | 0.02ms |
| p99 | 0.05ms |
| mean | 0.02ms |
| stdev | 0.01ms |
| min | 0.01ms |
| max | 0.06ms |
| total | 0.34ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.01ms | 0.01ms | +0.0015ms | +13.22% |
| p50 | 0.01ms | 0.01ms | +0.00090ms | +6.78% |
| p95 | 0.02ms | 0.02ms | -0.00040ms | -1.82% |
| p99 | 0.05ms | 0.02ms | +0.03ms | +136.28% |
| mean | 0.02ms | 0.01ms | +0.0027ms | +18.67% |
| min | 0.01ms | 0.01ms | +0.00013ms | +1.08% |
| max | 0.06ms | 0.02ms | +0.04ms | +170.74% |
| total | 0.34ms | 0.29ms | +0.05ms | +18.67% |

### retry_recovery (5 flaky async retry to success)

# Perf Report — retry_recovery (5 flaky async retry to success).serial

| metric | value |
|---|---|
| iterations | 20 |
| warmup | 3 |
| p10 | 0.03ms |
| p50 | 0.03ms |
| p95 | 0.05ms |
| p99 | 0.05ms |
| mean | 0.03ms |
| stdev | 0.0077ms |
| min | 0.03ms |
| max | 0.05ms |
| total | 0.66ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.03ms | 0.03ms | -0.0013ms | -4.60% |
| p50 | 0.03ms | 0.03ms | -0.0017ms | -5.60% |
| p95 | 0.05ms | 0.10ms | -0.05ms | -48.50% |
| p99 | 0.05ms | 0.19ms | -0.13ms | -71.13% |
| mean | 0.03ms | 0.04ms | -0.01ms | -26.21% |
| min | 0.03ms | 0.03ms | -0.0013ms | -4.58% |
| max | 0.05ms | 0.21ms | -0.15ms | -73.73% |
| total | 0.66ms | 0.89ms | -0.23ms | -26.21% |

### concurrent_batch (5 batches of 4 items with error isolation)

# Perf Report — concurrent_batch (5 batches of 4 items with error isolation).serial

| metric | value |
|---|---|
| iterations | 20 |
| warmup | 3 |
| p10 | 0.0096ms |
| p50 | 0.0098ms |
| p95 | 0.01ms |
| p99 | 0.01ms |
| mean | 0.01ms |
| stdev | 0.00060ms |
| min | 0.0095ms |
| max | 0.01ms |
| total | 0.20ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.0096ms | 0.01ms | -0.0013ms | -11.85% |
| p50 | 0.0098ms | 0.02ms | -0.0063ms | -38.99% |
| p95 | 0.01ms | 0.05ms | -0.04ms | -77.67% |
| p99 | 0.01ms | 0.09ms | -0.08ms | -87.45% |
| mean | 0.01ms | 0.02ms | -0.01ms | -58.02% |
| min | 0.0095ms | 0.01ms | -0.0011ms | -10.59% |
| max | 0.01ms | 0.11ms | -0.09ms | -88.62% |
| total | 0.20ms | 0.48ms | -0.28ms | -58.02% |

