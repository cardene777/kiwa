# Perf Suite — payment-app-scenario

Threshold source: [docs/quality/perf-thresholds.md](../../quality/perf-thresholds)

## Serial p95 (concurrency = 1)

| op | p95 | cap | gate | regression |
|---|---|---|---|---|
| webhook_verify_cycle (10x sign + verify) | 0.07ms | 100ms | PASS | stable |
| handler_dispatch (3 handler + emit 10 events) | 0.04ms | 100ms | PASS | stable |
| bulk_sign (20 signWebhook rapid) | 0.05ms | 50ms | PASS | stable |

## Concurrent p95 (concurrency = 4, 5 iter each)

| op | p95 | cap | gate |
|---|---|---|---|
| webhook_verify_cycle (10x sign + verify) | 0.25ms | 200ms | PASS |
| handler_dispatch (3 handler + emit 10 events) | 0.15ms | 200ms | PASS |
| bulk_sign (20 signWebhook rapid) | 0.21ms | 100ms | PASS |

## Memory retention (20 iter, arrayBuffers axis is the gate; heap is informational)

| op | heapUsed Δ | arrayBuffers Δ | cap | gc exposed | verdict |
|---|---|---|---|---|---|
| webhook_verify_cycle (10x sign + verify) | -27600 B | 0 B | 102400 B | yes | PASS |
| handler_dispatch (3 handler + emit 10 events) | -15704 B | 0 B | 102400 B | yes | PASS |
| bulk_sign (20 signWebhook rapid) | -14600 B | 0 B | 102400 B | yes | PASS |

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
| max | 0.07ms |
| total | 1.26ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p50 | 0.06ms | 0.06ms | +0.00ms | +3.27% |
| p95 | 0.07ms | 0.07ms | +0.00ms | +3.63% |
| p99 | 0.07ms | 0.07ms | +0.00ms | +1.17% |
| mean | 0.06ms | 0.06ms | +0.00ms | +3.54% |
| min | 0.05ms | 0.05ms | -0.00ms | -0.63% |
| max | 0.07ms | 0.07ms | +0.00ms | +0.57% |
| total | 1.26ms | 1.22ms | +0.04ms | +3.54% |

### handler_dispatch (3 handler + emit 10 events)

# Perf Report — handler_dispatch (3 handler + emit 10 events).serial

| metric | value |
|---|---|
| iterations | 20 |
| warmup | 3 |
| p50 | 0.03ms |
| p95 | 0.04ms |
| p99 | 0.04ms |
| mean | 0.03ms |
| stdev | 0.00ms |
| min | 0.03ms |
| max | 0.04ms |
| total | 0.61ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p50 | 0.03ms | 0.02ms | +0.00ms | +19.86% |
| p95 | 0.04ms | 0.03ms | +0.01ms | +40.41% |
| p99 | 0.04ms | 0.03ms | +0.01ms | +20.11% |
| mean | 0.03ms | 0.02ms | +0.01ms | +22.39% |
| min | 0.03ms | 0.02ms | +0.00ms | +18.28% |
| max | 0.04ms | 0.03ms | +0.01ms | +16.06% |
| total | 0.61ms | 0.50ms | +0.11ms | +22.39% |

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
| total | 0.85ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p50 | 0.04ms | 0.04ms | +0.00ms | +1.41% |
| p95 | 0.05ms | 0.05ms | -0.00ms | -0.09% |
| p99 | 0.05ms | 0.05ms | +0.00ms | +2.66% |
| mean | 0.04ms | 0.04ms | +0.00ms | +1.10% |
| min | 0.04ms | 0.04ms | +0.00ms | +1.76% |
| max | 0.05ms | 0.05ms | +0.00ms | +3.31% |
| total | 0.85ms | 0.84ms | +0.01ms | +1.10% |

