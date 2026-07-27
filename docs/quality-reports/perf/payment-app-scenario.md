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
| handler_dispatch (3 handler + emit 10 events) | 0.13ms | 200ms | PASS |
| bulk_sign (20 signWebhook rapid) | 0.20ms | 100ms | PASS |

## Memory retention (20 iter, arrayBuffers axis is the gate; heap is informational)

| op | heapUsed Δ | arrayBuffers Δ | cap | gc exposed | verdict |
|---|---|---|---|---|---|
| webhook_verify_cycle (10x sign + verify) | -23208 B | 0 B | 102400 B | yes | PASS |
| handler_dispatch (3 handler + emit 10 events) | -18192 B | 0 B | 102400 B | yes | PASS |
| bulk_sign (20 signWebhook rapid) | 640 B | 0 B | 102400 B | yes | PASS |

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
| total | 1.20ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p50 | 0.06ms | 0.06ms | -0.00ms | -2.61% |
| p95 | 0.07ms | 0.07ms | -0.00ms | -1.10% |
| p99 | 0.07ms | 0.07ms | -0.00ms | -2.47% |
| mean | 0.06ms | 0.06ms | -0.00ms | -1.07% |
| min | 0.05ms | 0.05ms | +0.00ms | +2.63% |
| max | 0.07ms | 0.07ms | -0.00ms | -2.80% |
| total | 1.20ms | 1.22ms | -0.01ms | -1.07% |

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
| total | 0.50ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p50 | 0.02ms | 0.02ms | +0.00ms | +0.09% |
| p95 | 0.03ms | 0.03ms | +0.00ms | +9.59% |
| p99 | 0.03ms | 0.03ms | -0.00ms | -5.71% |
| mean | 0.03ms | 0.02ms | +0.00ms | +1.73% |
| min | 0.02ms | 0.02ms | 0.00ms | 0.00% |
| max | 0.03ms | 0.03ms | -0.00ms | -8.76% |
| total | 0.50ms | 0.50ms | +0.01ms | +1.73% |

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
| total | 0.88ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p50 | 0.04ms | 0.04ms | +0.00ms | +5.50% |
| p95 | 0.05ms | 0.05ms | +0.00ms | +1.49% |
| p99 | 0.05ms | 0.05ms | +0.00ms | +7.11% |
| mean | 0.04ms | 0.04ms | +0.00ms | +4.53% |
| min | 0.04ms | 0.04ms | +0.00ms | +3.21% |
| max | 0.05ms | 0.05ms | +0.00ms | +8.45% |
| total | 0.88ms | 0.84ms | +0.04ms | +4.53% |

