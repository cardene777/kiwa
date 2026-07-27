# Perf Suite — email-app-scenario

Threshold source: [docs/quality/perf-thresholds.md](../../quality/perf-thresholds)

## Serial p95 (concurrency = 1)

| op | p95 | cap | gate | regression |
|---|---|---|---|---|
| transactional_send_workflow (10 send across 4 providers) | 0.01ms | 100ms | PASS | stable |
| template_render_batch (5 render with data) | 0.01ms | 100ms | PASS | stable |
| webhook_verify_delivery_batch (5 verify + parse) | 0.24ms | 100ms | PASS | stable |

## Concurrent p95 (concurrency = 4, 5 iter each)

| op | p95 | cap | gate |
|---|---|---|---|
| transactional_send_workflow (10 send across 4 providers) | 0.03ms | 200ms | PASS |
| template_render_batch (5 render with data) | 0.02ms | 200ms | PASS |
| webhook_verify_delivery_batch (5 verify + parse) | 0.46ms | 200ms | PASS |

## Memory retention (20 iter, arrayBuffers axis is the gate; heap is informational)

| op | heapUsed Δ | arrayBuffers Δ | cap | gc exposed | verdict |
|---|---|---|---|---|---|
| transactional_send_workflow (10 send across 4 providers) | -6856 B | 0 B | 102400 B | yes | PASS |
| template_render_batch (5 render with data) | -2024 B | 0 B | 102400 B | yes | PASS |
| webhook_verify_delivery_batch (5 verify + parse) | 16864 B | 0 B | 102400 B | yes | PASS |

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
| mean | 0.01ms |
| stdev | 0.00ms |
| min | 0.00ms |
| max | 0.01ms |
| total | 0.10ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p50 | 0.00ms | 0.00ms | +0.00ms | +10.66% |
| p95 | 0.01ms | 0.01ms | -0.00ms | -24.05% |
| p99 | 0.01ms | 0.01ms | -0.00ms | -16.66% |
| mean | 0.01ms | 0.01ms | +0.00ms | +3.26% |
| min | 0.00ms | 0.00ms | +0.00ms | +10.67% |
| max | 0.01ms | 0.01ms | -0.00ms | -15.03% |
| total | 0.10ms | 0.10ms | +0.00ms | +3.26% |

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
| p50 | 0.00ms | 0.00ms | +0.00ms | +7.15% |
| p95 | 0.01ms | 0.01ms | +0.00ms | +2.49% |
| p99 | 0.01ms | 0.01ms | +0.00ms | +4.34% |
| mean | 0.00ms | 0.00ms | +0.00ms | +1.67% |
| min | 0.00ms | 0.00ms | -0.00ms | -3.30% |
| max | 0.01ms | 0.01ms | +0.00ms | +4.72% |
| total | 0.10ms | 0.10ms | +0.00ms | +1.67% |

### webhook_verify_delivery_batch (5 verify + parse)

# Perf Report — webhook_verify_delivery_batch (5 verify + parse).serial

| metric | value |
|---|---|
| iterations | 20 |
| warmup | 3 |
| p50 | 0.03ms |
| p95 | 0.24ms |
| p99 | 0.28ms |
| mean | 0.05ms |
| stdev | 0.07ms |
| min | 0.02ms |
| max | 0.29ms |
| total | 1.05ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p50 | 0.03ms | 0.03ms | -0.00ms | -11.98% |
| p95 | 0.24ms | 0.04ms | +0.20ms | +477.31% |
| p99 | 0.28ms | 0.05ms | +0.23ms | +489.17% |
| mean | 0.05ms | 0.03ms | +0.02ms | +64.14% |
| min | 0.02ms | 0.03ms | -0.00ms | -8.56% |
| max | 0.29ms | 0.05ms | +0.24ms | +491.67% |
| total | 1.05ms | 0.64ms | +0.41ms | +64.14% |

