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
| sendPush | 34552 B | 0 B | 102400 B | yes | PASS |
| sendSMS | 23480 B | 0 B | 102400 B | yes | PASS |
| parseNotificationEvent | 848 B | 0 B | 102400 B | yes | PASS |

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
| p95 | 0.00ms | 0.00ms | +0.00ms | +5.89% |
| p99 | 0.00ms | 0.01ms | -0.00ms | -38.56% |
| mean | 0.00ms | 0.00ms | -0.00ms | -1.56% |
| min | 0.00ms | 0.00ms | 0.00ms | 0.00% |
| max | 0.01ms | 0.01ms | -0.00ms | -1.28% |
| total | 0.15ms | 0.15ms | -0.00ms | -1.56% |

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
| stdev | 0.01ms |
| min | 0.00ms |
| max | 0.11ms |
| total | 0.23ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p50 | 0.00ms | 0.00ms | +0.00ms | +9.17% |
| p95 | 0.00ms | 0.00ms | +0.00ms | +5.62% |
| p99 | 0.00ms | 0.00ms | +0.00ms | +33.74% |
| mean | 0.00ms | 0.00ms | +0.00ms | +127.52% |
| min | 0.00ms | 0.00ms | +0.00ms | +10.10% |
| max | 0.11ms | 0.00ms | +0.11ms | +6696.16% |
| total | 0.23ms | 0.10ms | +0.13ms | +127.52% |

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
| p95 | 0.00ms | 0.00ms | +0.00ms | +18.91% |
| p99 | 0.01ms | 0.00ms | +0.00ms | +75.87% |
| mean | 0.00ms | 0.00ms | +0.00ms | +4.53% |
| min | 0.00ms | 0.00ms | -0.00ms | -22.40% |
| max | 0.01ms | 0.01ms | +0.00ms | +41.84% |
| total | 0.12ms | 0.12ms | +0.01ms | +4.53% |

