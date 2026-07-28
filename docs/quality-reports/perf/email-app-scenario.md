# Perf Suite — email-app-scenario

Threshold source: [docs/quality/perf-thresholds.md](../../quality/perf-thresholds)

## Serial p95 (concurrency = 1)

| op | p95 | cap | gate | regression |
|---|---|---|---|---|
| transactional_send_workflow (10 send across 4 providers) | 0.01ms | 100ms | PASS | stable (検知には +0.5ms (baseline 比 +6689%) 以上の悪化が必要) |
| template_render_batch (5 render with data) | 0.01ms | 100ms | PASS | stable (検知には +0.5ms (baseline 比 +3221%) 以上の悪化が必要) |
| webhook_verify_delivery_batch (5 verify + parse) | 0.03ms | 100ms | PASS | stable (差 0.45ms が下限 0.5ms 未満で判定を保留) |

## Concurrent p95 (concurrency = 4, 5 iter each)

| op | p95 | cap | gate |
|---|---|---|---|
| transactional_send_workflow (10 send across 4 providers) | 0.03ms | 200ms | PASS |
| template_render_batch (5 render with data) | 0.02ms | 200ms | PASS |
| webhook_verify_delivery_batch (5 verify + parse) | 0.10ms | 200ms | PASS |

## Memory retention (20 iter, arrayBuffers axis is the gate; heap is informational)

| op | heapUsed Δ | arrayBuffers Δ | cap | gc exposed | verdict |
|---|---|---|---|---|---|
| transactional_send_workflow (10 send across 4 providers) | -278896 B | 0 B | 102400 B | yes | PASS |
| template_render_batch (5 render with data) | -4024 B | 0 B | 102400 B | yes | PASS |
| webhook_verify_delivery_batch (5 verify + parse) | 12032 B | 0 B | 102400 B | yes | PASS |

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
| p50 | 0.00ms | 0.01ms | -0.00ms | -10.15% |
| p95 | 0.01ms | 0.01ms | -0.00ms | -24.87% |
| p99 | 0.01ms | 0.01ms | -0.00ms | -24.89% |
| mean | 0.00ms | 0.01ms | -0.00ms | -13.23% |
| min | 0.00ms | 0.01ms | -0.00ms | -9.01% |
| max | 0.01ms | 0.01ms | -0.00ms | -24.90% |
| total | 0.10ms | 0.11ms | -0.02ms | -13.23% |

### template_render_batch (5 render with data)

# Perf Report — template_render_batch (5 render with data).serial

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
| max | 0.02ms |
| total | 0.10ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p50 | 0.00ms | 0.00ms | +0.00ms | +2.02% |
| p95 | 0.01ms | 0.02ms | -0.01ms | -34.41% |
| p99 | 0.01ms | 0.02ms | -0.01ms | -29.10% |
| mean | 0.01ms | 0.01ms | -0.00ms | -12.71% |
| min | 0.00ms | 0.00ms | -0.00ms | -15.49% |
| max | 0.02ms | 0.02ms | -0.01ms | -28.18% |
| total | 0.10ms | 0.12ms | -0.01ms | -12.71% |

### webhook_verify_delivery_batch (5 verify + parse)

# Perf Report — webhook_verify_delivery_batch (5 verify + parse).serial

| metric | value |
|---|---|
| iterations | 20 |
| warmup | 3 |
| p50 | 0.02ms |
| p95 | 0.03ms |
| p99 | 0.04ms |
| mean | 0.02ms |
| stdev | 0.01ms |
| min | 0.02ms |
| max | 0.04ms |
| total | 0.50ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p50 | 0.02ms | 0.03ms | -0.01ms | -23.43% |
| p95 | 0.03ms | 0.48ms | -0.45ms | -93.43% |
| p99 | 0.04ms | 0.86ms | -0.82ms | -95.15% |
| mean | 0.02ms | 0.11ms | -0.08ms | -76.47% |
| min | 0.02ms | 0.02ms | -0.00ms | -13.18% |
| max | 0.04ms | 0.95ms | -0.91ms | -95.36% |
| total | 0.50ms | 2.10ms | -1.61ms | -76.47% |

