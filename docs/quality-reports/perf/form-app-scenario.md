# Perf Suite — form-app-scenario

Threshold source: [docs/quality/perf-thresholds.md](../../quality/perf-thresholds)

## Serial p95 (concurrency = 1)

| op | p95 | cap | gate | regression |
|---|---|---|---|---|
| signup_workflow (10 register+submit cycle) | 0.10ms | 100ms | PASS | stable |
| multi_field_validate_batch (5 provider-mixed validate) | 0.01ms | 100ms | PASS | stable |
| submit_error_handling (5 required-missing → onError catch) | 0.04ms | 100ms | PASS | stable |

## Concurrent p95 (concurrency = 4, 5 iter each)

| op | p95 | cap | gate |
|---|---|---|---|
| signup_workflow (10 register+submit cycle) | 0.39ms | 200ms | PASS |
| multi_field_validate_batch (5 provider-mixed validate) | 0.02ms | 200ms | PASS |
| submit_error_handling (5 required-missing → onError catch) | 0.14ms | 200ms | PASS |

## Memory retention (20 iter, arrayBuffers axis is the gate; heap is informational)

| op | heapUsed Δ | arrayBuffers Δ | cap | gc exposed | verdict |
|---|---|---|---|---|---|
| signup_workflow (10 register+submit cycle) | 20144 B | 0 B | 102400 B | yes | PASS |
| multi_field_validate_batch (5 provider-mixed validate) | 3264 B | 0 B | 102400 B | yes | PASS |
| submit_error_handling (5 required-missing → onError catch) | 6472 B | 0 B | 102400 B | yes | PASS |

## Detailed serial reports

### signup_workflow (10 register+submit cycle)

# Perf Report — signup_workflow (10 register+submit cycle).serial

| metric | value |
|---|---|
| iterations | 20 |
| warmup | 3 |
| p50 | 0.08ms |
| p95 | 0.10ms |
| p99 | 0.10ms |
| mean | 0.09ms |
| stdev | 0.01ms |
| min | 0.07ms |
| max | 0.10ms |
| total | 1.70ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p50 | 0.08ms | 0.08ms | +0.01ms | +9.24% |
| p95 | 0.10ms | 0.28ms | -0.18ms | -64.95% |
| p99 | 0.10ms | 0.34ms | -0.24ms | -70.47% |
| mean | 0.09ms | 0.11ms | -0.03ms | -23.49% |
| min | 0.07ms | 0.07ms | -0.00ms | -1.66% |
| max | 0.10ms | 0.36ms | -0.26ms | -71.57% |
| total | 1.70ms | 2.22ms | -0.52ms | -23.49% |

### multi_field_validate_batch (5 provider-mixed validate)

# Perf Report — multi_field_validate_batch (5 provider-mixed validate).serial

| metric | value |
|---|---|
| iterations | 20 |
| warmup | 3 |
| p50 | 0.01ms |
| p95 | 0.01ms |
| p99 | 0.01ms |
| mean | 0.01ms |
| stdev | 0.00ms |
| min | 0.01ms |
| max | 0.01ms |
| total | 0.13ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p50 | 0.01ms | 0.00ms | +0.00ms | +104.29% |
| p95 | 0.01ms | 0.00ms | +0.00ms | +93.72% |
| p99 | 0.01ms | 0.01ms | +0.00ms | +85.89% |
| mean | 0.01ms | 0.00ms | +0.00ms | +101.55% |
| min | 0.01ms | 0.00ms | +0.00ms | +107.38% |
| max | 0.01ms | 0.01ms | +0.00ms | +84.56% |
| total | 0.13ms | 0.06ms | +0.06ms | +101.55% |

### submit_error_handling (5 required-missing → onError catch)

# Perf Report — submit_error_handling (5 required-missing → onError catch).serial

| metric | value |
|---|---|
| iterations | 20 |
| warmup | 3 |
| p50 | 0.03ms |
| p95 | 0.04ms |
| p99 | 0.04ms |
| mean | 0.03ms |
| stdev | 0.00ms |
| min | 0.03ms |
| max | 0.04ms |
| total | 0.62ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p50 | 0.03ms | 0.04ms | -0.01ms | -33.01% |
| p95 | 0.04ms | 0.06ms | -0.02ms | -28.51% |
| p99 | 0.04ms | 0.06ms | -0.02ms | -26.46% |
| mean | 0.03ms | 0.04ms | -0.01ms | -27.31% |
| min | 0.03ms | 0.03ms | -0.00ms | -15.77% |
| max | 0.04ms | 0.06ms | -0.02ms | -25.96% |
| total | 0.62ms | 0.86ms | -0.23ms | -27.31% |

