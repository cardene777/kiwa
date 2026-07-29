# Perf Suite — notification-app-scenario

Threshold source: [docs/quality/perf-thresholds.md](../../quality/perf-thresholds)

測定系の分解能 = 0.00025ms (何もしない関数を同じ経路で呼んだ時の p10)。 回帰判定の絶対下限は既定でこの 2 倍 = 0.00050ms、 op ごとの実効値は下表の「下限」 列。

## Serial (concurrency = 1)

| op | p10 (回帰判定) | p95 (上限判定) | cap | 下限 | gate | regression |
|---|---|---|---|---|---|---|
| multi_channel_workflow (10 dispatch push+sms+in-app across providers) | 0.0074ms | 0.02ms | 100ms | 0.00050ms | PASS | stable — gate 無効 (regressionGate=false) |
| push_batch (5 sendPush with high-priority payload) | 0.0017ms | 0.0022ms | 100ms | 0.00050ms | PASS | stable — gate 無効 (regressionGate=false) |
| sms_error_handling (5 failOn callback path) | 0.0015ms | 0.0036ms | 100ms | 0.00050ms | PASS | stable — gate 無効 (regressionGate=false) |

## Concurrent p95 (concurrency = 4, 5 iter each)

| op | p95 | cap | gate |
|---|---|---|---|
| multi_channel_workflow (10 dispatch push+sms+in-app across providers) | 0.03ms | 200ms | PASS |
| push_batch (5 sendPush with high-priority payload) | 0.01ms | 200ms | PASS |
| sms_error_handling (5 failOn callback path) | 0.01ms | 200ms | PASS |

## Memory retention (20 iter, arrayBuffers axis is the gate; heap is informational)

| op | heapUsed Δ | arrayBuffers Δ | cap | gc exposed | verdict |
|---|---|---|---|---|---|
| multi_channel_workflow (10 dispatch push+sms+in-app across providers) | -2208 B | 0 B | 102400 B | yes | PASS |
| push_batch (5 sendPush with high-priority payload) | -216 B | 0 B | 102400 B | yes | PASS |
| sms_error_handling (5 failOn callback path) | 584 B | 0 B | 102400 B | yes | PASS |

## Detailed serial reports

### multi_channel_workflow (10 dispatch push+sms+in-app across providers)

# Perf Report — multi_channel_workflow (10 dispatch push+sms+in-app across providers).serial

| metric | value |
|---|---|
| iterations | 20 |
| warmup | 3 |
| p10 | 0.0074ms |
| p50 | 0.0077ms |
| p95 | 0.02ms |
| p99 | 0.02ms |
| mean | 0.0094ms |
| stdev | 0.0033ms |
| min | 0.0074ms |
| max | 0.02ms |
| total | 0.19ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.0074ms | 0.0079ms | -0.00057ms | -7.23% |
| p50 | 0.0077ms | 0.0081ms | -0.00044ms | -5.38% |
| p95 | 0.02ms | 0.02ms | -0.0015ms | -9.00% |
| p99 | 0.02ms | 0.02ms | +0.00097ms | +5.56% |
| mean | 0.0094ms | 0.0097ms | -0.00039ms | -4.00% |
| min | 0.0074ms | 0.0079ms | -0.00050ms | -6.35% |
| max | 0.02ms | 0.02ms | +0.0016ms | +9.02% |
| total | 0.19ms | 0.19ms | -0.0078ms | -4.00% |

### push_batch (5 sendPush with high-priority payload)

# Perf Report — push_batch (5 sendPush with high-priority payload).serial

| metric | value |
|---|---|
| iterations | 20 |
| warmup | 3 |
| p10 | 0.0017ms |
| p50 | 0.0017ms |
| p95 | 0.0022ms |
| p99 | 0.0027ms |
| mean | 0.0018ms |
| stdev | 0.00028ms |
| min | 0.0017ms |
| max | 0.0029ms |
| total | 0.04ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.0017ms | 0.0018ms | -0.000084ms | -4.80% |
| p50 | 0.0017ms | 0.0018ms | -0.000062ms | -3.49% |
| p95 | 0.0022ms | 0.0027ms | -0.00048ms | -17.51% |
| p99 | 0.0027ms | 0.0029ms | -0.00013ms | -4.45% |
| mean | 0.0018ms | 0.0019ms | -0.00011ms | -5.62% |
| min | 0.0017ms | 0.0018ms | -0.000084ms | -4.80% |
| max | 0.0029ms | 0.0029ms | -0.000041ms | -1.41% |
| total | 0.04ms | 0.04ms | -0.0022ms | -5.62% |

### sms_error_handling (5 failOn callback path)

# Perf Report — sms_error_handling (5 failOn callback path).serial

| metric | value |
|---|---|
| iterations | 20 |
| warmup | 3 |
| p10 | 0.0015ms |
| p50 | 0.0016ms |
| p95 | 0.0036ms |
| p99 | 0.0098ms |
| mean | 0.0022ms |
| stdev | 0.0022ms |
| min | 0.0015ms |
| max | 0.01ms |
| total | 0.04ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.0015ms | 0.0016ms | -0.00017ms | -10.28% |
| p50 | 0.0016ms | 0.0017ms | -0.00012ms | -7.29% |
| p95 | 0.0036ms | 0.0079ms | -0.0043ms | -54.83% |
| p99 | 0.0098ms | 0.05ms | -0.04ms | -81.46% |
| mean | 0.0022ms | 0.0053ms | -0.0031ms | -58.92% |
| min | 0.0015ms | 0.0016ms | -0.00017ms | -10.28% |
| max | 0.01ms | 0.06ms | -0.05ms | -82.28% |
| total | 0.04ms | 0.11ms | -0.06ms | -58.92% |

