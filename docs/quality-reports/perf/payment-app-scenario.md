# Perf Suite — payment-app-scenario

Threshold source: [docs/quality/perf-thresholds.md](../../quality/perf-thresholds)

## Serial p95 (concurrency = 1)

| op | p95 | cap | gate | regression |
|---|---|---|---|---|
| webhook_verify_cycle (10x sign + verify) | 0.07ms | 100ms | PASS | stable |
| handler_dispatch (3 handler + emit 10 events) | 0.03ms | 100ms | PASS | stable |
| bulk_sign (20 signWebhook rapid) | 0.05ms | 50ms | PASS | stable |

## Concurrent p95 (concurrency = 4, 5 iter each)

| op | p95 | cap | gate |
|---|---|---|---|
| webhook_verify_cycle (10x sign + verify) | 0.22ms | 200ms | PASS |
| handler_dispatch (3 handler + emit 10 events) | 0.16ms | 200ms | PASS |
| bulk_sign (20 signWebhook rapid) | 0.19ms | 100ms | PASS |

## Memory retention (20 iter, arrayBuffers axis is the gate; heap is informational)

| op | heapUsed Δ | arrayBuffers Δ | cap | gc exposed | verdict |
|---|---|---|---|---|---|
| webhook_verify_cycle (10x sign + verify) | -23176 B | 0 B | 102400 B | yes | PASS |
| handler_dispatch (3 handler + emit 10 events) | -18640 B | 0 B | 102400 B | yes | PASS |
| bulk_sign (20 signWebhook rapid) | -2408 B | 0 B | 102400 B | yes | PASS |

## Detailed serial reports

### webhook_verify_cycle (10x sign + verify)

# Perf Report — webhook_verify_cycle (10x sign + verify).serial

| metric | value |
|---|---|
| iterations | 20 |
| warmup | 3 |
| p50 | 0.06ms |
| p95 | 0.07ms |
| p99 | 0.07ms |
| mean | 0.06ms |
| stdev | 0.01ms |
| min | 0.05ms |
| max | 0.08ms |
| total | 1.24ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p50 | 0.06ms | 0.06ms | +0.00ms | +3.13% |
| p95 | 0.07ms | 0.07ms | +0.00ms | +0.86% |
| p99 | 0.07ms | 0.07ms | +0.00ms | +2.98% |
| mean | 0.06ms | 0.06ms | +0.00ms | +2.08% |
| min | 0.05ms | 0.05ms | +0.00ms | +1.83% |
| max | 0.08ms | 0.07ms | +0.00ms | +3.49% |
| total | 1.24ms | 1.22ms | +0.03ms | +2.08% |

### handler_dispatch (3 handler + emit 10 events)

# Perf Report — handler_dispatch (3 handler + emit 10 events).serial

| metric | value |
|---|---|
| iterations | 20 |
| warmup | 3 |
| p50 | 0.03ms |
| p95 | 0.03ms |
| p99 | 0.03ms |
| mean | 0.03ms |
| stdev | 0.00ms |
| min | 0.02ms |
| max | 0.03ms |
| total | 0.54ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p50 | 0.03ms | 0.02ms | +0.00ms | +9.41% |
| p95 | 0.03ms | 0.03ms | +0.00ms | +13.17% |
| p99 | 0.03ms | 0.03ms | +0.00ms | +0.16% |
| mean | 0.03ms | 0.02ms | +0.00ms | +8.50% |
| min | 0.02ms | 0.02ms | +0.00ms | +5.02% |
| max | 0.03ms | 0.03ms | -0.00ms | -2.43% |
| total | 0.54ms | 0.50ms | +0.04ms | +8.50% |

### bulk_sign (20 signWebhook rapid)

# Perf Report — bulk_sign (20 signWebhook rapid).serial

| metric | value |
|---|---|
| iterations | 20 |
| warmup | 3 |
| p50 | 0.04ms |
| p95 | 0.05ms |
| p99 | 0.05ms |
| mean | 0.04ms |
| stdev | 0.00ms |
| min | 0.04ms |
| max | 0.05ms |
| total | 0.89ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p50 | 0.04ms | 0.04ms | +0.00ms | +8.13% |
| p95 | 0.05ms | 0.05ms | +0.00ms | +4.23% |
| p99 | 0.05ms | 0.05ms | +0.00ms | +0.32% |
| mean | 0.04ms | 0.04ms | +0.00ms | +6.62% |
| min | 0.04ms | 0.04ms | +0.00ms | +6.22% |
| max | 0.05ms | 0.05ms | -0.00ms | -0.61% |
| total | 0.89ms | 0.84ms | +0.06ms | +6.62% |

