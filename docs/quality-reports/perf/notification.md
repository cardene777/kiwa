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

| op | heapUsed Δ | arrayBuffers Δ | cap | gc exposed | verdict |
|---|---|---|---|---|---|
| sendPush | 37896 B | 0 B | 102400 B | yes | PASS |
| sendSMS | 23080 B | 0 B | 102400 B | yes | PASS |
| parseNotificationEvent | -480 B | 0 B | 102400 B | yes | PASS |

## Detailed serial reports

### sendPush

# Perf Report — sendPush.serial

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
| max | 0.01ms |
| total | 0.15ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p50 | 0.00ms | 0.00ms | 0.00ms | 0.00% |
| p95 | 0.00ms | 0.00ms | +0.00ms | +15.82% |
| p99 | 0.00ms | 0.01ms | -0.00ms | -36.98% |
| mean | 0.00ms | 0.00ms | -0.00ms | -1.03% |
| min | 0.00ms | 0.00ms | 0.00ms | 0.00% |
| max | 0.01ms | 0.01ms | -0.00ms | -6.09% |
| total | 0.15ms | 0.15ms | -0.00ms | -1.03% |

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
| max | 0.01ms |
| total | 0.10ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p50 | 0.00ms | 0.00ms | -0.00ms | -8.95% |
| p95 | 0.00ms | 0.00ms | -0.00ms | -17.60% |
| p99 | 0.00ms | 0.00ms | +0.00ms | +10.74% |
| mean | 0.00ms | 0.00ms | +0.00ms | +3.45% |
| min | 0.00ms | 0.00ms | -0.00ms | -9.86% |
| max | 0.01ms | 0.00ms | +0.01ms | +394.90% |
| total | 0.10ms | 0.10ms | +0.00ms | +3.45% |

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
| total | 0.12ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p50 | 0.00ms | 0.00ms | 0.00ms | 0.00% |
| p95 | 0.00ms | 0.00ms | +0.00ms | +2.82% |
| p99 | 0.01ms | 0.00ms | +0.00ms | +86.44% |
| mean | 0.00ms | 0.00ms | +0.00ms | +3.22% |
| min | 0.00ms | 0.00ms | -0.00ms | -11.20% |
| max | 0.01ms | 0.01ms | +0.00ms | +17.35% |
| total | 0.12ms | 0.12ms | +0.00ms | +3.22% |

