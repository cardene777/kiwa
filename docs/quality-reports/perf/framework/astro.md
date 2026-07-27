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
| invokeEndpoint | 0.06ms | 10ms | PASS |

## Memory retention (200 iter, arrayBuffers axis is the gate; heap is informational)

| op | heapUsed Δ | arrayBuffers Δ | cap | gc exposed | verdict |
|---|---|---|---|---|---|
| renderAstroPage | 40168 B | 0 B | 102400 B | yes | PASS |
| invokeEndpoint | -121144 B | 0 B | 102400 B | yes | PASS |

## Detailed serial reports

### renderAstroPage

# Perf Report — renderAstroPage.serial

| metric | value |
|---|---|
| iterations | 200 |
| warmup | 5 |
| p50 | 0.01ms |
| p95 | 0.03ms |
| p99 | 0.07ms |
| mean | 0.01ms |
| stdev | 0.01ms |
| min | 0.01ms |
| max | 0.10ms |
| total | 2.88ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p50 | 0.01ms | 0.01ms | -0.00ms | -0.92% |
| p95 | 0.03ms | 0.03ms | -0.00ms | -8.65% |
| p99 | 0.07ms | 0.07ms | -0.00ms | -0.54% |
| mean | 0.01ms | 0.01ms | -0.00ms | -0.47% |
| min | 0.01ms | 0.01ms | -0.00ms | -0.89% |
| max | 0.10ms | 0.10ms | +0.00ms | +4.71% |
| total | 2.88ms | 2.90ms | -0.01ms | -0.47% |

### invokeEndpoint

# Perf Report — invokeEndpoint.serial

| metric | value |
|---|---|
| iterations | 200 |
| warmup | 5 |
| p50 | 0.00ms |
| p95 | 0.01ms |
| p99 | 0.01ms |
| mean | 0.01ms |
| stdev | 0.00ms |
| min | 0.00ms |
| max | 0.02ms |
| total | 1.07ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p50 | 0.00ms | 0.00ms | -0.00ms | -2.98% |
| p95 | 0.01ms | 0.01ms | -0.00ms | -7.72% |
| p99 | 0.01ms | 0.02ms | -0.01ms | -28.40% |
| mean | 0.01ms | 0.01ms | -0.00ms | -3.41% |
| min | 0.00ms | 0.00ms | -0.00ms | -4.56% |
| max | 0.02ms | 0.03ms | -0.01ms | -32.67% |
| total | 1.07ms | 1.11ms | -0.04ms | -3.41% |

