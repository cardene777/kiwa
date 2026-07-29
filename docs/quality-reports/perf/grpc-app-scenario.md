# Perf Suite — grpc-app-scenario

Threshold source: [docs/quality/perf-thresholds.md](../../quality/perf-thresholds)

測定系の分解能 = 0.00025ms (何もしない関数を同じ経路で呼んだ時の p10)。 回帰判定の絶対下限は既定でこの 2 倍 = 0.00050ms、 op ごとの実効値は下表の「下限」 列。

## Serial (concurrency = 1)

| op | p10 (回帰判定) | p95 (上限判定) | cap | 下限 | gate | regression |
|---|---|---|---|---|---|---|
| multi_service_workflow (10 invokeUnary across 4 providers) | 0.0052ms | 0.0061ms | 100ms | 0.00050ms | PASS | regressed — gate 無効 (regressionGate=false) |
| streaming_batch (5 server-stream + bidi mix) | 0.0062ms | 0.01ms | 100ms | 0.00050ms | PASS | stable — gate 無効 (regressionGate=false) |
| error_status_batch (5 fail method returns INTERNAL) | 0.01ms | 0.02ms | 100ms | 0.00050ms | PASS | stable — gate 無効 (regressionGate=false) |
| interceptor_chain_batch (10 unary through auth+log) | 0.0084ms | 0.01ms | 100ms | 0.00050ms | PASS | stable — gate 無効 (regressionGate=false) |
| cancel_deadline_batch (5 cancel + 5 deadline expired) | 0.0020ms | 0.0022ms | 100ms | 0.00050ms | PASS | stable — gate 無効 (regressionGate=false) |

## Concurrent p95 (concurrency = 4, 5 iter each)

| op | p95 | cap | gate |
|---|---|---|---|
| multi_service_workflow (10 invokeUnary across 4 providers) | 0.04ms | 200ms | PASS |
| streaming_batch (5 server-stream + bidi mix) | 0.04ms | 200ms | PASS |
| error_status_batch (5 fail method returns INTERNAL) | 0.06ms | 200ms | PASS |
| interceptor_chain_batch (10 unary through auth+log) | 0.04ms | 200ms | PASS |
| cancel_deadline_batch (5 cancel + 5 deadline expired) | 0.02ms | 200ms | PASS |

## Memory retention (20 iter, arrayBuffers axis is the gate; heap is informational)

| op | heapUsed Δ | arrayBuffers Δ | cap | gc exposed | verdict |
|---|---|---|---|---|---|
| multi_service_workflow (10 invokeUnary across 4 providers) | 9848 B | 0 B | 102400 B | yes | PASS |
| streaming_batch (5 server-stream + bidi mix) | 2216 B | 0 B | 102400 B | yes | PASS |
| error_status_batch (5 fail method returns INTERNAL) | -4048 B | 0 B | 102400 B | yes | PASS |
| interceptor_chain_batch (10 unary through auth+log) | 28088 B | 0 B | 102400 B | yes | PASS |
| cancel_deadline_batch (5 cancel + 5 deadline expired) | 3992 B | 0 B | 102400 B | yes | PASS |

## Detailed serial reports

### multi_service_workflow (10 invokeUnary across 4 providers)

# Perf Report — multi_service_workflow (10 invokeUnary across 4 providers).serial

| metric | value |
|---|---|
| iterations | 20 |
| warmup | 3 |
| p10 | 0.0052ms |
| p50 | 0.0053ms |
| p95 | 0.0061ms |
| p99 | 0.0069ms |
| mean | 0.0055ms |
| stdev | 0.00046ms |
| min | 0.0050ms |
| max | 0.0071ms |
| total | 0.11ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.0052ms | 0.0041ms | +0.0011ms | +26.78% |
| p50 | 0.0053ms | 0.0053ms | +5.0e-7ms | +0.01% |
| p95 | 0.0061ms | 0.0071ms | -0.0011ms | -14.97% |
| p99 | 0.0069ms | 0.01ms | -0.0040ms | -36.54% |
| mean | 0.0055ms | 0.0055ms | -0.000090ms | -1.62% |
| min | 0.0050ms | 0.0040ms | +0.0011ms | +27.36% |
| max | 0.0071ms | 0.01ms | -0.0047ms | -39.79% |
| total | 0.11ms | 0.11ms | -0.0018ms | -1.62% |

