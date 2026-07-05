# Perf Suite — astro

Threshold source: [docs/quality/perf-thresholds.md](../../quality/perf-thresholds)

## Serial p95 (concurrency = 1)

| op | p95 | cap | gate | regression |
|---|---|---|---|---|
| renderAstroPage | 0.03ms | 5ms | PASS | stable |
| invokeEndpoint | 0.01ms | 5ms | PASS | stable |

## Concurrent p95 (concurrency = 10, 50 iter each)

| op | p95 | cap | gate |
|---|---|---|---|
| renderAstroPage | 0.17ms | 10ms | PASS |
| invokeEndpoint | 0.58ms | 10ms | PASS |

## Memory retention (200 iter, arrayBuffers axis is the gate; heap is informational)

| op | heapUsed Δ | arrayBuffers Δ | cap | verdict |
|---|---|---|---|---|
| renderAstroPage | 3069456 B | 2800 B | 102400 B | PASS |
| invokeEndpoint | 2687304 B | 2200 B | 102400 B | PASS |

## Detailed serial reports

### renderAstroPage

# Perf Report — renderAstroPage.serial

| metric | value |
|---|---|
| iterations | 200 |
| warmup | 5 |
| p50 | 0.01ms |
| p95 | 0.03ms |
| p99 | 0.08ms |
| mean | 0.02ms |
| stdev | 0.01ms |
| min | 0.01ms |
| max | 0.12ms |
| total | 3.49ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p50 | 0.01ms | 0.01ms | +0.00ms | +17.16% |
| p95 | 0.03ms | 0.03ms | -0.00ms | -1.78% |
| p99 | 0.08ms | 0.10ms | -0.03ms | -26.03% |
| mean | 0.02ms | 0.02ms | +0.00ms | +2.51% |
| min | 0.01ms | 0.01ms | +0.00ms | +12.92% |
| max | 0.12ms | 0.19ms | -0.07ms | -37.90% |
| total | 3.49ms | 3.40ms | +0.09ms | +2.51% |

### invokeEndpoint

# Perf Report — invokeEndpoint.serial

| metric | value |
|---|---|
| iterations | 200 |
| warmup | 5 |
| p50 | 0.01ms |
| p95 | 0.01ms |
| p99 | 0.05ms |
| mean | 0.02ms |
| stdev | 0.22ms |
| min | 0.01ms |
| max | 3.06ms |
| total | 4.76ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p50 | 0.01ms | 0.01ms | +0.00ms | +5.54% |
| p95 | 0.01ms | 0.01ms | +0.00ms | +34.75% |
| p99 | 0.05ms | 0.02ms | +0.03ms | +140.36% |
| mean | 0.02ms | 0.01ms | +0.02ms | +224.77% |
| min | 0.01ms | 0.00ms | +0.00ms | +7.89% |
| max | 3.06ms | 0.26ms | +2.79ms | +1053.77% |
| total | 4.76ms | 1.46ms | +3.29ms | +224.77% |

