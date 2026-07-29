# Perf Suite — grpc-app-scenario

Threshold source: [docs/quality/perf-thresholds.md](../../quality/perf-thresholds)

## Serial p95 (concurrency = 1)

| op | p95 | cap | gate | regression |
|---|---|---|---|---|
| multi_service_workflow (10 invokeUnary across 4 providers) | 0.02ms | 100ms | PASS | stable (差 0.01ms が下限 0.5ms 未満で判定を保留) — gate 無効 (regressionGate=false) |
| streaming_batch (5 server-stream + bidi mix) | 0.02ms | 100ms | PASS | stable (検知には +0.5ms (baseline 比 +3217%) 以上の悪化が必要) — gate 無効 (regressionGate=false) |
| error_status_batch (5 fail method returns INTERNAL) | 0.02ms | 100ms | PASS | stable (検知には +0.5ms (baseline 比 +1675%) 以上の悪化が必要) — gate 無効 (regressionGate=false) |
| interceptor_chain_batch (10 unary through auth+log) | 0.01ms | 100ms | PASS | stable (検知には +0.5ms (baseline 比 +2926%) 以上の悪化が必要) — gate 無効 (regressionGate=false) |
| cancel_deadline_batch (5 cancel + 5 deadline expired) | 0.00ms | 100ms | PASS | stable (検知には +0.5ms (baseline 比 +19342%) 以上の悪化が必要) — gate 無効 (regressionGate=false) |

## Concurrent p95 (concurrency = 4, 5 iter each)

| op | p95 | cap | gate |
|---|---|---|---|
| multi_service_workflow (10 invokeUnary across 4 providers) | 0.07ms | 200ms | PASS |
| streaming_batch (5 server-stream + bidi mix) | 0.05ms | 200ms | PASS |
| error_status_batch (5 fail method returns INTERNAL) | 0.08ms | 200ms | PASS |
| interceptor_chain_batch (10 unary through auth+log) | 0.04ms | 200ms | PASS |
| cancel_deadline_batch (5 cancel + 5 deadline expired) | 0.01ms | 200ms | PASS |

## Memory retention (20 iter, arrayBuffers axis is the gate; heap is informational)

| op | heapUsed Δ | arrayBuffers Δ | cap | gc exposed | verdict |
|---|---|---|---|---|---|
| multi_service_workflow (10 invokeUnary across 4 providers) | 6432 B | 0 B | 102400 B | yes | PASS |
| streaming_batch (5 server-stream + bidi mix) | 3072 B | 0 B | 102400 B | yes | PASS |
| error_status_batch (5 fail method returns INTERNAL) | -19816 B | 0 B | 102400 B | yes | PASS |
| interceptor_chain_batch (10 unary through auth+log) | 12536 B | 0 B | 102400 B | yes | PASS |
| cancel_deadline_batch (5 cancel + 5 deadline expired) | 7152 B | 0 B | 102400 B | yes | PASS |

## Detailed serial reports

### multi_service_workflow (10 invokeUnary across 4 providers)

# Perf Report — multi_service_workflow (10 invokeUnary across 4 providers).serial

| metric | value |
|---|---|
| iterations | 20 |
| warmup | 3 |
| p50 | 0.01ms |
| p95 | 0.02ms |
| p99 | 0.03ms |
| mean | 0.01ms |
| stdev | 0.00ms |
| min | 0.01ms |
| max | 0.03ms |
| total | 0.25ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p50 | 0.01ms | 0.01ms | +0.01ms | +100.39% |
| p95 | 0.02ms | 0.01ms | +0.01ms | +131.44% |
| p99 | 0.03ms | 0.01ms | +0.01ms | +95.41% |
| mean | 0.01ms | 0.01ms | +0.01ms | +108.78% |
| min | 0.01ms | 0.00ms | +0.01ms | +115.06% |
| max | 0.03ms | 0.01ms | +0.01ms | +90.56% |
| total | 0.25ms | 0.12ms | +0.13ms | +108.78% |

### streaming_batch (5 server-stream + bidi mix)

