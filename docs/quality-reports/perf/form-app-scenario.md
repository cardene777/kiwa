# Perf Suite — form-app-scenario

Threshold source: [docs/quality/perf-thresholds.md](../../quality/perf-thresholds)

## Serial p95 (concurrency = 1)

| op | p95 | cap | gate | regression |
|---|---|---|---|---|
| signup_workflow (10 register+submit cycle) | 0.09ms | 100ms | PASS | stable |
| multi_field_validate_batch (5 provider-mixed validate) | 0.00ms | 100ms | PASS | stable |
| submit_error_handling (5 required-missing → onError catch) | 0.04ms | 100ms | PASS | stable |

## Concurrent p95 (concurrency = 4, 5 iter each)

| op | p95 | cap | gate |
|---|---|---|---|
| signup_workflow (10 register+submit cycle) | 0.37ms | 200ms | PASS |
| multi_field_validate_batch (5 provider-mixed validate) | 0.01ms | 200ms | PASS |
| submit_error_handling (5 required-missing → onError catch) | 0.10ms | 200ms | PASS |

## Memory retention (20 iter, arrayBuffers axis is the gate; heap is informational)

| op | heapUsed Δ | arrayBuffers Δ | cap | gc exposed | verdict |
|---|---|---|---|---|---|
| signup_workflow (10 register+submit cycle) | 51048 B | 0 B | 102400 B | yes | PASS |
| multi_field_validate_batch (5 provider-mixed validate) | 2016 B | 0 B | 102400 B | yes | PASS |
| submit_error_handling (5 required-missing → onError catch) | 4968 B | 0 B | 102400 B | yes | PASS |

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
| mean | 0.07ms |
| stdev | 0.01ms |
| min | 0.06ms |
| max | 0.09ms |
| total | 1.48ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p50 | 0.07ms | 0.08ms | -0.00ms | -3.46% |
| p95 | 0.09ms | 0.28ms | -0.20ms | -68.52% |
| p99 | 0.09ms | 0.34ms | -0.25ms | -73.48% |
| mean | 0.07ms | 0.11ms | -0.04ms | -33.53% |
| min | 0.06ms | 0.07ms | -0.01ms | -13.74% |
| max | 0.09ms | 0.36ms | -0.27ms | -74.47% |
| total | 1.48ms | 2.22ms | -0.75ms | -33.53% |

### multi_field_validate_batch (5 provider-mixed validate)

# Perf Report — multi_field_validate_batch (5 provider-mixed validate).serial

| metric | value |
|---|---|
| iterations | 20 |
| warmup | 3 |
| p50 | 0.00ms |
| p95 | 0.00ms |
| p99 | 0.00ms |
| mean | 0.00ms |
| stdev | 0.00ms |
| min | 0.00ms |
| max | 0.01ms |
| total | 0.05ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p50 | 0.00ms | 0.00ms | -0.00ms | -13.58% |
| p95 | 0.00ms | 0.00ms | -0.00ms | -19.02% |
| p99 | 0.00ms | 0.01ms | -0.00ms | -8.43% |
| mean | 0.00ms | 0.00ms | -0.00ms | -13.08% |
| min | 0.00ms | 0.00ms | -0.00ms | -13.24% |
| max | 0.01ms | 0.01ms | -0.00ms | -6.63% |
| total | 0.05ms | 0.06ms | -0.01ms | -13.08% |

### submit_error_handling (5 required-missing → onError catch)

# Perf Report — submit_error_handling (5 required-missing → onError catch).serial

| metric | value |
|---|---|
| iterations | 20 |
| warmup | 3 |
| p50 | 0.03ms |
| p95 | 0.04ms |
| p99 | 0.12ms |
| mean | 0.03ms |
| stdev | 0.03ms |
| min | 0.02ms |
| max | 0.15ms |
| total | 0.65ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p50 | 0.03ms | 0.04ms | -0.02ms | -39.19% |
| p95 | 0.04ms | 0.06ms | -0.02ms | -31.33% |
| p99 | 0.12ms | 0.06ms | +0.07ms | +113.98% |
| mean | 0.03ms | 0.04ms | -0.01ms | -23.55% |
| min | 0.02ms | 0.03ms | -0.01ms | -24.21% |
| max | 0.15ms | 0.06ms | +0.09ms | +149.65% |
| total | 0.65ms | 0.86ms | -0.20ms | -23.55% |

