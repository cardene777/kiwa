# Perf Suite — grpc-app-scenario

Threshold source: [docs/quality/perf-thresholds.md](../../quality/perf-thresholds)

測定系の分解能 = 0.00058ms (何もしない関数を同じ経路で呼んだ時の p10)。 回帰判定の絶対下限は既定でこの 2 倍 = 0.0012ms、 op ごとの実効値は下表の「下限」 列。

## Serial (concurrency = 1)

| op | p10 (回帰判定) | p95 (上限判定) | cap | 下限 | gate | regression |
|---|---|---|---|---|---|---|
| multi_service_workflow (10 invokeUnary across 4 providers) | 0.01ms | 0.02ms | 100ms | 0.0012ms | PASS | regressed — gate 無効 (regressionGate=false) |
| streaming_batch (5 server-stream + bidi mix) | 0.0071ms | 0.02ms | 100ms | 0.0012ms | PASS | stable (p10 +17% (閾値未満)、 p95 +27% (裾は実行間の振れ幅と区別できないため判定には使わない)) — gate 無効 (regressionGate=false) |
| error_status_batch (5 fail method returns INTERNAL) | 0.02ms | 0.03ms | 100ms | 0.0012ms | PASS | regressed — gate 無効 (regressionGate=false) |
| interceptor_chain_batch (10 unary through auth+log) | 0.0074ms | 0.01ms | 100ms | 0.0012ms | PASS | stable (p10 -14% (閾値未満)、 p95 +41% (裾は実行間の振れ幅と区別できないため判定には使わない)) — gate 無効 (regressionGate=false) |
| cancel_deadline_batch (5 cancel + 5 deadline expired) | 0.0020ms | 0.0022ms | 100ms | 0.0012ms | PASS | stable — gate 無効 (regressionGate=false) |

## Concurrent p95 (concurrency = 4, 5 iter each)

| op | p95 | cap | gate |
|---|---|---|---|
| multi_service_workflow (10 invokeUnary across 4 providers) | 0.07ms | 200ms | PASS |
| streaming_batch (5 server-stream + bidi mix) | 0.04ms | 200ms | PASS |
| error_status_batch (5 fail method returns INTERNAL) | 0.07ms | 200ms | PASS |
| interceptor_chain_batch (10 unary through auth+log) | 0.04ms | 200ms | PASS |
| cancel_deadline_batch (5 cancel + 5 deadline expired) | 0.01ms | 200ms | PASS |

## Memory retention (20 iter, arrayBuffers axis is the gate; heap is informational)

| op | heapUsed Δ | arrayBuffers Δ | cap | gc exposed | verdict |
|---|---|---|---|---|---|
| multi_service_workflow (10 invokeUnary across 4 providers) | -3360 B | 0 B | 102400 B | yes | PASS |
| streaming_batch (5 server-stream + bidi mix) | 3152 B | 0 B | 102400 B | yes | PASS |
| error_status_batch (5 fail method returns INTERNAL) | -2384 B | 0 B | 102400 B | yes | PASS |
| interceptor_chain_batch (10 unary through auth+log) | 22432 B | 0 B | 102400 B | yes | PASS |
| cancel_deadline_batch (5 cancel + 5 deadline expired) | 4480 B | 0 B | 102400 B | yes | PASS |

## Detailed serial reports

### multi_service_workflow (10 invokeUnary across 4 providers)

# Perf Report — multi_service_workflow (10 invokeUnary across 4 providers).serial

| metric | value |
|---|---|
| iterations | 20 |
| warmup | 3 |
| p10 | 0.01ms |
| p50 | 0.01ms |
| p95 | 0.02ms |
| p99 | 0.03ms |
| mean | 0.01ms |
| stdev | 0.0057ms |
| min | 0.01ms |
| max | 0.04ms |
| total | 0.27ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.01ms | 0.0041ms | +0.0063ms | +154.05% |
| p50 | 0.01ms | 0.0053ms | +0.0061ms | +116.16% |
| p95 | 0.02ms | 0.0071ms | +0.01ms | +182.13% |
| p99 | 0.03ms | 0.01ms | +0.02ms | +196.75% |
| mean | 0.01ms | 0.0055ms | +0.0080ms | +145.11% |
| min | 0.01ms | 0.0040ms | +0.0061ms | +154.69% |
| max | 0.04ms | 0.01ms | +0.02ms | +198.95% |
| total | 0.27ms | 0.11ms | +0.16ms | +145.11% |

### streaming_batch (5 server-stream + bidi mix)

# Perf Report — streaming_batch (5 server-stream + bidi mix).serial

