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
| renderAstroPage | 0.25ms | 10ms | PASS |
| invokeEndpoint | 0.11ms | 10ms | PASS |

## Memory retention (200 iter, arrayBuffers axis is the gate; heap is informational)

| op | heapUsed Δ | arrayBuffers Δ | cap | gc exposed | verdict |
|---|---|---|---|---|---|
| renderAstroPage | -107408 B | 0 B | 102400 B | yes | PASS |
| invokeEndpoint | -10008 B | 0 B | 102400 B | yes | PASS |

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
| total | 2.87ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p50 | 0.01ms | 0.01ms | -0.00ms | -0.92% |
| p95 | 0.03ms | 0.03ms | -0.00ms | -8.80% |
| p99 | 0.07ms | 0.07ms | +0.00ms | +0.86% |
| mean | 0.01ms | 0.01ms | -0.00ms | -0.81% |
| min | 0.01ms | 0.01ms | +0.00ms | +2.22% |
| max | 0.10ms | 0.10ms | -0.00ms | -1.58% |
| total | 2.87ms | 2.90ms | -0.02ms | -0.81% |

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
| stdev | 0.00ms |
| min | 0.01ms |
| max | 0.02ms |
| total | 1.63ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p50 | 0.01ms | 0.00ms | +0.00ms | +56.78% |
| p95 | 0.01ms | 0.01ms | +0.00ms | +30.28% |
| p99 | 0.02ms | 0.02ms | -0.00ms | -14.21% |
| mean | 0.01ms | 0.01ms | +0.00ms | +47.13% |
| min | 0.01ms | 0.00ms | +0.00ms | +60.89% |
| max | 0.02ms | 0.03ms | -0.01ms | -24.68% |
| total | 1.63ms | 1.11ms | +0.52ms | +47.13% |

