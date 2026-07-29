# Perf Suite — python-app-scenario

Threshold source: [docs/quality/perf-thresholds.md](../../quality/perf-thresholds)

測定系の分解能 = 0.00025ms (何もしない関数を同じ経路で呼んだ時の p10)。 回帰判定の絶対下限は既定でこの 2 倍 = 0.00049ms、 op ごとの実効値は下表の「下限」 列。

## Serial (concurrency = 1)

| op | p10 (回帰判定) | p95 (上限判定) | cap | 下限 | gate | regression |
|---|---|---|---|---|---|---|
| rest_workflow (10 dispatch across 4 frameworks) | 0.0075ms | 0.01ms | 100ms | 0.00049ms | PASS | improved — gate 無効 (regressionGate=false) |
| template_render_batch (5 Jinja2-like renders) | 0.0027ms | 0.0059ms | 100ms | 0.00049ms | PASS | stable — gate 無効 (regressionGate=false) |
| middleware_chain_error_handling (5 throw + catch) | 0.01ms | 0.02ms | 100ms | 0.00049ms | PASS | stable — gate 無効 (regressionGate=false) |
| retry_recovery (5 flaky async retry to success) | 0.03ms | 0.04ms | 100ms | 0.00049ms | PASS | stable — gate 無効 (regressionGate=false) |
| concurrent_batch (5 batches of 4 items with error isolation) | 0.0095ms | 0.02ms | 100ms | 0.00049ms | PASS | stable — gate 無効 (regressionGate=false) |

## Concurrent p95 (concurrency = 4, 5 iter each)

| op | p95 | cap | gate |
|---|---|---|---|
| rest_workflow (10 dispatch across 4 frameworks) | 0.10ms | 200ms | PASS |
| template_render_batch (5 Jinja2-like renders) | 0.01ms | 200ms | PASS |
| middleware_chain_error_handling (5 throw + catch) | 0.06ms | 200ms | PASS |
| retry_recovery (5 flaky async retry to success) | 0.14ms | 200ms | PASS |
| concurrent_batch (5 batches of 4 items with error isolation) | 0.06ms | 200ms | PASS |

## Memory retention (20 iter, arrayBuffers axis is the gate; heap is informational)

| op | heapUsed Δ | arrayBuffers Δ | cap | gc exposed | verdict |
|---|---|---|---|---|---|
| rest_workflow (10 dispatch across 4 frameworks) | 568 B | 0 B | 102400 B | yes | PASS |
| template_render_batch (5 Jinja2-like renders) | -200 B | 0 B | 102400 B | yes | PASS |
| middleware_chain_error_handling (5 throw + catch) | 1408 B | 0 B | 102400 B | yes | PASS |
| retry_recovery (5 flaky async retry to success) | -672 B | 0 B | 102400 B | yes | PASS |
| concurrent_batch (5 batches of 4 items with error isolation) | 2800 B | 0 B | 102400 B | yes | PASS |

## Detailed serial reports

### rest_workflow (10 dispatch across 4 frameworks)

# Perf Report — rest_workflow (10 dispatch across 4 frameworks).serial

| metric | value |
|---|---|
| iterations | 20 |
| warmup | 3 |
| p10 | 0.0075ms |
| p50 | 0.0088ms |
| p95 | 0.01ms |
| p99 | 0.02ms |
| mean | 0.0093ms |
| stdev | 0.0024ms |
| min | 0.0074ms |
| max | 0.02ms |
| total | 0.19ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.0075ms | 0.0097ms | -0.0022ms | -23.17% |
| p50 | 0.0088ms | 0.010ms | -0.0012ms | -11.69% |
| p95 | 0.01ms | 0.01ms | +0.00026ms | +2.17% |
| p99 | 0.02ms | 0.01ms | +0.0023ms | +16.33% |
| mean | 0.0093ms | 0.01ms | -0.0011ms | -10.51% |
| min | 0.0074ms | 0.0083ms | -0.00092ms | -11.02% |
| max | 0.02ms | 0.01ms | +0.0028ms | +19.21% |
| total | 0.19ms | 0.21ms | -0.02ms | -10.51% |

