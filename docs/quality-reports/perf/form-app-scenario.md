# Perf Suite — form-app-scenario

Threshold source: [docs/quality/perf-thresholds.md](../../quality/perf-thresholds)

## Serial p95 (concurrency = 1)

| op | p95 | cap | gate | regression |
|---|---|---|---|---|
| signup_workflow (10 register+submit cycle) | 0.09ms | 100ms | PASS | stable |
| multi_field_validate_batch (5 provider-mixed validate) | 0.01ms | 100ms | PASS | stable |
| submit_error_handling (5 required-missing → onError catch) | 0.03ms | 100ms | PASS | stable |

## Concurrent p95 (concurrency = 4, 5 iter each)

| op | p95 | cap | gate |
|---|---|---|---|
| signup_workflow (10 register+submit cycle) | 0.33ms | 200ms | PASS |
| multi_field_validate_batch (5 provider-mixed validate) | 0.01ms | 200ms | PASS |
| submit_error_handling (5 required-missing → onError catch) | 0.17ms | 200ms | PASS |

## Memory retention (20 iter, arrayBuffers axis is the gate; heap is informational)

| op | heapUsed Δ | arrayBuffers Δ | cap | gc exposed | verdict |
|---|---|---|---|---|---|
| signup_workflow (10 register+submit cycle) | 59328 B | 0 B | 102400 B | yes | PASS |
| multi_field_validate_batch (5 provider-mixed validate) | 5896 B | 0 B | 102400 B | yes | PASS |
| submit_error_handling (5 required-missing → onError catch) | 5720 B | 0 B | 102400 B | yes | PASS |

## Detailed serial reports

### signup_workflow (10 register+submit cycle)

# Perf Report — signup_workflow (10 register+submit cycle).serial

| metric | value |
|---|---|
| iterations | 20 |
| warmup | 3 |
| p50 | 0.07ms |
| p95 | 0.09ms |
| p99 | 0.09ms |
| mean | 0.08ms |
| stdev | 0.01ms |
| min | 0.06ms |
| max | 0.09ms |
| total | 1.52ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p50 | 0.07ms | 0.08ms | -0.00ms | -3.02% |
| p95 | 0.09ms | 0.28ms | -0.20ms | -68.72% |
| p99 | 0.09ms | 0.34ms | -0.25ms | -73.81% |
| mean | 0.08ms | 0.11ms | -0.04ms | -31.51% |
| min | 0.06ms | 0.07ms | -0.00ms | -4.68% |
| max | 0.09ms | 0.36ms | -0.27ms | -74.82% |
| total | 1.52ms | 2.22ms | -0.70ms | -31.51% |

### multi_field_validate_batch (5 provider-mixed validate)

# Perf Report — multi_field_validate_batch (5 provider-mixed validate).serial

| metric | value |
|---|---|
| iterations | 20 |
| warmup | 3 |
| p50 | 0.00ms |
| p95 | 0.01ms |
| p99 | 0.01ms |
| mean | 0.00ms |
| stdev | 0.00ms |
| min | 0.00ms |
| max | 0.01ms |
| total | 0.07ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p50 | 0.00ms | 0.00ms | -0.00ms | -10.70% |
| p95 | 0.01ms | 0.00ms | +0.00ms | +69.57% |
| p99 | 0.01ms | 0.01ms | +0.00ms | +76.71% |
| mean | 0.00ms | 0.00ms | +0.00ms | +9.07% |
| min | 0.00ms | 0.00ms | -0.00ms | -16.17% |
| max | 0.01ms | 0.01ms | +0.00ms | +77.92% |
| total | 0.07ms | 0.06ms | +0.01ms | +9.07% |

### submit_error_handling (5 required-missing → onError catch)

# Perf Report — submit_error_handling (5 required-missing → onError catch).serial

| metric | value |
|---|---|
| iterations | 20 |
| warmup | 3 |
| p50 | 0.02ms |
| p95 | 0.03ms |
| p99 | 0.03ms |
| mean | 0.03ms |
| stdev | 0.00ms |
| min | 0.02ms |
| max | 0.03ms |
| total | 0.50ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p50 | 0.02ms | 0.04ms | -0.02ms | -46.12% |
| p95 | 0.03ms | 0.06ms | -0.03ms | -43.68% |
| p99 | 0.03ms | 0.06ms | -0.03ms | -42.93% |
| mean | 0.03ms | 0.04ms | -0.02ms | -41.45% |
| min | 0.02ms | 0.03ms | -0.01ms | -26.00% |
| max | 0.03ms | 0.06ms | -0.03ms | -42.74% |
| total | 0.50ms | 0.86ms | -0.35ms | -41.45% |

