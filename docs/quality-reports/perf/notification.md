# Perf Suite — notification

Threshold source: [docs/quality/perf-thresholds.md](../../quality/perf-thresholds)

## Serial p95 (concurrency = 1)

| op | p95 | cap | gate | regression |
|---|---|---|---|---|
| sendPush | 0.00ms | 5ms | PASS | stable |
| sendSMS | 0.00ms | 5ms | PASS | stable |
| parseNotificationEvent | 0.00ms | 5ms | PASS | stable |

## Concurrent p95 (concurrency = 10, 50 iter each)

| op | p95 | cap | gate |
|---|---|---|---|
| sendPush | 0.01ms | 10ms | PASS |
| sendSMS | 0.01ms | 10ms | PASS |
| parseNotificationEvent | 0.01ms | 10ms | PASS |

## Memory retention (200 iter, arrayBuffers axis is the gate; heap is informational)

| op | heapUsed Δ | arrayBuffers Δ | cap | verdict |
|---|---|---|---|---|
| sendPush | 540832 B | 0 B | 102400 B | PASS |
| sendSMS | 378176 B | 0 B | 102400 B | PASS |
| parseNotificationEvent | 218064 B | 0 B | 102400 B | PASS |

## Detailed serial reports

### sendPush

# Perf Report — sendPush.serial

| metric | value |
|---|---|
| iterations | 200 |
| warmup | 5 |
| p50 | 0.00ms |
| p95 | 0.00ms |
| p99 | 0.01ms |
| mean | 0.00ms |
| stdev | 0.00ms |
| min | 0.00ms |
| max | 0.01ms |
| total | 0.14ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p50 | 0.00ms | 0.00ms | 0.00ms | 0.00% |
| p95 | 0.00ms | 0.00ms | -0.00ms | -21.40% |
| p99 | 0.01ms | 0.01ms | -0.00ms | -32.27% |
| mean | 0.00ms | 0.00ms | -0.00ms | -9.01% |
| min | 0.00ms | 0.00ms | -0.00ms | -9.86% |
| max | 0.01ms | 0.01ms | -0.00ms | -17.78% |
| total | 0.14ms | 0.15ms | -0.01ms | -9.01% |

### sendSMS

# Perf Report — sendSMS.serial

| metric | value |
|---|---|
| iterations | 200 |
| warmup | 5 |
| p50 | 0.00ms |
| p95 | 0.00ms |
| p99 | 0.00ms |
| mean | 0.00ms |
| stdev | 0.00ms |
| min | 0.00ms |
| max | 0.00ms |
| total | 0.09ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p50 | 0.00ms | 0.00ms | -0.00ms | -8.95% |
| p95 | 0.00ms | 0.00ms | -0.00ms | -47.94% |
| p99 | 0.00ms | 0.00ms | -0.00ms | -2.56% |
| mean | 0.00ms | 0.00ms | -0.00ms | -8.60% |
| min | 0.00ms | 0.00ms | -0.00ms | -9.86% |
| max | 0.00ms | 0.00ms | -0.00ms | -13.20% |
| total | 0.09ms | 0.10ms | -0.01ms | -8.60% |

### parseNotificationEvent

# Perf Report — parseNotificationEvent.serial

| metric | value |
|---|---|
| iterations | 200 |
| warmup | 5 |
| p50 | 0.00ms |
| p95 | 0.00ms |
| p99 | 0.01ms |
| mean | 0.00ms |
| stdev | 0.00ms |
| min | 0.00ms |
| max | 0.01ms |
| total | 0.13ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p50 | 0.00ms | 0.00ms | +0.00ms | +11.20% |
| p95 | 0.00ms | 0.00ms | -0.00ms | -13.68% |
| p99 | 0.01ms | 0.00ms | +0.01ms | +159.98% |
| mean | 0.00ms | 0.00ms | +0.00ms | +6.96% |
| min | 0.00ms | 0.00ms | +0.00ms | +14.04% |
| max | 0.01ms | 0.01ms | +0.01ms | +90.85% |
| total | 0.13ms | 0.12ms | +0.01ms | +6.96% |

