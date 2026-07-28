# Perf Suite — grpc-app-scenario

Threshold source: [docs/quality/perf-thresholds.md](../../quality/perf-thresholds)

## Serial p95 (concurrency = 1)

| op | p95 | cap | gate | regression |
|---|---|---|---|---|
| multi_service_workflow (10 invokeUnary across 4 providers) | 0.01ms | 100ms | PASS | stable (検知には +0.5ms (baseline 比 +6584%) 以上の悪化が必要) |
| streaming_batch (5 server-stream + bidi mix) | 0.02ms | 100ms | PASS | stable (検知には +0.5ms (baseline 比 +3217%) 以上の悪化が必要) |
| error_status_batch (5 fail method returns INTERNAL) | 0.02ms | 100ms | PASS | stable (検知には +0.5ms (baseline 比 +1675%) 以上の悪化が必要) |
| interceptor_chain_batch (10 unary through auth+log) | 0.01ms | 100ms | PASS | stable (検知には +0.5ms (baseline 比 +2926%) 以上の悪化が必要) |
| cancel_deadline_batch (5 cancel + 5 deadline expired) | 0.00ms | 100ms | PASS | stable (検知には +0.5ms (baseline 比 +19342%) 以上の悪化が必要) |

## Concurrent p95 (concurrency = 4, 5 iter each)

| op | p95 | cap | gate |
|---|---|---|---|
| multi_service_workflow (10 invokeUnary across 4 providers) | 0.03ms | 200ms | PASS |
| streaming_batch (5 server-stream + bidi mix) | 0.04ms | 200ms | PASS |
| error_status_batch (5 fail method returns INTERNAL) | 0.06ms | 200ms | PASS |
| interceptor_chain_batch (10 unary through auth+log) | 0.05ms | 200ms | PASS |
| cancel_deadline_batch (5 cancel + 5 deadline expired) | 0.01ms | 200ms | PASS |

## Memory retention (20 iter, arrayBuffers axis is the gate; heap is informational)

| op | heapUsed Δ | arrayBuffers Δ | cap | gc exposed | verdict |
|---|---|---|---|---|---|
| multi_service_workflow (10 invokeUnary across 4 providers) | 13368 B | 0 B | 102400 B | yes | PASS |
| streaming_batch (5 server-stream + bidi mix) | 3112 B | 0 B | 102400 B | yes | PASS |
| error_status_batch (5 fail method returns INTERNAL) | -2336 B | 0 B | 102400 B | yes | PASS |
| interceptor_chain_batch (10 unary through auth+log) | 18992 B | 0 B | 102400 B | yes | PASS |
| cancel_deadline_batch (5 cancel + 5 deadline expired) | 7152 B | 0 B | 102400 B | yes | PASS |

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
| min | 0.00ms |
| max | 0.01ms |
| total | 0.11ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p50 | 0.01ms | 0.01ms | +0.00ms | +1.99% |
| p95 | 0.01ms | 0.01ms | -0.00ms | -4.20% |
| p99 | 0.01ms | 0.01ms | -0.00ms | -10.64% |
| mean | 0.01ms | 0.01ms | -0.00ms | -5.83% |
| min | 0.00ms | 0.00ms | -0.00ms | -13.28% |
| max | 0.01ms | 0.01ms | -0.00ms | -11.50% |
| total | 0.11ms | 0.12ms | -0.01ms | -5.83% |

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
| p50 | 0.01ms | 0.01ms | +0.00ms | +5.73% |
| p95 | 0.02ms | 0.02ms | +0.00ms | +9.90% |
| p99 | 0.02ms | 0.02ms | +0.00ms | +1.17% |
| mean | 0.01ms | 0.01ms | +0.00ms | +6.44% |
| min | 0.01ms | 0.01ms | -0.00ms | -11.79% |
| max | 0.02ms | 0.02ms | -0.00ms | -0.38% |
| total | 0.21ms | 0.20ms | +0.01ms | +6.44% |

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
| total | 0.27ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p50 | 0.01ms | 0.01ms | -0.00ms | -6.33% |
| p95 | 0.02ms | 0.03ms | -0.01ms | -46.08% |
| p99 | 0.02ms | 0.07ms | -0.05ms | -68.96% |
| mean | 0.01ms | 0.02ms | -0.00ms | -23.55% |
| min | 0.01ms | 0.01ms | -0.00ms | -3.57% |
| max | 0.02ms | 0.08ms | -0.05ms | -71.20% |
| total | 0.27ms | 0.36ms | -0.08ms | -23.55% |

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
| max | 0.03ms |
| total | 0.18ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p50 | 0.01ms | 0.01ms | -0.00ms | -21.43% |
| p95 | 0.01ms | 0.02ms | -0.00ms | -14.21% |
| p99 | 0.02ms | 0.03ms | -0.00ms | -7.34% |
| mean | 0.01ms | 0.01ms | -0.00ms | -14.76% |
| min | 0.01ms | 0.01ms | -0.00ms | -8.44% |
| max | 0.03ms | 0.03ms | -0.00ms | -6.32% |
| total | 0.18ms | 0.21ms | -0.03ms | -14.76% |

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
| p50 | 0.00ms | 0.00ms | -0.00ms | -11.28% |
| p95 | 0.00ms | 0.00ms | -0.00ms | -13.14% |
| p99 | 0.00ms | 0.00ms | +0.00ms | +7.58% |
| mean | 0.00ms | 0.00ms | -0.00ms | -9.15% |
| min | 0.00ms | 0.00ms | -0.00ms | -9.84% |
| max | 0.00ms | 0.00ms | +0.00ms | +12.69% |
| total | 0.04ms | 0.05ms | -0.00ms | -9.15% |

