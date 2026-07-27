# Perf Suite — python-app-scenario

Threshold source: [docs/quality/perf-thresholds.md](../../quality/perf-thresholds)

## Serial p95 (concurrency = 1)

| op | p95 | cap | gate | regression |
|---|---|---|---|---|
| rest_workflow (10 dispatch across 4 frameworks) | 0.01ms | 100ms | PASS | stable |
| template_render_batch (5 Jinja2-like renders) | 0.01ms | 100ms | PASS | stable |
| middleware_chain_error_handling (5 throw + catch) | 0.02ms | 100ms | PASS | stable |
| retry_recovery (5 flaky async retry to success) | 0.04ms | 100ms | PASS | stable |
| concurrent_batch (5 batches of 4 items with error isolation) | 0.01ms | 100ms | PASS | stable |

## Concurrent p95 (concurrency = 4, 5 iter each)

| op | p95 | cap | gate |
|---|---|---|---|
| rest_workflow (10 dispatch across 4 frameworks) | 0.05ms | 200ms | PASS |
| template_render_batch (5 Jinja2-like renders) | 0.02ms | 200ms | PASS |
| middleware_chain_error_handling (5 throw + catch) | 0.07ms | 200ms | PASS |
| retry_recovery (5 flaky async retry to success) | 0.12ms | 200ms | PASS |
| concurrent_batch (5 batches of 4 items with error isolation) | 0.08ms | 200ms | PASS |

## Memory retention (20 iter, arrayBuffers axis is the gate; heap is informational)

| op | heapUsed Δ | arrayBuffers Δ | cap | gc exposed | verdict |
|---|---|---|---|---|---|
| rest_workflow (10 dispatch across 4 frameworks) | 8576 B | 0 B | 102400 B | yes | PASS |
| template_render_batch (5 Jinja2-like renders) | -2448 B | 0 B | 102400 B | yes | PASS |
| middleware_chain_error_handling (5 throw + catch) | 72 B | 0 B | 102400 B | yes | PASS |
| retry_recovery (5 flaky async retry to success) | 4576 B | 0 B | 102400 B | yes | PASS |
| concurrent_batch (5 batches of 4 items with error isolation) | 5448 B | 0 B | 102400 B | yes | PASS |

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
| total | 0.18ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p50 | 0.01ms | 0.01ms | +0.00ms | +1.81% |
| p95 | 0.01ms | 0.01ms | -0.00ms | -4.57% |
| p99 | 0.02ms | 0.02ms | +0.00ms | +6.76% |
| mean | 0.01ms | 0.01ms | +0.00ms | +3.11% |
| min | 0.01ms | 0.01ms | +0.00ms | +1.08% |
| max | 0.02ms | 0.02ms | +0.00ms | +8.69% |
| total | 0.18ms | 0.18ms | +0.01ms | +3.11% |

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
| total | 0.09ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p50 | 0.00ms | 0.00ms | +0.00ms | +30.29% |
| p95 | 0.01ms | 0.00ms | +0.00ms | +86.29% |
| p99 | 0.01ms | 0.01ms | +0.00ms | +35.91% |
| mean | 0.00ms | 0.00ms | +0.00ms | +32.36% |
| min | 0.00ms | 0.00ms | +0.00ms | +2.89% |
| max | 0.01ms | 0.01ms | +0.00ms | +27.37% |
| total | 0.09ms | 0.07ms | +0.02ms | +32.36% |

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
| p50 | 0.01ms | 0.01ms | +0.00ms | +7.17% |
| p95 | 0.02ms | 0.01ms | +0.00ms | +21.98% |
| p99 | 0.02ms | 0.02ms | +0.00ms | +10.18% |
| mean | 0.01ms | 0.01ms | +0.00ms | +8.26% |
| min | 0.01ms | 0.01ms | +0.00ms | +4.24% |
| max | 0.02ms | 0.02ms | +0.00ms | +7.71% |
| total | 0.26ms | 0.24ms | +0.02ms | +8.26% |

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
| total | 0.61ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p50 | 0.03ms | 0.02ms | +0.01ms | +22.12% |
| p95 | 0.04ms | 0.03ms | +0.01ms | +19.47% |
| p99 | 0.04ms | 0.03ms | +0.01ms | +28.17% |
| mean | 0.03ms | 0.03ms | +0.01ms | +20.60% |
| min | 0.03ms | 0.02ms | +0.00ms | +19.20% |
| max | 0.04ms | 0.03ms | +0.01ms | +30.16% |
| total | 0.61ms | 0.50ms | +0.10ms | +20.60% |

### concurrent_batch (5 batches of 4 items with error isolation)

# Perf Report — concurrent_batch (5 batches of 4 items with error isolation).serial

| metric | value |
|---|---|
| iterations | 20 |
| warmup | 3 |
| p50 | 0.01ms |
| p95 | 0.01ms |
| p99 | 0.05ms |
| mean | 0.01ms |
| stdev | 0.01ms |
| min | 0.01ms |
| max | 0.06ms |
| total | 0.26ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p50 | 0.01ms | 0.01ms | +0.00ms | +3.24% |
| p95 | 0.01ms | 0.01ms | +0.00ms | +4.18% |
| p99 | 0.05ms | 0.01ms | +0.04ms | +280.99% |
| mean | 0.01ms | 0.01ms | +0.00ms | +27.42% |
| min | 0.01ms | 0.01ms | +0.00ms | +2.73% |
| max | 0.06ms | 0.01ms | +0.05ms | +350.00% |
| total | 0.26ms | 0.20ms | +0.06ms | +27.42% |

