# Perf Suite — python-app-scenario

Threshold source: [docs/quality/perf-thresholds.md](../../quality/perf-thresholds)

測定系の分解能 = 0.00021ms (何もしない関数を同じ経路で呼んだ時の p10)。 回帰判定の絶対下限は既定でこの 2 倍 = 0.00042ms、 op ごとの実効値は下表の「下限」 列。

## Serial (concurrency = 1)

| op | p10 (回帰判定) | p95 (上限判定) | cap | 下限 | gate | regression |
|---|---|---|---|---|---|---|
| rest_workflow (10 dispatch across 4 frameworks) | 0.0095ms | 0.01ms | 100ms | 0.00042ms | PASS | stable — gate 無効 (regressionGate=false) |
| template_render_batch (5 Jinja2-like renders) | 0.0034ms | 0.0066ms | 100ms | 0.00042ms | PASS | stable (p10 +8% (閾値未満)、 p95 +25% (裾は実行間の振れ幅と区別できないため判定には使わない)) — gate 無効 (regressionGate=false) |
| middleware_chain_error_handling (5 throw + catch) | 0.01ms | 0.05ms | 100ms | 0.00042ms | PASS | stable (p10 +10% (閾値未満)、 p95 +142% (裾は実行間の振れ幅と区別できないため判定には使わない)) — gate 無効 (regressionGate=false) |
| retry_recovery (5 flaky async retry to success) | 0.03ms | 0.14ms | 100ms | 0.00042ms | PASS | stable (p10 -4% (閾値未満)、 p95 +46% (裾は実行間の振れ幅と区別できないため判定には使わない)) — gate 無効 (regressionGate=false) |
| concurrent_batch (5 batches of 4 items with error isolation) | 0.01ms | 0.05ms | 100ms | 0.00042ms | PASS | stable — gate 無効 (regressionGate=false) |

## Concurrent p95 (concurrency = 4, 5 iter each)

| op | p95 | cap | gate |
|---|---|---|---|
| rest_workflow (10 dispatch across 4 frameworks) | 0.05ms | 200ms | PASS |
| template_render_batch (5 Jinja2-like renders) | 0.11ms | 200ms | PASS |
| middleware_chain_error_handling (5 throw + catch) | 0.07ms | 200ms | PASS |
| retry_recovery (5 flaky async retry to success) | 0.46ms | 200ms | PASS |
| concurrent_batch (5 batches of 4 items with error isolation) | 0.10ms | 200ms | PASS |

## Memory retention (20 iter, arrayBuffers axis is the gate; heap is informational)

| op | heapUsed Δ | arrayBuffers Δ | cap | gc exposed | verdict |
|---|---|---|---|---|---|
| rest_workflow (10 dispatch across 4 frameworks) | -11552 B | 0 B | 102400 B | yes | PASS |
| template_render_batch (5 Jinja2-like renders) | -5056 B | 0 B | 102400 B | yes | PASS |
| middleware_chain_error_handling (5 throw + catch) | 648 B | 0 B | 102400 B | yes | PASS |
| retry_recovery (5 flaky async retry to success) | 12264 B | 0 B | 102400 B | yes | PASS |
| concurrent_batch (5 batches of 4 items with error isolation) | 5768 B | 0 B | 102400 B | yes | PASS |

## Detailed serial reports

### rest_workflow (10 dispatch across 4 frameworks)

# Perf Report — rest_workflow (10 dispatch across 4 frameworks).serial

| metric | value |
|---|---|
| iterations | 20 |
| warmup | 3 |
| p10 | 0.0095ms |
| p50 | 0.0098ms |
| p95 | 0.01ms |
| p99 | 0.01ms |
| mean | 0.01ms |
| stdev | 0.0014ms |
| min | 0.0095ms |
| max | 0.02ms |
| total | 0.21ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.0095ms | 0.0097ms | -0.00021ms | -2.14% |
| p50 | 0.0098ms | 0.010ms | -0.00021ms | -2.09% |
| p95 | 0.01ms | 0.01ms | +0.00062ms | +5.13% |
| p99 | 0.01ms | 0.01ms | +0.00049ms | +3.45% |
| mean | 0.01ms | 0.01ms | -0.000079ms | -0.76% |
| min | 0.0095ms | 0.0083ms | +0.0011ms | +13.49% |
| max | 0.02ms | 0.01ms | +0.00046ms | +3.11% |
| total | 0.21ms | 0.21ms | -0.0016ms | -0.76% |

### template_render_batch (5 Jinja2-like renders)

