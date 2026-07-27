# Perf Suite — notification-app-scenario

Threshold source: [docs/quality/perf-thresholds.md](../../quality/perf-thresholds)

## Serial p95 (concurrency = 1)

| op | p95 | cap | gate | regression |
|---|---|---|---|---|
| multi_channel_workflow (10 dispatch push+sms+in-app across providers) | 0.02ms | 100ms | PASS | stable |
| push_batch (5 sendPush with high-priority payload) | 0.01ms | 100ms | PASS | stable |
| sms_error_handling (5 failOn callback path) | 0.00ms | 100ms | PASS | stable |

## Concurrent p95 (concurrency = 4, 5 iter each)

| op | p95 | cap | gate |
|---|---|---|---|
| multi_channel_workflow (10 dispatch push+sms+in-app across providers) | 0.03ms | 200ms | PASS |
| push_batch (5 sendPush with high-priority payload) | 0.01ms | 200ms | PASS |
| sms_error_handling (5 failOn callback path) | 0.01ms | 200ms | PASS |

## Memory retention (20 iter, arrayBuffers axis is the gate; heap is informational)

| op | heapUsed Δ | arrayBuffers Δ | cap | gc exposed | verdict |
|---|---|---|---|---|---|
| multi_channel_workflow (10 dispatch push+sms+in-app across providers) | -4464 B | 0 B | 102400 B | yes | PASS |
| push_batch (5 sendPush with high-priority payload) | 1224 B | 0 B | 102400 B | yes | PASS |
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
| total | 0.20ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p50 | 0.01ms | 0.01ms | +0.00ms | +2.65% |
| p95 | 0.02ms | 0.02ms | +0.00ms | +23.83% |
| p99 | 0.02ms | 0.02ms | +0.00ms | +8.45% |
| mean | 0.01ms | 0.01ms | +0.00ms | +1.01% |
| min | 0.01ms | 0.01ms | +0.00ms | +2.85% |
| max | 0.02ms | 0.02ms | +0.00ms | +5.19% |
| total | 0.20ms | 0.20ms | +0.00ms | +1.01% |

### push_batch (5 sendPush with high-priority payload)

# Perf Report — push_batch (5 sendPush with high-priority payload).serial

| metric | value |
|---|---|
| iterations | 20 |
| warmup | 3 |
| p50 | 0.00ms |
| p95 | 0.01ms |
| p99 | 0.01ms |
| mean | 0.00ms |
| stdev | 0.00ms |
| min | 0.00ms |
| max | 0.01ms |
| total | 0.05ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p50 | 0.00ms | 0.00ms | -0.00ms | -2.46% |
| p95 | 0.01ms | 0.00ms | +0.00ms | +116.54% |
| p99 | 0.01ms | 0.00ms | +0.01ms | +173.57% |
| mean | 0.00ms | 0.00ms | +0.00ms | +30.44% |
| min | 0.00ms | 0.00ms | -0.00ms | -2.58% |
| max | 0.01ms | 0.00ms | +0.01ms | +181.62% |
| total | 0.05ms | 0.04ms | +0.01ms | +30.44% |

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
| p50 | 0.00ms | 0.00ms | -0.00ms | -2.72% |
| p95 | 0.00ms | 0.00ms | +0.00ms | +13.93% |
| p99 | 0.00ms | 0.00ms | -0.00ms | -4.96% |
| mean | 0.00ms | 0.00ms | -0.00ms | -1.53% |
| min | 0.00ms | 0.00ms | -0.00ms | -5.53% |
| max | 0.00ms | 0.00ms | -0.00ms | -7.76% |
| total | 0.03ms | 0.03ms | -0.00ms | -1.53% |

