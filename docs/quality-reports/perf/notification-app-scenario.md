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
| multi_channel_workflow (10 dispatch push+sms+in-app across providers) | 0.04ms | 200ms | PASS |
| push_batch (5 sendPush with high-priority payload) | 0.01ms | 200ms | PASS |
| sms_error_handling (5 failOn callback path) | 0.02ms | 200ms | PASS |

## Memory retention (20 iter, arrayBuffers axis is the gate; heap is informational)

| op | heapUsed Δ | arrayBuffers Δ | cap | gc exposed | verdict |
|---|---|---|---|---|---|
| multi_channel_workflow (10 dispatch push+sms+in-app across providers) | -4808 B | 0 B | 102400 B | yes | PASS |
| push_batch (5 sendPush with high-priority payload) | 1144 B | 0 B | 102400 B | yes | PASS |
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
| p50 | 0.01ms | 0.01ms | -0.00ms | -2.38% |
| p95 | 0.02ms | 0.02ms | +0.00ms | +20.84% |
| p99 | 0.02ms | 0.02ms | +0.00ms | +11.42% |
| mean | 0.01ms | 0.01ms | -0.00ms | -1.18% |
| min | 0.01ms | 0.01ms | -0.00ms | -0.56% |
| max | 0.02ms | 0.02ms | +0.00ms | +9.42% |
| total | 0.20ms | 0.20ms | -0.00ms | -1.18% |

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
| p50 | 0.00ms | 0.00ms | +0.00ms | +9.78% |
| p95 | 0.01ms | 0.00ms | +0.00ms | +114.18% |
| p99 | 0.01ms | 0.00ms | +0.01ms | +149.97% |
| mean | 0.00ms | 0.00ms | +0.00ms | +41.65% |
| min | 0.00ms | 0.00ms | +0.00ms | +5.11% |
| max | 0.01ms | 0.00ms | +0.01ms | +155.02% |
| total | 0.05ms | 0.04ms | +0.02ms | +41.65% |

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
| max | 0.01ms |
| total | 0.07ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p50 | 0.00ms | 0.00ms | +0.00ms | +108.04% |
| p95 | 0.00ms | 0.00ms | +0.00ms | +82.40% |
| p99 | 0.00ms | 0.00ms | +0.00ms | +66.07% |
| mean | 0.00ms | 0.00ms | +0.00ms | +102.94% |
| min | 0.00ms | 0.00ms | +0.00ms | +108.33% |
| max | 0.01ms | 0.00ms | +0.00ms | +63.65% |
| total | 0.07ms | 0.03ms | +0.03ms | +102.94% |

