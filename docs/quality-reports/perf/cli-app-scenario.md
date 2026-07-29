# Perf Suite — cli-app-scenario

Threshold source: [docs/quality/perf-thresholds.md](../../quality/perf-thresholds)

## Serial p95 (concurrency = 1)

| op | p95 | cap | gate | regression |
|---|---|---|---|---|
| init_workflow (3 fresh project scaffold) | 12.16ms | 500ms | PASS | stable — gate 無効 (regressionGate=false) |
| spec_to_test_batch (5 consecutive runSpecToTest) | 2.27ms | 300ms | PASS | stable — gate 無効 (regressionGate=false) |
| init_error_handling (3 InitConflictError catch) | 2.67ms | 500ms | PASS | stable — gate 無効 (regressionGate=false) |

## Concurrent p95 (concurrency = 4, 5 iter each)

| op | p95 | cap | gate |
|---|---|---|---|
| init_workflow (3 fresh project scaffold) | 40.70ms | 1000ms | PASS |
| spec_to_test_batch (5 consecutive runSpecToTest) | 8.34ms | 600ms | PASS |
| init_error_handling (3 InitConflictError catch) | 6.34ms | 1000ms | PASS |

## Memory retention (20 iter, arrayBuffers axis is the gate; heap is informational)

| op | heapUsed Δ | arrayBuffers Δ | cap | gc exposed | verdict |
|---|---|---|---|---|---|
| init_workflow (3 fresh project scaffold) | 6080 B | 0 B | 102400 B | yes | PASS |
| spec_to_test_batch (5 consecutive runSpecToTest) | -17936 B | 0 B | 102400 B | yes | PASS |
| init_error_handling (3 InitConflictError catch) | 5464 B | 0 B | 102400 B | yes | PASS |

## Detailed serial reports

### init_workflow (3 fresh project scaffold)

# Perf Report — init_workflow (3 fresh project scaffold).serial

| metric | value |
|---|---|
| iterations | 20 |
| warmup | 3 |
| p50 | 3.25ms |
| p95 | 12.16ms |
| p99 | 41.27ms |
| mean | 6.01ms |
| stdev | 10.16ms |
| min | 2.18ms |
| max | 48.55ms |
| total | 120.17ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p50 | 3.25ms | 3.21ms | +0.04ms | +1.25% |
| p95 | 12.16ms | 7.34ms | +4.82ms | +65.58% |
| p99 | 41.27ms | 18.87ms | +22.40ms | +118.68% |
| mean | 6.01ms | 3.90ms | +2.11ms | +54.15% |
| min | 2.18ms | 1.87ms | +0.31ms | +16.70% |
| max | 48.55ms | 24.60ms | +23.94ms | +97.32% |
| total | 120.17ms | 779.57ms | -659.39ms | -84.58% |

### spec_to_test_batch (5 consecutive runSpecToTest)

# Perf Report — spec_to_test_batch (5 consecutive runSpecToTest).serial

| metric | value |
|---|---|
| iterations | 20 |
| warmup | 3 |
| p50 | 0.64ms |
| p95 | 2.27ms |
| p99 | 2.46ms |
| mean | 0.97ms |
| stdev | 0.64ms |
| min | 0.50ms |
| max | 2.51ms |
| total | 19.40ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p50 | 0.64ms | 0.55ms | +0.09ms | +15.88% |
| p95 | 2.27ms | 1.93ms | +0.34ms | +17.35% |
| p99 | 2.46ms | 2.98ms | -0.52ms | -17.53% |
| mean | 0.97ms | 0.82ms | +0.15ms | +17.74% |
| min | 0.50ms | 0.42ms | +0.08ms | +18.09% |
| max | 2.51ms | 6.47ms | -3.97ms | -61.28% |
| total | 19.40ms | 164.78ms | -145.37ms | -88.23% |

### init_error_handling (3 InitConflictError catch)

# Perf Report — init_error_handling (3 InitConflictError catch).serial

| metric | value |
|---|---|
| iterations | 20 |
| warmup | 3 |
| p50 | 1.57ms |
| p95 | 2.67ms |
| p99 | 3.01ms |
| mean | 1.61ms |
| stdev | 0.68ms |
| min | 0.86ms |
| max | 3.10ms |
| total | 32.29ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p50 | 1.57ms | 1.04ms | +0.53ms | +50.93% |
| p95 | 2.67ms | 2.59ms | +0.07ms | +2.75% |
| p99 | 3.01ms | 4.14ms | -1.13ms | -27.30% |
| mean | 1.61ms | 1.28ms | +0.33ms | +26.12% |
| min | 0.86ms | 0.53ms | +0.32ms | +59.91% |
| max | 3.10ms | 4.80ms | -1.70ms | -35.37% |
| total | 32.29ms | 256.05ms | -223.76ms | -87.39% |