### template_render_batch (5 Jinja2-like renders)

# Perf Report — template_render_batch (5 Jinja2-like renders).serial

| metric | value |
|---|---|
| iterations | 20 |
| warmup | 3 |
| p10 | 0.0027ms |
| p50 | 0.0028ms |
| p95 | 0.0059ms |
| p99 | 0.0064ms |
| mean | 0.0032ms |
| stdev | 0.0011ms |
| min | 0.0026ms |
| max | 0.0065ms |
| total | 0.06ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.0027ms | 0.0032ms | -0.00049ms | -15.66% |
| p50 | 0.0028ms | 0.0032ms | -0.00040ms | -12.52% |
| p95 | 0.0059ms | 0.0053ms | +0.00066ms | +12.41% |
| p99 | 0.0064ms | 0.0059ms | +0.00050ms | +8.45% |
| mean | 0.0032ms | 0.0036ms | -0.00034ms | -9.61% |
| min | 0.0026ms | 0.0030ms | -0.00042ms | -13.68% |
| max | 0.0065ms | 0.0060ms | +0.00046ms | +7.58% |
| total | 0.06ms | 0.07ms | -0.0068ms | -9.61% |

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
| stdev | 0.0025ms |
| min | 0.01ms |
| max | 0.02ms |
| total | 0.29ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.01ms | 0.01ms | +0.0011ms | +9.16% |
| p50 | 0.01ms | 0.01ms | +0.00042ms | +3.16% |
| p95 | 0.02ms | 0.02ms | -0.0023ms | -10.47% |
| p99 | 0.02ms | 0.02ms | -0.0014ms | -6.53% |
| mean | 0.01ms | 0.01ms | +0.00043ms | +2.97% |
| min | 0.01ms | 0.01ms | +0.000042ms | +0.36% |
| max | 0.02ms | 0.02ms | -0.0012ms | -5.55% |
| total | 0.29ms | 0.29ms | +0.0085ms | +2.97% |

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
| stdev | 0.0035ms |
| min | 0.03ms |
| max | 0.04ms |
| total | 0.61ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.03ms | 0.03ms | -0.0019ms | -6.57% |
| p50 | 0.03ms | 0.03ms | -0.0024ms | -7.73% |
| p95 | 0.04ms | 0.10ms | -0.06ms | -62.02% |
| p99 | 0.04ms | 0.19ms | -0.15ms | -79.97% |
| mean | 0.03ms | 0.04ms | -0.01ms | -31.95% |
| min | 0.03ms | 0.03ms | -0.0020ms | -6.87% |
| max | 0.04ms | 0.21ms | -0.17ms | -82.03% |
| total | 0.61ms | 0.89ms | -0.29ms | -31.95% |

### concurrent_batch (5 batches of 4 items with error isolation)

# Perf Report — concurrent_batch (5 batches of 4 items with error isolation).serial

| metric | value |
|---|---|
| iterations | 20 |
| warmup | 3 |
| p10 | 0.0095ms |
| p50 | 0.0099ms |
| p95 | 0.02ms |
| p99 | 0.02ms |
| mean | 0.01ms |
| stdev | 0.0031ms |
| min | 0.0095ms |
| max | 0.02ms |
| total | 0.22ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.0095ms | 0.01ms | -0.0014ms | -12.58% |
| p50 | 0.0099ms | 0.02ms | -0.0061ms | -38.21% |
| p95 | 0.02ms | 0.05ms | -0.03ms | -67.56% |
| p99 | 0.02ms | 0.09ms | -0.07ms | -77.55% |
| mean | 0.01ms | 0.02ms | -0.01ms | -53.39% |
| min | 0.0095ms | 0.01ms | -0.0012ms | -10.98% |
| max | 0.02ms | 0.11ms | -0.08ms | -78.74% |
| total | 0.22ms | 0.48ms | -0.26ms | -53.39% |

