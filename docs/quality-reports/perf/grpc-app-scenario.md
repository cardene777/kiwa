# Perf Suite — grpc-app-scenario

Threshold source: [docs/quality/perf-thresholds.md](../../quality/perf-thresholds)

測定系の分解能 = 0.00025ms (何もしない関数を同じ経路で呼んだ時の p10)。 回帰判定の絶対下限は既定でこの 2 倍 = 0.00049ms、 op ごとの実効値は下表の「下限」 列。

## Serial (concurrency = 1)

| op | p10 (回帰判定) | p95 (上限判定) | cap | 下限 | gate | regression |
|---|---|---|---|---|---|---|
| multi_service_workflow (10 invokeUnary across 4 providers) | 0.0042ms | 0.0085ms | 100ms | 0.00049ms | PASS | stable — gate 無効 (regressionGate=false) |
| streaming_batch (5 server-stream + bidi mix) | 0.0079ms | 0.02ms | 100ms | 0.00049ms | PASS | regressed — gate 無効 (regressionGate=false) |
| error_status_batch (5 fail method returns INTERNAL) | 0.01ms | 0.02ms | 100ms | 0.00049ms | PASS | stable — gate 無効 (regressionGate=false) |
| interceptor_chain_batch (10 unary through auth+log) | 0.0066ms | 0.01ms | 100ms | 0.00049ms | PASS | improved — gate 無効 (regressionGate=false) |
| cancel_deadline_batch (5 cancel + 5 deadline expired) | 0.0019ms | 0.0023ms | 100ms | 0.00049ms | PASS | stable — gate 無効 (regressionGate=false) |

## Concurrent p95 (concurrency = 4, 5 iter each)

| op | p95 | cap | gate |
|---|---|---|---|
| multi_service_workflow (10 invokeUnary across 4 providers) | 0.03ms | 200ms | PASS |
| streaming_batch (5 server-stream + bidi mix) | 0.04ms | 200ms | PASS |
| error_status_batch (5 fail method returns INTERNAL) | 0.07ms | 200ms | PASS |
| interceptor_chain_batch (10 unary through auth+log) | 0.04ms | 200ms | PASS |
| cancel_deadline_batch (5 cancel + 5 deadline expired) | 0.02ms | 200ms | PASS |

## Memory retention (20 iter, arrayBuffers axis is the gate; heap is informational)

| op | heapUsed Δ | arrayBuffers Δ | cap | gc exposed | verdict |
|---|---|---|---|---|---|
| multi_service_workflow (10 invokeUnary across 4 providers) | 6216 B | 0 B | 102400 B | yes | PASS |
| streaming_batch (5 server-stream + bidi mix) | 2216 B | 0 B | 102400 B | yes | PASS |
| error_status_batch (5 fail method returns INTERNAL) | 363344 B | 0 B | 102400 B | yes | PASS |
| interceptor_chain_batch (10 unary through auth+log) | 372840 B | 0 B | 102400 B | yes | PASS |
| cancel_deadline_batch (5 cancel + 5 deadline expired) | -2440 B | 0 B | 102400 B | yes | PASS |

## Detailed serial reports

### multi_service_workflow (10 invokeUnary across 4 providers)

# Perf Report — multi_service_workflow (10 invokeUnary across 4 providers).serial

| metric | value |
|---|---|
| iterations | 20 |
| warmup | 3 |
| p10 | 0.0042ms |
| p50 | 0.0054ms |
| p95 | 0.0085ms |
| p99 | 0.01ms |
| mean | 0.0055ms |
| stdev | 0.0015ms |
| min | 0.0042ms |
| max | 0.01ms |
| total | 0.11ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.0042ms | 0.0041ms | +0.00013ms | +3.25% |
| p50 | 0.0054ms | 0.0053ms | +0.000083ms | +1.58% |
| p95 | 0.0085ms | 0.0071ms | +0.0014ms | +19.53% |
| p99 | 0.01ms | 0.01ms | -0.00089ms | -8.16% |
| mean | 0.0055ms | 0.0055ms | -0.000050ms | -0.90% |
| min | 0.0042ms | 0.0040ms | +0.00021ms | +5.23% |
| max | 0.01ms | 0.01ms | -0.0015ms | -12.32% |
| total | 0.11ms | 0.11ms | -0.0010ms | -0.90% |

### streaming_batch (5 server-stream + bidi mix)

# Perf Report — streaming_batch (5 server-stream + bidi mix).serial

