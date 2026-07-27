# Perf Suite — email-app-scenario

Threshold source: [docs/quality/perf-thresholds.md](../../quality/perf-thresholds)

## Serial p95 (concurrency = 1)

| op | p95 | cap | gate | regression |
|---|---|---|---|---|
| transactional_send_workflow (10 send across 4 providers) | 0.01ms | 100ms | PASS | stable |
| template_render_batch (5 render with data) | 0.01ms | 100ms | PASS | stable |
| webhook_verify_delivery_batch (5 verify + parse) | 0.04ms | 100ms | PASS | stable |

## Concurrent p95 (concurrency = 4, 5 iter each)

| op | p95 | cap | gate |
|---|---|---|---|
| transactional_send_workflow (10 send across 4 providers) | 0.03ms | 200ms | PASS |
| template_render_batch (5 render with data) | 0.02ms | 200ms | PASS |
| webhook_verify_delivery_batch (5 verify + parse) | 0.12ms | 200ms | PASS |

## Memory retention (20 iter, arrayBuffers axis is the gate; heap is informational)

| op | heapUsed Δ | arrayBuffers Δ | cap | gc exposed | verdict |
|---|---|---|---|---|---|
| transactional_send_workflow (10 send across 4 providers) | 4904 B | 0 B | 102400 B | yes | PASS |
| template_render_batch (5 render with data) | -7840 B | 0 B | 102400 B | yes | PASS |
| webhook_verify_delivery_batch (5 verify + parse) | 12688 B | 8192 B | 102400 B | yes | PASS |

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
| total | 0.10ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p50 | 0.00ms | 0.00ms | +0.00ms | +5.56% |
| p95 | 0.01ms | 0.01ms | -0.00ms | -12.31% |
| p99 | 0.01ms | 0.01ms | -0.00ms | -5.30% |
| mean | 0.00ms | 0.01ms | -0.00ms | -1.94% |
| min | 0.00ms | 0.00ms | -0.00ms | -10.67% |
| max | 0.01ms | 0.01ms | -0.00ms | -3.75% |
| total | 0.10ms | 0.10ms | -0.00ms | -1.94% |

### template_render_batch (5 render with data)

# Perf Report — template_render_batch (5 render with data).serial

| metric | value |
|---|---|
| iterations | 20 |
| warmup | 3 |
| p50 | 0.01ms |
| p95 | 0.01ms |
| p99 | 0.01ms |
| mean | 0.01ms |
| stdev | 0.00ms |
| min | 0.00ms |
| max | 0.01ms |
| total | 0.11ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p50 | 0.01ms | 0.00ms | +0.00ms | +22.38% |
| p95 | 0.01ms | 0.01ms | -0.00ms | -15.87% |
| p99 | 0.01ms | 0.01ms | -0.00ms | -8.16% |
| mean | 0.01ms | 0.00ms | +0.00ms | +8.70% |
| min | 0.00ms | 0.00ms | +0.00ms | +13.19% |
| max | 0.01ms | 0.01ms | -0.00ms | -6.60% |
| total | 0.11ms | 0.10ms | +0.01ms | +8.70% |

### webhook_verify_delivery_batch (5 verify + parse)

# Perf Report — webhook_verify_delivery_batch (5 verify + parse).serial

| metric | value |
|---|---|
| iterations | 20 |
| warmup | 3 |
| p50 | 0.03ms |
| p95 | 0.04ms |
| p99 | 0.05ms |
| mean | 0.03ms |
| stdev | 0.01ms |
| min | 0.02ms |
| max | 0.05ms |
| total | 0.60ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p50 | 0.03ms | 0.03ms | -0.00ms | -11.56% |
| p95 | 0.04ms | 0.04ms | +0.00ms | +4.30% |
| p99 | 0.05ms | 0.05ms | +0.00ms | +4.60% |
| mean | 0.03ms | 0.03ms | -0.00ms | -6.89% |
| min | 0.02ms | 0.03ms | -0.00ms | -5.86% |
| max | 0.05ms | 0.05ms | +0.00ms | +4.67% |
| total | 0.60ms | 0.64ms | -0.04ms | -6.89% |

