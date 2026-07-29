# Perf Suite — python-app-scenario

Threshold source: [docs/quality/perf-thresholds.md](../../quality/perf-thresholds)

測定系の分解能 = 0.00025ms (何もしない関数を同じ経路で呼んだ時の p10)。 回帰判定の絶対下限は既定でこの 2 倍 = 0.00049ms、 op ごとの実効値は下表の「下限」 列。

## Serial (concurrency = 1)

| op | p10 (回帰判定) | p95 (上限判定) | cap | 下限 | gate | regression |
|---|---|---|---|---|---|---|
| rest_workflow (10 dispatch across 4 frameworks) | 0.0074ms | 0.01ms | 100ms | 0.00049ms | PASS | improved — gate 無効 (regressionGate=false) |
| template_render_batch (5 Jinja2-like renders) | 0.0029ms | 0.0064ms | 100ms | 0.00049ms | PASS | stable (p10 -8% (閾値未満)、 p95 +21% (裾は実行間の振れ幅と区別できないため判定には使わない)) — gate 無効 (regressionGate=false) |
| middleware_chain_error_handling (5 throw + catch) | 0.03ms | 0.07ms | 100ms | 0.00049ms | PASS | regressed — gate 無効 (regressionGate=false) |
| retry_recovery (5 flaky async retry to success) | 0.03ms | 0.04ms | 100ms | 0.00049ms | PASS | stable — gate 無効 (regressionGate=false) |
| concurrent_batch (5 batches of 4 items with error isolation) | 0.0097ms | 0.01ms | 100ms | 0.00049ms | PASS | stable — gate 無効 (regressionGate=false) |

## Concurrent p95 (concurrency = 4, 5 iter each)

| op | p95 | cap | gate |
|---|---|---|---|
| rest_workflow (10 dispatch across 4 frameworks) | 0.06ms | 200ms | PASS |
| template_render_batch (5 Jinja2-like renders) | 0.01ms | 200ms | PASS |
| middleware_chain_error_handling (5 throw + catch) | 0.60ms | 200ms | PASS |
| retry_recovery (5 flaky async retry to success) | 0.24ms | 200ms | PASS |
| concurrent_batch (5 batches of 4 items with error isolation) | 0.05ms | 200ms | PASS |

## Memory retention (20 iter, arrayBuffers axis is the gate; heap is informational)

| op | heapUsed Δ | arrayBuffers Δ | cap | gc exposed | verdict |
|---|---|---|---|---|---|
| rest_workflow (10 dispatch across 4 frameworks) | 5464 B | 0 B | 102400 B | yes | PASS |
| template_render_batch (5 Jinja2-like renders) | -120 B | 0 B | 102400 B | yes | PASS |
| middleware_chain_error_handling (5 throw + catch) | 3504 B | 0 B | 102400 B | yes | PASS |
| retry_recovery (5 flaky async retry to success) | 2312 B | 0 B | 102400 B | yes | PASS |
| concurrent_batch (5 batches of 4 items with error isolation) | 2888 B | 0 B | 102400 B | yes | PASS |

## Detailed serial reports

### rest_workflow (10 dispatch across 4 frameworks)

# Perf Report — rest_workflow (10 dispatch across 4 frameworks).serial

| metric | value |
|---|---|
| iterations | 20 |
| warmup | 3 |
| p10 | 0.0074ms |
| p50 | 0.0076ms |
| p95 | 0.01ms |
| p99 | 0.01ms |
| mean | 0.0086ms |
| stdev | 0.0019ms |
| min | 0.0073ms |
| max | 0.01ms |
| total | 0.17ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.0074ms | 0.0097ms | -0.0023ms | -24.07% |
| p50 | 0.0076ms | 0.010ms | -0.0024ms | -23.79% |
| p95 | 0.01ms | 0.01ms | -0.00080ms | -6.64% |
| p99 | 0.01ms | 0.01ms | -0.00026ms | -1.83% |
| mean | 0.0086ms | 0.01ms | -0.0018ms | -17.07% |
| min | 0.0073ms | 0.0083ms | -0.0011ms | -13.01% |
| max | 0.01ms | 0.01ms | -0.00012ms | -0.85% |
| total | 0.17ms | 0.21ms | -0.04ms | -17.07% |

