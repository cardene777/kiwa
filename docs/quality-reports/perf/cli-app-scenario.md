# Perf Suite — cli-app-scenario

Threshold source: [docs/quality/perf-thresholds.md](../../quality/perf-thresholds)

## Serial p95 (concurrency = 1)

| op | p95 | cap | gate | regression |
|---|---|---|---|---|
| init_workflow (3 fresh project scaffold) | 2.98ms | 500ms | PASS | stable |
| spec_to_test_batch (5 consecutive runSpecToTest) | 0.59ms | 300ms | PASS | stable |
| init_error_handling (3 InitConflictError catch) | 0.84ms | 500ms | PASS | stable |

## Concurrent p95 (concurrency = 4, 5 iter each)

| op | p95 | cap | gate |
|---|---|---|---|
| init_workflow (3 fresh project scaffold) | 30.19ms | 1000ms | PASS |
| spec_to_test_batch (5 consecutive runSpecToTest) | 2.23ms | 600ms | PASS |
| init_error_handling (3 InitConflictError catch) | 3.09ms | 1000ms | PASS |

## Memory retention (20 iter, arrayBuffers axis is the gate; heap is informational)

| op | heapUsed Δ | arrayBuffers Δ | cap | gc exposed | verdict |
|---|---|---|---|---|---|
| init_workflow (3 fresh project scaffold) | 5224 B | 0 B | 102400 B | yes | PASS |
| spec_to_test_batch (5 consecutive runSpecToTest) | -17976 B | 0 B | 102400 B | yes | PASS |
| init_error_handling (3 InitConflictError catch) | -432 B | 0 B | 102400 B | yes | PASS |

## Detailed serial reports

### init_workflow (3 fresh project scaffold)

# Perf Report — init_workflow (3 fresh project scaffold).serial

| metric | value |
|---|---|
| iterations | 20 |
| warmup | 3 |
| p50 | 2.49ms |
| p95 | 2.98ms |
| p99 | 3.45ms |
| mean | 2.46ms |
| stdev | 0.43ms |
| min | 1.83ms |
| max | 3.57ms |
| total | 49.14ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p50 | 2.49ms | 2.42ms | +0.07ms | +2.71% |
| p95 | 2.98ms | 3.28ms | -0.30ms | -9.20% |
| p99 | 3.45ms | 3.38ms | +0.08ms | +2.29% |
| mean | 2.46ms | 2.54ms | -0.09ms | -3.43% |
| min | 1.83ms | 2.03ms | -0.20ms | -9.92% |
| max | 3.57ms | 3.40ms | +0.17ms | +5.06% |
| total | 49.14ms | 50.88ms | -1.75ms | -3.43% |

### spec_to_test_batch (5 consecutive runSpecToTest)

# Perf Report — spec_to_test_batch (5 consecutive runSpecToTest).serial

| metric | value |
|---|---|
| iterations | 20 |
| warmup | 3 |
| p50 | 0.46ms |
| p95 | 0.59ms |
| p99 | 0.65ms |
| mean | 0.48ms |
| stdev | 0.06ms |
| min | 0.41ms |
| max | 0.66ms |
| total | 9.58ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p50 | 0.46ms | 0.45ms | +0.01ms | +2.83% |
| p95 | 0.59ms | 0.66ms | -0.07ms | -11.24% |
| p99 | 0.65ms | 0.77ms | -0.13ms | -16.66% |
| mean | 0.48ms | 0.49ms | -0.01ms | -2.05% |
| min | 0.41ms | 0.38ms | +0.03ms | +6.82% |
| max | 0.66ms | 0.80ms | -0.14ms | -17.77% |
| total | 9.58ms | 9.78ms | -0.20ms | -2.05% |

### init_error_handling (3 InitConflictError catch)

# Perf Report — init_error_handling (3 InitConflictError catch).serial

| metric | value |
|---|---|
| iterations | 20 |
| warmup | 3 |
| p50 | 0.67ms |
| p95 | 0.84ms |
| p99 | 0.96ms |
| mean | 0.69ms |
| stdev | 0.10ms |
| min | 0.58ms |
| max | 0.99ms |
| total | 13.76ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p50 | 0.67ms | 0.69ms | -0.02ms | -2.49% |
| p95 | 0.84ms | 0.90ms | -0.07ms | -7.26% |
| p99 | 0.96ms | 0.92ms | +0.05ms | +4.95% |
| mean | 0.69ms | 0.72ms | -0.03ms | -3.95% |
| min | 0.58ms | 0.60ms | -0.02ms | -3.41% |
| max | 0.99ms | 0.92ms | +0.07ms | +7.96% |
| total | 13.76ms | 14.33ms | -0.57ms | -3.95% |

