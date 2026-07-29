# Perf Suite — grpc-app-scenario

Threshold source: [docs/quality/perf-thresholds.md](../../quality/perf-thresholds)

測定系の分解能 = 0.00025ms (何もしない関数を同じ経路で呼んだ時の p10)。 回帰判定の絶対下限は既定でこの 2 倍 = 0.00049ms、 op ごとの実効値は下表の「下限」 列。

## Serial (concurrency = 1)

| op | p10 (回帰判定) | p95 (上限判定) | cap | 下限 | gate | regression |
|---|---|---|---|---|---|---|
| multi_service_workflow (10 invokeUnary across 4 providers) | 0.0050ms | 0.0085ms | 100ms | 0.00049ms | PASS | stable — gate 無効 (regressionGate=false) |
| streaming_batch (5 server-stream + bidi mix) | 0.0065ms | 0.01ms | 100ms | 0.00049ms | PASS | stable — gate 無効 (regressionGate=false) |
| error_status_batch (5 fail method returns INTERNAL) | 0.01ms | 0.02ms | 100ms | 0.00049ms | PASS | stable — gate 無効 (regressionGate=false) |
| interceptor_chain_batch (10 unary through auth+log) | 0.0069ms | 0.01ms | 100ms | 0.00049ms | PASS | stable (p10 -19% (閾値未満)、 p95 +25% (裾は実行間の振れ幅と区別できないため判定には使わない)) — gate 無効 (regressionGate=false) |
| cancel_deadline_batch (5 cancel + 5 deadline expired) | 0.0019ms | 0.0022ms | 100ms | 0.00049ms | PASS | stable — gate 無効 (regressionGate=false) |

## Concurrent p95 (concurrency = 4, 5 iter each)

| op | p95 | cap | gate |
|---|---|---|---|
| multi_service_workflow (10 invokeUnary across 4 providers) | 0.03ms | 200ms | PASS |
| streaming_batch (5 server-stream + bidi mix) | 0.04ms | 200ms | PASS |
| error_status_batch (5 fail method returns INTERNAL) | 0.11ms | 200ms | PASS |
| interceptor_chain_batch (10 unary through auth+log) | 0.05ms | 200ms | PASS |
| cancel_deadline_batch (5 cancel + 5 deadline expired) | 0.01ms | 200ms | PASS |

## Memory retention (20 iter, arrayBuffers axis is the gate; heap is informational)

| op | heapUsed Δ | arrayBuffers Δ | cap | gc exposed | verdict |
|---|---|---|---|---|---|
| multi_service_workflow (10 invokeUnary across 4 providers) | 3752 B | 0 B | 102400 B | yes | PASS |
| streaming_batch (5 server-stream + bidi mix) | 2264 B | 0 B | 102400 B | yes | PASS |
| error_status_batch (5 fail method returns INTERNAL) | -3080 B | 0 B | 102400 B | yes | PASS |
| interceptor_chain_batch (10 unary through auth+log) | 20080 B | 0 B | 102400 B | yes | PASS |
| cancel_deadline_batch (5 cancel + 5 deadline expired) | 952 B | 0 B | 102400 B | yes | PASS |

## Detailed serial reports

### multi_service_workflow (10 invokeUnary across 4 providers)

# Perf Report — multi_service_workflow (10 invokeUnary across 4 providers).serial

| metric | value |
|---|---|
| iterations | 20 |
| warmup | 3 |
| p10 | 0.0050ms |
| p50 | 0.0051ms |
| p95 | 0.0085ms |
| p99 | 0.01ms |
| mean | 0.0057ms |
| stdev | 0.0015ms |
| min | 0.0043ms |
| max | 0.01ms |
| total | 0.11ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.0050ms | 0.0041ms | +0.00092ms | +22.68% |
| p50 | 0.0051ms | 0.0053ms | -0.00015ms | -2.75% |
| p95 | 0.0085ms | 0.0071ms | +0.0014ms | +19.01% |
| p99 | 0.01ms | 0.01ms | -0.00023ms | -2.10% |
| mean | 0.0057ms | 0.0055ms | +0.00012ms | +2.18% |
| min | 0.0043ms | 0.0040ms | +0.00029ms | +7.35% |
| max | 0.01ms | 0.01ms | -0.00063ms | -5.28% |
| total | 0.11ms | 0.11ms | +0.0024ms | +2.18% |

