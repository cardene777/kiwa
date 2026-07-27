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
| sendPush | 0.02ms | 10ms | PASS |
| sendSMS | 0.01ms | 10ms | PASS |
| parseNotificationEvent | 0.01ms | 10ms | PASS |

## Memory retention (200 iter, arrayBuffers axis is the gate; heap is informational)

| op | heapUsed Δ | arrayBuffers Δ | cap | gc exposed | verdict |
|---|---|---|---|---|---|
| sendPush | 254640 B | 0 B | 102400 B | yes | PASS |
| sendSMS | 39232 B | 0 B | 102400 B | yes | PASS |
| parseNotificationEvent | -15896 B | 0 B | 102400 B | yes | PASS |

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
| total | 0.16ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p50 | 0.00ms | 0.00ms | +0.00ms | +7.75% |
| p95 | 0.00ms | 0.00ms | +0.00ms | +7.56% |
| p99 | 0.01ms | 0.01ms | -0.00ms | -15.32% |
| mean | 0.00ms | 0.00ms | +0.00ms | +7.56% |
| min | 0.00ms | 0.00ms | +0.00ms | +10.93% |
| max | 0.01ms | 0.01ms | +0.00ms | +4.81% |
| total | 0.16ms | 0.15ms | +0.01ms | +7.56% |

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
| total | 0.11ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p50 | 0.00ms | 0.00ms | +0.00ms | +0.22% |
| p95 | 0.00ms | 0.00ms | -0.00ms | -5.32% |
| p99 | 0.00ms | 0.00ms | +0.00ms | +13.00% |
| mean | 0.00ms | 0.00ms | +0.00ms | +12.59% |
| min | 0.00ms | 0.00ms | 0.00ms | 0.00% |
| max | 0.01ms | 0.00ms | +0.01ms | +357.41% |
| total | 0.11ms | 0.10ms | +0.01ms | +12.59% |

### parseNotificationEvent

# Perf Report — parseNotificationEvent.serial

| metric | value |
|---|---|
| iterations | 200 |
| warmup | 5 |
| p50 | 0.00ms |
| p95 | 0.00ms |
| p99 | 0.02ms |
| mean | 0.00ms |
| stdev | 0.01ms |
| min | 0.00ms |
| max | 0.14ms |
| total | 0.30ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p50 | 0.00ms | 0.00ms | +0.00ms | +9.83% |
| p95 | 0.00ms | 0.00ms | +0.00ms | +121.98% |
| p99 | 0.02ms | 0.00ms | +0.01ms | +317.90% |
| mean | 0.00ms | 0.00ms | +0.00ms | +156.25% |
| min | 0.00ms | 0.00ms | 0.00ms | 0.00% |
| max | 0.14ms | 0.01ms | +0.13ms | +1557.27% |
| total | 0.30ms | 0.12ms | +0.18ms | +156.25% |

