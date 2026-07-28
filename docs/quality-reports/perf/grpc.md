# Perf Suite — grpc

Threshold source: [docs/quality/perf-thresholds.md](../../quality/perf-thresholds)

## Serial p95 (concurrency = 1)

| op | p95 | cap | gate | regression |
|---|---|---|---|---|
| invokeUnary | 0.00ms | 5ms | PASS | stable (検知には +0.5ms (baseline 比 +23392%) 以上の悪化が必要) |
| invokeServerStream | 0.00ms | 5ms | PASS | stable (検知には +0.5ms (baseline 比 +10165%) 以上の悪化が必要) |

## Concurrent p95 (concurrency = 10, 50 iter each)

| op | p95 | cap | gate |
|---|---|---|---|
| invokeUnary | 0.01ms | 10ms | PASS |
| invokeServerStream | 0.02ms | 10ms | PASS |

## Memory retention (200 iter, arrayBuffers axis is the gate; heap is informational)

| op | heapUsed Δ | arrayBuffers Δ | cap | gc exposed | verdict |
|---|---|---|---|---|---|
| invokeUnary | -5128 B | 0 B | 102400 B | yes | PASS |
| invokeServerStream | -21760 B | 0 B | 102400 B | yes | PASS |

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
| total | 0.17ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p50 | 0.00ms | 0.00ms | -0.00ms | -22.13% |
| p95 | 0.00ms | 0.00ms | -0.00ms | -21.82% |
| p99 | 0.00ms | 0.01ms | -0.00ms | -18.27% |
| mean | 0.00ms | 0.00ms | -0.00ms | -21.00% |
| min | 0.00ms | 0.00ms | -0.00ms | -18.89% |
| max | 0.02ms | 0.02ms | -0.00ms | -9.67% |
| total | 0.17ms | 0.22ms | -0.05ms | -21.00% |

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
| total | 0.25ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p50 | 0.00ms | 0.00ms | -0.00ms | -12.00% |
| p95 | 0.00ms | 0.00ms | -0.00ms | -61.55% |
| p99 | 0.01ms | 0.01ms | -0.01ms | -48.64% |
| mean | 0.00ms | 0.00ms | -0.00ms | -35.60% |
| min | 0.00ms | 0.00ms | -0.00ms | -9.06% |
| max | 0.01ms | 0.03ms | -0.01ms | -48.44% |
| total | 0.25ms | 0.39ms | -0.14ms | -35.60% |

