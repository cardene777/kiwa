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
| error_status_batch (5 fail method returns INTERNAL) | 0.07ms | 200ms | PASS |
| interceptor_chain_batch (10 unary through auth+log) | 0.05ms | 200ms | PASS |
| cancel_deadline_batch (5 cancel + 5 deadline expired) | 0.01ms | 200ms | PASS |

## Memory retention (20 iter, arrayBuffers axis is the gate; heap is informational)

| op | heapUsed Δ | arrayBuffers Δ | cap | gc exposed | verdict |
|---|---|---|---|---|---|
| multi_service_workflow (10 invokeUnary across 4 providers) | 1440 B | 0 B | 102400 B | yes | PASS |
| streaming_batch (5 server-stream + bidi mix) | 1464 B | 0 B | 102400 B | yes | PASS |
| error_status_batch (5 fail method returns INTERNAL) | -2912 B | 0 B | 102400 B | yes | PASS |
| interceptor_chain_batch (10 unary through auth+log) | 23160 B | 0 B | 102400 B | yes | PASS |
| cancel_deadline_batch (5 cancel + 5 deadline expired) | 2864 B | 0 B | 102400 B | yes | PASS |

## Detailed serial reports

### multi_service_workflow (10 invokeUnary across 4 providers)

# Perf Report — multi_service_workflow (10 invokeUnary across 4 providers).serial

| metric | value |
|---|---|
| iterations | 20 |
| warmup | 3 |
| p50 | 0.01ms |
| p95 | 0.01ms |
| p99 | 0.01ms |
| mean | 0.01ms |
| stdev | 0.00ms |
| min | 0.01ms |
| max | 0.01ms |
| total | 0.13ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p50 | 0.01ms | 0.01ms | +0.00ms | +7.08% |
| p95 | 0.01ms | 0.01ms | +0.00ms | +10.25% |
| p99 | 0.01ms | 0.01ms | +0.00ms | +37.62% |
| mean | 0.01ms | 0.01ms | +0.00ms | +9.10% |
| min | 0.01ms | 0.01ms | -0.00ms | -5.98% |
| max | 0.01ms | 0.01ms | +0.00ms | +43.97% |
| total | 0.13ms | 0.12ms | +0.01ms | +9.10% |

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
| p50 | 0.01ms | 0.01ms | +0.00ms | +24.93% |
| p95 | 0.02ms | 0.02ms | +0.01ms | +34.46% |
| p99 | 0.02ms | 0.02ms | +0.00ms | +11.86% |
| mean | 0.01ms | 0.01ms | +0.00ms | +25.14% |
| min | 0.01ms | 0.01ms | +0.00ms | +8.80% |
| max | 0.02ms | 0.02ms | +0.00ms | +7.64% |
| total | 0.24ms | 0.19ms | +0.05ms | +25.14% |

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
| total | 0.28ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p50 | 0.01ms | 0.02ms | -0.00ms | -12.28% |
| p95 | 0.02ms | 0.02ms | -0.00ms | -3.00% |
| p99 | 0.02ms | 0.02ms | +0.00ms | +25.49% |
| mean | 0.01ms | 0.02ms | -0.00ms | -8.51% |
| min | 0.01ms | 0.01ms | -0.00ms | -12.39% |
| max | 0.02ms | 0.02ms | +0.01ms | +32.60% |
| total | 0.28ms | 0.31ms | -0.03ms | -8.51% |

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
| total | 0.19ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p50 | 0.01ms | 0.01ms | -0.00ms | -12.36% |
| p95 | 0.01ms | 0.01ms | +0.00ms | +36.83% |
| p99 | 0.02ms | 0.02ms | +0.00ms | +10.85% |
| mean | 0.01ms | 0.01ms | -0.00ms | -5.25% |
| min | 0.01ms | 0.01ms | -0.00ms | -14.21% |
| max | 0.02ms | 0.02ms | +0.00ms | +7.84% |
| total | 0.19ms | 0.20ms | -0.01ms | -5.25% |

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
| p50 | 0.00ms | 0.00ms | +0.00ms | +0.96% |
| p95 | 0.00ms | 0.00ms | +0.00ms | +2.78% |
| p99 | 0.00ms | 0.00ms | -0.00ms | -6.91% |
| mean | 0.00ms | 0.00ms | -0.00ms | -0.19% |
| min | 0.00ms | 0.00ms | 0.00ms | 0.00% |
| max | 0.00ms | 0.00ms | -0.00ms | -8.55% |
| total | 0.04ms | 0.04ms | -0.00ms | -0.19% |

