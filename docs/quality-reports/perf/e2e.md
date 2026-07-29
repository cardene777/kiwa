# Perf Suite — e2e

Threshold source: [docs/quality/perf-thresholds.md](../../quality/perf-thresholds)

## Serial p95 (concurrency = 1)

| op | p95 | cap | gate | regression |
|---|---|---|---|---|
| fetchOverLoopback | 1.34ms | 20ms | PASS | regressed — gate 無効 (regressionGate=false) |

## Concurrent p95 (concurrency = 4, 25 iter each)

| op | p95 | cap | gate |
|---|---|---|---|
| fetchOverLoopback | 4.41ms | 40ms | PASS |

## Memory retention (100 iter, arrayBuffers axis is the gate; heap is informational)

| op | heapUsed Δ | arrayBuffers Δ | cap | gc exposed | verdict |
|---|---|---|---|---|---|
| fetchOverLoopback | 207216 B | 0 B | 102400 B | yes | PASS |

## Detailed serial reports

### fetchOverLoopback

# Perf Report — fetchOverLoopback.serial

| metric | value |
|---|---|
| iterations | 100 |
| warmup | 3 |
| p50 | 0.39ms |
| p95 | 1.34ms |
| p99 | 2.43ms |
| mean | 0.58ms |
| stdev | 0.50ms |
| min | 0.18ms |
| max | 3.12ms |
| total | 57.76ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p50 | 0.39ms | 0.21ms | +0.19ms | +88.59% |
| p95 | 1.34ms | 0.83ms | +0.51ms | +62.36% |
| p99 | 2.43ms | 1.14ms | +1.30ms | +113.73% |
| mean | 0.58ms | 0.32ms | +0.26ms | +80.43% |
| min | 0.18ms | 0.15ms | +0.03ms | +19.31% |
| max | 3.12ms | 1.53ms | +1.59ms | +103.86% |
| total | 57.76ms | 32.01ms | +25.75ms | +80.43% |