# Perf Report — template_render_batch (5 Jinja2-like renders).serial

| metric | value |
|---|---|
| iterations | 20 |
| warmup | 3 |
| p10 | 0.0034ms |
| p50 | 0.0037ms |
| p95 | 0.0066ms |
| p99 | 0.0071ms |
| mean | 0.0043ms |
| stdev | 0.0011ms |
| min | 0.0033ms |
| max | 0.0072ms |
| total | 0.09ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.0034ms | 0.0032ms | +0.00025ms | +7.91% |
| p50 | 0.0037ms | 0.0032ms | +0.00056ms | +17.76% |
| p95 | 0.0066ms | 0.0053ms | +0.0013ms | +25.00% |
| p99 | 0.0071ms | 0.0059ms | +0.0012ms | +19.75% |
| mean | 0.0043ms | 0.0036ms | +0.00072ms | +20.23% |
| min | 0.0033ms | 0.0030ms | +0.00029ms | +9.60% |
| max | 0.0072ms | 0.0060ms | +0.0011ms | +18.60% |
| total | 0.09ms | 0.07ms | +0.01ms | +20.23% |

### middleware_chain_error_handling (5 throw + catch)

# Perf Report — middleware_chain_error_handling (5 throw + catch).serial

| metric | value |
|---|---|
| iterations | 20 |
| warmup | 3 |
| p10 | 0.01ms |
| p50 | 0.02ms |
| p95 | 0.05ms |
| p99 | 0.42ms |
| mean | 0.04ms |
| stdev | 0.11ms |
| min | 0.01ms |
| max | 0.51ms |
| total | 0.82ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.01ms | 0.01ms | +0.0012ms | +9.97% |
| p50 | 0.02ms | 0.01ms | +0.0021ms | +15.78% |
| p95 | 0.05ms | 0.02ms | +0.03ms | +141.68% |
| p99 | 0.42ms | 0.02ms | +0.40ms | +1817.98% |
| mean | 0.04ms | 0.01ms | +0.03ms | +185.51% |
| min | 0.01ms | 0.01ms | +0.00083ms | +7.17% |
| max | 0.51ms | 0.02ms | +0.49ms | +2236.29% |
| total | 0.82ms | 0.29ms | +0.53ms | +185.51% |

### retry_recovery (5 flaky async retry to success)

# Perf Report — retry_recovery (5 flaky async retry to success).serial

| metric | value |
|---|---|
| iterations | 20 |
| warmup | 3 |
| p10 | 0.03ms |
| p50 | 0.03ms |
| p95 | 0.14ms |
| p99 | 0.40ms |
| mean | 0.07ms |
| stdev | 0.10ms |
| min | 0.03ms |
| max | 0.47ms |
| total | 1.30ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.03ms | 0.03ms | -0.0012ms | -4.14% |
| p50 | 0.03ms | 0.03ms | +0.0019ms | +6.00% |
| p95 | 0.14ms | 0.10ms | +0.04ms | +45.83% |
| p99 | 0.40ms | 0.19ms | +0.22ms | +116.13% |
| mean | 0.07ms | 0.04ms | +0.02ms | +45.98% |
| min | 0.03ms | 0.03ms | -0.0017ms | -5.86% |
| max | 0.47ms | 0.21ms | +0.26ms | +124.22% |
| total | 1.30ms | 0.89ms | +0.41ms | +45.98% |

### concurrent_batch (5 batches of 4 items with error isolation)

# Perf Report — concurrent_batch (5 batches of 4 items with error isolation).serial

| metric | value |
|---|---|
| iterations | 20 |
| warmup | 3 |
| p10 | 0.01ms |
| p50 | 0.01ms |
| p95 | 0.05ms |
| p99 | 0.08ms |
| mean | 0.02ms |
| stdev | 0.02ms |
| min | 0.01ms |
| max | 0.09ms |
| total | 0.37ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.01ms | 0.01ms | -0.00034ms | -3.15% |
| p50 | 0.01ms | 0.02ms | -0.0047ms | -29.27% |
| p95 | 0.05ms | 0.05ms | +0.00065ms | +1.30% |
| p99 | 0.08ms | 0.09ms | -0.0097ms | -10.28% |
| mean | 0.02ms | 0.02ms | -0.0055ms | -23.08% |
| min | 0.01ms | 0.01ms | -0.00046ms | -4.31% |
| max | 0.09ms | 0.11ms | -0.01ms | -11.66% |
| total | 0.37ms | 0.48ms | -0.11ms | -23.08% |

