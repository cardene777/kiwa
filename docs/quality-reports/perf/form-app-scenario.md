# Perf Suite — form-app-scenario

Threshold source: [docs/quality/perf-thresholds.md](../../quality/perf-thresholds)

## Serial p95 (concurrency = 1)

| op | p95 | cap | gate | regression |
|---|---|---|---|---|
| signup_workflow (10 register+submit cycle) | 0.12ms | 100ms | PASS | improved |
| multi_field_validate_batch (5 provider-mixed validate) | 0.01ms | 100ms | PASS | stable |
| submit_error_handling (5 required-missing → onError catch) | 0.09ms | 100ms | PASS | stable |

## Concurrent p95 (concurrency = 4, 5 iter each)

| op | p95 | cap | gate |
|---|---|---|---|
| signup_workflow (10 register+submit cycle) | 0.35ms | 200ms | PASS |
| multi_field_validate_batch (5 provider-mixed validate) | 0.01ms | 200ms | PASS |
| submit_error_handling (5 required-missing → onError catch) | 0.12ms | 200ms | PASS |

## Memory retention (20 iter, arrayBuffers axis is the gate; heap is informational)

| op | heapUsed Δ | arrayBuffers Δ | cap | verdict |
|---|---|---|---|---|
| signup_workflow (10 register+submit cycle) | -6110496 B | -10545 B | 102400 B | PASS |
| multi_field_validate_batch (5 provider-mixed validate) | 387456 B | 0 B | 102400 B | PASS |
| submit_error_handling (5 required-missing → onError catch) | 1167680 B | 0 B | 102400 B | PASS |

## Detailed serial reports

### signup_workflow (10 register+submit cycle)

# Perf Report — signup_workflow (10 register+submit cycle).serial

| metric | value |
|---|---|
| iterations | 20 |
| warmup | 3 |
| p50 | 0.08ms |
| p95 | 0.12ms |
| p99 | 0.16ms |
| mean | 0.09ms |
| stdev | 0.02ms |
| min | 0.07ms |
| max | 0.17ms |
| total | 1.79ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p50 | 0.08ms | 0.14ms | -0.06ms | -41.75% |
| p95 | 0.12ms | 0.21ms | -0.09ms | -41.60% |
| p99 | 0.16ms | 0.23ms | -0.07ms | -29.83% |
| mean | 0.09ms | 0.15ms | -0.06ms | -41.22% |
| min | 0.07ms | 0.09ms | -0.02ms | -26.45% |
| max | 0.17ms | 0.24ms | -0.07ms | -27.25% |
| total | 1.79ms | 3.04ms | -1.25ms | -41.22% |

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
| total | 0.06ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p50 | 0.00ms | 0.00ms | -0.00ms | -26.57% |
| p95 | 0.01ms | 0.00ms | +0.00ms | +39.75% |
| p99 | 0.01ms | 0.01ms | +0.00ms | +30.97% |
| mean | 0.00ms | 0.00ms | -0.00ms | -15.79% |
| min | 0.00ms | 0.00ms | -0.00ms | -25.34% |
| max | 0.01ms | 0.01ms | +0.00ms | +29.61% |
| total | 0.06ms | 0.07ms | -0.01ms | -15.79% |

### submit_error_handling (5 required-missing → onError catch)

# Perf Report — submit_error_handling (5 required-missing → onError catch).serial

| metric | value |
|---|---|
| iterations | 20 |
| warmup | 3 |
| p50 | 0.02ms |
| p95 | 0.09ms |
| p99 | 0.19ms |
| mean | 0.04ms |
| stdev | 0.04ms |
| min | 0.02ms |
| max | 0.21ms |
| total | 0.78ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p50 | 0.02ms | 0.06ms | -0.03ms | -57.23% |
| p95 | 0.09ms | 0.09ms | +0.00ms | +2.60% |
| p99 | 0.19ms | 0.09ms | +0.10ms | +103.64% |
| mean | 0.04ms | 0.06ms | -0.02ms | -31.06% |
| min | 0.02ms | 0.03ms | -0.00ms | -12.93% |
| max | 0.21ms | 0.09ms | +0.12ms | +127.22% |
| total | 0.78ms | 1.14ms | -0.35ms | -31.06% |