# Perf Report — streaming_batch (5 server-stream + bidi mix).serial

| metric | value |
|---|---|
| iterations | 20 |
| warmup | 3 |
| p50 | 0.01ms |
| p95 | 0.02ms |
| p99 | 0.02ms |
| mean | 0.01ms |
| stdev | 0.00ms |
| min | 0.01ms |
| max | 0.02ms |
| total | 0.24ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p50 | 0.01ms | 0.01ms | +0.00ms | +32.23% |
| p95 | 0.02ms | 0.02ms | +0.00ms | +17.72% |
| p99 | 0.02ms | 0.02ms | +0.00ms | +13.65% |
| mean | 0.01ms | 0.01ms | +0.00ms | +20.46% |
| min | 0.01ms | 0.01ms | +0.00ms | +9.23% |
| max | 0.02ms | 0.02ms | +0.00ms | +12.93% |
| total | 0.24ms | 0.20ms | +0.04ms | +20.46% |

### error_status_batch (5 fail method returns INTERNAL)

# Perf Report — error_status_batch (5 fail method returns INTERNAL).serial

| metric | value |
|---|---|
| iterations | 20 |
| warmup | 3 |
| p50 | 0.01ms |
| p95 | 0.02ms |
| p99 | 0.02ms |
| mean | 0.01ms |
| stdev | 0.00ms |
| min | 0.01ms |
| max | 0.03ms |
| total | 0.30ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p50 | 0.01ms | 0.01ms | +0.00ms | +2.41% |
| p95 | 0.02ms | 0.03ms | -0.01ms | -46.02% |
| p99 | 0.02ms | 0.07ms | -0.04ms | -62.89% |
| mean | 0.01ms | 0.02ms | -0.00ms | -16.21% |
| min | 0.01ms | 0.01ms | +0.00ms | +4.85% |
| max | 0.03ms | 0.08ms | -0.05ms | -64.54% |
| total | 0.30ms | 0.36ms | -0.06ms | -16.21% |

### interceptor_chain_batch (10 unary through auth+log)

# Perf Report — interceptor_chain_batch (10 unary through auth+log).serial

| metric | value |
|---|---|
| iterations | 20 |
| warmup | 3 |
| p50 | 0.01ms |
| p95 | 0.01ms |
| p99 | 0.02ms |
| mean | 0.01ms |
| stdev | 0.00ms |
| min | 0.01ms |
| max | 0.02ms |
| total | 0.18ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p50 | 0.01ms | 0.01ms | -0.00ms | -13.61% |
| p95 | 0.01ms | 0.02ms | -0.00ms | -12.32% |
| p99 | 0.02ms | 0.03ms | -0.01ms | -30.51% |
| mean | 0.01ms | 0.01ms | -0.00ms | -13.27% |
| min | 0.01ms | 0.01ms | -0.00ms | -2.25% |
| max | 0.02ms | 0.03ms | -0.01ms | -33.19% |
| total | 0.18ms | 0.21ms | -0.03ms | -13.27% |

### cancel_deadline_batch (5 cancel + 5 deadline expired)

# Perf Report — cancel_deadline_batch (5 cancel + 5 deadline expired).serial

| metric | value |
|---|---|
| iterations | 20 |
| warmup | 3 |
| p50 | 0.00ms |
| p95 | 0.00ms |
| p99 | 0.00ms |
| mean | 0.00ms |
| stdev | 0.00ms |
| min | 0.00ms |
| max | 0.00ms |
| total | 0.04ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p50 | 0.00ms | 0.00ms | -0.00ms | -3.76% |
| p95 | 0.00ms | 0.00ms | -0.00ms | -13.50% |
| p99 | 0.00ms | 0.00ms | +0.00ms | +1.15% |
| mean | 0.00ms | 0.00ms | -0.00ms | -3.50% |
| min | 0.00ms | 0.00ms | -0.00ms | -1.98% |
| max | 0.00ms | 0.00ms | +0.00ms | +4.76% |
| total | 0.04ms | 0.05ms | -0.00ms | -3.50% |

