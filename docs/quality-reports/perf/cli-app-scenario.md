# Perf Suite — cli-app-scenario

Threshold source: [docs/quality/perf-thresholds.md](../../quality/perf-thresholds)

## Serial p95 (concurrency = 1)

| op | p95 | cap | gate | regression |
|---|---|---|---|---|
| init_workflow (3 fresh project scaffold) | 2.77ms | 500ms | PASS | stable |
| spec_to_test_batch (5 consecutive runSpecToTest) | 0.64ms | 300ms | PASS | stable |
| init_error_handling (3 InitConflictError catch) | 0.78ms | 500ms | PASS | stable |

## Concurrent p95 (concurrency = 4, 5 iter each)

| op | p95 | cap | gate |
|---|---|---|---|
| init_workflow (3 fresh project scaffold) | 9.20ms | 1000ms | PASS |
| spec_to_test_batch (5 consecutive runSpecToTest) | 2.11ms | 600ms | PASS |
| init_error_handling (3 InitConflictError catch) | 2.73ms | 1000ms | PASS |

## Memory retention (20 iter, arrayBuffers axis is the gate; heap is informational)

| op | heapUsed Δ | arrayBuffers Δ | cap | verdict |
|---|---|---|---|---|
| init_workflow (3 fresh project scaffold) | 1925032 B | 0 B | 102400 B | PASS |
| spec_to_test_batch (5 consecutive runSpecToTest) | 1239760 B | 0 B | 102400 B | PASS |
| init_error_handling (3 InitConflictError catch) | 943320 B | 0 B | 102400 B | PASS |

## Detailed serial reports

### init_workflow (3 fresh project scaffold)

# Perf Report — init_workflow (3 fresh project scaffold).serial

| metric | value |
|---|---|
| iterations | 20 |
| warmup | 3 |
| p50 | 2.44ms |
| p95 | 2.77ms |
| p99 | 2.83ms |
| mean | 2.45ms |
| stdev | 0.22ms |
| min | 2.09ms |
| max | 2.85ms |
| total | 49.01ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p50 | 2.44ms | 2.21ms | +0.22ms | +10.06% |
| p95 | 2.77ms | 2.54ms | +0.23ms | +9.07% |
| p99 | 2.83ms | 2.55ms | +0.28ms | +11.13% |
| mean | 2.45ms | 2.15ms | +0.30ms | +13.94% |
| min | 2.09ms | 1.69ms | +0.40ms | +23.62% |
| max | 2.85ms | 2.55ms | +0.30ms | +11.64% |
| total | 49.01ms | 43.01ms | +6.00ms | +13.94% |

### spec_to_test_batch (5 consecutive runSpecToTest)

# Perf Report — spec_to_test_batch (5 consecutive runSpecToTest).serial

| metric | value |
|---|---|
| iterations | 20 |
| warmup | 3 |
| p50 | 0.46ms |
| p95 | 0.64ms |
| p99 | 0.65ms |
| mean | 0.49ms |
| stdev | 0.09ms |
| min | 0.39ms |
| max | 0.66ms |
| total | 9.80ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p50 | 0.46ms | 0.41ms | +0.05ms | +13.40% |
| p95 | 0.64ms | 0.67ms | -0.03ms | -4.44% |
| p99 | 0.65ms | 0.70ms | -0.05ms | -6.47% |
| mean | 0.49ms | 0.45ms | +0.04ms | +9.46% |
| min | 0.39ms | 0.36ms | +0.02ms | +6.82% |
| max | 0.66ms | 0.71ms | -0.05ms | -6.95% |
| total | 9.80ms | 8.95ms | +0.85ms | +9.46% |

### init_error_handling (3 InitConflictError catch)

# Perf Report — init_error_handling (3 InitConflictError catch).serial

| metric | value |
|---|---|
| iterations | 20 |
| warmup | 3 |
| p50 | 0.61ms |
| p95 | 0.78ms |
| p99 | 0.82ms |
| mean | 0.63ms |
| stdev | 0.08ms |
| min | 0.50ms |
| max | 0.83ms |
| total | 12.65ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p50 | 0.61ms | 0.64ms | -0.03ms | -4.21% |
| p95 | 0.78ms | 0.77ms | +0.01ms | +0.72% |
| p99 | 0.82ms | 0.79ms | +0.03ms | +4.07% |
| mean | 0.63ms | 0.65ms | -0.02ms | -3.41% |
| min | 0.50ms | 0.56ms | -0.06ms | -10.66% |
| max | 0.83ms | 0.79ms | +0.04ms | +4.88% |
| total | 12.65ms | 13.10ms | -0.45ms | -3.41% |

