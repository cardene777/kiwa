# Perf Suite — notification

Threshold source: [docs/quality/perf-thresholds.md](../../quality/perf-thresholds)

## Serial p95 (concurrency = 1)

| op | p95 | cap | gate | regression |
|---|---|---|---|---|
| sendPush | 0.00ms | 5ms | PASS | stable (検知には +0.5ms (baseline 比 +22529%) 以上の悪化が必要) — gate 無効 (regressionGate=false) |
| sendSMS | 0.00ms | 5ms | PASS | stable (検知には +0.5ms (baseline 比 +79732%) 以上の悪化が必要) — gate 無効 (regressionGate=false) |
| parseNotificationEvent | 0.00ms | 5ms | PASS | stable (検知には +0.5ms (baseline 比 +45903%) 以上の悪化が必要) — gate 無効 (regressionGate=false) |

## Concurrent p95 (concurrency = 10, 50 iter each)

| op | p95 | cap | gate |
|---|---|---|---|
| sendPush | 0.01ms | 10ms | PASS |
| sendSMS | 0.01ms | 10ms | PASS |
| parseNotificationEvent | 0.01ms | 10ms | PASS |

## Memory retention (200 iter, arrayBuffers axis is the gate; heap is informational)

| op | heapUsed Δ | arrayBuffers Δ | cap | gc exposed | verdict |
|---|---|---|---|---|---|
| sendPush | 39944 B | 0 B | 102400 B | yes | PASS |
| sendSMS | 38840 B | 0 B | 102400 B | yes | PASS |
| parseNotificationEvent | 12280 B | 0 B | 102400 B | yes | PASS |

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
| p50 | 0.00ms | 0.00ms | +0.00ms | +36.17% |
| p95 | 0.00ms | 0.00ms | -0.00ms | -45.38% |
| p99 | 0.00ms | 0.01ms | -0.01ms | -56.57% |
| mean | 0.00ms | 0.00ms | -0.00ms | -52.31% |
| min | 0.00ms | 0.00ms | +0.00ms | +30.05% |
| max | 0.01ms | 0.17ms | -0.16ms | -94.03% |
| total | 0.15ms | 0.32ms | -0.17ms | -52.31% |

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
| total | 0.11ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p50 | 0.00ms | 0.00ms | 0.00ms | 0.00% |
| p95 | 0.00ms | 0.00ms | +0.00ms | +6.21% |
| p99 | 0.00ms | 0.00ms | +0.00ms | +2.46% |
| mean | 0.00ms | 0.00ms | +0.00ms | +2.33% |
| min | 0.00ms | 0.00ms | 0.00ms | 0.00% |
| max | 0.00ms | 0.00ms | +0.00ms | +52.94% |
| total | 0.11ms | 0.11ms | +0.00ms | +2.33% |

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
| total | 0.15ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p50 | 0.00ms | 0.00ms | +0.00ms | +9.17% |
| p95 | 0.00ms | 0.00ms | +0.00ms | +33.95% |
| p99 | 0.01ms | 0.00ms | +0.00ms | +90.98% |
| mean | 0.00ms | 0.00ms | +0.00ms | +12.52% |
| min | 0.00ms | 0.00ms | 0.00ms | 0.00% |
| max | 0.01ms | 0.01ms | -0.00ms | -1.51% |
| total | 0.15ms | 0.13ms | +0.02ms | +12.52% |