### streaming_batch (5 server-stream + bidi mix)

# Perf Report — streaming_batch (5 server-stream + bidi mix).serial

| metric | value |
|---|---|
| iterations | 20 |
| warmup | 3 |
| p10 | 0.0065ms |
| p50 | 0.0082ms |
| p95 | 0.01ms |
| p99 | 0.02ms |
| mean | 0.0091ms |
| stdev | 0.0032ms |
| min | 0.0063ms |
| max | 0.02ms |
| total | 0.18ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.0065ms | 0.0061ms | +0.00033ms | +5.46% |
| p50 | 0.0082ms | 0.0066ms | +0.0015ms | +23.28% |
| p95 | 0.01ms | 0.01ms | +0.00039ms | +2.79% |
| p99 | 0.02ms | 0.02ms | -0.000055ms | -0.31% |
| mean | 0.0091ms | 0.0082ms | +0.00091ms | +11.18% |
| min | 0.0063ms | 0.0061ms | +0.00025ms | +4.13% |
| max | 0.02ms | 0.02ms | -0.00017ms | -0.87% |
| total | 0.18ms | 0.16ms | +0.02ms | +11.18% |

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
| stdev | 0.0021ms |
| min | 0.01ms |
| max | 0.02ms |
| total | 0.27ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.01ms | 0.01ms | +0.00037ms | +3.06% |
| p50 | 0.01ms | 0.01ms | +0.00025ms | +2.01% |
| p95 | 0.02ms | 0.02ms | -0.0053ms | -23.77% |
| p99 | 0.02ms | 0.02ms | -0.0024ms | -10.82% |
| mean | 0.01ms | 0.01ms | -0.00029ms | -2.08% |
| min | 0.01ms | 0.01ms | +0.00038ms | +3.13% |
| max | 0.02ms | 0.02ms | -0.0017ms | -7.62% |
| total | 0.27ms | 0.28ms | -0.0058ms | -2.08% |

### interceptor_chain_batch (10 unary through auth+log)

# Perf Report — interceptor_chain_batch (10 unary through auth+log).serial

| metric | value |
|---|---|
| iterations | 20 |
| warmup | 3 |
| p10 | 0.0069ms |
| p50 | 0.0071ms |
| p95 | 0.01ms |
| p99 | 0.02ms |
| mean | 0.0082ms |
| stdev | 0.0029ms |
| min | 0.0069ms |
| max | 0.02ms |
| total | 0.16ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.0069ms | 0.0085ms | -0.0016ms | -19.04% |
| p50 | 0.0071ms | 0.0089ms | -0.0018ms | -19.77% |
| p95 | 0.01ms | 0.01ms | +0.0026ms | +25.22% |
| p99 | 0.02ms | 0.02ms | -0.0037ms | -17.10% |
| mean | 0.0082ms | 0.0097ms | -0.0014ms | -14.91% |
| min | 0.0069ms | 0.0085ms | -0.0016ms | -19.12% |
| max | 0.02ms | 0.02ms | -0.0053ms | -21.60% |
| total | 0.16ms | 0.19ms | -0.03ms | -14.91% |

### cancel_deadline_batch (5 cancel + 5 deadline expired)

# Perf Report — cancel_deadline_batch (5 cancel + 5 deadline expired).serial

| metric | value |
|---|---|
| iterations | 20 |
| warmup | 3 |
| p10 | 0.0019ms |
| p50 | 0.0020ms |
| p95 | 0.0022ms |
| p99 | 0.0025ms |
| mean | 0.0020ms |
| stdev | 0.00015ms |
| min | 0.0019ms |
| max | 0.0026ms |
| total | 0.04ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.0019ms | 0.0020ms | -0.000038ms | -1.94% |
| p50 | 0.0020ms | 0.0020ms | -0.0000010ms | -0.05% |
| p95 | 0.0022ms | 0.0022ms | +0.000054ms | +2.51% |
| p99 | 0.0025ms | 0.0023ms | +0.00024ms | +10.74% |
| mean | 0.0020ms | 0.0020ms | -0.000017ms | -0.85% |
| min | 0.0019ms | 0.0019ms | -0.0000010ms | -0.05% |
| max | 0.0026ms | 0.0023ms | +0.00029ms | +12.70% |
| total | 0.04ms | 0.04ms | -0.00034ms | -0.85% |

