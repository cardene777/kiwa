# Perf Suite — grpc-app-scenario

Threshold source: [docs/quality/perf-thresholds.md](../../quality/perf-thresholds)

測定系の分解能 = 0.00025ms (何もしない関数を同じ経路で呼んだ時の p10)。 回帰判定の絶対下限は既定でこの 2 倍 = 0.00050ms、 op ごとの実効値は下表の「下限」 列。

## Serial (concurrency = 1)

| op | p10 (回帰判定) | p95 (上限判定) | cap | 下限 | gate | regression |
|---|---|---|---|---|---|---|
| multi_service_workflow (10 invokeUnary across 4 providers) | 0.0040ms | 0.0088ms | 100ms | 0.00050ms | PASS | stable (p10 -1% (閾値未満)、 p95 +24% (裾は実行間の振れ幅と区別できないため判定には使わない)) — gate 無効 (regressionGate=false) |
| streaming_batch (5 server-stream + bidi mix) | 0.0073ms | 0.02ms | 100ms | 0.00050ms | PASS | stable (p10 +19% (閾値未満)、 p95 +24% (裾は実行間の振れ幅と区別できないため判定には使わない)) — gate 無効 (regressionGate=false) |
| error_status_batch (5 fail method returns INTERNAL) | 0.01ms | 0.03ms | 100ms | 0.00050ms | PASS | stable (p10 +0% (閾値未満)、 p95 +34% (裾は実行間の振れ幅と区別できないため判定には使わない)) — gate 無効 (regressionGate=false) |
| interceptor_chain_batch (10 unary through auth+log) | 0.0068ms | 0.01ms | 100ms | 0.00050ms | PASS | improved — gate 無効 (regressionGate=false) |
| cancel_deadline_batch (5 cancel + 5 deadline expired) | 0.0020ms | 0.0025ms | 100ms | 0.00050ms | PASS | stable — gate 無効 (regressionGate=false) |

## Concurrent p95 (concurrency = 4, 5 iter each)

| op | p95 | cap | gate |
|---|---|---|---|
| multi_service_workflow (10 invokeUnary across 4 providers) | 0.03ms | 200ms | PASS |
| streaming_batch (5 server-stream + bidi mix) | 0.08ms | 200ms | PASS |
| error_status_batch (5 fail method returns INTERNAL) | 0.07ms | 200ms | PASS |
| interceptor_chain_batch (10 unary through auth+log) | 0.05ms | 200ms | PASS |
| cancel_deadline_batch (5 cancel + 5 deadline expired) | 0.01ms | 200ms | PASS |

## Memory retention (20 iter, arrayBuffers axis is the gate; heap is informational)

| op | heapUsed Δ | arrayBuffers Δ | cap | gc exposed | verdict |
|---|---|---|---|---|---|
| multi_service_workflow (10 invokeUnary across 4 providers) | 1944 B | 0 B | 102400 B | yes | PASS |
| streaming_batch (5 server-stream + bidi mix) | 3168 B | 0 B | 102400 B | yes | PASS |
| error_status_batch (5 fail method returns INTERNAL) | -2208 B | 0 B | 102400 B | yes | PASS |
| interceptor_chain_batch (10 unary through auth+log) | 19424 B | 0 B | 102400 B | yes | PASS |
| cancel_deadline_batch (5 cancel + 5 deadline expired) | 1072 B | 0 B | 102400 B | yes | PASS |

## Detailed serial reports

### multi_service_workflow (10 invokeUnary across 4 providers)

# Perf Report — multi_service_workflow (10 invokeUnary across 4 providers).serial

| metric | value |
|---|---|
| iterations | 20 |
| warmup | 3 |
| p10 | 0.0040ms |
| p50 | 0.0053ms |
| p95 | 0.0088ms |
| p99 | 0.01ms |
| mean | 0.0058ms |
| stdev | 0.0020ms |
| min | 0.0040ms |
| max | 0.01ms |
| total | 0.12ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.0040ms | 0.0041ms | -0.000034ms | -0.82% |
| p50 | 0.0053ms | 0.0053ms | -0.000021ms | -0.39% |
| p95 | 0.0088ms | 0.0071ms | +0.0017ms | +23.72% |
| p99 | 0.01ms | 0.01ms | +0.0014ms | +12.90% |
| mean | 0.0058ms | 0.0055ms | +0.00026ms | +4.70% |
| min | 0.0040ms | 0.0040ms | +0.000041ms | +1.04% |
| max | 0.01ms | 0.01ms | +0.0013ms | +11.27% |
| total | 0.12ms | 0.11ms | +0.0052ms | +4.70% |

### streaming_batch (5 server-stream + bidi mix)

