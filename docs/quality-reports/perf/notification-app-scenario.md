# Perf Suite — notification-app-scenario

Threshold source: [docs/quality/perf-thresholds.md](../../quality/perf-thresholds)

測定系の分解能 = 0.00025ms (何もしない関数を同じ経路で呼んだ時の p10)。 回帰判定の絶対下限は既定でこの 2 倍 = 0.00050ms、 op ごとの実効値は下表の「下限」 列。

## Serial (concurrency = 1)

| op | p10 (回帰判定) | p95 (上限判定) | cap | 下限 | gate | regression |
|---|---|---|---|---|---|---|
| multi_channel_workflow (10 dispatch push+sms+in-app across providers) | 0.0072ms | 0.01ms | 100ms | 0.00050ms | PASS | stable — gate 無効 (regressionGate=false) |
| push_batch (5 sendPush with high-priority payload) | 0.0016ms | 0.0024ms | 100ms | 0.00050ms | PASS | stable — gate 無効 (regressionGate=false) |
| sms_error_handling (5 failOn callback path) | 0.0015ms | 0.0024ms | 100ms | 0.00050ms | PASS | stable — gate 無効 (regressionGate=false) |

## Concurrent p95 (concurrency = 4, 5 iter each)

| op | p95 | cap | gate |
|---|---|---|---|
| multi_channel_workflow (10 dispatch push+sms+in-app across providers) | 0.04ms | 200ms | PASS |
| push_batch (5 sendPush with high-priority payload) | 0.01ms | 200ms | PASS |
| sms_error_handling (5 failOn callback path) | 0.01ms | 200ms | PASS |

## Memory retention (20 iter, arrayBuffers axis is the gate; heap is informational)

| op | heapUsed Δ | arrayBuffers Δ | cap | gc exposed | verdict |
|---|---|---|---|---|---|
| multi_channel_workflow (10 dispatch push+sms+in-app across providers) | -976 B | 0 B | 102400 B | yes | PASS |
| push_batch (5 sendPush with high-priority payload) | 216 B | 0 B | 102400 B | yes | PASS |
| sms_error_handling (5 failOn callback path) | -376 B | 0 B | 102400 B | yes | PASS |

## Detailed serial reports

### multi_channel_workflow (10 dispatch push+sms+in-app across providers)

# Perf Report — multi_channel_workflow (10 dispatch push+sms+in-app across providers).serial

| metric | value |
|---|---|
| iterations | 20 |
| warmup | 3 |
| p10 | 0.0072ms |
| p50 | 0.0077ms |
| p95 | 0.01ms |
| p99 | 0.02ms |
| mean | 0.0090ms |
| stdev | 0.0027ms |
| min | 0.0072ms |
| max | 0.02ms |
| total | 0.18ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.0072ms | 0.0079ms | -0.00078ms | -9.85% |
| p50 | 0.0077ms | 0.0081ms | -0.00040ms | -4.87% |
| p95 | 0.01ms | 0.02ms | -0.0024ms | -14.33% |
| p99 | 0.02ms | 0.02ms | -0.0021ms | -11.97% |
| mean | 0.0090ms | 0.0097ms | -0.00071ms | -7.32% |
| min | 0.0072ms | 0.0079ms | -0.00071ms | -9.00% |
| max | 0.02ms | 0.02ms | -0.0020ms | -11.40% |
| total | 0.18ms | 0.19ms | -0.01ms | -7.32% |

### push_batch (5 sendPush with high-priority payload)

# Perf Report — push_batch (5 sendPush with high-priority payload).serial

| metric | value |
|---|---|
| iterations | 20 |
| warmup | 3 |
| p10 | 0.0016ms |
| p50 | 0.0016ms |
| p95 | 0.0024ms |
| p99 | 0.0081ms |
| mean | 0.0020ms |
| stdev | 0.0018ms |
| min | 0.0016ms |
| max | 0.0095ms |
| total | 0.04ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.0016ms | 0.0018ms | -0.00017ms | -9.54% |
| p50 | 0.0016ms | 0.0018ms | -0.00017ms | -9.32% |
| p95 | 0.0024ms | 0.0027ms | -0.00030ms | -11.09% |
| p99 | 0.0081ms | 0.0029ms | +0.0052ms | +182.19% |
| mean | 0.0020ms | 0.0019ms | +0.00011ms | +5.84% |
| min | 0.0016ms | 0.0018ms | -0.00017ms | -9.54% |
| max | 0.0095ms | 0.0029ms | +0.0066ms | +227.23% |
| total | 0.04ms | 0.04ms | +0.0023ms | +5.84% |

### sms_error_handling (5 failOn callback path)

# Perf Report — sms_error_handling (5 failOn callback path).serial

| metric | value |
|---|---|
| iterations | 20 |
| warmup | 3 |
| p10 | 0.0015ms |
| p50 | 0.0015ms |
| p95 | 0.0024ms |
| p99 | 0.0027ms |
| mean | 0.0016ms |
| stdev | 0.00034ms |
| min | 0.0015ms |
| max | 0.0027ms |
| total | 0.03ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.0015ms | 0.0016ms | -0.00017ms | -10.28% |
| p50 | 0.0015ms | 0.0017ms | -0.00021ms | -12.18% |
| p95 | 0.0024ms | 0.0079ms | -0.0055ms | -69.78% |
| p99 | 0.0027ms | 0.05ms | -0.05ms | -94.94% |
| mean | 0.0016ms | 0.0053ms | -0.0036ms | -68.86% |
| min | 0.0015ms | 0.0016ms | -0.00017ms | -10.28% |
| max | 0.0027ms | 0.06ms | -0.06ms | -95.72% |
| total | 0.03ms | 0.11ms | -0.07ms | -68.86% |

