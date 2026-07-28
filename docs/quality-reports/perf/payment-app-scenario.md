# Perf Suite — payment-app-scenario

Threshold source: [docs/quality/perf-thresholds.md](../../quality/perf-thresholds)

## Serial p95 (concurrency = 1)

| op | p95 | cap | gate | regression |
|---|---|---|---|---|
| webhook_verify_cycle (10x sign + verify) | 0.11ms | 100ms | PASS | stable (検知には +0.5ms (baseline 比 +524%) 以上の悪化が必要) |
| handler_dispatch (3 handler + emit 10 events) | 0.03ms | 100ms | PASS | stable (検知には +0.5ms (baseline 比 +1535%) 以上の悪化が必要) |
| bulk_sign (20 signWebhook rapid) | 0.06ms | 50ms | PASS | stable (検知には +0.5ms (baseline 比 +865%) 以上の悪化が必要) |

## Concurrent p95 (concurrency = 4, 5 iter each)

| op | p95 | cap | gate |
|---|---|---|---|
| webhook_verify_cycle (10x sign + verify) | 0.22ms | 200ms | PASS |
| handler_dispatch (3 handler + emit 10 events) | 0.13ms | 200ms | PASS |
| bulk_sign (20 signWebhook rapid) | 0.19ms | 100ms | PASS |

## Memory retention (20 iter, arrayBuffers axis is the gate; heap is informational)

| op | heapUsed Δ | arrayBuffers Δ | cap | gc exposed | verdict |
|---|---|---|---|---|---|
| webhook_verify_cycle (10x sign + verify) | -12736 B | 0 B | 102400 B | yes | PASS |
| handler_dispatch (3 handler + emit 10 events) | -4728 B | 0 B | 102400 B | yes | PASS |
| bulk_sign (20 signWebhook rapid) | 968 B | 0 B | 102400 B | yes | PASS |

## Detailed serial reports

### webhook_verify_cycle (10x sign + verify)

# Perf Report — webhook_verify_cycle (10x sign + verify).serial

| metric | value |
|---|---|
| iterations | 20 |
| warmup | 3 |
| p50 | 0.06ms |
| p95 | 0.11ms |
| p99 | 0.13ms |
| mean | 0.07ms |
| stdev | 0.02ms |
| min | 0.05ms |
| max | 0.14ms |
| total | 1.38ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p50 | 0.06ms | 0.07ms | -0.00ms | -7.36% |
| p95 | 0.11ms | 0.10ms | +0.01ms | +14.55% |
| p99 | 0.13ms | 0.16ms | -0.03ms | -16.62% |
| mean | 0.07ms | 0.07ms | -0.00ms | -6.41% |
| min | 0.05ms | 0.05ms | -0.00ms | -4.85% |
| max | 0.14ms | 0.18ms | -0.04ms | -20.87% |
| total | 1.38ms | 1.47ms | -0.09ms | -6.41% |

### handler_dispatch (3 handler + emit 10 events)

# Perf Report — handler_dispatch (3 handler + emit 10 events).serial

| metric | value |
|---|---|
| iterations | 20 |
| warmup | 3 |
| p50 | 0.02ms |
| p95 | 0.03ms |
| p99 | 0.03ms |
| mean | 0.03ms |
| stdev | 0.00ms |
| min | 0.02ms |
| max | 0.03ms |
| total | 0.51ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p50 | 0.02ms | 0.03ms | -0.00ms | -4.52% |
| p95 | 0.03ms | 0.03ms | -0.00ms | -11.32% |
| p99 | 0.03ms | 0.03ms | -0.00ms | -4.51% |
| mean | 0.03ms | 0.03ms | -0.00ms | -3.60% |
| min | 0.02ms | 0.03ms | -0.00ms | -5.11% |
| max | 0.03ms | 0.03ms | -0.00ms | -2.81% |
| total | 0.51ms | 0.53ms | -0.02ms | -3.60% |

### bulk_sign (20 signWebhook rapid)

# Perf Report — bulk_sign (20 signWebhook rapid).serial

| metric | value |
|---|---|
| iterations | 20 |
| warmup | 3 |
| p50 | 0.04ms |
| p95 | 0.06ms |
| p99 | 0.07ms |
| mean | 0.05ms |
| stdev | 0.01ms |
| min | 0.04ms |
| max | 0.07ms |
| total | 0.93ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p50 | 0.04ms | 0.04ms | -0.00ms | -6.07% |
| p95 | 0.06ms | 0.06ms | +0.01ms | +10.68% |
| p99 | 0.07ms | 0.10ms | -0.03ms | -34.56% |
| mean | 0.05ms | 0.05ms | -0.00ms | -5.53% |
| min | 0.04ms | 0.04ms | -0.00ms | -5.58% |
| max | 0.07ms | 0.11ms | -0.05ms | -40.41% |
| total | 0.93ms | 0.98ms | -0.05ms | -5.53% |

