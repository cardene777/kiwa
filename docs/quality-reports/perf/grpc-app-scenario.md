# Perf Suite — grpc-app-scenario

Threshold source: [docs/quality/perf-thresholds.md](../../quality/perf-thresholds)

## Serial p95 (concurrency = 1)

| op | p95 | cap | gate | regression |
|---|---|---|---|---|
| multi_service_workflow (10 invokeUnary across 4 providers) | 0.01ms | 100ms | PASS | stable |
| streaming_batch (5 server-stream + bidi mix) | 0.02ms | 100ms | PASS | stable |
| error_status_batch (5 fail method returns INTERNAL) | 0.02ms | 100ms | PASS | stable |
| interceptor_chain_batch (10 unary through auth+log) | 0.01ms | 100ms | PASS | stable |
| cancel_deadline_batch (5 cancel + 5 deadline expired) | 0.00ms | 100ms | PASS | stable |

## Concurrent p95 (concurrency = 4, 5 iter each)

| op | p95 | cap | gate |
|---|---|---|---|
| multi_service_workflow (10 invokeUnary across 4 providers) | 0.03ms | 200ms | PASS |
| streaming_batch (5 server-stream + bidi mix) | 0.04ms | 200ms | PASS |
| error_status_batch (5 fail method returns INTERNAL) | 0.08ms | 200ms | PASS |
| interceptor_chain_batch (10 unary through auth+log) | 0.04ms | 200ms | PASS |
| cancel_deadline_batch (5 cancel + 5 deadline expired) | 0.01ms | 200ms | PASS |

## Memory retention (20 iter, arrayBuffers axis is the gate; heap is informational)

| op | heapUsed Δ | arrayBuffers Δ | cap | gc exposed | verdict |
|---|---|---|---|---|---|
| multi_service_workflow (10 invokeUnary across 4 providers) | -4328 B | 0 B | 102400 B | yes | PASS |
| streaming_batch (5 server-stream + bidi mix) | 952 B | 0 B | 102400 B | yes | PASS |
| error_status_batch (5 fail method returns INTERNAL) | -2024 B | 0 B | 102400 B | yes | PASS |
| interceptor_chain_batch (10 unary through auth+log) | 24264 B | 0 B | 102400 B | yes | PASS |
| cancel_deadline_batch (5 cancel + 5 deadline expired) | 3888 B | 0 B | 102400 B | yes | PASS |

## Detailed serial reports

### multi_service_workflow (10 invokeUnary across 4 providers)

# Perf Report — multi_service_workflow (10 invokeUnary across 4 providers).serial

| metric | value |
|---|---|
| iterations | 20 |
| warmup | 3 |
| p50 | 0.00ms |
| p95 | 0.01ms |
| p99 | 0.01ms |
| mean | 0.01ms |
| stdev | 0.00ms |
| min | 0.00ms |
| max | 0.01ms |
| total | 0.11ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p50 | 0.00ms | 0.01ms | -0.00ms | -26.24% |
| p95 | 0.01ms | 0.01ms | +0.00ms | +46.50% |
| p99 | 0.01ms | 0.01ms | +0.01ms | +81.47% |
| mean | 0.01ms | 0.01ms | -0.00ms | -7.45% |
| min | 0.00ms | 0.01ms | -0.00ms | -26.13% |
| max | 0.01ms | 0.01ms | +0.01ms | +89.57% |
| total | 0.11ms | 0.12ms | -0.01ms | -7.45% |

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
| total | 0.21ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p50 | 0.01ms | 0.01ms | +0.00ms | +1.21% |
| p95 | 0.02ms | 0.02ms | -0.00ms | -1.21% |
| p99 | 0.02ms | 0.02ms | -0.00ms | -3.71% |
| mean | 0.01ms | 0.01ms | +0.00ms | +6.69% |
| min | 0.01ms | 0.01ms | -0.00ms | -9.33% |
| max | 0.02ms | 0.02ms | -0.00ms | -4.18% |
| total | 0.21ms | 0.19ms | +0.01ms | +6.69% |

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
| max | 0.02ms |
| total | 0.26ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p50 | 0.01ms | 0.02ms | -0.00ms | -19.64% |
| p95 | 0.02ms | 0.02ms | -0.00ms | -9.46% |
| p99 | 0.02ms | 0.02ms | +0.00ms | +24.59% |
| mean | 0.01ms | 0.02ms | -0.00ms | -15.75% |
| min | 0.01ms | 0.01ms | -0.00ms | -18.87% |
| max | 0.02ms | 0.02ms | +0.01ms | +33.09% |
| total | 0.26ms | 0.31ms | -0.05ms | -15.75% |

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
| total | 0.17ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p50 | 0.01ms | 0.01ms | -0.00ms | -19.33% |
| p95 | 0.01ms | 0.01ms | +0.00ms | +25.84% |
| p99 | 0.02ms | 0.02ms | -0.00ms | -6.81% |
| mean | 0.01ms | 0.01ms | -0.00ms | -13.18% |
| min | 0.01ms | 0.01ms | -0.00ms | -21.09% |
| max | 0.02ms | 0.02ms | -0.00ms | -10.59% |
| total | 0.17ms | 0.20ms | -0.03ms | -13.18% |

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
| p50 | 0.00ms | 0.00ms | -0.00ms | -2.91% |
| p95 | 0.00ms | 0.00ms | -0.00ms | -0.08% |
| p99 | 0.00ms | 0.00ms | -0.00ms | -20.89% |
| mean | 0.00ms | 0.00ms | -0.00ms | -5.09% |
| min | 0.00ms | 0.00ms | -0.00ms | -3.98% |
| max | 0.00ms | 0.00ms | -0.00ms | -24.41% |
| total | 0.04ms | 0.04ms | -0.00ms | -5.09% |

