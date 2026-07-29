# Perf Suite — payment-app-scenario

Threshold source: [docs/quality/perf-thresholds.md](../../quality/perf-thresholds)

## Serial p95 (concurrency = 1)

| op | p95 | cap | gate | regression |
|---|---|---|---|---|
| webhook_verify_cycle (10x sign + verify) | 0.09ms | 100ms | PASS | stable (検知には +0.5ms (baseline 比 +524%) 以上の悪化が必要) — gate 無効 (regressionGate=false) |
| handler_dispatch (3 handler + emit 10 events) | 0.04ms | 100ms | PASS | stable (検知には +0.5ms (baseline 比 +1535%) 以上の悪化が必要) — gate 無効 (regressionGate=false) |
| bulk_sign (20 signWebhook rapid) | 0.05ms | 50ms | PASS | stable (検知には +0.5ms (baseline 比 +865%) 以上の悪化が必要) — gate 無効 (regressionGate=false) |

## Concurrent p95 (concurrency = 4, 5 iter each)

| op | p95 | cap | gate |
|---|---|---|---|
| webhook_verify_cycle (10x sign + verify) | 0.23ms | 200ms | PASS |
| handler_dispatch (3 handler + emit 10 events) | 0.13ms | 200ms | PASS |
| bulk_sign (20 signWebhook rapid) | 1.33ms | 100ms | PASS |

## Memory retention (20 iter, arrayBuffers axis is the gate; heap is informational)

| op | heapUsed Δ | arrayBuffers Δ | cap | gc exposed | verdict |
|---|---|---|---|---|---|
| webhook_verify_cycle (10x sign + verify) | -18432 B | 0 B | 102400 B | yes | PASS |
| handler_dispatch (3 handler + emit 10 events) | 248 B | 0 B | 102400 B | yes | PASS |
| bulk_sign (20 signWebhook rapid) | -9744 B | 0 B | 102400 B | yes | PASS |

## Detailed serial reports

### webhook_verify_cycle (10x sign + verify)

# Perf Report — webhook_verify_cycle (10x sign + verify).serial

| metric | value |
|---|---|
| iterations | 20 |
| warmup | 3 |
| p50 | 0.07ms |
| p95 | 0.09ms |
| p99 | 0.09ms |
| mean | 0.07ms |
| stdev | 0.01ms |
| min | 0.06ms |
| max | 0.09ms |
| total | 1.40ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p50 | 0.07ms | 0.07ms | -0.00ms | -0.68% |
| p95 | 0.09ms | 0.10ms | -0.01ms | -10.00% |
| p99 | 0.09ms | 0.16ms | -0.07ms | -43.38% |
| mean | 0.07ms | 0.07ms | -0.00ms | -5.23% |
| min | 0.06ms | 0.05ms | +0.00ms | +5.38% |
| max | 0.09ms | 0.18ms | -0.08ms | -47.93% |
| total | 1.40ms | 1.47ms | -0.08ms | -5.23% |

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
| total | 0.62ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p50 | 0.03ms | 0.03ms | +0.00ms | +13.49% |
| p95 | 0.04ms | 0.03ms | +0.00ms | +13.77% |
| p99 | 0.04ms | 0.03ms | +0.01ms | +28.74% |
| mean | 0.03ms | 0.03ms | +0.00ms | +15.86% |
| min | 0.03ms | 0.03ms | +0.00ms | +11.36% |
| max | 0.04ms | 0.03ms | +0.01ms | +32.48% |
| total | 0.62ms | 0.53ms | +0.08ms | +15.86% |

### bulk_sign (20 signWebhook rapid)

# Perf Report — bulk_sign (20 signWebhook rapid).serial

| metric | value |
|---|---|
| iterations | 20 |
| warmup | 3 |
| p50 | 0.05ms |
| p95 | 0.05ms |
| p99 | 0.12ms |
| mean | 0.05ms |
| stdev | 0.02ms |
| min | 0.04ms |
| max | 0.14ms |
| total | 1.00ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p50 | 0.05ms | 0.04ms | +0.00ms | +2.23% |
| p95 | 0.05ms | 0.06ms | -0.00ms | -8.29% |
| p99 | 0.12ms | 0.10ms | +0.02ms | +19.07% |
| mean | 0.05ms | 0.05ms | +0.00ms | +2.37% |
| min | 0.04ms | 0.04ms | -0.00ms | -0.10% |
| max | 0.14ms | 0.11ms | +0.03ms | +22.61% |
| total | 1.00ms | 0.98ms | +0.02ms | +2.37% |