# Perf Report — streaming_batch (5 server-stream + bidi mix).serial

| metric | value |
|---|---|
| iterations | 20 |
| warmup | 3 |
| p10 | 0.0073ms |
| p50 | 0.0085ms |
| p95 | 0.02ms |
| p99 | 0.02ms |
| mean | 0.0095ms |
| stdev | 0.0034ms |
| min | 0.0067ms |
| max | 0.02ms |
| total | 0.19ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.0073ms | 0.0061ms | +0.0012ms | +19.39% |
| p50 | 0.0085ms | 0.0066ms | +0.0019ms | +28.61% |
| p95 | 0.02ms | 0.01ms | +0.0034ms | +24.14% |
| p99 | 0.02ms | 0.02ms | +0.0011ms | +6.33% |
| mean | 0.0095ms | 0.0082ms | +0.0014ms | +16.90% |
| min | 0.0067ms | 0.0061ms | +0.00067ms | +10.96% |
| max | 0.02ms | 0.02ms | +0.00058ms | +3.07% |
| total | 0.19ms | 0.16ms | +0.03ms | +16.90% |

### error_status_batch (5 fail method returns INTERNAL)

# Perf Report — error_status_batch (5 fail method returns INTERNAL).serial

| metric | value |
|---|---|
| iterations | 20 |
| warmup | 3 |
| p10 | 0.01ms |
| p50 | 0.01ms |
| p95 | 0.03ms |
| p99 | 0.05ms |
| mean | 0.02ms |
| stdev | 0.0092ms |
| min | 0.01ms |
| max | 0.05ms |
| total | 0.32ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.01ms | 0.01ms | +1.0e-7ms | +0.00% |
| p50 | 0.01ms | 0.01ms | +0.00025ms | +2.01% |
| p95 | 0.03ms | 0.02ms | +0.0076ms | +34.12% |
| p99 | 0.05ms | 0.02ms | +0.02ms | +103.62% |
| mean | 0.02ms | 0.01ms | +0.0022ms | +15.71% |
| min | 0.01ms | 0.01ms | +0.000042ms | +0.35% |
| max | 0.05ms | 0.02ms | +0.03ms | +120.81% |
| total | 0.32ms | 0.28ms | +0.04ms | +15.71% |

### interceptor_chain_batch (10 unary through auth+log)

# Perf Report — interceptor_chain_batch (10 unary through auth+log).serial

| metric | value |
|---|---|
| iterations | 20 |
| warmup | 3 |
| p10 | 0.0068ms |
| p50 | 0.0071ms |
| p95 | 0.01ms |
| p99 | 0.02ms |
| mean | 0.0081ms |
| stdev | 0.0031ms |
| min | 0.0067ms |
| max | 0.02ms |
| total | 0.16ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.0068ms | 0.0085ms | -0.0018ms | -20.51% |
| p50 | 0.0071ms | 0.0089ms | -0.0018ms | -20.00% |
| p95 | 0.01ms | 0.01ms | +0.0026ms | +24.68% |
| p99 | 0.02ms | 0.02ms | -0.0034ms | -15.47% |
| mean | 0.0081ms | 0.0097ms | -0.0016ms | -16.46% |
| min | 0.0067ms | 0.0085ms | -0.0018ms | -20.59% |
| max | 0.02ms | 0.02ms | -0.0048ms | -19.73% |
| total | 0.16ms | 0.19ms | -0.03ms | -16.46% |

### cancel_deadline_batch (5 cancel + 5 deadline expired)

# Perf Report — cancel_deadline_batch (5 cancel + 5 deadline expired).serial

| metric | value |
|---|---|
| iterations | 20 |
| warmup | 3 |
| p10 | 0.0020ms |
| p50 | 0.0020ms |
| p95 | 0.0025ms |
| p99 | 0.0029ms |
| mean | 0.0021ms |
| stdev | 0.00024ms |
| min | 0.0020ms |
| max | 0.0030ms |
| total | 0.04ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.0020ms | 0.0020ms | +0.0000041ms | +0.21% |
| p50 | 0.0020ms | 0.0020ms | +0.000041ms | +2.09% |
| p95 | 0.0025ms | 0.0022ms | +0.00035ms | +16.09% |
| p99 | 0.0029ms | 0.0023ms | +0.00060ms | +26.57% |
| mean | 0.0021ms | 0.0020ms | +0.000077ms | +3.83% |
| min | 0.0020ms | 0.0019ms | +0.000041ms | +2.14% |
| max | 0.0030ms | 0.0023ms | +0.00067ms | +29.06% |
| total | 0.04ms | 0.04ms | +0.0015ms | +3.83% |

