# Perf Suite — notification

Threshold source: [docs/quality/perf-thresholds.md](../../quality/perf-thresholds)

## Serial p95 (concurrency = 1)

| op | p95 | cap | gate | regression |
|---|---|---|---|---|
| sendPush | 0.00ms | 5ms | PASS | stable (検知には +0.5ms (baseline 比 +22529%) 以上の悪化が必要) |
| sendSMS | 0.00ms | 5ms | PASS | stable (検知には +0.5ms (baseline 比 +79732%) 以上の悪化が必要) |
| parseNotificationEvent | 0.00ms | 5ms | PASS | stable (検知には +0.5ms (baseline 比 +45903%) 以上の悪化が必要) |

## Concurrent p95 (concurrency = 10, 50 iter each)

| op | p95 | cap | gate |
|---|---|---|---|
| sendPush | 0.02ms | 10ms | PASS |
| sendSMS | 0.17ms | 10ms | PASS |
| parseNotificationEvent | 0.01ms | 10ms | PASS |

## Memory retention (200 iter, arrayBuffers axis is the gate; heap is informational)

| op | heapUsed Δ | arrayBuffers Δ | cap | gc exposed | verdict |
|---|---|---|---|---|---|
| sendPush | 24168 B | 0 B | 102400 B | yes | PASS |
| sendSMS | 23264 B | 0 B | 102400 B | yes | PASS |
| parseNotificationEvent | 632 B | 0 B | 102400 B | yes | PASS |

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
| max | 0.02ms |
| total | 0.19ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p50 | 0.00ms | 0.00ms | +0.00ms | +18.08% |
| p95 | 0.00ms | 0.00ms | -0.00ms | -0.51% |
| p99 | 0.01ms | 0.01ms | -0.00ms | -44.12% |
| mean | 0.00ms | 0.00ms | -0.00ms | -39.67% |
| min | 0.00ms | 0.00ms | +0.00ms | +20.19% |
| max | 0.02ms | 0.17ms | -0.15ms | -90.33% |
| total | 0.19ms | 0.32ms | -0.13ms | -39.67% |

### sendSMS

# Perf Report — sendSMS.serial

| metric | value |
|---|---|
| iterations | 200 |
| warmup | 5 |
| p50 | 0.00ms |
| p95 | 0.00ms |
| p99 | 0.01ms |
| mean | 0.00ms |
| stdev | 0.04ms |
| min | 0.00ms |
| max | 0.50ms |
| total | 0.64ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p50 | 0.00ms | 0.00ms | -0.00ms | -8.40% |
| p95 | 0.00ms | 0.00ms | +0.00ms | +155.42% |
| p99 | 0.01ms | 0.00ms | +0.01ms | +435.35% |
| mean | 0.00ms | 0.00ms | +0.00ms | +507.68% |
| min | 0.00ms | 0.00ms | -0.00ms | -9.17% |
| max | 0.50ms | 0.00ms | +0.50ms | +23486.31% |
| total | 0.64ms | 0.11ms | +0.54ms | +507.68% |

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
| p50 | 0.00ms | 0.00ms | 0.00ms | 0.00% |
| p95 | 0.00ms | 0.00ms | -0.00ms | -10.71% |
| p99 | 0.01ms | 0.00ms | +0.00ms | +106.96% |
| mean | 0.00ms | 0.00ms | -0.00ms | -0.79% |
| min | 0.00ms | 0.00ms | -0.00ms | -9.86% |
| max | 0.01ms | 0.01ms | -0.00ms | -9.44% |
| total | 0.13ms | 0.13ms | -0.00ms | -0.79% |

