# Perf Suite — grpc-app-scenario

Threshold source: [docs/quality/perf-thresholds.md](../../quality/perf-thresholds)

測定系の分解能 = 0.00025ms (何もしない関数を同じ経路で呼んだ時の p10)。 回帰判定の絶対下限は既定でこの 2 倍 = 0.00049ms、 op ごとの実効値は下表の「下限」 列。

## Serial (concurrency = 1)

| op | p10 (回帰判定) | p95 (上限判定) | cap | 下限 | gate | regression |
|---|---|---|---|---|---|---|
| multi_service_workflow (10 invokeUnary across 4 providers) | 0.0051ms | 0.0074ms | 100ms | 0.00049ms | PASS | stable — gate 無効 (regressionGate=false) |
| streaming_batch (5 server-stream + bidi mix) | 0.0069ms | 0.01ms | 100ms | 0.00049ms | PASS | stable — gate 無効 (regressionGate=false) |
| error_status_batch (5 fail method returns INTERNAL) | 0.01ms | 0.02ms | 100ms | 0.00049ms | PASS | stable — gate 無効 (regressionGate=false) |
| interceptor_chain_batch (10 unary through auth+log) | 0.0067ms | 0.01ms | 100ms | 0.00049ms | PASS | improved — gate 無効 (regressionGate=false) |
| cancel_deadline_batch (5 cancel + 5 deadline expired) | 0.0019ms | 0.0021ms | 100ms | 0.00049ms | PASS | stable — gate 無効 (regressionGate=false) |

## Concurrent p95 (concurrency = 4, 5 iter each)

| op | p95 | cap | gate |
|---|---|---|---|
| multi_service_workflow (10 invokeUnary across 4 providers) | 0.03ms | 200ms | PASS |
| streaming_batch (5 server-stream + bidi mix) | 0.04ms | 200ms | PASS |
| error_status_batch (5 fail method returns INTERNAL) | 0.07ms | 200ms | PASS |
| interceptor_chain_batch (10 unary through auth+log) | 0.04ms | 200ms | PASS |
| cancel_deadline_batch (5 cancel + 5 deadline expired) | 0.01ms | 200ms | PASS |

## Memory retention (20 iter, arrayBuffers axis is the gate; heap is informational)

| op | heapUsed Δ | arrayBuffers Δ | cap | gc exposed | verdict |
|---|---|---|---|---|---|
| multi_service_workflow (10 invokeUnary across 4 providers) | -362832 B | 0 B | 102400 B | yes | PASS |
| streaming_batch (5 server-stream + bidi mix) | 616 B | 0 B | 102400 B | yes | PASS |
| error_status_batch (5 fail method returns INTERNAL) | -2144 B | 0 B | 102400 B | yes | PASS |
| interceptor_chain_batch (10 unary through auth+log) | 17224 B | 0 B | 102400 B | yes | PASS |
| cancel_deadline_batch (5 cancel + 5 deadline expired) | -288 B | 0 B | 102400 B | yes | PASS |

## Detailed serial reports

### multi_service_workflow (10 invokeUnary across 4 providers)

# Perf Report — multi_service_workflow (10 invokeUnary across 4 providers).serial

| metric | value |
|---|---|
| iterations | 20 |
| warmup | 3 |
| p10 | 0.0051ms |
| p50 | 0.0052ms |
| p95 | 0.0074ms |
| p99 | 0.01ms |
| mean | 0.0059ms |
| stdev | 0.0019ms |
| min | 0.0049ms |
| max | 0.01ms |
| total | 0.12ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.0051ms | 0.0041ms | +0.0010ms | +24.62% |
| p50 | 0.0052ms | 0.0053ms | -0.000083ms | -1.57% |
| p95 | 0.0074ms | 0.0071ms | +0.00025ms | +3.46% |
| p99 | 0.01ms | 0.01ms | +0.0014ms | +13.31% |
| mean | 0.0059ms | 0.0055ms | +0.00034ms | +6.09% |
| min | 0.0049ms | 0.0040ms | +0.00096ms | +24.17% |
| max | 0.01ms | 0.01ms | +0.0017ms | +14.79% |
| total | 0.12ms | 0.11ms | +0.0067ms | +6.09% |

### streaming_batch (5 server-stream + bidi mix)

# Perf Report — streaming_batch (5 server-stream + bidi mix).serial

