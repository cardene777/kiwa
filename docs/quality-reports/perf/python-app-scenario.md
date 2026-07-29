# Perf Suite — python-app-scenario

Threshold source: [docs/quality/perf-thresholds.md](../../quality/perf-thresholds)

測定系の分解能 = 0.00029ms (何もしない関数を同じ経路で呼んだ時の p10)。 回帰判定の絶対下限は既定でこの 2 倍 = 0.00058ms、 op ごとの実効値は下表の「下限」 列。

## Serial (concurrency = 1)

| op | p10 (回帰判定) | p95 (上限判定) | cap | 下限 | gate | regression |
|---|---|---|---|---|---|---|
| rest_workflow (10 dispatch across 4 frameworks) | 0.0085ms | 0.01ms | 100ms | 0.00058ms | PASS | stable — gate 無効 (regressionGate=false) |
| template_render_batch (5 Jinja2-like renders) | 0.0034ms | 0.0066ms | 100ms | 0.00058ms | PASS | stable (p10 +8% (閾値未満)、 p95 +24% (裾は実行間の振れ幅と区別できないため判定には使わない)) — gate 無効 (regressionGate=false) |
| middleware_chain_error_handling (5 throw + catch) | 0.01ms | 0.02ms | 100ms | 0.00058ms | PASS | stable — gate 無効 (regressionGate=false) |
| retry_recovery (5 flaky async retry to success) | 0.03ms | 0.04ms | 100ms | 0.00058ms | PASS | stable — gate 無効 (regressionGate=false) |
| concurrent_batch (5 batches of 4 items with error isolation) | 0.0096ms | 0.08ms | 100ms | 0.00058ms | PASS | stable (p10 -12% (閾値未満)、 p95 +67% (裾は実行間の振れ幅と区別できないため判定には使わない)) — gate 無効 (regressionGate=false) |

## Concurrent p95 (concurrency = 4, 5 iter each)

| op | p95 | cap | gate |
|---|---|---|---|
| rest_workflow (10 dispatch across 4 frameworks) | 0.05ms | 200ms | PASS |
| template_render_batch (5 Jinja2-like renders) | 0.01ms | 200ms | PASS |
| middleware_chain_error_handling (5 throw + catch) | 0.05ms | 200ms | PASS |
| retry_recovery (5 flaky async retry to success) | 0.16ms | 200ms | PASS |
| concurrent_batch (5 batches of 4 items with error isolation) | 0.05ms | 200ms | PASS |

## Memory retention (20 iter, arrayBuffers axis is the gate; heap is informational)

| op | heapUsed Δ | arrayBuffers Δ | cap | gc exposed | verdict |
|---|---|---|---|---|---|
| rest_workflow (10 dispatch across 4 frameworks) | 12776 B | 0 B | 102400 B | yes | PASS |
| template_render_batch (5 Jinja2-like renders) | -1712 B | 0 B | 102400 B | yes | PASS |
| middleware_chain_error_handling (5 throw + catch) | -245896 B | 0 B | 102400 B | yes | PASS |
| retry_recovery (5 flaky async retry to success) | 12512 B | 0 B | 102400 B | yes | PASS |
| concurrent_batch (5 batches of 4 items with error isolation) | 2832 B | 0 B | 102400 B | yes | PASS |

## Detailed serial reports

### rest_workflow (10 dispatch across 4 frameworks)

# Perf Report — rest_workflow (10 dispatch across 4 frameworks).serial

| metric | value |
|---|---|
| iterations | 20 |
| warmup | 3 |
| p10 | 0.0085ms |
| p50 | 0.01ms |
| p95 | 0.01ms |
| p99 | 0.02ms |
| mean | 0.01ms |
| stdev | 0.0022ms |
| min | 0.0083ms |
| max | 0.02ms |
| total | 0.21ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.0085ms | 0.0097ms | -0.0013ms | -12.92% |
| p50 | 0.01ms | 0.010ms | +0.00054ms | +5.43% |
| p95 | 0.01ms | 0.01ms | +0.00055ms | +4.58% |
| p99 | 0.02ms | 0.01ms | +0.0032ms | +22.60% |
| mean | 0.01ms | 0.01ms | +0.00025ms | +2.38% |
| min | 0.0083ms | 0.0083ms | 0.00ms | 0.00% |
| max | 0.02ms | 0.01ms | +0.0039ms | +26.27% |
| total | 0.21ms | 0.21ms | +0.0049ms | +2.38% |

