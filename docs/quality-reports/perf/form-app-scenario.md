# Perf Suite — form-app-scenario

Threshold source: [docs/quality/perf-thresholds.md](../../quality/perf-thresholds)

## Serial p95 (concurrency = 1)

| op | p95 | cap | gate | regression |
|---|---|---|---|---|
| signup_workflow (10 register+submit cycle) | 4.43ms | 100ms | PASS | regressed — gate 無効 (regressionGate=false) |
| multi_field_validate_batch (5 provider-mixed validate) | 0.01ms | 100ms | PASS | stable (差 0.00ms が下限 0.5ms 未満で判定を保留) — gate 無効 (regressionGate=false) |
| submit_error_handling (5 required-missing → onError catch) | 0.11ms | 100ms | PASS | stable (差 0.08ms が下限 0.5ms 未満で判定を保留) — gate 無効 (regressionGate=false) |

## Concurrent p95 (concurrency = 4, 5 iter each)

| op | p95 | cap | gate |
|---|---|---|---|
| signup_workflow (10 register+submit cycle) | 0.47ms | 200ms | PASS |
| multi_field_validate_batch (5 provider-mixed validate) | 0.01ms | 200ms | PASS |
| submit_error_handling (5 required-missing → onError catch) | 0.55ms | 200ms | PASS |

## Memory retention (20 iter, arrayBuffers axis is the gate; heap is informational)

| op | heapUsed Δ | arrayBuffers Δ | cap | gc exposed | verdict |
|---|---|---|---|---|---|
| signup_workflow (10 register+submit cycle) | 52784 B | -10058 B | 102400 B | yes | PASS |
| multi_field_validate_batch (5 provider-mixed validate) | 480 B | 0 B | 102400 B | yes | PASS |
| submit_error_handling (5 required-missing → onError catch) | 12800 B | 0 B | 102400 B | yes | PASS |

## Detailed serial reports

### signup_workflow (10 register+submit cycle)

# Perf Report — signup_workflow (10 register+submit cycle).serial

| metric | value |
|---|---|
| iterations | 20 |
| warmup | 3 |
| p50 | 0.10ms |
| p95 | 4.43ms |
| p99 | 9.57ms |
| mean | 0.89ms |
| stdev | 2.51ms |
| min | 0.07ms |
| max | 10.85ms |
| total | 17.83ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p50 | 0.10ms | 0.08ms | +0.01ms | +17.95% |
| p95 | 4.43ms | 0.09ms | +4.33ms | +4687.97% |
| p99 | 9.57ms | 0.09ms | +9.48ms | +10242.15% |
| mean | 0.89ms | 0.08ms | +0.81ms | +989.50% |
| min | 0.07ms | 0.07ms | +0.00ms | +6.98% |
| max | 10.85ms | 0.09ms | +10.76ms | +11628.91% |
| total | 17.83ms | 1.64ms | +16.20ms | +989.50% |

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
| p50 | 0.00ms | 0.00ms | -0.00ms | -0.76% |
| p95 | 0.01ms | 0.00ms | +0.00ms | +77.29% |
| p99 | 0.01ms | 0.00ms | +0.00ms | +31.76% |
| mean | 0.00ms | 0.00ms | +0.00ms | +24.54% |
| min | 0.00ms | 0.00ms | -0.00ms | -1.51% |
| max | 0.01ms | 0.01ms | +0.00ms | +23.96% |
| total | 0.07ms | 0.06ms | +0.01ms | +24.54% |

### submit_error_handling (5 required-missing → onError catch)

# Perf Report — submit_error_handling (5 required-missing → onError catch).serial

| metric | value |
|---|---|
| iterations | 20 |
| warmup | 3 |
| p50 | 0.08ms |
| p95 | 0.11ms |
| p99 | 0.14ms |
| mean | 0.08ms |
| stdev | 0.02ms |
| min | 0.07ms |
| max | 0.14ms |
| total | 1.68ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p50 | 0.08ms | 0.03ms | +0.05ms | +198.06% |
| p95 | 0.11ms | 0.03ms | +0.08ms | +278.91% |
| p99 | 0.14ms | 0.03ms | +0.10ms | +300.66% |
| mean | 0.08ms | 0.03ms | +0.06ms | +216.09% |
| min | 0.07ms | 0.02ms | +0.04ms | +170.50% |
| max | 0.14ms | 0.04ms | +0.11ms | +305.15% |
| total | 1.68ms | 0.53ms | +1.15ms | +216.09% |

