# Perf Suite — notification-app-scenario

Threshold source: [docs/quality/perf-thresholds.md](../../quality/perf-thresholds)

測定系の分解能 = 0.00025ms (何もしない関数を同じ経路で呼んだ時の p10)。 回帰判定の絶対下限は既定でこの 2 倍 = 0.00050ms、 op ごとの実効値は下表の「下限」 列。

## Serial (concurrency = 1)

| op | p10 (回帰判定) | p95 (上限判定) | cap | 下限 | gate | regression |
|---|---|---|---|---|---|---|
| multi_channel_workflow (10 dispatch push+sms+in-app across providers) | 0.0071ms | 0.01ms | 100ms | 0.00050ms | PASS | stable — gate 無効 (regressionGate=false) |
| push_batch (5 sendPush with high-priority payload) | 0.0016ms | 0.0021ms | 100ms | 0.00050ms | PASS | stable — gate 無効 (regressionGate=false) |
| sms_error_handling (5 failOn callback path) | 0.0015ms | 0.0020ms | 100ms | 0.00050ms | PASS | stable — gate 無効 (regressionGate=false) |

## Concurrent p95 (concurrency = 4, 5 iter each)

| op | p95 | cap | gate |
|---|---|---|---|
| multi_channel_workflow (10 dispatch push+sms+in-app across providers) | 0.04ms | 200ms | PASS |
| push_batch (5 sendPush with high-priority payload) | 0.01ms | 200ms | PASS |
| sms_error_handling (5 failOn callback path) | 0.01ms | 200ms | PASS |

## Memory retention (20 iter, arrayBuffers axis is the gate; heap is informational)

| op | heapUsed Δ | arrayBuffers Δ | cap | gc exposed | verdict |
|---|---|---|---|---|---|
| multi_channel_workflow (10 dispatch push+sms+in-app across providers) | 9520 B | 0 B | 102400 B | yes | PASS |
| push_batch (5 sendPush with high-priority payload) | 216 B | 0 B | 102400 B | yes | PASS |
| sms_error_handling (5 failOn callback path) | -432 B | 0 B | 102400 B | yes | PASS |

## Detailed serial reports

### multi_channel_workflow (10 dispatch push+sms+in-app across providers)

# Perf Report — multi_channel_workflow (10 dispatch push+sms+in-app across providers).serial

| metric | value |
|---|---|
| iterations | 20 |
| warmup | 3 |
| p10 | 0.0071ms |
| p50 | 0.0085ms |
| p95 | 0.01ms |
| p99 | 0.02ms |
| mean | 0.01ms |
| stdev | 0.0044ms |
| min | 0.0071ms |
| max | 0.03ms |
| total | 0.20ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.0071ms | 0.0079ms | -0.00082ms | -10.37% |
| p50 | 0.0085ms | 0.0081ms | +0.00042ms | +5.13% |
| p95 | 0.01ms | 0.02ms | -0.0021ms | -12.29% |
| p99 | 0.02ms | 0.02ms | +0.0066ms | +38.11% |
| mean | 0.01ms | 0.0097ms | +0.00040ms | +4.11% |
| min | 0.0071ms | 0.0079ms | -0.00079ms | -10.06% |
| max | 0.03ms | 0.02ms | +0.0088ms | +50.11% |
| total | 0.20ms | 0.19ms | +0.0080ms | +4.11% |

### push_batch (5 sendPush with high-priority payload)

# Perf Report — push_batch (5 sendPush with high-priority payload).serial

| metric | value |
|---|---|
| iterations | 20 |
| warmup | 3 |
| p10 | 0.0016ms |
| p50 | 0.0017ms |
| p95 | 0.0021ms |
| p99 | 0.0028ms |
| mean | 0.0018ms |
| stdev | 0.00030ms |
| min | 0.0016ms |
| max | 0.0030ms |
| total | 0.04ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.0016ms | 0.0018ms | -0.00013ms | -7.14% |
| p50 | 0.0017ms | 0.0018ms | -0.00012ms | -6.98% |
| p95 | 0.0021ms | 0.0027ms | -0.00063ms | -23.16% |
| p99 | 0.0028ms | 0.0029ms | -0.000059ms | -2.04% |
| mean | 0.0018ms | 0.0019ms | -0.00016ms | -8.31% |
| min | 0.0016ms | 0.0018ms | -0.00013ms | -7.14% |
| max | 0.0030ms | 0.0029ms | +0.000084ms | +2.88% |
| total | 0.04ms | 0.04ms | -0.0032ms | -8.31% |

### sms_error_handling (5 failOn callback path)

# Perf Report — sms_error_handling (5 failOn callback path).serial

| metric | value |
|---|---|
| iterations | 20 |
| warmup | 3 |
| p10 | 0.0015ms |
| p50 | 0.0015ms |
| p95 | 0.0020ms |
| p99 | 0.0023ms |
| mean | 0.0016ms |
| stdev | 0.00024ms |
| min | 0.0014ms |
| max | 0.0024ms |
| total | 0.03ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.0015ms | 0.0016ms | -0.00017ms | -10.28% |
| p50 | 0.0015ms | 0.0017ms | -0.00023ms | -13.38% |
| p95 | 0.0020ms | 0.0079ms | -0.0059ms | -74.51% |
| p99 | 0.0023ms | 0.05ms | -0.05ms | -95.65% |
| mean | 0.0016ms | 0.0053ms | -0.0037ms | -69.81% |
| min | 0.0014ms | 0.0016ms | -0.00021ms | -12.80% |
| max | 0.0024ms | 0.06ms | -0.06ms | -96.30% |
| total | 0.03ms | 0.11ms | -0.07ms | -69.81% |

