# Perf Suite — cli-app-scenario

Threshold source: [docs/quality/perf-thresholds.md](../../quality/perf-thresholds)

## Serial p95 (concurrency = 1)

| op | p95 | cap | gate | regression |
|---|---|---|---|---|
| init_workflow (3 fresh project scaffold) | 3.27ms | 500ms | PASS | stable |
| spec_to_test_batch (5 consecutive runSpecToTest) | 0.60ms | 300ms | PASS | stable |
| init_error_handling (3 InitConflictError catch) | 0.86ms | 500ms | PASS | stable |

## Concurrent p95 (concurrency = 4, 5 iter each)

| op | p95 | cap | gate |
|---|---|---|---|
| init_workflow (3 fresh project scaffold) | 10.19ms | 1000ms | PASS |
| spec_to_test_batch (5 consecutive runSpecToTest) | 2.12ms | 600ms | PASS |
| init_error_handling (3 InitConflictError catch) | 3.55ms | 1000ms | PASS |

## Memory retention (20 iter, arrayBuffers axis is the gate; heap is informational)

| op | heapUsed Δ | arrayBuffers Δ | cap | gc exposed | verdict |
|---|---|---|---|---|---|
| init_workflow (3 fresh project scaffold) | 3760 B | 0 B | 102400 B | yes | PASS |
| spec_to_test_batch (5 consecutive runSpecToTest) | -18160 B | 0 B | 102400 B | yes | PASS |
| init_error_handling (3 InitConflictError catch) | 912 B | 0 B | 102400 B | yes | PASS |

## Detailed serial reports

### init_workflow (3 fresh project scaffold)

# Perf Report — init_workflow (3 fresh project scaffold).serial

| metric | value |
|---|---|
| iterations | 20 |
| warmup | 3 |
| p50 | 2.52ms |
| p95 | 3.27ms |
| p99 | 3.89ms |
| mean | 2.59ms |
| stdev | 0.54ms |
| min | 1.82ms |
| max | 4.04ms |
| total | 51.82ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p50 | 2.52ms | 2.42ms | +0.09ms | +3.84% |
| p95 | 3.27ms | 3.28ms | -0.01ms | -0.20% |
| p99 | 3.89ms | 3.38ms | +0.51ms | +15.19% |
| mean | 2.59ms | 2.54ms | +0.05ms | +1.84% |
| min | 1.82ms | 2.03ms | -0.21ms | -10.30% |
| max | 4.04ms | 3.40ms | +0.64ms | +18.90% |
| total | 51.82ms | 50.88ms | +0.94ms | +1.84% |

### spec_to_test_batch (5 consecutive runSpecToTest)

# Perf Report — spec_to_test_batch (5 consecutive runSpecToTest).serial

| metric | value |
|---|---|
| iterations | 20 |
| warmup | 3 |
| p50 | 0.46ms |
| p95 | 0.60ms |
| p99 | 1.21ms |
| mean | 0.50ms |
| stdev | 0.21ms |
| min | 0.40ms |
| max | 1.36ms |
| total | 10.07ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p50 | 0.46ms | 0.45ms | +0.01ms | +3.32% |
| p95 | 0.60ms | 0.66ms | -0.06ms | -9.04% |
| p99 | 1.21ms | 0.77ms | +0.43ms | +55.66% |
| mean | 0.50ms | 0.49ms | +0.01ms | +2.96% |
| min | 0.40ms | 0.38ms | +0.02ms | +4.86% |
| max | 1.36ms | 0.80ms | +0.55ms | +68.96% |
| total | 10.07ms | 9.78ms | +0.29ms | +2.96% |

### init_error_handling (3 InitConflictError catch)

# Perf Report — init_error_handling (3 InitConflictError catch).serial

| metric | value |
|---|---|
| iterations | 20 |
| warmup | 3 |
| p50 | 0.69ms |
| p95 | 0.86ms |
| p99 | 0.93ms |
| mean | 0.71ms |
| stdev | 0.08ms |
| min | 0.61ms |
| max | 0.95ms |
| total | 14.22ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p50 | 0.69ms | 0.69ms | +0.00ms | +0.30% |
| p95 | 0.86ms | 0.90ms | -0.04ms | -4.70% |
| p99 | 0.93ms | 0.92ms | +0.01ms | +1.52% |
| mean | 0.71ms | 0.72ms | -0.01ms | -0.72% |
| min | 0.61ms | 0.60ms | +0.01ms | +2.05% |
| max | 0.95ms | 0.92ms | +0.03ms | +3.05% |
| total | 14.22ms | 14.33ms | -0.10ms | -0.72% |

