# Perf Suite — notification-app-scenario

Threshold source: [docs/quality/perf-thresholds.md](../../quality/perf-thresholds)

## Serial p95 (concurrency = 1)

| op | p95 | cap | gate | regression |
|---|---|---|---|---|
| multi_channel_workflow (10 dispatch push+sms+in-app across providers) | 0.02ms | 100ms | PASS | stable |
| push_batch (5 sendPush with high-priority payload) | 0.00ms | 100ms | PASS | stable |
| sms_error_handling (5 failOn callback path) | 0.00ms | 100ms | PASS | stable |

## Concurrent p95 (concurrency = 4, 5 iter each)

| op | p95 | cap | gate |
|---|---|---|---|
| multi_channel_workflow (10 dispatch push+sms+in-app across providers) | 0.04ms | 200ms | PASS |
| push_batch (5 sendPush with high-priority payload) | 0.01ms | 200ms | PASS |
| sms_error_handling (5 failOn callback path) | 0.01ms | 200ms | PASS |

## Memory retention (20 iter, arrayBuffers axis is the gate; heap is informational)

| op | heapUsed Δ | arrayBuffers Δ | cap | gc exposed | verdict |
|---|---|---|---|---|---|
| multi_channel_workflow (10 dispatch push+sms+in-app across providers) | -7760 B | 0 B | 102400 B | yes | PASS |
| push_batch (5 sendPush with high-priority payload) | 8 B | 0 B | 102400 B | yes | PASS |
| sms_error_handling (5 failOn callback path) | 784 B | 0 B | 102400 B | yes | PASS |

## Detailed serial reports

### multi_channel_workflow (10 dispatch push+sms+in-app across providers)

# Perf Report — multi_channel_workflow (10 dispatch push+sms+in-app across providers).serial

| metric | value |
|---|---|
| iterations | 20 |
| warmup | 3 |
| p50 | 0.01ms |
| p95 | 0.02ms |
| p99 | 0.02ms |
| mean | 0.01ms |
| stdev | 0.00ms |
| min | 0.01ms |
| max | 0.02ms |
| total | 0.22ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p50 | 0.01ms | 0.01ms | +0.00ms | +14.81% |
| p95 | 0.02ms | 0.02ms | +0.00ms | +20.20% |
| p99 | 0.02ms | 0.02ms | +0.00ms | +11.30% |
| mean | 0.01ms | 0.01ms | +0.00ms | +8.94% |
| min | 0.01ms | 0.01ms | +0.00ms | +9.10% |
| max | 0.02ms | 0.02ms | +0.00ms | +9.42% |
| total | 0.22ms | 0.20ms | +0.02ms | +8.94% |

### push_batch (5 sendPush with high-priority payload)

# Perf Report — push_batch (5 sendPush with high-priority payload).serial

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
| max | 0.01ms |
| total | 0.04ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p50 | 0.00ms | 0.00ms | +0.00ms | +4.92% |
| p95 | 0.00ms | 0.00ms | +0.00ms | +10.44% |
| p99 | 0.00ms | 0.00ms | +0.00ms | +12.54% |
| mean | 0.00ms | 0.00ms | +0.00ms | +7.92% |
| min | 0.00ms | 0.00ms | +0.00ms | +7.69% |
| max | 0.01ms | 0.00ms | +0.00ms | +12.84% |
| total | 0.04ms | 0.04ms | +0.00ms | +7.92% |

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
| p50 | 0.00ms | 0.00ms | +0.00ms | +5.38% |
| p95 | 0.00ms | 0.00ms | +0.00ms | +6.14% |
| p99 | 0.00ms | 0.00ms | -0.00ms | -0.32% |
| mean | 0.00ms | 0.00ms | +0.00ms | +4.99% |
| min | 0.00ms | 0.00ms | +0.00ms | +5.53% |
| max | 0.00ms | 0.00ms | -0.00ms | -1.28% |
| total | 0.03ms | 0.03ms | +0.00ms | +4.99% |