| metric | value |
|---|---|
| iterations | 20 |
| warmup | 3 |
| p10 | 0.0069ms |
| p50 | 0.0083ms |
| p95 | 0.01ms |
| p99 | 0.02ms |
| mean | 0.0091ms |
| stdev | 0.0032ms |
| min | 0.0065ms |
| max | 0.02ms |
| total | 0.18ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.0069ms | 0.0061ms | +0.00075ms | +12.18% |
| p50 | 0.0083ms | 0.0066ms | +0.0017ms | +25.47% |
| p95 | 0.01ms | 0.01ms | +0.00056ms | +4.03% |
| p99 | 0.02ms | 0.02ms | +0.00084ms | +4.70% |
| mean | 0.0091ms | 0.0082ms | +0.00096ms | +11.79% |
| min | 0.0065ms | 0.0061ms | +0.00042ms | +6.86% |
| max | 0.02ms | 0.02ms | +0.00092ms | +4.82% |
| total | 0.18ms | 0.16ms | +0.02ms | +11.79% |

### error_status_batch (5 fail method returns INTERNAL)

# Perf Report — error_status_batch (5 fail method returns INTERNAL).serial

| metric | value |
|---|---|
| iterations | 20 |
| warmup | 3 |
| p10 | 0.01ms |
| p50 | 0.01ms |
| p95 | 0.02ms |
| p99 | 0.02ms |
| mean | 0.01ms |
| stdev | 0.0028ms |
| min | 0.01ms |
| max | 0.02ms |
| total | 0.27ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.01ms | 0.01ms | +0.00017ms | +1.41% |
| p50 | 0.01ms | 0.01ms | +0.000084ms | +0.67% |
| p95 | 0.02ms | 0.02ms | -0.0038ms | -17.30% |
| p99 | 0.02ms | 0.02ms | -0.00010ms | -0.45% |
| mean | 0.01ms | 0.01ms | -0.00031ms | -2.22% |
| min | 0.01ms | 0.01ms | +0.00017ms | +1.38% |
| max | 0.02ms | 0.02ms | +0.00083ms | +3.72% |
| total | 0.27ms | 0.28ms | -0.0062ms | -2.22% |

### interceptor_chain_batch (10 unary through auth+log)

# Perf Report — interceptor_chain_batch (10 unary through auth+log).serial

| metric | value |
|---|---|
| iterations | 20 |
| warmup | 3 |
| p10 | 0.0067ms |
| p50 | 0.0070ms |
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
| p10 | 0.0067ms | 0.0085ms | -0.0018ms | -20.94% |
| p50 | 0.0070ms | 0.0089ms | -0.0019ms | -21.41% |
| p95 | 0.01ms | 0.01ms | +0.0025ms | +24.33% |
| p99 | 0.02ms | 0.02ms | -0.0033ms | -15.19% |
| mean | 0.0081ms | 0.0097ms | -0.0016ms | -16.52% |
| min | 0.0067ms | 0.0085ms | -0.0018ms | -20.59% |
| max | 0.02ms | 0.02ms | -0.0048ms | -19.39% |
| total | 0.16ms | 0.19ms | -0.03ms | -16.52% |

### cancel_deadline_batch (5 cancel + 5 deadline expired)

# Perf Report — cancel_deadline_batch (5 cancel + 5 deadline expired).serial

| metric | value |
|---|---|
| iterations | 20 |
| warmup | 3 |
| p10 | 0.0019ms |
| p50 | 0.0019ms |
| p95 | 0.0021ms |
| p99 | 0.0027ms |
| mean | 0.0020ms |
| stdev | 0.00021ms |
| min | 0.0019ms |
| max | 0.0029ms |
| total | 0.04ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.0019ms | 0.0020ms | -0.000038ms | -1.94% |
| p50 | 0.0019ms | 0.0020ms | -0.000021ms | -1.10% |
| p95 | 0.0021ms | 0.0022ms | -0.000090ms | -4.12% |
| p99 | 0.0027ms | 0.0023ms | +0.00045ms | +19.77% |
| mean | 0.0020ms | 0.0020ms | -0.000011ms | -0.53% |
| min | 0.0019ms | 0.0019ms | -0.0000010ms | -0.05% |
| max | 0.0029ms | 0.0023ms | +0.00058ms | +25.44% |
| total | 0.04ms | 0.04ms | -0.00021ms | -0.53% |

