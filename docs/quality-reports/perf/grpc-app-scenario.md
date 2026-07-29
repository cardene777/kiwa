# Perf Suite — grpc-app-scenario

Threshold source: [docs/quality/perf-thresholds.md](../../quality/perf-thresholds)

測定系の分解能 = 0.00025ms (何もしない関数を同じ経路で呼んだ時の p10)。 回帰判定の絶対下限は既定でこの 2 倍 = 0.00050ms、 op ごとの実効値は下表の「下限」 列。

## Serial (concurrency = 1)

| op | p10 (回帰判定) | p95 (上限判定) | cap | 下限 | gate | regression |
|---|---|---|---|---|---|---|
| multi_service_workflow (10 invokeUnary across 4 providers) | 0.0048ms | 0.0081ms | 100ms | 0.00050ms | PASS | stable — gate 無効 (regressionGate=false) |
| streaming_batch (5 server-stream + bidi mix) | 0.0088ms | 0.02ms | 100ms | 0.00050ms | PASS | regressed — gate 無効 (regressionGate=false) |
| error_status_batch (5 fail method returns INTERNAL) | 0.01ms | 0.02ms | 100ms | 0.00050ms | PASS | stable — gate 無効 (regressionGate=false) |
| interceptor_chain_batch (10 unary through auth+log) | 0.0074ms | 0.01ms | 100ms | 0.00050ms | PASS | stable (p10 -14% (閾値未満)、 p95 +42% (裾は実行間の振れ幅と区別できないため判定には使わない)) — gate 無効 (regressionGate=false) |
| cancel_deadline_batch (5 cancel + 5 deadline expired) | 0.0020ms | 0.0022ms | 100ms | 0.00050ms | PASS | stable — gate 無効 (regressionGate=false) |

## Concurrent p95 (concurrency = 4, 5 iter each)

| op | p95 | cap | gate |
|---|---|---|---|
| multi_service_workflow (10 invokeUnary across 4 providers) | 0.04ms | 200ms | PASS |
| streaming_batch (5 server-stream + bidi mix) | 0.05ms | 200ms | PASS |
| error_status_batch (5 fail method returns INTERNAL) | 0.07ms | 200ms | PASS |
| interceptor_chain_batch (10 unary through auth+log) | 0.06ms | 200ms | PASS |
| cancel_deadline_batch (5 cancel + 5 deadline expired) | 0.01ms | 200ms | PASS |

## Memory retention (20 iter, arrayBuffers axis is the gate; heap is informational)

| op | heapUsed Δ | arrayBuffers Δ | cap | gc exposed | verdict |
|---|---|---|---|---|---|
| multi_service_workflow (10 invokeUnary across 4 providers) | -3880 B | 0 B | 102400 B | yes | PASS |
| streaming_batch (5 server-stream + bidi mix) | 3200 B | 0 B | 102400 B | yes | PASS |
| error_status_batch (5 fail method returns INTERNAL) | -2208 B | 0 B | 102400 B | yes | PASS |
| interceptor_chain_batch (10 unary through auth+log) | 18680 B | 0 B | 102400 B | yes | PASS |
| cancel_deadline_batch (5 cancel + 5 deadline expired) | 3440 B | 0 B | 102400 B | yes | PASS |

## Detailed serial reports

### multi_service_workflow (10 invokeUnary across 4 providers)

# Perf Report — multi_service_workflow (10 invokeUnary across 4 providers).serial

| metric | value |
|---|---|
| iterations | 20 |
| warmup | 3 |
| p10 | 0.0048ms |
| p50 | 0.0060ms |
| p95 | 0.0081ms |
| p99 | 0.01ms |
| mean | 0.0063ms |
| stdev | 0.0017ms |
| min | 0.0047ms |
| max | 0.01ms |
| total | 0.13ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.0048ms | 0.0041ms | +0.00075ms | +18.38% |
| p50 | 0.0060ms | 0.0053ms | +0.00075ms | +14.17% |
| p95 | 0.0081ms | 0.0071ms | +0.0010ms | +13.98% |
| p99 | 0.01ms | 0.01ms | +0.00093ms | +8.56% |
| mean | 0.0063ms | 0.0055ms | +0.00078ms | +14.02% |
| min | 0.0047ms | 0.0040ms | +0.00071ms | +17.88% |
| max | 0.01ms | 0.01ms | +0.00092ms | +7.75% |
| total | 0.13ms | 0.11ms | +0.02ms | +14.02% |

