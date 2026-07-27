# Perf Suite — grpc-app-scenario

Threshold source: [docs/quality/perf-thresholds.md](../../quality/perf-thresholds)

## Serial p95 (concurrency = 1)

| op | p95 | cap | gate | regression |
|---|---|---|---|---|
| multi_service_workflow (10 invokeUnary across 4 providers) | 0.02ms | 100ms | PASS | stable |
| streaming_batch (5 server-stream + bidi mix) | 0.03ms | 100ms | PASS | stable |
| error_status_batch (5 fail method returns INTERNAL) | 0.02ms | 100ms | PASS | stable |
| interceptor_chain_batch (10 unary through auth+log) | 0.01ms | 100ms | PASS | stable |
| cancel_deadline_batch (5 cancel + 5 deadline expired) | 0.02ms | 100ms | PASS | stable |

## Concurrent p95 (concurrency = 4, 5 iter each)

| op | p95 | cap | gate |
|---|---|---|---|
| multi_service_workflow (10 invokeUnary across 4 providers) | 0.06ms | 200ms | PASS |
| streaming_batch (5 server-stream + bidi mix) | 0.09ms | 200ms | PASS |
| error_status_batch (5 fail method returns INTERNAL) | 0.08ms | 200ms | PASS |
| interceptor_chain_batch (10 unary through auth+log) | 0.04ms | 200ms | PASS |
| cancel_deadline_batch (5 cancel + 5 deadline expired) | 0.03ms | 200ms | PASS |

## Memory retention (20 iter, arrayBuffers axis is the gate; heap is informational)

| op | heapUsed Δ | arrayBuffers Δ | cap | gc exposed | verdict |
|---|---|---|---|---|---|
| multi_service_workflow (10 invokeUnary across 4 providers) | -3888 B | -15542 B | 102400 B | yes | PASS |
| streaming_batch (5 server-stream + bidi mix) | 1272 B | 0 B | 102400 B | yes | PASS |
| error_status_batch (5 fail method returns INTERNAL) | -1912 B | 0 B | 102400 B | yes | PASS |
| interceptor_chain_batch (10 unary through auth+log) | 11008 B | 0 B | 102400 B | yes | PASS |
| cancel_deadline_batch (5 cancel + 5 deadline expired) | 1368 B | 0 B | 102400 B | yes | PASS |

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
| stdev | 0.01ms |
| min | 0.01ms |
| max | 0.03ms |
| total | 0.26ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p50 | 0.01ms | 0.01ms | +0.01ms | +86.89% |
| p95 | 0.02ms | 0.01ms | +0.02ms | +247.30% |
| p99 | 0.03ms | 0.01ms | +0.02ms | +293.67% |
| mean | 0.01ms | 0.01ms | +0.01ms | +115.36% |
| min | 0.01ms | 0.01ms | +0.00ms | +82.07% |
| max | 0.03ms | 0.01ms | +0.02ms | +304.42% |
| total | 0.26ms | 0.12ms | +0.14ms | +115.36% |

### streaming_batch (5 server-stream + bidi mix)

# Perf Report — streaming_batch (5 server-stream + bidi mix).serial

| metric | value |
|---|---|
| iterations | 20 |
| warmup | 3 |
| p50 | 0.02ms |
| p95 | 0.03ms |
| p99 | 0.03ms |
| mean | 0.02ms |
| stdev | 0.01ms |
| min | 0.01ms |
| max | 0.04ms |
| total | 0.38ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p50 | 0.02ms | 0.01ms | +0.01ms | +95.39% |
| p95 | 0.03ms | 0.02ms | +0.01ms | +66.78% |
| p99 | 0.03ms | 0.02ms | +0.01ms | +60.30% |
| mean | 0.02ms | 0.01ms | +0.01ms | +96.27% |
| min | 0.01ms | 0.01ms | +0.01ms | +72.02% |
| max | 0.04ms | 0.02ms | +0.01ms | +59.09% |
| total | 0.38ms | 0.19ms | +0.19ms | +96.27% |

### error_status_batch (5 fail method returns INTERNAL)

# Perf Report — error_status_batch (5 fail method returns INTERNAL).serial

| metric | value |
|---|---|
| iterations | 20 |
| warmup | 3 |
| p50 | 0.02ms |
| p95 | 0.02ms |
| p99 | 0.03ms |
| mean | 0.02ms |
| stdev | 0.00ms |
| min | 0.01ms |
| max | 0.03ms |
| total | 0.34ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p50 | 0.02ms | 0.02ms | +0.00ms | +4.77% |
| p95 | 0.02ms | 0.02ms | +0.00ms | +27.90% |
| p99 | 0.03ms | 0.02ms | +0.01ms | +77.43% |
| mean | 0.02ms | 0.02ms | +0.00ms | +10.71% |
| min | 0.01ms | 0.01ms | -0.00ms | -3.38% |
| max | 0.03ms | 0.02ms | +0.02ms | +89.78% |
| total | 0.34ms | 0.31ms | +0.03ms | +10.71% |

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
| p50 | 0.01ms | 0.01ms | -0.00ms | -14.83% |
| p95 | 0.01ms | 0.01ms | +0.00ms | +16.31% |
| p99 | 0.02ms | 0.02ms | -0.00ms | -12.21% |
| mean | 0.01ms | 0.01ms | -0.00ms | -11.73% |
| min | 0.01ms | 0.01ms | -0.00ms | -15.59% |
| max | 0.02ms | 0.02ms | -0.00ms | -15.51% |
| total | 0.18ms | 0.20ms | -0.02ms | -11.73% |

### cancel_deadline_batch (5 cancel + 5 deadline expired)

# Perf Report — cancel_deadline_batch (5 cancel + 5 deadline expired).serial

| metric | value |
|---|---|
| iterations | 20 |
| warmup | 3 |
| p50 | 0.00ms |
| p95 | 0.02ms |
| p99 | 0.04ms |
| mean | 0.01ms |
| stdev | 0.01ms |
| min | 0.00ms |
| max | 0.04ms |
| total | 0.11ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p50 | 0.00ms | 0.00ms | +0.00ms | +11.65% |
| p95 | 0.02ms | 0.00ms | +0.02ms | +880.68% |
| p99 | 0.04ms | 0.00ms | +0.03ms | +1030.66% |
| mean | 0.01ms | 0.00ms | +0.00ms | +146.80% |
| min | 0.00ms | 0.00ms | +0.00ms | +8.02% |
| max | 0.04ms | 0.00ms | +0.04ms | +1055.98% |
| total | 0.11ms | 0.04ms | +0.06ms | +146.80% |

