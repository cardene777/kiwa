# Perf Suite — e2e

Threshold source: [docs/quality/perf-thresholds.md](../../quality/perf-thresholds)

## Serial p95 (concurrency = 1)

| op | p95 | cap | gate | regression |
|---|---|---|---|---|
| fetchOverLoopback | 0.50ms | 20ms | PASS | stable |

## Concurrent p95 (concurrency = 4, 25 iter each)

| op | p95 | cap | gate |
|---|---|---|---|
| fetchOverLoopback | 0.94ms | 40ms | PASS |

## Memory retention (100 iter, arrayBuffers axis is the gate; heap is informational)

| op | heapUsed Δ | arrayBuffers Δ | cap | gc exposed | verdict |
|---|---|---|---|---|---|
| fetchOverLoopback | 232520 B | 0 B | 102400 B | yes | PASS |

## Detailed serial reports

### fetchOverLoopback

# Perf Report — fetchOverLoopback.serial

| metric | value |
|---|---|
| iterations | 100 |
| warmup | 3 |
| p50 | 0.20ms |
| p95 | 0.50ms |
| p99 | 0.86ms |
| mean | 0.26ms |
| stdev | 0.14ms |
| min | 0.16ms |
| max | 0.86ms |
| total | 25.94ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p50 | 0.20ms | 0.21ms | -0.02ms | -7.85% |
| p95 | 0.50ms | 0.57ms | -0.07ms | -12.18% |
| p99 | 0.86ms | 0.72ms | +0.13ms | +18.60% |
| mean | 0.26ms | 0.27ms | -0.01ms | -2.84% |
| min | 0.16ms | 0.16ms | -0.00ms | -0.74% |
| max | 0.86ms | 0.83ms | +0.03ms | +3.93% |
| total | 25.94ms | 26.70ms | -0.76ms | -2.84% |

