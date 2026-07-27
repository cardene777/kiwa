# Perf Suite — cli-app-scenario

Threshold source: [docs/quality/perf-thresholds.md](../../quality/perf-thresholds)

## Serial p95 (concurrency = 1)

| op | p95 | cap | gate | regression |
|---|---|---|---|---|
| init_workflow (3 fresh project scaffold) | 3.08ms | 500ms | PASS | stable |
| spec_to_test_batch (5 consecutive runSpecToTest) | 0.83ms | 300ms | PASS | stable |
| init_error_handling (3 InitConflictError catch) | 1.05ms | 500ms | PASS | stable |

## Concurrent p95 (concurrency = 4, 5 iter each)

| op | p95 | cap | gate |
|---|---|---|---|
| init_workflow (3 fresh project scaffold) | 10.65ms | 1000ms | PASS |
| spec_to_test_batch (5 consecutive runSpecToTest) | 2.54ms | 600ms | PASS |
| init_error_handling (3 InitConflictError catch) | 3.61ms | 1000ms | PASS |

## Memory retention (20 iter, arrayBuffers axis is the gate; heap is informational)

| op | heapUsed Δ | arrayBuffers Δ | cap | gc exposed | verdict |
|---|---|---|---|---|---|
| init_workflow (3 fresh project scaffold) | 6296 B | 0 B | 102400 B | yes | PASS |
| spec_to_test_batch (5 consecutive runSpecToTest) | -17008 B | 0 B | 102400 B | yes | PASS |
| init_error_handling (3 InitConflictError catch) | -464 B | 0 B | 102400 B | yes | PASS |

## Detailed serial reports

### init_workflow (3 fresh project scaffold)

# Perf Report — init_workflow (3 fresh project scaffold).serial

| metric | value |
|---|---|
| iterations | 20 |
| warmup | 3 |
| p50 | 2.67ms |
| p95 | 3.08ms |
| p99 | 3.24ms |
| mean | 2.66ms |
| stdev | 0.29ms |
| min | 2.17ms |
| max | 3.28ms |
| total | 53.20ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p50 | 2.67ms | 2.42ms | +0.25ms | +10.35% |
| p95 | 3.08ms | 3.28ms | -0.20ms | -6.07% |
| p99 | 3.24ms | 3.38ms | -0.13ms | -3.91% |
| mean | 2.66ms | 2.54ms | +0.12ms | +4.55% |
| min | 2.17ms | 2.03ms | +0.14ms | +6.72% |
| max | 3.28ms | 3.40ms | -0.12ms | -3.39% |
| total | 53.20ms | 50.88ms | +2.31ms | +4.55% |

### spec_to_test_batch (5 consecutive runSpecToTest)

# Perf Report — spec_to_test_batch (5 consecutive runSpecToTest).serial

| metric | value |
|---|---|
| iterations | 20 |
| warmup | 3 |
| p50 | 0.60ms |
| p95 | 0.83ms |
| p99 | 1.00ms |
| mean | 0.62ms |
| stdev | 0.13ms |
| min | 0.47ms |
| max | 1.04ms |
| total | 12.33ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p50 | 0.60ms | 0.45ms | +0.15ms | +33.38% |
| p95 | 0.83ms | 0.66ms | +0.17ms | +25.94% |
| p99 | 1.00ms | 0.77ms | +0.22ms | +28.98% |
| mean | 0.62ms | 0.49ms | +0.13ms | +26.05% |
| min | 0.47ms | 0.38ms | +0.09ms | +23.88% |
| max | 1.04ms | 0.80ms | +0.24ms | +29.61% |
| total | 12.33ms | 9.78ms | +2.55ms | +26.05% |

### init_error_handling (3 InitConflictError catch)

# Perf Report — init_error_handling (3 InitConflictError catch).serial

| metric | value |
|---|---|
| iterations | 20 |
| warmup | 3 |
| p50 | 0.81ms |
| p95 | 1.05ms |
| p99 | 1.07ms |
| mean | 0.83ms |
| stdev | 0.11ms |
| min | 0.69ms |
| max | 1.08ms |
| total | 16.65ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p50 | 0.81ms | 0.69ms | +0.12ms | +17.99% |
| p95 | 1.05ms | 0.90ms | +0.14ms | +15.63% |
| p99 | 1.07ms | 0.92ms | +0.16ms | +17.02% |
| mean | 0.83ms | 0.72ms | +0.12ms | +16.18% |
| min | 0.69ms | 0.60ms | +0.10ms | +15.91% |
| max | 1.08ms | 0.92ms | +0.16ms | +17.37% |
| total | 16.65ms | 14.33ms | +2.32ms | +16.18% |

