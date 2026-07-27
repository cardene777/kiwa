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
| invokeUnary | 0.03ms | 10ms | PASS |
| invokeServerStream | 0.01ms | 10ms | PASS |

## Memory retention (200 iter, arrayBuffers axis is the gate; heap is informational)

| op | heapUsed Δ | arrayBuffers Δ | cap | gc exposed | verdict |
|---|---|---|---|---|---|
| invokeUnary | -2336 B | 0 B | 102400 B | yes | PASS |
| invokeServerStream | -20616 B | 0 B | 102400 B | yes | PASS |

## Detailed serial reports

### invokeUnary

# Perf Report — invokeUnary.serial

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
| max | 0.03ms |
| total | 0.40ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p50 | 0.00ms | 0.00ms | +0.00ms | +70.11% |
| p95 | 0.00ms | 0.00ms | +0.00ms | +82.39% |
| p99 | 0.01ms | 0.01ms | +0.00ms | +53.70% |
| mean | 0.00ms | 0.00ms | +0.00ms | +86.61% |
| min | 0.00ms | 0.00ms | +0.00ms | +100.15% |
| max | 0.03ms | 0.02ms | +0.01ms | +66.26% |
| total | 0.40ms | 0.21ms | +0.18ms | +86.61% |

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
| total | 0.23ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p50 | 0.00ms | 0.00ms | -0.00ms | -21.42% |
| p95 | 0.00ms | 0.00ms | -0.00ms | -53.21% |
| p99 | 0.01ms | 0.01ms | -0.00ms | -28.57% |
| mean | 0.00ms | 0.00ms | -0.00ms | -25.16% |
| min | 0.00ms | 0.00ms | -0.00ms | -13.05% |
| max | 0.01ms | 0.03ms | -0.02ms | -62.80% |
| total | 0.23ms | 0.31ms | -0.08ms | -25.16% |

