# Perf Suite — email-app-scenario

Threshold source: [docs/quality/perf-thresholds.md](../../quality/perf-thresholds)

## Serial p95 (concurrency = 1)

| op | p95 | cap | gate | regression |
|---|---|---|---|---|
| transactional_send_workflow (10 send across 4 providers) | 0.01ms | 100ms | PASS | stable (検知には +0.5ms (baseline 比 +6689%) 以上の悪化が必要) — gate 無効 (regressionGate=false) |
| template_render_batch (5 render with data) | 0.01ms | 100ms | PASS | stable (検知には +0.5ms (baseline 比 +3221%) 以上の悪化が必要) — gate 無効 (regressionGate=false) |
| webhook_verify_delivery_batch (5 verify + parse) | 0.04ms | 100ms | PASS | stable (差 0.44ms が下限 0.5ms 未満で判定を保留) — gate 無効 (regressionGate=false) |

## Concurrent p95 (concurrency = 4, 5 iter each)

| op | p95 | cap | gate |
|---|---|---|---|
| transactional_send_workflow (10 send across 4 providers) | 0.04ms | 200ms | PASS |
| template_render_batch (5 render with data) | 0.03ms | 200ms | PASS |
| webhook_verify_delivery_batch (5 verify + parse) | 0.11ms | 200ms | PASS |

## Memory retention (20 iter, arrayBuffers axis is the gate; heap is informational)

| op | heapUsed Δ | arrayBuffers Δ | cap | gc exposed | verdict |
|---|---|---|---|---|---|
| transactional_send_workflow (10 send across 4 providers) | 8728 B | -12354 B | 102400 B | yes | PASS |
| template_render_batch (5 render with data) | 11808 B | 0 B | 102400 B | yes | PASS |
| webhook_verify_delivery_batch (5 verify + parse) | 712 B | -24576 B | 102400 B | yes | PASS |

## Detailed serial reports

### transactional_send_workflow (10 send across 4 providers)

# Perf Report — transactional_send_workflow (10 send across 4 providers).serial

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
| total | 0.11ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p50 | 0.01ms | 0.01ms | +0.00ms | +0.01% |
| p95 | 0.01ms | 0.01ms | -0.00ms | -13.55% |
| p99 | 0.01ms | 0.01ms | -0.00ms | -27.46% |
| mean | 0.01ms | 0.01ms | -0.00ms | -2.58% |
| min | 0.01ms | 0.01ms | +0.00ms | +2.46% |
| max | 0.01ms | 0.01ms | -0.00ms | -30.23% |
| total | 0.11ms | 0.11ms | -0.00ms | -2.58% |

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
| total | 0.09ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p50 | 0.00ms | 0.00ms | +0.00ms | +3.56% |
| p95 | 0.01ms | 0.02ms | -0.01ms | -64.35% |
| p99 | 0.01ms | 0.02ms | -0.01ms | -65.00% |
| mean | 0.00ms | 0.01ms | -0.00ms | -23.43% |
| min | 0.00ms | 0.00ms | +0.00ms | +1.01% |
| max | 0.01ms | 0.02ms | -0.01ms | -65.12% |
| total | 0.09ms | 0.12ms | -0.03ms | -23.43% |

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
| total | 0.59ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p50 | 0.03ms | 0.03ms | -0.00ms | -10.05% |
| p95 | 0.04ms | 0.48ms | -0.44ms | -90.76% |
| p99 | 0.05ms | 0.86ms | -0.81ms | -94.64% |
| mean | 0.03ms | 0.11ms | -0.08ms | -71.76% |
| min | 0.02ms | 0.02ms | +0.00ms | +4.92% |
| max | 0.05ms | 0.95ms | -0.91ms | -95.13% |
| total | 0.59ms | 2.10ms | -1.51ms | -71.76% |

