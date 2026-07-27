# Perf Suite — email-app-scenario

Threshold source: [docs/quality/perf-thresholds.md](../../quality/perf-thresholds)

## Serial p95 (concurrency = 1)

| op | p95 | cap | gate | regression |
|---|---|---|---|---|
| transactional_send_workflow (10 send across 4 providers) | 0.01ms | 100ms | PASS | stable |
| template_render_batch (5 render with data) | 0.01ms | 100ms | PASS | stable |
| webhook_verify_delivery_batch (5 verify + parse) | 0.03ms | 100ms | PASS | stable |

## Concurrent p95 (concurrency = 4, 5 iter each)

| op | p95 | cap | gate |
|---|---|---|---|
| transactional_send_workflow (10 send across 4 providers) | 0.03ms | 200ms | PASS |
| template_render_batch (5 render with data) | 0.02ms | 200ms | PASS |
| webhook_verify_delivery_batch (5 verify + parse) | 0.11ms | 200ms | PASS |

## Memory retention (20 iter, arrayBuffers axis is the gate; heap is informational)

| op | heapUsed Δ | arrayBuffers Δ | cap | verdict |
|---|---|---|---|---|
| transactional_send_workflow (10 send across 4 providers) | 868016 B | 0 B | 102400 B | PASS |
| template_render_batch (5 render with data) | 226064 B | 0 B | 102400 B | PASS |
| webhook_verify_delivery_batch (5 verify + parse) | 236312 B | 8192 B | 102400 B | PASS |

## Detailed serial reports

### transactional_send_workflow (10 send across 4 providers)

# Perf Report — transactional_send_workflow (10 send across 4 providers).serial

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
| p50 | 0.00ms | 0.00ms | 0.00ms | 0.00% |
| p95 | 0.01ms | 0.01ms | +0.00ms | +7.90% |
| p99 | 0.01ms | 0.01ms | +0.00ms | +16.59% |
| mean | 0.00ms | 0.00ms | +0.00ms | +2.02% |
| min | 0.00ms | 0.00ms | -0.00ms | -3.26% |
| max | 0.01ms | 0.01ms | +0.00ms | +18.18% |
| total | 0.09ms | 0.09ms | +0.00ms | +2.02% |

### template_render_batch (5 render with data)

# Perf Report — template_render_batch (5 render with data).serial

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
| total | 0.10ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p50 | 0.00ms | 0.00ms | +0.00ms | +21.97% |
| p95 | 0.01ms | 0.01ms | +0.00ms | +19.81% |
| p99 | 0.01ms | 0.01ms | +0.00ms | +41.38% |
| mean | 0.00ms | 0.00ms | +0.00ms | +23.32% |
| min | 0.00ms | 0.00ms | +0.00ms | +3.85% |
| max | 0.01ms | 0.01ms | +0.00ms | +46.40% |
| total | 0.10ms | 0.08ms | +0.02ms | +23.32% |

### webhook_verify_delivery_batch (5 verify + parse)

# Perf Report — webhook_verify_delivery_batch (5 verify + parse).serial

| metric | value |
|---|---|
| iterations | 20 |
| warmup | 3 |
| p50 | 0.02ms |
| p95 | 0.03ms |
| p99 | 0.04ms |
| mean | 0.03ms |
| stdev | 0.00ms |
| min | 0.02ms |
| max | 0.04ms |
| total | 0.51ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p50 | 0.02ms | 0.02ms | +0.00ms | +0.36% |
| p95 | 0.03ms | 0.03ms | +0.00ms | +12.16% |
| p99 | 0.04ms | 0.03ms | +0.01ms | +20.66% |
| mean | 0.03ms | 0.02ms | +0.00ms | +3.95% |
| min | 0.02ms | 0.02ms | +0.00ms | +1.52% |
| max | 0.04ms | 0.03ms | +0.01ms | +22.68% |
| total | 0.51ms | 0.49ms | +0.02ms | +3.95% |

