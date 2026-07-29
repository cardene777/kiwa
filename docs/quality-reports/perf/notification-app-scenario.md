# Perf Suite — notification-app-scenario

Threshold source: [docs/quality/perf-thresholds.md](../../quality/perf-thresholds)

## Serial p95 (concurrency = 1)

| op | p95 | cap | gate | regression |
|---|---|---|---|---|
| multi_channel_workflow (10 dispatch push+sms+in-app across providers) | 0.02ms | 100ms | PASS | stable (検知には +0.5ms (baseline 比 +521%) 以上の悪化が必要) — gate 無効 (regressionGate=false) |
| push_batch (5 sendPush with high-priority payload) | 0.00ms | 100ms | PASS | stable (検知には +0.5ms (baseline 比 +19404%) 以上の悪化が必要) — gate 無効 (regressionGate=false) |
| sms_error_handling (5 failOn callback path) | 0.00ms | 100ms | PASS | stable (検知には +0.5ms (baseline 比 +25486%) 以上の悪化が必要) — gate 無効 (regressionGate=false) |

## Concurrent p95 (concurrency = 4, 5 iter each)

| op | p95 | cap | gate |
|---|---|---|---|
| multi_channel_workflow (10 dispatch push+sms+in-app across providers) | 0.04ms | 200ms | PASS |
| push_batch (5 sendPush with high-priority payload) | 0.01ms | 200ms | PASS |
| sms_error_handling (5 failOn callback path) | 0.02ms | 200ms | PASS |

## Memory retention (20 iter, arrayBuffers axis is the gate; heap is informational)

| op | heapUsed Δ | arrayBuffers Δ | cap | gc exposed | verdict |
|---|---|---|---|---|---|
| multi_channel_workflow (10 dispatch push+sms+in-app across providers) | -6168 B | 0 B | 102400 B | yes | PASS |
| push_batch (5 sendPush with high-priority payload) | 6784 B | 0 B | 102400 B | yes | PASS |
| sms_error_handling (5 failOn callback path) | -728 B | 0 B | 102400 B | yes | PASS |

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
| total | 0.24ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p50 | 0.01ms | 0.01ms | -0.00ms | -1.67% |
| p95 | 0.02ms | 0.10ms | -0.08ms | -78.55% |
| p99 | 0.03ms | 1.04ms | -1.01ms | -97.20% |
| mean | 0.01ms | 0.08ms | -0.06ms | -83.89% |
| min | 0.01ms | 0.01ms | -0.00ms | -1.02% |
| max | 0.03ms | 1.27ms | -1.24ms | -97.56% |
| total | 0.24ms | 1.51ms | -1.27ms | -83.89% |

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
| p50 | 0.00ms | 0.00ms | +0.00ms | +2.40% |
| p95 | 0.00ms | 0.00ms | +0.00ms | +4.15% |
| p99 | 0.00ms | 0.00ms | +0.00ms | +10.38% |
| mean | 0.00ms | 0.00ms | +0.00ms | +4.04% |
| min | 0.00ms | 0.00ms | 0.00ms | 0.00% |
| max | 0.01ms | 0.00ms | +0.00ms | +11.21% |
| total | 0.04ms | 0.04ms | +0.00ms | +4.04% |

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
| p50 | 0.00ms | 0.00ms | +0.00ms | +2.58% |
| p95 | 0.00ms | 0.00ms | +0.00ms | +4.49% |
| p99 | 0.00ms | 0.00ms | +0.00ms | +5.69% |
| mean | 0.00ms | 0.00ms | +0.00ms | +2.74% |
| min | 0.00ms | 0.00ms | +0.00ms | +0.06% |
| max | 0.00ms | 0.00ms | +0.00ms | +5.89% |
| total | 0.03ms | 0.03ms | +0.00ms | +2.74% |

