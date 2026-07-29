# Perf Suite — notification-app-scenario

Threshold source: [docs/quality/perf-thresholds.md](../../quality/perf-thresholds)

測定系の分解能 = 0.00025ms (何もしない関数を同じ経路で呼んだ時の p10)。 回帰判定の絶対下限は既定でこの 2 倍 = 0.00049ms、 op ごとの実効値は下表の「下限」 列。

## Serial (concurrency = 1)

| op | p10 (回帰判定) | p95 (上限判定) | cap | 下限 | gate | regression |
|---|---|---|---|---|---|---|
| multi_channel_workflow (10 dispatch push+sms+in-app across providers) | 0.0074ms | 0.02ms | 100ms | 0.00049ms | PASS | stable — gate 無効 (regressionGate=false) |
| push_batch (5 sendPush with high-priority payload) | 0.0016ms | 0.0029ms | 100ms | 0.00049ms | PASS | stable — gate 無効 (regressionGate=false) |
| sms_error_handling (5 failOn callback path) | 0.0015ms | 0.0021ms | 100ms | 0.00049ms | PASS | stable — gate 無効 (regressionGate=false) |

## Concurrent p95 (concurrency = 4, 5 iter each)

| op | p95 | cap | gate |
|---|---|---|---|
| multi_channel_workflow (10 dispatch push+sms+in-app across providers) | 0.15ms | 200ms | PASS |
| push_batch (5 sendPush with high-priority payload) | 0.01ms | 200ms | PASS |
| sms_error_handling (5 failOn callback path) | 0.02ms | 200ms | PASS |

## Memory retention (20 iter, arrayBuffers axis is the gate; heap is informational)

| op | heapUsed Δ | arrayBuffers Δ | cap | gc exposed | verdict |
|---|---|---|---|---|---|
| multi_channel_workflow (10 dispatch push+sms+in-app across providers) | -4632 B | 0 B | 102400 B | yes | PASS |
| push_batch (5 sendPush with high-priority payload) | -168 B | 0 B | 102400 B | yes | PASS |
| sms_error_handling (5 failOn callback path) | 584 B | 0 B | 102400 B | yes | PASS |

## Detailed serial reports

### multi_channel_workflow (10 dispatch push+sms+in-app across providers)

# Perf Report — multi_channel_workflow (10 dispatch push+sms+in-app across providers).serial

| metric | value |
|---|---|
| iterations | 20 |
| warmup | 3 |
| p10 | 0.0074ms |
| p50 | 0.01ms |
| p95 | 0.02ms |
| p99 | 0.02ms |
| mean | 0.01ms |
| stdev | 0.0036ms |
| min | 0.0073ms |
| max | 0.02ms |
| total | 0.22ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.0074ms | 0.0079ms | -0.00057ms | -7.23% |
| p50 | 0.01ms | 0.0081ms | +0.0022ms | +26.92% |
| p95 | 0.02ms | 0.02ms | +0.0011ms | +6.69% |
| p99 | 0.02ms | 0.02ms | +0.0016ms | +9.34% |
| mean | 0.01ms | 0.0097ms | +0.0013ms | +13.35% |
| min | 0.0073ms | 0.0079ms | -0.00058ms | -7.40% |
| max | 0.02ms | 0.02ms | +0.0018ms | +9.98% |
| total | 0.22ms | 0.19ms | +0.03ms | +13.35% |

### push_batch (5 sendPush with high-priority payload)

# Perf Report — push_batch (5 sendPush with high-priority payload).serial

| metric | value |
|---|---|
| iterations | 20 |
| warmup | 3 |
| p10 | 0.0016ms |
| p50 | 0.0018ms |
| p95 | 0.0029ms |
| p99 | 0.0040ms |
| mean | 0.0022ms |
| stdev | 0.00069ms |
| min | 0.0016ms |
| max | 0.0042ms |
| total | 0.04ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.0016ms | 0.0018ms | -0.00013ms | -7.14% |
| p50 | 0.0018ms | 0.0018ms | -0.000042ms | -2.32% |
| p95 | 0.0029ms | 0.0027ms | +0.00022ms | +8.21% |
| p99 | 0.0040ms | 0.0029ms | +0.0011ms | +37.51% |
| mean | 0.0022ms | 0.0019ms | +0.00024ms | +12.64% |
| min | 0.0016ms | 0.0018ms | -0.00017ms | -9.49% |
| max | 0.0042ms | 0.0029ms | +0.0013ms | +44.34% |
| total | 0.04ms | 0.04ms | +0.0049ms | +12.64% |

### sms_error_handling (5 failOn callback path)

# Perf Report — sms_error_handling (5 failOn callback path).serial

| metric | value |
|---|---|
| iterations | 20 |
| warmup | 3 |
| p10 | 0.0015ms |
| p50 | 0.0015ms |
| p95 | 0.0021ms |
| p99 | 0.0030ms |
| mean | 0.0017ms |
| stdev | 0.00040ms |
| min | 0.0015ms |
| max | 0.0032ms |
| total | 0.03ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.0015ms | 0.0016ms | -0.00012ms | -7.69% |
| p50 | 0.0015ms | 0.0017ms | -0.00019ms | -10.98% |
| p95 | 0.0021ms | 0.0079ms | -0.0058ms | -73.46% |
| p99 | 0.0030ms | 0.05ms | -0.05ms | -94.30% |
| mean | 0.0017ms | 0.0053ms | -0.0036ms | -68.38% |
| min | 0.0015ms | 0.0016ms | -0.00017ms | -10.28% |
| max | 0.0032ms | 0.06ms | -0.06ms | -94.94% |
| total | 0.03ms | 0.11ms | -0.07ms | -68.38% |