### streaming_batch (5 server-stream + bidi mix)

# Perf Report — streaming_batch (5 server-stream + bidi mix).serial

| metric | value |
|---|---|
| iterations | 20 |
| warmup | 3 |
| p10 | 0.0062ms |
| p50 | 0.0069ms |
| p95 | 0.01ms |
| p99 | 0.02ms |
| mean | 0.0087ms |
| stdev | 0.0036ms |
| min | 0.0060ms |
| max | 0.02ms |
| total | 0.17ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.0062ms | 0.0061ms | +0.000079ms | +1.29% |
| p50 | 0.0069ms | 0.0066ms | +0.00027ms | +4.08% |
| p95 | 0.01ms | 0.01ms | +0.0011ms | +7.79% |
| p99 | 0.02ms | 0.02ms | +0.0010ms | +5.84% |
| mean | 0.0087ms | 0.0082ms | +0.00055ms | +6.74% |
| min | 0.0060ms | 0.0061ms | -0.000041ms | -0.67% |
| max | 0.02ms | 0.02ms | +0.0010ms | +5.48% |
| total | 0.17ms | 0.16ms | +0.01ms | +6.74% |

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
| total | 0.27ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.01ms | 0.01ms | -0.00016ms | -1.34% |
| p50 | 0.01ms | 0.01ms | -0.00017ms | -1.34% |
| p95 | 0.02ms | 0.02ms | -0.0033ms | -14.83% |
| p99 | 0.03ms | 0.02ms | +0.0056ms | +25.22% |
| mean | 0.01ms | 0.01ms | -0.00035ms | -2.51% |
| min | 0.01ms | 0.01ms | -0.00017ms | -1.38% |
| max | 0.03ms | 0.02ms | +0.0079ms | +35.13% |
| total | 0.27ms | 0.28ms | -0.0070ms | -2.51% |

### interceptor_chain_batch (10 unary through auth+log)

# Perf Report — interceptor_chain_batch (10 unary through auth+log).serial

| metric | value |
|---|---|
| iterations | 20 |
| warmup | 3 |
| p10 | 0.0084ms |
| p50 | 0.0086ms |
| p95 | 0.01ms |
| p99 | 0.02ms |
| mean | 0.0093ms |
| stdev | 0.0028ms |
| min | 0.0083ms |
| max | 0.02ms |
| total | 0.19ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.0084ms | 0.0085ms | -0.00016ms | -1.91% |
| p50 | 0.0086ms | 0.0089ms | -0.00025ms | -2.82% |
| p95 | 0.01ms | 0.01ms | -0.000060ms | -0.58% |
| p99 | 0.02ms | 0.02ms | -0.0029ms | -13.28% |
| mean | 0.0093ms | 0.0097ms | -0.00040ms | -4.18% |
| min | 0.0083ms | 0.0085ms | -0.00025ms | -2.94% |
| max | 0.02ms | 0.02ms | -0.0036ms | -14.63% |
| total | 0.19ms | 0.19ms | -0.0081ms | -4.18% |

### cancel_deadline_batch (5 cancel + 5 deadline expired)

# Perf Report — cancel_deadline_batch (5 cancel + 5 deadline expired).serial

| metric | value |
|---|---|
| iterations | 20 |
| warmup | 3 |
| p10 | 0.0020ms |
| p50 | 0.0020ms |
| p95 | 0.0022ms |
| p99 | 0.0030ms |
| mean | 0.0021ms |
| stdev | 0.00028ms |
| min | 0.0020ms |
| max | 0.0032ms |
| total | 0.04ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.0020ms | 0.0020ms | +0.0000041ms | +0.21% |
| p50 | 0.0020ms | 0.0020ms | +0.000041ms | +2.09% |
| p95 | 0.0022ms | 0.0022ms | +0.0000080ms | +0.37% |
| p99 | 0.0030ms | 0.0023ms | +0.00077ms | +33.86% |
| mean | 0.0021ms | 0.0020ms | +0.000060ms | +3.00% |
| min | 0.0020ms | 0.0019ms | +0.000041ms | +2.14% |
| max | 0.0032ms | 0.0023ms | +0.00096ms | +41.80% |
| total | 0.04ms | 0.04ms | +0.0012ms | +3.00% |