### streaming_batch (5 server-stream + bidi mix)

# Perf Report — streaming_batch (5 server-stream + bidi mix).serial

| metric | value |
|---|---|
| iterations | 20 |
| warmup | 3 |
| p10 | 0.0088ms |
| p50 | 0.01ms |
| p95 | 0.02ms |
| p99 | 0.02ms |
| mean | 0.01ms |
| stdev | 0.0040ms |
| min | 0.0081ms |
| max | 0.02ms |
| total | 0.24ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.0088ms | 0.0061ms | +0.0026ms | +43.23% |
| p50 | 0.01ms | 0.0066ms | +0.0042ms | +63.52% |
| p95 | 0.02ms | 0.01ms | +0.0063ms | +45.45% |
| p99 | 0.02ms | 0.02ms | +0.0054ms | +30.02% |
| mean | 0.01ms | 0.0082ms | +0.0037ms | +45.69% |
| min | 0.0081ms | 0.0061ms | +0.0020ms | +33.57% |
| max | 0.02ms | 0.02ms | +0.0052ms | +27.19% |
| total | 0.24ms | 0.16ms | +0.07ms | +45.69% |

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
| mean | 0.02ms |
| stdev | 0.0056ms |
| min | 0.01ms |
| max | 0.04ms |
| total | 0.32ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.01ms | 0.01ms | +0.00071ms | +5.84% |
| p50 | 0.01ms | 0.01ms | +0.0020ms | +16.27% |
| p95 | 0.02ms | 0.02ms | +0.0028ms | +12.42% |
| p99 | 0.03ms | 0.02ms | +0.01ms | +52.23% |
| mean | 0.02ms | 0.01ms | +0.0022ms | +15.71% |
| min | 0.01ms | 0.01ms | +0.00054ms | +4.52% |
| max | 0.04ms | 0.02ms | +0.01ms | +62.08% |
| total | 0.32ms | 0.28ms | +0.04ms | +15.71% |

### interceptor_chain_batch (10 unary through auth+log)

# Perf Report — interceptor_chain_batch (10 unary through auth+log).serial

| metric | value |
|---|---|
| iterations | 20 |
| warmup | 3 |
| p10 | 0.0074ms |
| p50 | 0.0091ms |
| p95 | 0.01ms |
| p99 | 0.02ms |
| mean | 0.0099ms |
| stdev | 0.0039ms |
| min | 0.0073ms |
| max | 0.03ms |
| total | 0.20ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.0074ms | 0.0085ms | -0.0012ms | -13.67% |
| p50 | 0.0091ms | 0.0089ms | +0.00029ms | +3.29% |
| p95 | 0.01ms | 0.01ms | +0.0044ms | +42.07% |
| p99 | 0.02ms | 0.02ms | +0.0013ms | +5.88% |
| mean | 0.0099ms | 0.0097ms | +0.00021ms | +2.19% |
| min | 0.0073ms | 0.0085ms | -0.0012ms | -14.21% |
| max | 0.03ms | 0.02ms | +0.00050ms | +2.04% |
| total | 0.20ms | 0.19ms | +0.0042ms | +2.19% |

### cancel_deadline_batch (5 cancel + 5 deadline expired)

# Perf Report — cancel_deadline_batch (5 cancel + 5 deadline expired).serial

| metric | value |
|---|---|
| iterations | 20 |
| warmup | 3 |
| p10 | 0.0020ms |
| p50 | 0.0020ms |
| p95 | 0.0022ms |
| p99 | 0.0028ms |
| mean | 0.0021ms |
| stdev | 0.00021ms |
| min | 0.0020ms |
| max | 0.0030ms |
| total | 0.04ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.0020ms | 0.0020ms | +0.000046ms | +2.36% |
| p50 | 0.0020ms | 0.0020ms | +0.000083ms | +4.24% |
| p95 | 0.0022ms | 0.0022ms | -0.0000066ms | -0.30% |
| p99 | 0.0028ms | 0.0023ms | +0.00053ms | +23.43% |
| mean | 0.0021ms | 0.0020ms | +0.000091ms | +4.55% |
| min | 0.0020ms | 0.0019ms | +0.000083ms | +4.33% |
| max | 0.0030ms | 0.0023ms | +0.00067ms | +29.06% |
| total | 0.04ms | 0.04ms | +0.0018ms | +4.55% |

