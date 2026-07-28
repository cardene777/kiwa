# Perf Suite — form-app-scenario

Threshold source: [docs/quality/perf-thresholds.md](../../quality/perf-thresholds)

## Serial p95 (concurrency = 1)

| op | p95 | cap | gate | regression |
|---|---|---|---|---|
| signup_workflow (10 register+submit cycle) | 0.46ms | 100ms | PASS | stable (差 0.37ms が下限 0.5ms 未満で判定を保留) |
| multi_field_validate_batch (5 provider-mixed validate) | 0.00ms | 100ms | PASS | stable (検知には +0.5ms (baseline 比 +14458%) 以上の悪化が必要) |
| submit_error_handling (5 required-missing → onError catch) | 0.10ms | 100ms | PASS | stable (差 0.07ms が下限 0.5ms 未満で判定を保留) |

## Concurrent p95 (concurrency = 4, 5 iter each)

| op | p95 | cap | gate |
|---|---|---|---|
| signup_workflow (10 register+submit cycle) | 1.95ms | 200ms | PASS |
| multi_field_validate_batch (5 provider-mixed validate) | 0.16ms | 200ms | PASS |
| submit_error_handling (5 required-missing → onError catch) | 0.11ms | 200ms | PASS |

## Memory retention (20 iter, arrayBuffers axis is the gate; heap is informational)

| op | heapUsed Δ | arrayBuffers Δ | cap | gc exposed | verdict |
|---|---|---|---|---|---|
| signup_workflow (10 register+submit cycle) | -258368 B | 0 B | 102400 B | yes | PASS |
| multi_field_validate_batch (5 provider-mixed validate) | -552 B | 0 B | 102400 B | yes | PASS |
| submit_error_handling (5 required-missing → onError catch) | 12648 B | 0 B | 102400 B | yes | PASS |

## Detailed serial reports

### signup_workflow (10 register+submit cycle)

# Perf Report — signup_workflow (10 register+submit cycle).serial

| metric | value |
|---|---|
| iterations | 20 |
| warmup | 3 |
| p50 | 0.16ms |
| p95 | 0.46ms |
| p99 | 0.59ms |
| mean | 0.20ms |
| stdev | 0.15ms |
| min | 0.07ms |
| max | 0.62ms |
| total | 4.06ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p50 | 0.16ms | 0.08ms | +0.08ms | +102.08% |
| p95 | 0.46ms | 0.09ms | +0.37ms | +401.75% |
| p99 | 0.59ms | 0.09ms | +0.49ms | +532.47% |
| mean | 0.20ms | 0.08ms | +0.12ms | +148.28% |
| min | 0.07ms | 0.07ms | -0.00ms | -1.49% |
| max | 0.62ms | 0.09ms | +0.52ms | +565.10% |
| total | 4.06ms | 1.64ms | +2.43ms | +148.28% |

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
| total | 0.06ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p50 | 0.00ms | 0.00ms | -0.00ms | -5.95% |
| p95 | 0.00ms | 0.00ms | +0.00ms | +20.60% |
| p99 | 0.00ms | 0.00ms | +0.00ms | +3.02% |
| mean | 0.00ms | 0.00ms | +0.00ms | +5.70% |
| min | 0.00ms | 0.00ms | -0.00ms | -7.68% |
| max | 0.01ms | 0.01ms | 0.00ms | 0.00% |
| total | 0.06ms | 0.06ms | +0.00ms | +5.70% |

### submit_error_handling (5 required-missing → onError catch)

# Perf Report — submit_error_handling (5 required-missing → onError catch).serial

| metric | value |
|---|---|
| iterations | 20 |
| warmup | 3 |
| p50 | 0.03ms |
| p95 | 0.10ms |
| p99 | 0.28ms |
| mean | 0.05ms |
| stdev | 0.07ms |
| min | 0.02ms |
| max | 0.33ms |
| total | 1.05ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p50 | 0.03ms | 0.03ms | +0.01ms | +28.41% |
| p95 | 0.10ms | 0.03ms | +0.07ms | +232.91% |
| p99 | 0.28ms | 0.03ms | +0.25ms | +723.30% |
| mean | 0.05ms | 0.03ms | +0.03ms | +98.04% |
| min | 0.02ms | 0.02ms | -0.00ms | -5.08% |
| max | 0.33ms | 0.04ms | +0.29ms | +824.73% |
| total | 1.05ms | 0.53ms | +0.52ms | +98.04% |

