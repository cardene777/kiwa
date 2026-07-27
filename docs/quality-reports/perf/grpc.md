# Perf Suite — grpc

Threshold source: [docs/quality/perf-thresholds.md](../../quality/perf-thresholds)

## Serial p95 (concurrency = 1)

| op | p95 | cap | gate | regression |
|---|---|---|---|---|
| invokeUnary | 0.00ms | 5ms | PASS | stable |
| invokeServerStream | 0.00ms | 5ms | PASS | stable |

## Concurrent p95 (concurrency = 10, 50 iter each)

| op | p95 | cap | gate |
|---|---|---|---|
| invokeUnary | 0.02ms | 10ms | PASS |
| invokeServerStream | 0.02ms | 10ms | PASS |

## Memory retention (200 iter, arrayBuffers axis is the gate; heap is informational)

| op | heapUsed Δ | arrayBuffers Δ | cap | gc exposed | verdict |
|---|---|---|---|---|---|
| invokeUnary | -7544 B | -33491 B | 102400 B | yes | PASS |
| invokeServerStream | -20440 B | 0 B | 102400 B | yes | PASS |

## Detailed serial reports

### invokeUnary

# Perf Report — invokeUnary.serial

| metric | value |
|---|---|
| iterations | 200 |
| warmup | 5 |
| p50 | 0.00ms |
| p95 | 0.00ms |
| p99 | 0.00ms |
| mean | 0.00ms |
| stdev | 0.00ms |
| min | 0.00ms |
| max | 0.02ms |
| total | 0.18ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p50 | 0.00ms | 0.00ms | -0.00ms | -15.01% |
| p95 | 0.00ms | 0.00ms | -0.00ms | -31.50% |
| p99 | 0.00ms | 0.01ms | -0.00ms | -26.64% |
| mean | 0.00ms | 0.00ms | -0.00ms | -15.36% |
| min | 0.00ms | 0.00ms | -0.00ms | -12.46% |
| max | 0.02ms | 0.02ms | -0.00ms | -7.76% |
| total | 0.18ms | 0.21ms | -0.03ms | -15.36% |

### invokeServerStream

# Perf Report — invokeServerStream.serial

| metric | value |
|---|---|
| iterations | 200 |
| warmup | 5 |
| p50 | 0.00ms |
| p95 | 0.00ms |
| p99 | 0.01ms |
| mean | 0.00ms |
| stdev | 0.00ms |
| min | 0.00ms |
| max | 0.01ms |
| total | 0.28ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p50 | 0.00ms | 0.00ms | -0.00ms | -3.60% |
| p95 | 0.00ms | 0.00ms | -0.00ms | -33.48% |
| p99 | 0.01ms | 0.01ms | -0.00ms | -22.74% |
| mean | 0.00ms | 0.00ms | -0.00ms | -11.58% |
| min | 0.00ms | 0.00ms | -0.00ms | -4.28% |
| max | 0.01ms | 0.03ms | -0.02ms | -56.55% |
| total | 0.28ms | 0.31ms | -0.04ms | -11.58% |