| metric | value |
|---|---|
| iterations | 20 |
| warmup | 3 |
| p10 | 0.0071ms |
| p50 | 0.0082ms |
| p95 | 0.02ms |
| p99 | 0.02ms |
| mean | 0.0099ms |
| stdev | 0.0042ms |
| min | 0.0063ms |
| max | 0.02ms |
| total | 0.20ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.0071ms | 0.0061ms | +0.0010ms | +16.67% |
| p50 | 0.0082ms | 0.0066ms | +0.0016ms | +23.89% |
| p95 | 0.02ms | 0.01ms | +0.0037ms | +26.60% |
| p99 | 0.02ms | 0.02ms | +0.0041ms | +23.02% |
| mean | 0.0099ms | 0.0082ms | +0.0017ms | +21.11% |
| min | 0.0063ms | 0.0061ms | +0.00025ms | +4.13% |
| max | 0.02ms | 0.02ms | +0.0043ms | +22.37% |
| total | 0.20ms | 0.16ms | +0.03ms | +21.11% |

### error_status_batch (5 fail method returns INTERNAL)

# Perf Report — error_status_batch (5 fail method returns INTERNAL).serial

| metric | value |
|---|---|
| iterations | 20 |
| warmup | 3 |
| p10 | 0.02ms |
| p50 | 0.02ms |
| p95 | 0.03ms |
| p99 | 0.03ms |
| mean | 0.02ms |
| stdev | 0.0043ms |
| min | 0.02ms |
| max | 0.03ms |
| total | 0.40ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.02ms | 0.01ms | +0.0049ms | +40.27% |
| p50 | 0.02ms | 0.01ms | +0.0059ms | +47.15% |
| p95 | 0.03ms | 0.02ms | +0.0080ms | +35.87% |
| p99 | 0.03ms | 0.02ms | +0.0079ms | +35.43% |
| mean | 0.02ms | 0.01ms | +0.0062ms | +44.02% |
| min | 0.02ms | 0.01ms | +0.0049ms | +40.98% |
| max | 0.03ms | 0.02ms | +0.0079ms | +35.32% |
| total | 0.40ms | 0.28ms | +0.12ms | +44.02% |

### interceptor_chain_batch (10 unary through auth+log)

# Perf Report — interceptor_chain_batch (10 unary through auth+log).serial

| metric | value |
|---|---|
| iterations | 20 |
| warmup | 3 |
| p10 | 0.0074ms |
| p50 | 0.0090ms |
| p95 | 0.01ms |
| p99 | 0.02ms |
| mean | 0.0096ms |
| stdev | 0.0036ms |
| min | 0.0071ms |
| max | 0.02ms |
| total | 0.19ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.0074ms | 0.0085ms | -0.0012ms | -13.67% |
| p50 | 0.0090ms | 0.0089ms | +0.00017ms | +1.88% |
| p95 | 0.01ms | 0.01ms | +0.0042ms | +40.58% |
| p99 | 0.02ms | 0.02ms | +0.000045ms | +0.21% |
| mean | 0.0096ms | 0.0097ms | -0.000073ms | -0.76% |
| min | 0.0071ms | 0.0085ms | -0.0014ms | -16.18% |
| max | 0.02ms | 0.02ms | -0.0010ms | -4.08% |
| total | 0.19ms | 0.19ms | -0.0015ms | -0.76% |

### cancel_deadline_batch (5 cancel + 5 deadline expired)

# Perf Report — cancel_deadline_batch (5 cancel + 5 deadline expired).serial

| metric | value |
|---|---|
| iterations | 20 |
| warmup | 3 |
| p10 | 0.0020ms |
| p50 | 0.0020ms |
| p95 | 0.0022ms |
| p99 | 0.0027ms |
| mean | 0.0021ms |
| stdev | 0.00020ms |
| min | 0.0020ms |
| max | 0.0029ms |
| total | 0.04ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.0020ms | 0.0020ms | +0.0000041ms | +0.21% |
| p50 | 0.0020ms | 0.0020ms | +0.000061ms | +3.14% |
| p95 | 0.0022ms | 0.0022ms | +0.000029ms | +1.34% |
| p99 | 0.0027ms | 0.0023ms | +0.00047ms | +20.82% |
| mean | 0.0021ms | 0.0020ms | +0.000062ms | +3.11% |
| min | 0.0020ms | 0.0019ms | +0.000041ms | +2.14% |
| max | 0.0029ms | 0.0023ms | +0.00058ms | +25.44% |
| total | 0.04ms | 0.04ms | +0.0012ms | +3.11% |

