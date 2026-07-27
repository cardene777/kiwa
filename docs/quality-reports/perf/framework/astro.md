# Perf Suite — astro

Threshold source: [docs/quality/perf-thresholds.md](../../../quality/perf-thresholds)

## Serial p95 (concurrency = 1)

| op | p95 | cap | gate | regression |
|---|---|---|---|---|
| renderAstroPage | 0.03ms | 5ms | PASS | stable |
| invokeEndpoint | 0.01ms | 5ms | PASS | stable |

## Concurrent p95 (concurrency = 10, 50 iter each)

| op | p95 | cap | gate |
|---|---|---|---|
| renderAstroPage | 0.13ms | 10ms | PASS |
| invokeEndpoint | 0.09ms | 10ms | PASS |

## Memory retention (200 iter, arrayBuffers axis is the gate; heap is informational)

| op | heapUsed Δ | arrayBuffers Δ | cap | gc exposed | verdict |
|---|---|---|---|---|---|
| renderAstroPage | -4384 B | -28 B | 102400 B | yes | PASS |
| invokeEndpoint | -7880 B | 0 B | 102400 B | yes | PASS |

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
| max | 0.09ms |
| total | 2.90ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p50 | 0.01ms | 0.01ms | -0.00ms | -0.55% |
| p95 | 0.03ms | 0.03ms | -0.00ms | -4.87% |
| p99 | 0.07ms | 0.07ms | +0.00ms | +0.60% |
| mean | 0.01ms | 0.01ms | +0.00ms | +0.10% |
| min | 0.01ms | 0.01ms | -0.00ms | -1.78% |
| max | 0.09ms | 0.10ms | -0.00ms | -2.65% |
| total | 2.90ms | 2.90ms | +0.00ms | +0.10% |

### invokeEndpoint

# Perf Report — invokeEndpoint.serial

| metric | value |
|---|---|
| iterations | 200 |
| warmup | 5 |
| p50 | 0.01ms |
| p95 | 0.01ms |
| p99 | 0.02ms |
| mean | 0.01ms |
| stdev | 0.01ms |
| min | 0.01ms |
| max | 0.07ms |
| total | 1.73ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p50 | 0.01ms | 0.00ms | +0.00ms | +57.62% |
| p95 | 0.01ms | 0.01ms | +0.00ms | +36.17% |
| p99 | 0.02ms | 0.02ms | +0.01ms | +31.10% |
| mean | 0.01ms | 0.01ms | +0.00ms | +56.00% |
| min | 0.01ms | 0.00ms | +0.00ms | +59.05% |
| max | 0.07ms | 0.03ms | +0.04ms | +141.80% |
| total | 1.73ms | 1.11ms | +0.62ms | +56.00% |

