# Perf Suite — python-app-scenario

Threshold source: [docs/quality/perf-thresholds.md](../../quality/perf-thresholds)

## Serial p95 (concurrency = 1)

| op | p95 | cap | gate | regression |
|---|---|---|---|---|
| rest_workflow (10 dispatch across 4 frameworks) | 0.01ms | 100ms | PASS | stable (検知には +0.5ms (baseline 比 +3525%) 以上の悪化が必要) — gate 無効 (regressionGate=false) |
| template_render_batch (5 Jinja2-like renders) | 0.01ms | 100ms | PASS | stable (検知には +0.5ms (baseline 比 +5942%) 以上の悪化が必要) — gate 無効 (regressionGate=false) |
| middleware_chain_error_handling (5 throw + catch) | 0.02ms | 100ms | PASS | stable (検知には +0.5ms (baseline 比 +3383%) 以上の悪化が必要) — gate 無効 (regressionGate=false) |
| retry_recovery (5 flaky async retry to success) | 0.05ms | 100ms | PASS | stable (差 0.20ms が下限 0.5ms 未満で判定を保留) — gate 無効 (regressionGate=false) |
| concurrent_batch (5 batches of 4 items with error isolation) | 0.03ms | 100ms | PASS | stable (差 0.05ms が下限 0.5ms 未満で判定を保留) — gate 無効 (regressionGate=false) |

## Concurrent p95 (concurrency = 4, 5 iter each)

| op | p95 | cap | gate |
|---|---|---|---|
| rest_workflow (10 dispatch across 4 frameworks) | 0.06ms | 200ms | PASS |
| template_render_batch (5 Jinja2-like renders) | 0.02ms | 200ms | PASS |
| middleware_chain_error_handling (5 throw + catch) | 0.06ms | 200ms | PASS |
| retry_recovery (5 flaky async retry to success) | 0.64ms | 200ms | PASS |
| concurrent_batch (5 batches of 4 items with error isolation) | 0.05ms | 200ms | PASS |

## Memory retention (20 iter, arrayBuffers axis is the gate; heap is informational)

| op | heapUsed Δ | arrayBuffers Δ | cap | gc exposed | verdict |
|---|---|---|---|---|---|
| rest_workflow (10 dispatch across 4 frameworks) | -5768 B | -14416 B | 102400 B | yes | PASS |
| template_render_batch (5 Jinja2-like renders) | -2480 B | 0 B | 102400 B | yes | PASS |
| middleware_chain_error_handling (5 throw + catch) | 3064 B | 0 B | 102400 B | yes | PASS |
| retry_recovery (5 flaky async retry to success) | 3944 B | 0 B | 102400 B | yes | PASS |
| concurrent_batch (5 batches of 4 items with error isolation) | -1824 B | 0 B | 102400 B | yes | PASS |

## Detailed serial reports

### rest_workflow (10 dispatch across 4 frameworks)

# Perf Report — rest_workflow (10 dispatch across 4 frameworks).serial

| metric | value |
|---|---|
| iterations | 20 |
| warmup | 3 |
| p50 | 0.01ms |
| p95 | 0.01ms |
| p99 | 0.01ms |
| mean | 0.01ms |
| stdev | 0.00ms |
| min | 0.01ms |
| max | 0.01ms |
| total | 0.22ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p50 | 0.01ms | 0.01ms | +0.00ms | +23.29% |
| p95 | 0.01ms | 0.01ms | -0.00ms | -17.02% |
| p99 | 0.01ms | 0.02ms | -0.00ms | -28.97% |
| mean | 0.01ms | 0.01ms | +0.00ms | +8.51% |
| min | 0.01ms | 0.01ms | +0.00ms | +24.62% |
| max | 0.01ms | 0.02ms | -0.01ms | -31.37% |
| total | 0.22ms | 0.20ms | +0.02ms | +8.51% |

### template_render_batch (5 Jinja2-like renders)

# Perf Report — template_render_batch (5 Jinja2-like renders).serial

