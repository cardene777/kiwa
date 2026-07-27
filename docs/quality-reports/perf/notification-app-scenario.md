# Perf Suite — notification-app-scenario

Threshold source: [docs/quality/perf-thresholds.md](../../quality/perf-thresholds)

## Serial p95 (concurrency = 1)

| op | p95 | cap | gate | regression |
|---|---|---|---|---|
| multi_channel_workflow (10 dispatch push+sms+in-app across providers) | 0.02ms | 100ms | PASS | stable |
| push_batch (5 sendPush with high-priority payload) | 0.01ms | 100ms | PASS | stable |
| sms_error_handling (5 failOn callback path) | 0.00ms | 100ms | PASS | improved |

## Concurrent p95 (concurrency = 4, 5 iter each)

| op | p95 | cap | gate |
|---|---|---|---|
| multi_channel_workflow (10 dispatch push+sms+in-app across providers) | 0.04ms | 200ms | PASS |
| push_batch (5 sendPush with high-priority payload) | 0.01ms | 200ms | PASS |
| sms_error_handling (5 failOn callback path) | 0.01ms | 200ms | PASS |

## Memory retention (20 iter, arrayBuffers axis is the gate; heap is informational)

| op | heapUsed Δ | arrayBuffers Δ | cap | verdict |
|---|---|---|---|---|
| multi_channel_workflow (10 dispatch push+sms+in-app across providers) | 514608 B | 0 B | 102400 B | PASS |
| push_batch (5 sendPush with high-priority payload) | 128880 B | 0 B | 102400 B | PASS |
| sms_error_handling (5 failOn callback path) | 120000 B | 0 B | 102400 B | PASS |

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
| p50 | 0.01ms | 0.01ms | -0.00ms | -9.16% |
| p95 | 0.02ms | 0.02ms | +0.00ms | +2.18% |
| p99 | 0.02ms | 0.02ms | -0.00ms | -1.06% |
| mean | 0.01ms | 0.01ms | -0.00ms | -7.34% |
| min | 0.01ms | 0.01ms | -0.00ms | -9.75% |
| max | 0.02ms | 0.02ms | -0.00ms | -1.78% |
| total | 0.20ms | 0.21ms | -0.02ms | -7.34% |

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
| p50 | 0.00ms | 0.00ms | +0.00ms | +8.00% |
| p95 | 0.01ms | 0.00ms | +0.00ms | +127.04% |
| p99 | 0.01ms | 0.00ms | +0.01ms | +166.25% |
| mean | 0.00ms | 0.00ms | +0.00ms | +45.35% |
| min | 0.00ms | 0.00ms | -0.00ms | -14.32% |
| max | 0.01ms | 0.00ms | +0.01ms | +171.89% |
| total | 0.05ms | 0.04ms | +0.02ms | +45.35% |

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
| p50 | 0.00ms | 0.00ms | -0.00ms | -6.78% |
| p95 | 0.00ms | 0.00ms | -0.00ms | -51.47% |
| p99 | 0.00ms | 0.00ms | -0.00ms | -46.48% |
| mean | 0.00ms | 0.00ms | -0.00ms | -25.00% |
| min | 0.00ms | 0.00ms | -0.00ms | -8.33% |
| max | 0.00ms | 0.00ms | -0.00ms | -45.45% |
| total | 0.03ms | 0.04ms | -0.01ms | -25.00% |