### template_render_batch (5 Jinja2-like renders)

# Perf Report — template_render_batch (5 Jinja2-like renders).serial

| metric | value |
|---|---|
| iterations | 20 |
| warmup | 3 |
| p10 | 0.0034ms |
| p50 | 0.0035ms |
| p95 | 0.0066ms |
| p99 | 0.0075ms |
| mean | 0.0040ms |
| stdev | 0.0012ms |
| min | 0.0031ms |
| max | 0.0078ms |
| total | 0.08ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.0034ms | 0.0032ms | +0.00025ms | +7.94% |
| p50 | 0.0035ms | 0.0032ms | +0.00035ms | +11.16% |
| p95 | 0.0066ms | 0.0053ms | +0.0013ms | +24.10% |
| p99 | 0.0075ms | 0.0059ms | +0.0017ms | +28.09% |
| mean | 0.0040ms | 0.0036ms | +0.00045ms | +12.78% |
| min | 0.0031ms | 0.0030ms | +0.000084ms | +2.76% |
| max | 0.0078ms | 0.0060ms | +0.0018ms | +28.96% |
| total | 0.08ms | 0.07ms | +0.0091ms | +12.78% |

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
| stdev | 0.0023ms |
| min | 0.01ms |
| max | 0.02ms |
| total | 0.25ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.01ms | 0.01ms | -0.00054ms | -4.62% |
| p50 | 0.01ms | 0.01ms | -0.0015ms | -11.51% |
| p95 | 0.02ms | 0.02ms | -0.0034ms | -15.84% |
| p99 | 0.02ms | 0.02ms | -0.0026ms | -12.04% |
| mean | 0.01ms | 0.01ms | -0.0016ms | -11.38% |
| min | 0.01ms | 0.01ms | -0.00058ms | -5.02% |
| max | 0.02ms | 0.02ms | -0.0024ms | -11.09% |
| total | 0.25ms | 0.29ms | -0.03ms | -11.38% |

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
| stdev | 0.0043ms |
| min | 0.03ms |
| max | 0.04ms |
| total | 0.67ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.03ms | 0.03ms | +0.00092ms | +3.12% |
| p50 | 0.03ms | 0.03ms | +0.00025ms | +0.80% |
| p95 | 0.04ms | 0.10ms | -0.05ms | -56.36% |
| p99 | 0.04ms | 0.19ms | -0.14ms | -76.38% |
| mean | 0.03ms | 0.04ms | -0.01ms | -25.20% |
| min | 0.03ms | 0.03ms | +0.0010ms | +3.43% |
| max | 0.04ms | 0.21ms | -0.16ms | -78.68% |
| total | 0.67ms | 0.89ms | -0.22ms | -25.20% |

### concurrent_batch (5 batches of 4 items with error isolation)

# Perf Report — concurrent_batch (5 batches of 4 items with error isolation).serial

| metric | value |
|---|---|
| iterations | 20 |
| warmup | 3 |
| p10 | 0.0096ms |
| p50 | 0.01ms |
| p95 | 0.08ms |
| p99 | 0.08ms |
| mean | 0.02ms |
| stdev | 0.02ms |
| min | 0.0095ms |
| max | 0.09ms |
| total | 0.42ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.0096ms | 0.01ms | -0.0013ms | -11.85% |
| p50 | 0.01ms | 0.02ms | -0.0053ms | -32.77% |
| p95 | 0.08ms | 0.05ms | +0.03ms | +67.36% |
| p99 | 0.08ms | 0.09ms | -0.0091ms | -9.72% |
| mean | 0.02ms | 0.02ms | -0.0030ms | -12.53% |
| min | 0.0095ms | 0.01ms | -0.0012ms | -10.98% |
| max | 0.09ms | 0.11ms | -0.02ms | -18.92% |
| total | 0.42ms | 0.48ms | -0.06ms | -12.53% |

