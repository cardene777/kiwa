# Perf Suite — python-app-scenario

Threshold source: [docs/quality/perf-thresholds.md](../../quality/perf-thresholds)

## Serial p95 (concurrency = 1)

| op | p95 | cap | gate | regression |
|---|---|---|---|---|
| rest_workflow (10 dispatch across 4 frameworks) | 0.01ms | 100ms | PASS | stable |
| template_render_batch (5 Jinja2-like renders) | 0.01ms | 100ms | PASS | stable |
| middleware_chain_error_handling (5 throw + catch) | 0.02ms | 100ms | PASS | stable |
| retry_recovery (5 flaky async retry to success) | 0.03ms | 100ms | PASS | stable |
| concurrent_batch (5 batches of 4 items with error isolation) | 0.02ms | 100ms | PASS | stable |

## Concurrent p95 (concurrency = 4, 5 iter each)

| op | p95 | cap | gate |
|---|---|---|---|
| rest_workflow (10 dispatch across 4 frameworks) | 0.05ms | 200ms | PASS |
| template_render_batch (5 Jinja2-like renders) | 0.01ms | 200ms | PASS |
| middleware_chain_error_handling (5 throw + catch) | 0.07ms | 200ms | PASS |
| retry_recovery (5 flaky async retry to success) | 0.13ms | 200ms | PASS |
| concurrent_batch (5 batches of 4 items with error isolation) | 0.05ms | 200ms | PASS |

## Memory retention (20 iter, arrayBuffers axis is the gate; heap is informational)

| op | heapUsed Δ | arrayBuffers Δ | cap | gc exposed | verdict |
|---|---|---|---|---|---|
| rest_workflow (10 dispatch across 4 frameworks) | -4400 B | 0 B | 102400 B | yes | PASS |
| template_render_batch (5 Jinja2-like renders) | -2448 B | 0 B | 102400 B | yes | PASS |
| middleware_chain_error_handling (5 throw + catch) | 1336 B | 0 B | 102400 B | yes | PASS |
| retry_recovery (5 flaky async retry to success) | 5104 B | 0 B | 102400 B | yes | PASS |
| concurrent_batch (5 batches of 4 items with error isolation) | 1296 B | 0 B | 102400 B | yes | PASS |

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
| max | 0.02ms |
| total | 0.18ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p50 | 0.01ms | 0.01ms | +0.00ms | +3.89% |
| p95 | 0.01ms | 0.01ms | -0.00ms | -6.95% |
| p99 | 0.01ms | 0.02ms | -0.00ms | -5.25% |
| mean | 0.01ms | 0.01ms | +0.00ms | +3.23% |
| min | 0.01ms | 0.01ms | +0.00ms | +4.87% |
| max | 0.02ms | 0.02ms | -0.00ms | -4.96% |
| total | 0.18ms | 0.18ms | +0.01ms | +3.23% |

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
| p50 | 0.00ms | 0.00ms | 0.00ms | 0.00% |
| p95 | 0.01ms | 0.00ms | +0.00ms | +15.19% |
| p99 | 0.01ms | 0.01ms | +0.00ms | +13.90% |
| mean | 0.00ms | 0.00ms | +0.00ms | +3.13% |
| min | 0.00ms | 0.00ms | +0.00ms | +1.43% |
| max | 0.01ms | 0.01ms | +0.00ms | +13.69% |
| total | 0.07ms | 0.07ms | +0.00ms | +3.13% |

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
| total | 0.25ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p50 | 0.01ms | 0.01ms | +0.00ms | +6.06% |
| p95 | 0.02ms | 0.01ms | +0.00ms | +25.74% |
| p99 | 0.02ms | 0.02ms | +0.00ms | +11.85% |
| mean | 0.01ms | 0.01ms | +0.00ms | +7.26% |
| min | 0.01ms | 0.01ms | +0.00ms | +5.40% |
| max | 0.02ms | 0.02ms | +0.00ms | +8.96% |
| total | 0.25ms | 0.24ms | +0.02ms | +7.26% |

### retry_recovery (5 flaky async retry to success)

# Perf Report — retry_recovery (5 flaky async retry to success).serial

| metric | value |
|---|---|
| iterations | 20 |
| warmup | 3 |
| p50 | 0.03ms |
| p95 | 0.03ms |
| p99 | 0.04ms |
| mean | 0.03ms |
| stdev | 0.00ms |
| min | 0.03ms |
| max | 0.04ms |
| total | 0.58ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p50 | 0.03ms | 0.02ms | +0.00ms | +17.62% |
| p95 | 0.03ms | 0.03ms | +0.00ms | +8.12% |
| p99 | 0.04ms | 0.03ms | +0.01ms | +21.89% |
| mean | 0.03ms | 0.03ms | +0.00ms | +15.52% |
| min | 0.03ms | 0.02ms | +0.00ms | +17.56% |
| max | 0.04ms | 0.03ms | +0.01ms | +25.03% |
| total | 0.58ms | 0.50ms | +0.08ms | +15.52% |

### concurrent_batch (5 batches of 4 items with error isolation)

# Perf Report — concurrent_batch (5 batches of 4 items with error isolation).serial

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
| total | 0.21ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p50 | 0.01ms | 0.01ms | +0.00ms | +2.17% |
| p95 | 0.02ms | 0.01ms | +0.00ms | +9.47% |
| p99 | 0.02ms | 0.01ms | +0.00ms | +15.23% |
| mean | 0.01ms | 0.01ms | +0.00ms | +2.62% |
| min | 0.01ms | 0.01ms | 0.00ms | 0.00% |
| max | 0.02ms | 0.01ms | +0.00ms | +16.67% |
| total | 0.21ms | 0.20ms | +0.01ms | +2.62% |

