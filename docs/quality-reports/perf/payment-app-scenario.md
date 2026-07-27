# Perf Suite — payment-app-scenario

Threshold source: [docs/quality/perf-thresholds.md](../../quality/perf-thresholds)

## Serial p95 (concurrency = 1)

| op | p95 | cap | gate | regression |
|---|---|---|---|---|
| webhook_verify_cycle (10x sign + verify) | 0.08ms | 100ms | PASS | improved |
| handler_dispatch (3 handler + emit 10 events) | 0.03ms | 100ms | PASS | improved |
| bulk_sign (20 signWebhook rapid) | 0.04ms | 50ms | PASS | stable |

## Concurrent p95 (concurrency = 4, 5 iter each)

| op | p95 | cap | gate |
|---|---|---|---|
| webhook_verify_cycle (10x sign + verify) | 0.21ms | 200ms | PASS |
| handler_dispatch (3 handler + emit 10 events) | 0.10ms | 200ms | PASS |
| bulk_sign (20 signWebhook rapid) | 0.22ms | 100ms | PASS |

## Memory retention (20 iter, arrayBuffers axis is the gate; heap is informational)

| op | heapUsed Δ | arrayBuffers Δ | cap | verdict |
|---|---|---|---|---|
| webhook_verify_cycle (10x sign + verify) | 659720 B | 32768 B | 102400 B | PASS |
| handler_dispatch (3 handler + emit 10 events) | 629568 B | 0 B | 102400 B | PASS |
| bulk_sign (20 signWebhook rapid) | 639960 B | 0 B | 102400 B | PASS |

## Detailed serial reports

### webhook_verify_cycle (10x sign + verify)

# Perf Report — webhook_verify_cycle (10x sign + verify).serial

| metric | value |
|---|---|
| iterations | 20 |
| warmup | 3 |
| p50 | 0.06ms |
| p95 | 0.08ms |
| p99 | 0.08ms |
| mean | 0.06ms |
| stdev | 0.01ms |
| min | 0.05ms |
| max | 0.08ms |
| total | 1.30ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p50 | 0.06ms | 0.10ms | -0.04ms | -38.01% |
| p95 | 0.08ms | 0.38ms | -0.30ms | -78.47% |
| p99 | 0.08ms | 0.42ms | -0.33ms | -80.14% |
| mean | 0.06ms | 0.16ms | -0.09ms | -58.87% |
| min | 0.05ms | 0.05ms | +0.00ms | +2.46% |
| max | 0.08ms | 0.43ms | -0.34ms | -80.51% |
| total | 1.30ms | 3.15ms | -1.85ms | -58.87% |

### handler_dispatch (3 handler + emit 10 events)

# Perf Report — handler_dispatch (3 handler + emit 10 events).serial

| metric | value |
|---|---|
| iterations | 20 |
| warmup | 3 |
| p50 | 0.02ms |
| p95 | 0.03ms |
| p99 | 0.03ms |
| mean | 0.02ms |
| stdev | 0.00ms |
| min | 0.02ms |
| max | 0.03ms |
| total | 0.45ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p50 | 0.02ms | 0.08ms | -0.06ms | -72.77% |
| p95 | 0.03ms | 0.32ms | -0.29ms | -91.37% |
| p99 | 0.03ms | 0.42ms | -0.39ms | -93.12% |
| mean | 0.02ms | 0.11ms | -0.09ms | -79.70% |
| min | 0.02ms | 0.03ms | -0.01ms | -26.38% |
| max | 0.03ms | 0.45ms | -0.42ms | -93.44% |
| total | 0.45ms | 2.23ms | -1.78ms | -79.70% |

### bulk_sign (20 signWebhook rapid)

# Perf Report — bulk_sign (20 signWebhook rapid).serial

| metric | value |
|---|---|
| iterations | 20 |
| warmup | 3 |
| p50 | 0.04ms |
| p95 | 0.04ms |
| p99 | 0.14ms |
| mean | 0.04ms |
| stdev | 0.03ms |
| min | 0.04ms |
| max | 0.16ms |
| total | 0.86ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p50 | 0.04ms | 0.05ms | -0.01ms | -22.84% |
| p95 | 0.04ms | 0.26ms | -0.21ms | -82.77% |
| p99 | 0.14ms | 0.33ms | -0.19ms | -58.58% |
| mean | 0.04ms | 0.09ms | -0.05ms | -53.63% |
| min | 0.04ms | 0.05ms | -0.01ms | -20.04% |
| max | 0.16ms | 0.35ms | -0.19ms | -54.14% |
| total | 0.86ms | 1.85ms | -0.99ms | -53.63% |