| metric | value |
|---|---|
| iterations | 20 |
| warmup | 3 |
| p50 | 0.00ms |
| p95 | 0.01ms |
| p99 | 0.01ms |
| mean | 0.00ms |
| stdev | 0.00ms |
| min | 0.00ms |
| max | 0.01ms |
| total | 0.07ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p50 | 0.00ms | 0.00ms | +0.00ms | +2.00% |
| p95 | 0.01ms | 0.01ms | -0.00ms | -35.42% |
| p99 | 0.01ms | 0.01ms | -0.00ms | -21.37% |
| mean | 0.00ms | 0.00ms | -0.00ms | -6.72% |
| min | 0.00ms | 0.00ms | +0.00ms | +2.77% |
| max | 0.01ms | 0.01ms | -0.00ms | -18.41% |
| total | 0.07ms | 0.08ms | -0.01ms | -6.72% |

### middleware_chain_error_handling (5 throw + catch)

# Perf Report — middleware_chain_error_handling (5 throw + catch).serial

| metric | value |
|---|---|
| iterations | 20 |
| warmup | 3 |
| p50 | 0.01ms |
| p95 | 0.02ms |
| p99 | 0.02ms |
| mean | 0.01ms |
| stdev | 0.00ms |
| min | 0.01ms |
| max | 0.02ms |
| total | 0.26ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p50 | 0.01ms | 0.01ms | +0.00ms | +5.36% |
| p95 | 0.02ms | 0.01ms | +0.00ms | +22.06% |
| p99 | 0.02ms | 0.02ms | +0.00ms | +8.87% |
| mean | 0.01ms | 0.01ms | +0.00ms | +4.36% |
| min | 0.01ms | 0.01ms | +0.00ms | +4.49% |
| max | 0.02ms | 0.02ms | +0.00ms | +6.12% |
| total | 0.26ms | 0.25ms | +0.01ms | +4.36% |

### retry_recovery (5 flaky async retry to success)

# Perf Report — retry_recovery (5 flaky async retry to success).serial

| metric | value |
|---|---|
| iterations | 20 |
| warmup | 3 |
| p50 | 0.04ms |
| p95 | 0.05ms |
| p99 | 0.05ms |
| mean | 0.04ms |
| stdev | 0.01ms |
| min | 0.03ms |
| max | 0.05ms |
| total | 0.73ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p50 | 0.04ms | 0.04ms | -0.01ms | -12.80% |
| p95 | 0.05ms | 0.25ms | -0.20ms | -81.03% |
| p99 | 0.05ms | 0.30ms | -0.25ms | -83.47% |
| mean | 0.04ms | 0.09ms | -0.05ms | -57.28% |
| min | 0.03ms | 0.03ms | +0.00ms | +2.09% |
| max | 0.05ms | 0.31ms | -0.26ms | -83.95% |
| total | 0.73ms | 1.70ms | -0.98ms | -57.28% |

### concurrent_batch (5 batches of 4 items with error isolation)

# Perf Report — concurrent_batch (5 batches of 4 items with error isolation).serial

| metric | value |
|---|---|
| iterations | 20 |
| warmup | 3 |
| p50 | 0.01ms |
| p95 | 0.03ms |
| p99 | 0.05ms |
| mean | 0.02ms |
| stdev | 0.01ms |
| min | 0.01ms |
| max | 0.06ms |
| total | 0.31ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p50 | 0.01ms | 0.03ms | -0.02ms | -58.92% |
| p95 | 0.03ms | 0.08ms | -0.05ms | -66.20% |
| p99 | 0.05ms | 0.13ms | -0.07ms | -58.02% |
| mean | 0.02ms | 0.04ms | -0.02ms | -61.03% |
| min | 0.01ms | 0.01ms | -0.00ms | -20.44% |
| max | 0.06ms | 0.14ms | -0.08ms | -56.79% |
| total | 0.31ms | 0.79ms | -0.48ms | -61.03% |

