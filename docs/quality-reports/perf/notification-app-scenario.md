# Perf Suite — notification-app-scenario

Threshold source: [docs/quality/perf-thresholds.md](../../quality/perf-thresholds)

## Serial p95 (concurrency = 1)

| op | p95 | cap | gate | regression |
|---|---|---|---|---|
| multi_channel_workflow (10 dispatch push+sms+in-app across providers) | 0.02ms | 100ms | PASS | stable (検知には +0.5ms (baseline 比 +521%) 以上の悪化が必要) |
| push_batch (5 sendPush with high-priority payload) | 0.00ms | 100ms | PASS | stable (検知には +0.5ms (baseline 比 +19404%) 以上の悪化が必要) |
| sms_error_handling (5 failOn callback path) | 0.00ms | 100ms | PASS | stable (検知には +0.5ms (baseline 比 +25486%) 以上の悪化が必要) |

## Concurrent p95 (concurrency = 4, 5 iter each)

| op | p95 | cap | gate |
|---|---|---|---|
| multi_channel_workflow (10 dispatch push+sms+in-app across providers) | 0.05ms | 200ms | PASS |
| push_batch (5 sendPush with high-priority payload) | 0.01ms | 200ms | PASS |
| sms_error_handling (5 failOn callback path) | 0.01ms | 200ms | PASS |

## Memory retention (20 iter, arrayBuffers axis is the gate; heap is informational)

| op | heapUsed Δ | arrayBuffers Δ | cap | gc exposed | verdict |
|---|---|---|---|---|---|
| multi_channel_workflow (10 dispatch push+sms+in-app across providers) | -8024 B | 0 B | 102400 B | yes | PASS |
| push_batch (5 sendPush with high-priority payload) | 592 B | 0 B | 102400 B | yes | PASS |
| sms_error_handling (5 failOn callback path) | 1600 B | 0 B | 102400 B | yes | PASS |

## Detailed serial reports

### multi_channel_workflow (10 dispatch push+sms+in-app across providers)

# Perf Report — multi_channel_workflow (10 dispatch push+sms+in-app across providers).serial

| metric | value |
|---|---|
| iterations | 20 |
| warmup | 3 |
| p50 | 0.01ms |
| p95 | 0.02ms |
| p99 | 0.03ms |
| mean | 0.01ms |
| stdev | 0.01ms |
| min | 0.01ms |
| max | 0.03ms |
| total | 0.21ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p50 | 0.01ms | 0.01ms | -0.00ms | -31.22% |
| p95 | 0.02ms | 0.10ms | -0.08ms | -79.65% |
| p99 | 0.03ms | 1.04ms | -1.01ms | -97.45% |
| mean | 0.01ms | 0.08ms | -0.07ms | -86.11% |
| min | 0.01ms | 0.01ms | -0.00ms | -9.75% |
| max | 0.03ms | 1.27ms | -1.24ms | -97.78% |
| total | 0.21ms | 1.51ms | -1.30ms | -86.11% |

### push_batch (5 sendPush with high-priority payload)

# Perf Report — push_batch (5 sendPush with high-priority payload).serial

| metric | value |
|---|---|
| iterations | 20 |
| warmup | 3 |
| p50 | 0.00ms |
| p95 | 0.00ms |
| p99 | 0.01ms |
| mean | 0.00ms |
| stdev | 0.00ms |
| min | 0.00ms |
| max | 0.01ms |
| total | 0.05ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p50 | 0.00ms | 0.00ms | +0.00ms | +9.51% |
| p95 | 0.00ms | 0.00ms | +0.00ms | +42.84% |
| p99 | 0.01ms | 0.00ms | +0.00ms | +32.42% |
| mean | 0.00ms | 0.00ms | +0.00ms | +20.24% |
| min | 0.00ms | 0.00ms | -0.00ms | -4.86% |
| max | 0.01ms | 0.00ms | +0.00ms | +31.04% |
| total | 0.05ms | 0.04ms | +0.01ms | +20.24% |

### sms_error_handling (5 failOn callback path)

# Perf Report — sms_error_handling (5 failOn callback path).serial

| metric | value |
|---|---|
| iterations | 20 |
| warmup | 3 |
| p50 | 0.00ms |
| p95 | 0.00ms |
| p99 | 0.00ms |
| mean | 0.00ms |
| stdev | 0.00ms |
| min | 0.00ms |
| max | 0.00ms |
| total | 0.03ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p50 | 0.00ms | 0.00ms | -0.00ms | -7.69% |
| p95 | 0.00ms | 0.00ms | -0.00ms | -4.39% |
| p99 | 0.00ms | 0.00ms | -0.00ms | -5.64% |
| mean | 0.00ms | 0.00ms | -0.00ms | -5.69% |
| min | 0.00ms | 0.00ms | -0.00ms | -5.39% |
| max | 0.00ms | 0.00ms | -0.00ms | -5.86% |
| total | 0.03ms | 0.03ms | -0.00ms | -5.69% |

