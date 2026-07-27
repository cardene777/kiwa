# Perf Suite — python-app-scenario

Threshold source: [docs/quality/perf-thresholds.md](../../quality/perf-thresholds)

## Serial p95 (concurrency = 1)

| op | p95 | cap | gate | regression |
|---|---|---|---|---|
| rest_workflow (10 dispatch across 4 frameworks) | 0.02ms | 100ms | PASS | stable |
| template_render_batch (5 Jinja2-like renders) | 0.01ms | 100ms | PASS | stable |
| middleware_chain_error_handling (5 throw + catch) | 0.04ms | 100ms | PASS | regressed |
| retry_recovery (5 flaky async retry to success) | 0.04ms | 100ms | PASS | n/a (baseline seeded) |
| concurrent_batch (5 batches of 4 items with error isolation) | 0.01ms | 100ms | PASS | n/a (baseline seeded) |

## Concurrent p95 (concurrency = 4, 5 iter each)

| op | p95 | cap | gate |
|---|---|---|---|
| rest_workflow (10 dispatch across 4 frameworks) | 0.05ms | 200ms | PASS |
| template_render_batch (5 Jinja2-like renders) | 0.02ms | 200ms | PASS |
| middleware_chain_error_handling (5 throw + catch) | 0.26ms | 200ms | PASS |
| retry_recovery (5 flaky async retry to success) | 0.12ms | 200ms | PASS |
| concurrent_batch (5 batches of 4 items with error isolation) | 0.06ms | 200ms | PASS |

## Memory retention (20 iter, arrayBuffers axis is the gate; heap is informational)

| op | heapUsed Δ | arrayBuffers Δ | cap | verdict |
|---|---|---|---|---|
| rest_workflow (10 dispatch across 4 frameworks) | 849016 B | 0 B | 102400 B | PASS |
| template_render_batch (5 Jinja2-like renders) | 158248 B | 0 B | 102400 B | PASS |
| middleware_chain_error_handling (5 throw + catch) | 295632 B | 0 B | 102400 B | PASS |
| retry_recovery (5 flaky async retry to success) | -7888200 B | 0 B | 102400 B | PASS |
| concurrent_batch (5 batches of 4 items with error isolation) | 507064 B | 0 B | 102400 B | PASS |

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
| total | 0.22ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p50 | 0.01ms | 0.01ms | -0.00ms | -5.47% |
| p95 | 0.02ms | 0.01ms | +0.00ms | +18.91% |
| p99 | 0.02ms | 0.02ms | -0.00ms | -3.92% |
| mean | 0.01ms | 0.01ms | -0.00ms | -5.18% |
| min | 0.01ms | 0.01ms | -0.00ms | -16.07% |
| max | 0.02ms | 0.02ms | -0.00ms | -8.26% |
| total | 0.22ms | 0.23ms | -0.01ms | -5.18% |

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
| p50 | 0.00ms | 0.00ms | +0.00ms | +17.54% |
| p95 | 0.01ms | 0.01ms | -0.00ms | -0.08% |
| p99 | 0.01ms | 0.01ms | -0.00ms | -0.88% |
| mean | 0.00ms | 0.00ms | +0.00ms | +9.28% |
| min | 0.00ms | 0.00ms | -0.00ms | -5.94% |
| max | 0.01ms | 0.01ms | -0.00ms | -1.03% |
| total | 0.09ms | 0.08ms | +0.01ms | +9.28% |

### middleware_chain_error_handling (5 throw + catch)

# Perf Report — middleware_chain_error_handling (5 throw + catch).serial

| metric | value |
|---|---|
| iterations | 20 |
| warmup | 3 |
| p50 | 0.03ms |
| p95 | 0.04ms |
| p99 | 0.05ms |
| mean | 0.03ms |
| stdev | 0.00ms |
| min | 0.03ms |
| max | 0.05ms |
| total | 0.67ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p50 | 0.03ms | 0.02ms | +0.01ms | +81.84% |
| p95 | 0.04ms | 0.02ms | +0.02ms | +110.38% |
| p99 | 0.05ms | 0.03ms | +0.02ms | +82.44% |
| mean | 0.03ms | 0.02ms | +0.02ms | +90.85% |
| min | 0.03ms | 0.01ms | +0.02ms | +100.83% |
| max | 0.05ms | 0.03ms | +0.02ms | +76.83% |
| total | 0.67ms | 0.35ms | +0.32ms | +90.85% |

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
| stdev | 0.01ms |
| min | 0.02ms |
| max | 0.05ms |
| total | 0.59ms |

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

