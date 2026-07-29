# Perf Suite — notification-app-scenario

Threshold source: [docs/quality/perf-thresholds.md](../../quality/perf-thresholds)

測定系の分解能 = 0.00025ms (何もしない関数を同じ経路で呼んだ時の p10)。 回帰判定の絶対下限は既定でこの 2 倍 = 0.00050ms、 op ごとの実効値は下表の「下限」 列。

## Serial (concurrency = 1)

| op | p10 (回帰判定) | p95 (上限判定) | cap | 下限 | gate | regression |
|---|---|---|---|---|---|---|
| multi_channel_workflow (10 dispatch push+sms+in-app across providers) | 0.0070ms | 0.01ms | 100ms | 0.00050ms | PASS | stable — gate 無効 (regressionGate=false) |
| push_batch (5 sendPush with high-priority payload) | 0.0016ms | 0.0024ms | 100ms | 0.00050ms | PASS | stable — gate 無効 (regressionGate=false) |
| sms_error_handling (5 failOn callback path) | 0.0015ms | 0.0019ms | 100ms | 0.00050ms | PASS | stable — gate 無効 (regressionGate=false) |

## Concurrent p95 (concurrency = 4, 5 iter each)

| op | p95 | cap | gate |
|---|---|---|---|
| multi_channel_workflow (10 dispatch push+sms+in-app across providers) | 0.06ms | 200ms | PASS |
| push_batch (5 sendPush with high-priority payload) | 0.01ms | 200ms | PASS |
| sms_error_handling (5 failOn callback path) | 0.02ms | 200ms | PASS |

## Memory retention (20 iter, arrayBuffers axis is the gate; heap is informational)

| op | heapUsed Δ | arrayBuffers Δ | cap | gc exposed | verdict |
|---|---|---|---|---|---|
| multi_channel_workflow (10 dispatch push+sms+in-app across providers) | -960 B | 0 B | 102400 B | yes | PASS |
| push_batch (5 sendPush with high-priority payload) | -584 B | 0 B | 102400 B | yes | PASS |
| sms_error_handling (5 failOn callback path) | 344 B | 0 B | 102400 B | yes | PASS |

## Detailed serial reports

### multi_channel_workflow (10 dispatch push+sms+in-app across providers)

# Perf Report — multi_channel_workflow (10 dispatch push+sms+in-app across providers).serial

| metric | value |
|---|---|
| iterations | 20 |
| warmup | 3 |
| p10 | 0.0070ms |
| p50 | 0.0073ms |
| p95 | 0.01ms |
| p99 | 0.02ms |
| mean | 0.0091ms |
| stdev | 0.0035ms |
| min | 0.0070ms |
| max | 0.02ms |
| total | 0.18ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.0070ms | 0.0079ms | -0.00095ms | -11.95% |
| p50 | 0.0073ms | 0.0081ms | -0.00087ms | -10.77% |
| p95 | 0.01ms | 0.02ms | -0.0022ms | -13.30% |
| p99 | 0.02ms | 0.02ms | +0.0020ms | +11.44% |
| mean | 0.0091ms | 0.0097ms | -0.00068ms | -6.95% |
| min | 0.0070ms | 0.0079ms | -0.00087ms | -11.11% |
| max | 0.02ms | 0.02ms | +0.0030ms | +17.34% |
| total | 0.18ms | 0.19ms | -0.01ms | -6.95% |

### push_batch (5 sendPush with high-priority payload)

# Perf Report — push_batch (5 sendPush with high-priority payload).serial

| metric | value |
|---|---|
| iterations | 20 |
| warmup | 3 |
| p10 | 0.0016ms |
| p50 | 0.0019ms |
| p95 | 0.0024ms |
| p99 | 0.0027ms |
| mean | 0.0019ms |
| stdev | 0.00035ms |
| min | 0.0015ms |
| max | 0.0027ms |
| total | 0.04ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.0016ms | 0.0018ms | -0.00017ms | -9.54% |
| p50 | 0.0019ms | 0.0018ms | +0.00012ms | +6.92% |
| p95 | 0.0024ms | 0.0027ms | -0.00029ms | -10.51% |
| p99 | 0.0027ms | 0.0029ms | -0.00019ms | -6.60% |
| mean | 0.0019ms | 0.0019ms | +0.000017ms | +0.86% |
| min | 0.0015ms | 0.0018ms | -0.00021ms | -11.94% |
| max | 0.0027ms | 0.0029ms | -0.00017ms | -5.69% |
| total | 0.04ms | 0.04ms | +0.00033ms | +0.86% |

### sms_error_handling (5 failOn callback path)

# Perf Report — sms_error_handling (5 failOn callback path).serial

| metric | value |
|---|---|
| iterations | 20 |
| warmup | 3 |
| p10 | 0.0015ms |
| p50 | 0.0017ms |
| p95 | 0.0019ms |
| p99 | 0.0023ms |
| mean | 0.0017ms |
| stdev | 0.00021ms |
| min | 0.0015ms |
| max | 0.0023ms |
| total | 0.03ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.0015ms | 0.0016ms | -0.00012ms | -7.69% |
| p50 | 0.0017ms | 0.0017ms | -0.000041ms | -2.40% |
| p95 | 0.0019ms | 0.0079ms | -0.0060ms | -75.53% |
| p99 | 0.0023ms | 0.05ms | -0.05ms | -95.74% |
| mean | 0.0017ms | 0.0053ms | -0.0036ms | -67.51% |
| min | 0.0015ms | 0.0016ms | -0.00012ms | -7.69% |
| max | 0.0023ms | 0.06ms | -0.06ms | -96.37% |
| total | 0.03ms | 0.11ms | -0.07ms | -67.51% |