### template_render_batch (5 Jinja2-like renders)

# Perf Report — template_render_batch (5 Jinja2-like renders).serial

| metric | value |
|---|---|
| iterations | 20 |
| warmup | 3 |
| p10 | 0.0029ms |
| p50 | 0.0030ms |
| p95 | 0.0064ms |
| p99 | 0.0076ms |
| mean | 0.0036ms |
| stdev | 0.0013ms |
| min | 0.0029ms |
| max | 0.0079ms |
| total | 0.07ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.0029ms | 0.0032ms | -0.00024ms | -7.75% |
| p50 | 0.0030ms | 0.0032ms | -0.00017ms | -5.27% |
| p95 | 0.0064ms | 0.0053ms | +0.0011ms | +21.20% |
| p99 | 0.0076ms | 0.0059ms | +0.0017ms | +28.70% |
| mean | 0.0036ms | 0.0036ms | +0.000021ms | +0.59% |
| min | 0.0029ms | 0.0030ms | -0.00012ms | -4.11% |
| max | 0.0079ms | 0.0060ms | +0.0018ms | +30.34% |
| total | 0.07ms | 0.07ms | +0.00042ms | +0.59% |

### middleware_chain_error_handling (5 throw + catch)

# Perf Report — middleware_chain_error_handling (5 throw + catch).serial

| metric | value |
|---|---|
| iterations | 20 |
| warmup | 3 |
| p10 | 0.03ms |
| p50 | 0.04ms |
| p95 | 0.07ms |
| p99 | 0.12ms |
| mean | 0.04ms |
| stdev | 0.02ms |
| min | 0.03ms |
| max | 0.13ms |
| total | 0.88ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.03ms | 0.01ms | +0.02ms | +194.59% |
| p50 | 0.04ms | 0.01ms | +0.02ms | +178.71% |
| p95 | 0.07ms | 0.02ms | +0.05ms | +223.13% |
| p99 | 0.12ms | 0.02ms | +0.09ms | +428.78% |
| mean | 0.04ms | 0.01ms | +0.03ms | +206.23% |
| min | 0.03ms | 0.01ms | +0.02ms | +192.83% |
| max | 0.13ms | 0.02ms | +0.10ms | +480.10% |
| total | 0.88ms | 0.29ms | +0.59ms | +206.23% |

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
| stdev | 0.0044ms |
| min | 0.03ms |
| max | 0.05ms |
| total | 0.59ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.03ms | 0.03ms | -0.0025ms | -8.48% |
| p50 | 0.03ms | 0.03ms | -0.0031ms | -9.80% |
| p95 | 0.04ms | 0.10ms | -0.06ms | -61.15% |
| p99 | 0.04ms | 0.19ms | -0.14ms | -76.46% |
| mean | 0.03ms | 0.04ms | -0.02ms | -33.62% |
| min | 0.03ms | 0.03ms | -0.0023ms | -7.87% |
| max | 0.05ms | 0.21ms | -0.16ms | -78.22% |
| total | 0.59ms | 0.89ms | -0.30ms | -33.62% |

### concurrent_batch (5 batches of 4 items with error isolation)

# Perf Report — concurrent_batch (5 batches of 4 items with error isolation).serial

| metric | value |
|---|---|
| iterations | 20 |
| warmup | 3 |
| p10 | 0.0097ms |
| p50 | 0.01ms |
| p95 | 0.01ms |
| p99 | 0.01ms |
| mean | 0.01ms |
| stdev | 0.0017ms |
| min | 0.0094ms |
| max | 0.01ms |
| total | 0.22ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.0097ms | 0.01ms | -0.0012ms | -11.05% |
| p50 | 0.01ms | 0.02ms | -0.0060ms | -37.56% |
| p95 | 0.01ms | 0.05ms | -0.04ms | -71.55% |
| p99 | 0.01ms | 0.09ms | -0.08ms | -84.38% |
| mean | 0.01ms | 0.02ms | -0.01ms | -54.28% |
| min | 0.0094ms | 0.01ms | -0.0012ms | -11.37% |
| max | 0.01ms | 0.11ms | -0.09ms | -85.92% |
| total | 0.22ms | 0.48ms | -0.26ms | -54.28% |

