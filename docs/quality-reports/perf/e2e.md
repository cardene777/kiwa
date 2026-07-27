# Perf Suite — e2e

Threshold source: [docs/quality/perf-thresholds.md](../../quality/perf-thresholds)

## Serial p95 (concurrency = 1)

| op | p95 | cap | gate | regression |
|---|---|---|---|---|
| fetchOverLoopback | 0.45ms | 20ms | PASS | stable |

## Concurrent p95 (concurrency = 4, 25 iter each)

| op | p95 | cap | gate |
|---|---|---|---|
| fetchOverLoopback | 1.16ms | 40ms | PASS |

## Memory retention (100 iter, arrayBuffers axis is the gate; heap is informational)

| op | heapUsed Δ | arrayBuffers Δ | cap | gc exposed | verdict |
|---|---|---|---|---|---|
| fetchOverLoopback | 235792 B | 0 B | 102400 B | yes | PASS |

## Detailed serial reports

### fetchOverLoopback

# Perf Report — fetchOverLoopback.serial

| metric | value |
|---|---|
| iterations | 100 |
| warmup | 3 |
| p50 | 0.18ms |
| p95 | 0.45ms |
| p99 | 0.50ms |
| mean | 0.21ms |
| stdev | 0.09ms |
| min | 0.14ms |
| max | 0.60ms |
| total | 21.25ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p50 | 0.18ms | 0.21ms | -0.03ms | -14.60% |
| p95 | 0.45ms | 0.57ms | -0.12ms | -21.69% |
| p99 | 0.50ms | 0.72ms | -0.23ms | -31.20% |
| mean | 0.21ms | 0.27ms | -0.05ms | -20.41% |
| min | 0.14ms | 0.16ms | -0.02ms | -12.74% |
| max | 0.60ms | 0.83ms | -0.23ms | -28.00% |
| total | 21.25ms | 26.70ms | -5.45ms | -20.41% |