| metric | value |
|---|---|
| iterations | 20 |
| warmup | 3 |
| p10 | 0.0079ms |
| p50 | 0.0089ms |
| p95 | 0.02ms |
| p99 | 0.03ms |
| mean | 0.01ms |
| stdev | 0.0053ms |
| min | 0.0077ms |
| max | 0.03ms |
| total | 0.23ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.0079ms | 0.0061ms | +0.0018ms | +29.69% |
| p50 | 0.0089ms | 0.0066ms | +0.0023ms | +34.59% |
| p95 | 0.02ms | 0.01ms | +0.0080ms | +57.88% |
| p99 | 0.03ms | 0.02ms | +0.0080ms | +44.73% |
| mean | 0.01ms | 0.0082ms | +0.0033ms | +40.91% |
| min | 0.0077ms | 0.0061ms | +0.0017ms | +27.40% |
| max | 0.03ms | 0.02ms | +0.0080ms | +42.32% |
| total | 0.23ms | 0.16ms | +0.07ms | +40.91% |

### error_status_batch (5 fail method returns INTERNAL)

# Perf Report — error_status_batch (5 fail method returns INTERNAL).serial

| metric | value |
|---|---|
| iterations | 20 |
| warmup | 3 |
| p10 | 0.01ms |
| p50 | 0.01ms |
| p95 | 0.02ms |
| p99 | 0.03ms |
| mean | 0.01ms |
| stdev | 0.0042ms |
| min | 0.01ms |
| max | 0.03ms |
| total | 0.28ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.01ms | 0.01ms | +0.000092ms | +0.76% |
| p50 | 0.01ms | 0.01ms | +0.00013ms | +1.01% |
| p95 | 0.02ms | 0.02ms | -0.0037ms | -16.86% |
| p99 | 0.03ms | 0.02ms | +0.0060ms | +26.61% |
| mean | 0.01ms | 0.01ms | +0.000079ms | +0.57% |
| min | 0.01ms | 0.01ms | +0.00021ms | +1.73% |
| max | 0.03ms | 0.02ms | +0.0084ms | +37.36% |
| total | 0.28ms | 0.28ms | +0.0016ms | +0.57% |

### interceptor_chain_batch (10 unary through auth+log)

# Perf Report — interceptor_chain_batch (10 unary through auth+log).serial

| metric | value |
|---|---|
| iterations | 20 |
| warmup | 3 |
| p10 | 0.0066ms |
| p50 | 0.0071ms |
| p95 | 0.01ms |
| p99 | 0.02ms |
| mean | 0.0081ms |
| stdev | 0.0028ms |
| min | 0.0066ms |
| max | 0.02ms |
| total | 0.16ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.0066ms | 0.0085ms | -0.0019ms | -22.45% |
| p50 | 0.0071ms | 0.0089ms | -0.0018ms | -20.00% |
| p95 | 0.01ms | 0.01ms | +0.0018ms | +16.93% |
| p99 | 0.02ms | 0.02ms | -0.0044ms | -20.21% |
| mean | 0.0081ms | 0.0097ms | -0.0016ms | -16.37% |
| min | 0.0066ms | 0.0085ms | -0.0019ms | -22.55% |
| max | 0.02ms | 0.02ms | -0.0059ms | -24.15% |
| total | 0.16ms | 0.19ms | -0.03ms | -16.37% |

### cancel_deadline_batch (5 cancel + 5 deadline expired)

# Perf Report — cancel_deadline_batch (5 cancel + 5 deadline expired).serial

| metric | value |
|---|---|
| iterations | 20 |
| warmup | 3 |
| p10 | 0.0019ms |
| p50 | 0.0020ms |
| p95 | 0.0023ms |
| p99 | 0.0023ms |
| mean | 0.0020ms |
| stdev | 0.00012ms |
| min | 0.0019ms |
| max | 0.0023ms |
| total | 0.04ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.0019ms | 0.0020ms | -0.000038ms | -1.94% |
| p50 | 0.0020ms | 0.0020ms | -0.0000010ms | -0.05% |
| p95 | 0.0023ms | 0.0022ms | +0.00012ms | +5.51% |
| p99 | 0.0023ms | 0.0023ms | +0.000057ms | +2.50% |
| mean | 0.0020ms | 0.0020ms | -0.000019ms | -0.95% |
| min | 0.0019ms | 0.0019ms | -0.0000010ms | -0.05% |
| max | 0.0023ms | 0.0023ms | +0.000041ms | +1.79% |
| total | 0.04ms | 0.04ms | -0.00038ms | -0.95% |

