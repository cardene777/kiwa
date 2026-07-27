# Perf Suite — grpc-app-scenario

Threshold source: [docs/quality/perf-thresholds.md](../../quality/perf-thresholds)

## Serial p95 (concurrency = 1)

| op | p95 | cap | gate | regression |
|---|---|---|---|---|
| multi_service_workflow (10 invokeUnary across 4 providers) | 0.01ms | 100ms | PASS | stable |
| streaming_batch (5 server-stream + bidi mix) | 0.02ms | 100ms | PASS | stable |
| error_status_batch (5 fail method returns INTERNAL) | 0.02ms | 100ms | PASS | stable |
| interceptor_chain_batch (10 unary through auth+log) | 0.01ms | 100ms | PASS | n/a (baseline seeded) |
| cancel_deadline_batch (5 cancel + 5 deadline expired) | 0.00ms | 100ms | PASS | n/a (baseline seeded) |

## Concurrent p95 (concurrency = 4, 5 iter each)

| op | p95 | cap | gate |
|---|---|---|---|
| multi_service_workflow (10 invokeUnary across 4 providers) | 0.03ms | 200ms | PASS |
| streaming_batch (5 server-stream + bidi mix) | 0.04ms | 200ms | PASS |
| error_status_batch (5 fail method returns INTERNAL) | 0.07ms | 200ms | PASS |
| interceptor_chain_batch (10 unary through auth+log) | 0.12ms | 200ms | PASS |
| cancel_deadline_batch (5 cancel + 5 deadline expired) | 0.01ms | 200ms | PASS |

## Memory retention (20 iter, arrayBuffers axis is the gate; heap is informational)

| op | heapUsed Δ | arrayBuffers Δ | cap | verdict |
|---|---|---|---|---|
| multi_service_workflow (10 invokeUnary across 4 providers) | 1116416 B | 0 B | 102400 B | PASS |
| streaming_batch (5 server-stream + bidi mix) | 564368 B | 0 B | 102400 B | PASS |
| error_status_batch (5 fail method returns INTERNAL) | 328864 B | 0 B | 102400 B | PASS |
| interceptor_chain_batch (10 unary through auth+log) | 856456 B | 0 B | 102400 B | PASS |
| cancel_deadline_batch (5 cancel + 5 deadline expired) | 313344 B | 0 B | 102400 B | PASS |

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
| total | 0.10ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p50 | 0.00ms | 0.01ms | -0.00ms | -25.86% |
| p95 | 0.01ms | 0.01ms | -0.00ms | -4.05% |
| p99 | 0.01ms | 0.01ms | +0.00ms | +22.06% |
| mean | 0.01ms | 0.01ms | -0.00ms | -18.00% |
| min | 0.00ms | 0.01ms | -0.00ms | -28.67% |
| max | 0.01ms | 0.01ms | +0.00ms | +27.51% |
| total | 0.10ms | 0.13ms | -0.02ms | -18.00% |

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
| p50 | 0.01ms | 0.01ms | -0.00ms | -5.04% |
| p95 | 0.02ms | 0.02ms | -0.00ms | -10.28% |
| p99 | 0.02ms | 0.02ms | +0.00ms | +1.44% |
| mean | 0.01ms | 0.01ms | +0.00ms | +3.98% |
| min | 0.01ms | 0.01ms | -0.00ms | -12.98% |
| max | 0.02ms | 0.02ms | +0.00ms | +3.89% |
| total | 0.21ms | 0.21ms | +0.01ms | +3.98% |

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
| p50 | 0.01ms | 0.02ms | -0.00ms | -23.28% |
| p95 | 0.02ms | 0.02ms | -0.00ms | -16.07% |
| p99 | 0.02ms | 0.03ms | -0.00ms | -9.42% |
| mean | 0.01ms | 0.02ms | -0.00ms | -20.73% |
| min | 0.01ms | 0.02ms | -0.00ms | -19.95% |
| max | 0.02ms | 0.03ms | -0.00ms | -8.18% |
| total | 0.28ms | 0.35ms | -0.07ms | -20.73% |

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

