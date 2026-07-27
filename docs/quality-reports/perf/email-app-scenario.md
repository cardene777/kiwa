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

| op | heapUsed Δ | arrayBuffers Δ | cap | gc exposed | verdict |
|---|---|---|---|---|---|
| transactional_send_workflow (10 send across 4 providers) | -4632 B | 0 B | 102400 B | yes | PASS |
| template_render_batch (5 render with data) | -1432 B | 0 B | 102400 B | yes | PASS |
| webhook_verify_delivery_batch (5 verify + parse) | 17368 B | 0 B | 102400 B | yes | PASS |

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
| p50 | 0.00ms | 0.00ms | -0.00ms | -12.96% |
| p95 | 0.01ms | 0.01ms | -0.00ms | -28.95% |
| p99 | 0.01ms | 0.01ms | +0.00ms | +13.99% |
| mean | 0.00ms | 0.01ms | -0.00ms | -9.78% |
| min | 0.00ms | 0.00ms | -0.00ms | -12.63% |
| max | 0.01ms | 0.01ms | +0.00ms | +23.48% |
| total | 0.09ms | 0.10ms | -0.01ms | -9.78% |

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
| total | 0.08ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p50 | 0.00ms | 0.00ms | -0.00ms | -16.18% |
| p95 | 0.01ms | 0.01ms | -0.00ms | -17.91% |
| p99 | 0.01ms | 0.01ms | -0.00ms | -21.06% |
| mean | 0.00ms | 0.00ms | -0.00ms | -16.76% |
| min | 0.00ms | 0.00ms | -0.00ms | -13.19% |
| max | 0.01ms | 0.01ms | -0.00ms | -21.70% |
| total | 0.08ms | 0.10ms | -0.02ms | -16.76% |

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
| stdev | 0.01ms |
| min | 0.02ms |
| max | 0.04ms |
| total | 0.53ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p50 | 0.02ms | 0.03ms | -0.01ms | -17.17% |
| p95 | 0.03ms | 0.04ms | -0.01ms | -21.27% |
| p99 | 0.04ms | 0.05ms | -0.01ms | -10.64% |
| mean | 0.03ms | 0.03ms | -0.01ms | -16.95% |
| min | 0.02ms | 0.03ms | -0.00ms | -16.32% |
| max | 0.04ms | 0.05ms | -0.00ms | -8.41% |
| total | 0.53ms | 0.64ms | -0.11ms | -16.95% |

