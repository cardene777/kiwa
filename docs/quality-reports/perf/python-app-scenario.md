# Perf Suite — python-app-scenario

Threshold source: [docs/quality/perf-thresholds.md](../../quality/perf-thresholds)

## Serial p95 (concurrency = 1)

| op | p95 | cap | gate | regression |
|---|---|---|---|---|
| rest_workflow (10 dispatch across 4 frameworks) | 0.01ms | 100ms | PASS | stable (検知には +0.5ms (baseline 比 +3525%) 以上の悪化が必要) |
| template_render_batch (5 Jinja2-like renders) | 0.01ms | 100ms | PASS | stable (検知には +0.5ms (baseline 比 +5942%) 以上の悪化が必要) |
| middleware_chain_error_handling (5 throw + catch) | 0.02ms | 100ms | PASS | stable (検知には +0.5ms (baseline 比 +3383%) 以上の悪化が必要) |
| retry_recovery (5 flaky async retry to success) | 0.04ms | 100ms | PASS | stable (差 0.21ms が下限 0.5ms 未満で判定を保留) |
| concurrent_batch (5 batches of 4 items with error isolation) | 0.01ms | 100ms | PASS | stable (差 0.07ms が下限 0.5ms 未満で判定を保留) |

## Concurrent p95 (concurrency = 4, 5 iter each)

| op | p95 | cap | gate |
|---|---|---|---|
| rest_workflow (10 dispatch across 4 frameworks) | 0.05ms | 200ms | PASS |
| template_render_batch (5 Jinja2-like renders) | 0.02ms | 200ms | PASS |
| middleware_chain_error_handling (5 throw + catch) | 0.06ms | 200ms | PASS |
| retry_recovery (5 flaky async retry to success) | 0.14ms | 200ms | PASS |
| concurrent_batch (5 batches of 4 items with error isolation) | 0.05ms | 200ms | PASS |

## Memory retention (20 iter, arrayBuffers axis is the gate; heap is informational)

| op | heapUsed Δ | arrayBuffers Δ | cap | gc exposed | verdict |
|---|---|---|---|---|---|
| rest_workflow (10 dispatch across 4 frameworks) | 1584 B | 0 B | 102400 B | yes | PASS |
| template_render_batch (5 Jinja2-like renders) | -1384 B | 0 B | 102400 B | yes | PASS |
| middleware_chain_error_handling (5 throw + catch) | 1344 B | 0 B | 102400 B | yes | PASS |
| retry_recovery (5 flaky async retry to success) | -17592 B | 0 B | 102400 B | yes | PASS |
| concurrent_batch (5 batches of 4 items with error isolation) | 2448 B | 0 B | 102400 B | yes | PASS |

## Detailed serial reports

### rest_workflow (10 dispatch across 4 frameworks)

# Perf Report — rest_workflow (10 dispatch across 4 frameworks).serial

| metric | value |
|---|---|
| iterations | 20 |
| warmup | 3 |
| p50 | 0.01ms |
| p95 | 0.01ms |
| p99 | 0.02ms |
| mean | 0.01ms |
| stdev | 0.00ms |
| min | 0.01ms |
| max | 0.02ms |
| total | 0.19ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p50 | 0.01ms | 0.01ms | 0.00ms | 0.00% |
| p95 | 0.01ms | 0.01ms | -0.00ms | -9.80% |
| p99 | 0.02ms | 0.02ms | +0.00ms | +1.70% |
| mean | 0.01ms | 0.01ms | -0.00ms | -4.74% |
| min | 0.01ms | 0.01ms | -0.00ms | -3.59% |
| max | 0.02ms | 0.02ms | +0.00ms | +4.01% |
| total | 0.19ms | 0.20ms | -0.01ms | -4.74% |

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
| total | 0.08ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p50 | 0.00ms | 0.00ms | +0.00ms | +23.98% |
| p95 | 0.01ms | 0.01ms | -0.00ms | -37.85% |
| p99 | 0.01ms | 0.01ms | -0.00ms | -16.28% |
| mean | 0.00ms | 0.00ms | +0.00ms | +2.93% |
| min | 0.00ms | 0.00ms | -0.00ms | -2.77% |
| max | 0.01ms | 0.01ms | -0.00ms | -11.72% |
| total | 0.08ms | 0.08ms | +0.00ms | +2.93% |

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
| total | 0.23ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p50 | 0.01ms | 0.01ms | -0.00ms | -5.36% |
| p95 | 0.02ms | 0.01ms | +0.00ms | +7.77% |
| p99 | 0.02ms | 0.02ms | -0.00ms | -6.05% |
| mean | 0.01ms | 0.01ms | -0.00ms | -6.45% |
| min | 0.01ms | 0.01ms | -0.00ms | -4.86% |
| max | 0.02ms | 0.02ms | -0.00ms | -8.94% |
| total | 0.23ms | 0.25ms | -0.02ms | -6.45% |

### retry_recovery (5 flaky async retry to success)

# Perf Report — retry_recovery (5 flaky async retry to success).serial

| metric | value |
|---|---|
| iterations | 20 |
| warmup | 3 |
| p50 | 0.03ms |
| p95 | 0.04ms |
| p99 | 0.04ms |
| mean | 0.03ms |
| stdev | 0.00ms |
| min | 0.03ms |
| max | 0.04ms |
| total | 0.59ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p50 | 0.03ms | 0.04ms | -0.01ms | -30.49% |
| p95 | 0.04ms | 0.25ms | -0.21ms | -85.12% |
| p99 | 0.04ms | 0.30ms | -0.26ms | -86.59% |
| mean | 0.03ms | 0.09ms | -0.06ms | -65.10% |
| min | 0.03ms | 0.03ms | -0.00ms | -5.51% |
| max | 0.04ms | 0.31ms | -0.27ms | -86.89% |
| total | 0.59ms | 1.70ms | -1.11ms | -65.10% |

### concurrent_batch (5 batches of 4 items with error isolation)

# Perf Report — concurrent_batch (5 batches of 4 items with error isolation).serial

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
| total | 0.19ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p50 | 0.01ms | 0.03ms | -0.02ms | -66.45% |
| p95 | 0.01ms | 0.08ms | -0.07ms | -87.11% |
| p99 | 0.01ms | 0.13ms | -0.12ms | -91.17% |
| mean | 0.01ms | 0.04ms | -0.03ms | -75.62% |
| min | 0.01ms | 0.01ms | -0.00ms | -29.38% |
| max | 0.01ms | 0.14ms | -0.13ms | -91.78% |
| total | 0.19ms | 0.79ms | -0.60ms | -75.62% |

