# Perf Suite — a11y-app-scenario

Threshold source: [docs/quality/perf-thresholds.md](../../quality/perf-thresholds)

## Serial p95 (concurrency = 1)

| op | p95 | cap | gate | regression |
|---|---|---|---|---|
| audit_workflow (3 fixture runAxe cycle) | 20.54ms | 1200ms | PASS | stable |
| violation_report_batch (2 dirty runAxe + reportViolations) | 14.05ms | 900ms | PASS | stable |
| audit_error_handling (3 invalid-context throw + catch) | 12.56ms | 100ms | PASS | stable |

## Concurrent p95 (concurrency = 4, 5 iter each)

| op | p95 | cap | gate |
|---|---|---|---|
| audit_workflow (3 fixture runAxe cycle) | 75.00ms | 2400ms | PASS |
| violation_report_batch (2 dirty runAxe + reportViolations) | 61.97ms | 1800ms | PASS |
| audit_error_handling (3 invalid-context throw + catch) | 48.18ms | 200ms | PASS |

## Memory retention (20 iter, arrayBuffers axis is the gate; heap is informational)

| op | heapUsed Δ | arrayBuffers Δ | cap | verdict |
|---|---|---|---|---|
| audit_workflow (3 fixture runAxe cycle) | -6526592 B | -8217 B | 102400 B | PASS |
| violation_report_batch (2 dirty runAxe + reportViolations) | -16980184 B | -8217 B | 102400 B | PASS |
| audit_error_handling (3 invalid-context throw + catch) | 37425944 B | 60 B | 102400 B | PASS |

## Detailed serial reports

### audit_workflow (3 fixture runAxe cycle)

# Perf Report — audit_workflow (3 fixture runAxe cycle).serial

| metric | value |
|---|---|
| iterations | 20 |
| warmup | 3 |
| p50 | 19.55ms |
| p95 | 20.54ms |
| p99 | 20.75ms |
| mean | 19.44ms |
| stdev | 0.84ms |
| min | 18.07ms |
| max | 20.80ms |
| total | 388.84ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p50 | 19.55ms | 19.93ms | -0.38ms | -1.92% |
| p95 | 20.54ms | 21.62ms | -1.08ms | -5.01% |
| p99 | 20.75ms | 25.62ms | -4.88ms | -19.04% |
| mean | 19.44ms | 20.10ms | -0.65ms | -3.25% |
| min | 18.07ms | 17.10ms | +0.97ms | +5.66% |
| max | 20.80ms | 26.63ms | -5.83ms | -21.89% |
| total | 388.84ms | 401.91ms | -13.07ms | -3.25% |

### violation_report_batch (2 dirty runAxe + reportViolations)

# Perf Report — violation_report_batch (2 dirty runAxe + reportViolations).serial

| metric | value |
|---|---|
| iterations | 20 |
| warmup | 3 |
| p50 | 13.48ms |
| p95 | 14.05ms |
| p99 | 14.05ms |
| mean | 13.21ms |
| stdev | 0.64ms |
| min | 12.06ms |
| max | 14.06ms |
| total | 264.29ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p50 | 13.48ms | 14.23ms | -0.76ms | -5.32% |
| p95 | 14.05ms | 15.54ms | -1.49ms | -9.56% |
| p99 | 14.05ms | 15.59ms | -1.54ms | -9.86% |
| mean | 13.21ms | 14.32ms | -1.11ms | -7.73% |
| min | 12.06ms | 13.10ms | -1.03ms | -7.89% |
| max | 14.06ms | 15.60ms | -1.55ms | -9.93% |
| total | 264.29ms | 286.43ms | -22.14ms | -7.73% |

### audit_error_handling (3 invalid-context throw + catch)

# Perf Report — audit_error_handling (3 invalid-context throw + catch).serial

| metric | value |
|---|---|
| iterations | 20 |
| warmup | 3 |
| p50 | 12.08ms |
| p95 | 12.56ms |
| p99 | 12.69ms |
| mean | 11.78ms |
| stdev | 0.80ms |
| min | 10.00ms |
| max | 12.72ms |
| total | 235.57ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p50 | 12.08ms | 11.62ms | +0.46ms | +3.92% |
| p95 | 12.56ms | 15.68ms | -3.12ms | -19.91% |
| p99 | 12.69ms | 16.53ms | -3.84ms | -23.22% |
| mean | 11.78ms | 12.26ms | -0.48ms | -3.92% |
| min | 10.00ms | 9.80ms | +0.20ms | +2.07% |
| max | 12.72ms | 16.74ms | -4.02ms | -24.00% |
| total | 235.57ms | 245.17ms | -9.61ms | -3.92% |

