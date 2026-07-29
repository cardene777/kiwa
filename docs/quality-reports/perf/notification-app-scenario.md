# Perf Suite — notification-app-scenario

Threshold source: [docs/quality/perf-thresholds.md](../../quality/perf-thresholds)

測定系の分解能 = 0.00021ms (何もしない関数を同じ経路で呼んだ時の p10)。 回帰判定の絶対下限は既定でこの 2 倍 = 0.00042ms、 op ごとの実効値は下表の「下限」 列。

## Serial (concurrency = 1)

| op | p10 (回帰判定) | p95 (上限判定) | cap | 下限 | gate | regression |
|---|---|---|---|---|---|---|
| multi_channel_workflow (10 dispatch push+sms+in-app across providers) | 0.0074ms | 0.01ms | 100ms | 0.00042ms | PASS | stable — gate 無効 (regressionGate=false) |
| push_batch (5 sendPush with high-priority payload) | 0.0015ms | 0.0020ms | 100ms | 0.00042ms | PASS | stable — gate 無効 (regressionGate=false) |
| sms_error_handling (5 failOn callback path) | 0.0015ms | 0.0023ms | 100ms | 0.00042ms | PASS | stable — gate 無効 (regressionGate=false) |

## Concurrent p95 (concurrency = 4, 5 iter each)

| op | p95 | cap | gate |
|---|---|---|---|
| multi_channel_workflow (10 dispatch push+sms+in-app across providers) | 0.04ms | 200ms | PASS |
| push_batch (5 sendPush with high-priority payload) | 0.01ms | 200ms | PASS |
| sms_error_handling (5 failOn callback path) | 0.02ms | 200ms | PASS |

## Memory retention (20 iter, arrayBuffers axis is the gate; heap is informational)

| op | heapUsed Δ | arrayBuffers Δ | cap | gc exposed | verdict |
|---|---|---|---|---|---|
| multi_channel_workflow (10 dispatch push+sms+in-app across providers) | -1192 B | 0 B | 102400 B | yes | PASS |
| push_batch (5 sendPush with high-priority payload) | -232 B | 0 B | 102400 B | yes | PASS |
| sms_error_handling (5 failOn callback path) | 128 B | 0 B | 102400 B | yes | PASS |

## Detailed serial reports

### multi_channel_workflow (10 dispatch push+sms+in-app across providers)

# Perf Report — multi_channel_workflow (10 dispatch push+sms+in-app across providers).serial

| metric | value |
|---|---|
| iterations | 20 |
| warmup | 3 |
| p10 | 0.0074ms |
| p50 | 0.0079ms |
| p95 | 0.01ms |
| p99 | 0.02ms |
| mean | 0.0094ms |
| stdev | 0.0033ms |
| min | 0.0073ms |
| max | 0.02ms |
| total | 0.19ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.0074ms | 0.0079ms | -0.00053ms | -6.70% |
| p50 | 0.0079ms | 0.0081ms | -0.00021ms | -2.56% |
| p95 | 0.01ms | 0.02ms | -0.0024ms | -14.26% |
| p99 | 0.02ms | 0.02ms | +0.0013ms | +7.42% |
| mean | 0.0094ms | 0.0097ms | -0.00031ms | -3.14% |
| min | 0.0073ms | 0.0079ms | -0.00058ms | -7.40% |
| max | 0.02ms | 0.02ms | +0.0022ms | +12.59% |
| total | 0.19ms | 0.19ms | -0.0061ms | -3.14% |

### push_batch (5 sendPush with high-priority payload)

# Perf Report — push_batch (5 sendPush with high-priority payload).serial

| metric | value |
|---|---|
| iterations | 20 |
| warmup | 3 |
| p10 | 0.0015ms |
| p50 | 0.0016ms |
| p95 | 0.0020ms |
| p99 | 0.0027ms |
| mean | 0.0017ms |
| stdev | 0.00032ms |
| min | 0.0015ms |
| max | 0.0029ms |
| total | 0.03ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.0015ms | 0.0018ms | -0.00021ms | -11.89% |
| p50 | 0.0016ms | 0.0018ms | -0.00023ms | -12.81% |
| p95 | 0.0020ms | 0.0027ms | -0.00071ms | -26.17% |
| p99 | 0.0027ms | 0.0029ms | -0.00014ms | -4.92% |
| mean | 0.0017ms | 0.0019ms | -0.00025ms | -12.83% |
| min | 0.0015ms | 0.0018ms | -0.00025ms | -14.29% |
| max | 0.0029ms | 0.0029ms | +0.0000010ms | +0.03% |
| total | 0.03ms | 0.04ms | -0.0050ms | -12.83% |

### sms_error_handling (5 failOn callback path)

# Perf Report — sms_error_handling (5 failOn callback path).serial

| metric | value |
|---|---|
| iterations | 20 |
| warmup | 3 |
| p10 | 0.0015ms |
| p50 | 0.0016ms |
| p95 | 0.0023ms |
| p99 | 0.0029ms |
| mean | 0.0017ms |
| stdev | 0.00036ms |
| min | 0.0015ms |
| max | 0.0030ms |
| total | 0.03ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.0015ms | 0.0016ms | -0.000088ms | -5.42% |
| p50 | 0.0016ms | 0.0017ms | -0.00013ms | -7.32% |
| p95 | 0.0023ms | 0.0079ms | -0.0056ms | -70.62% |
| p99 | 0.0029ms | 0.05ms | -0.05ms | -94.59% |
| mean | 0.0017ms | 0.0053ms | -0.0036ms | -67.71% |
| min | 0.0015ms | 0.0016ms | -0.00017ms | -10.28% |
| max | 0.0030ms | 0.06ms | -0.06ms | -95.33% |
| total | 0.03ms | 0.11ms | -0.07ms | -67.71% |

