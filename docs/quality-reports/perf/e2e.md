# Perf Suite — e2e

Threshold source: [docs/quality/perf-thresholds.md](../../quality/perf-thresholds)

## Serial p95 (concurrency = 1)

| op | p95 | cap | gate | regression |
|---|---|---|---|---|
| fetchOverLoopback | 0.92ms | 20ms | PASS | stable |

## Concurrent p95 (concurrency = 4, 25 iter each)

| op | p95 | cap | gate |
|---|---|---|---|
| fetchOverLoopback | 2.07ms | 40ms | PASS |

## Memory retention (100 iter, arrayBuffers axis is the gate; heap is informational)

| op | heapUsed Δ | arrayBuffers Δ | cap | gc exposed | verdict |
|---|---|---|---|---|---|
| fetchOverLoopback | 235376 B | 0 B | 102400 B | yes | PASS |

## Detailed serial reports

### fetchOverLoopback

# Perf Report — fetchOverLoopback.serial

| metric | value |
|---|---|
| iterations | 100 |
| warmup | 3 |
| p50 | 0.21ms |
| p95 | 0.92ms |
| p99 | 1.45ms |
| mean | 0.34ms |
| stdev | 0.29ms |
| min | 0.15ms |
| max | 1.82ms |
| total | 34.19ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p50 | 0.21ms | 0.21ms | -0.01ms | -2.96% |
| p95 | 0.92ms | 0.57ms | +0.35ms | +60.75% |
| p99 | 1.45ms | 0.72ms | +0.72ms | +100.02% |
| mean | 0.34ms | 0.27ms | +0.07ms | +28.05% |
| min | 0.15ms | 0.16ms | -0.01ms | -7.05% |
| max | 1.82ms | 0.83ms | +0.99ms | +119.55% |
| total | 34.19ms | 26.70ms | +7.49ms | +28.05% |

