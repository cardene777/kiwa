# Perf Suite — python-app-scenario

Threshold source: [docs/quality/perf-thresholds.md](../../quality/perf-thresholds)

## Serial p95 (concurrency = 1)

| op | p95 | cap | gate | regression |
|---|---|---|---|---|
| rest_workflow (10 dispatch across 4 frameworks) | 0.02ms | 100ms | PASS | stable |
| template_render_batch (5 Jinja2-like renders) | 0.01ms | 100ms | PASS | stable |
| middleware_chain_error_handling (5 throw + catch) | 0.02ms | 100ms | PASS | stable |
| retry_recovery (5 flaky async retry to success) | 0.04ms | 100ms | PASS | stable |
| concurrent_batch (5 batches of 4 items with error isolation) | 0.01ms | 100ms | PASS | stable |

## Concurrent p95 (concurrency = 4, 5 iter each)

| op | p95 | cap | gate |
|---|---|---|---|
| rest_workflow (10 dispatch across 4 frameworks) | 0.06ms | 200ms | PASS |
| template_render_batch (5 Jinja2-like renders) | 0.01ms | 200ms | PASS |
| middleware_chain_error_handling (5 throw + catch) | 0.06ms | 200ms | PASS |
| retry_recovery (5 flaky async retry to success) | 0.12ms | 200ms | PASS |
| concurrent_batch (5 batches of 4 items with error isolation) | 0.05ms | 200ms | PASS |

## Memory retention (20 iter, arrayBuffers axis is the gate; heap is informational)

| op | heapUsed Δ | arrayBuffers Δ | cap | gc exposed | verdict |
|---|---|---|---|---|---|
| rest_workflow (10 dispatch across 4 frameworks) | -264040 B | 0 B | 102400 B | yes | PASS |
| template_render_batch (5 Jinja2-like renders) | -1136 B | 0 B | 102400 B | yes | PASS |
| middleware_chain_error_handling (5 throw + catch) | 1336 B | 0 B | 102400 B | yes | PASS |
| retry_recovery (5 flaky async retry to success) | 4528 B | 0 B | 102400 B | yes | PASS |
| concurrent_batch (5 batches of 4 items with error isolation) | -144 B | 0 B | 102400 B | yes | PASS |

## Detailed serial reports

### rest_workflow (10 dispatch across 4 frameworks)

# Perf Report — rest_workflow (10 dispatch across 4 frameworks).serial

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
| total | 0.18ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p50 | 0.01ms | 0.01ms | -0.00ms | -0.78% |
| p95 | 0.02ms | 0.01ms | +0.00ms | +34.15% |
| p99 | 0.02ms | 0.02ms | -0.00ms | -1.40% |
| mean | 0.01ms | 0.01ms | +0.00ms | +1.80% |
| min | 0.01ms | 0.01ms | -0.00ms | -0.54% |
| max | 0.02ms | 0.02ms | -0.00ms | -7.44% |
| total | 0.18ms | 0.18ms | +0.00ms | +1.80% |

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
| p50 | 0.00ms | 0.00ms | +0.00ms | +1.42% |
| p95 | 0.01ms | 0.00ms | +0.00ms | +27.85% |
| p99 | 0.01ms | 0.01ms | +0.00ms | +26.94% |
| mean | 0.00ms | 0.00ms | +0.00ms | +12.64% |
| min | 0.00ms | 0.00ms | -0.00ms | -10.16% |
| max | 0.01ms | 0.01ms | +0.00ms | +26.79% |
| total | 0.07ms | 0.07ms | +0.01ms | +12.64% |

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
| p50 | 0.01ms | 0.01ms | +0.00ms | +4.78% |
| p95 | 0.02ms | 0.01ms | +0.00ms | +31.81% |
| p99 | 0.02ms | 0.02ms | +0.01ms | +41.92% |
| mean | 0.01ms | 0.01ms | +0.00ms | +10.52% |
| min | 0.01ms | 0.01ms | +0.00ms | +3.09% |
| max | 0.02ms | 0.02ms | +0.01ms | +44.03% |
| total | 0.26ms | 0.24ms | +0.02ms | +10.52% |

### retry_recovery (5 flaky async retry to success)

# Perf Report — retry_recovery (5 flaky async retry to success).serial

| metric | value |
|---|---|
| iterations | 20 |
| warmup | 3 |
| p50 | 0.03ms |
| p95 | 0.04ms |
| p99 | 0.05ms |
| mean | 0.03ms |
| stdev | 0.01ms |
| min | 0.03ms |
| max | 0.05ms |
| total | 0.59ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p50 | 0.03ms | 0.02ms | +0.00ms | +16.92% |
| p95 | 0.04ms | 0.03ms | +0.01ms | +19.55% |
| p99 | 0.05ms | 0.03ms | +0.01ms | +37.04% |
| mean | 0.03ms | 0.03ms | +0.00ms | +17.51% |
| min | 0.03ms | 0.02ms | +0.00ms | +16.27% |
| max | 0.05ms | 0.03ms | +0.01ms | +41.03% |
| total | 0.59ms | 0.50ms | +0.09ms | +17.51% |

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
| total | 0.20ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p50 | 0.01ms | 0.01ms | -0.00ms | -1.29% |
| p95 | 0.01ms | 0.01ms | -0.00ms | -23.77% |
| p99 | 0.01ms | 0.01ms | -0.00ms | -1.70% |
| mean | 0.01ms | 0.01ms | -0.00ms | -2.60% |
| min | 0.01ms | 0.01ms | -0.00ms | -0.46% |
| max | 0.01ms | 0.01ms | +0.00ms | +3.80% |
| total | 0.20ms | 0.20ms | -0.01ms | -2.60% |

