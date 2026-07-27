# Perf Suite — a11y-app-scenario

Threshold source: [docs/quality/perf-thresholds.md](../../quality/perf-thresholds)

## Serial p95 (concurrency = 1)

| op | p95 | cap | gate | regression |
|---|---|---|---|---|
| audit_workflow (3 fixture runAxe cycle) | 24.27ms | 1200ms | PASS | stable |
| violation_report_batch (2 dirty runAxe + reportViolations) | 15.63ms | 900ms | PASS | stable |
| audit_error_handling (3 invalid-context throw + catch) | 12.72ms | 100ms | PASS | stable |

## Concurrent p95 (concurrency = 4, 5 iter each)

| op | p95 | cap | gate |
|---|---|---|---|
| audit_workflow (3 fixture runAxe cycle) | 81.42ms | 2400ms | PASS |
| violation_report_batch (2 dirty runAxe + reportViolations) | 62.99ms | 1800ms | PASS |
| audit_error_handling (3 invalid-context throw + catch) | 49.87ms | 200ms | PASS |

## Memory retention (20 iter, arrayBuffers axis is the gate; heap is informational)

| op | heapUsed Δ | arrayBuffers Δ | cap | gc exposed | verdict |
|---|---|---|---|---|---|
| audit_workflow (3 fixture runAxe cycle) | -301064 B | 0 B | 102400 B | yes | PASS |
| violation_report_batch (2 dirty runAxe + reportViolations) | 12432 B | 0 B | 102400 B | yes | PASS |
| audit_error_handling (3 invalid-context throw + catch) | 171248 B | 0 B | 102400 B | yes | PASS |

## Detailed serial reports

### audit_workflow (3 fixture runAxe cycle)

# Perf Report — audit_workflow (3 fixture runAxe cycle).serial

| metric | value |
|---|---|
| iterations | 20 |
| warmup | 3 |
| p50 | 20.14ms |
| p95 | 24.27ms |
| p99 | 28.48ms |
| mean | 20.89ms |
| stdev | 2.60ms |
| min | 18.13ms |
| max | 29.53ms |
| total | 417.79ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p50 | 20.14ms | 20.76ms | -0.62ms | -2.98% |
| p95 | 24.27ms | 22.67ms | +1.60ms | +7.06% |
| p99 | 28.48ms | 22.93ms | +5.55ms | +24.21% |
| mean | 20.89ms | 20.84ms | +0.05ms | +0.25% |
| min | 18.13ms | 18.30ms | -0.16ms | -0.89% |
| max | 29.53ms | 23.00ms | +6.54ms | +28.43% |
| total | 417.79ms | 416.73ms | +1.06ms | +0.25% |

### violation_report_batch (2 dirty runAxe + reportViolations)

# Perf Report — violation_report_batch (2 dirty runAxe + reportViolations).serial

| metric | value |
|---|---|
| iterations | 20 |
| warmup | 3 |
| p50 | 14.25ms |
| p95 | 15.63ms |
| p99 | 18.27ms |
| mean | 14.38ms |
| stdev | 1.25ms |
| min | 13.16ms |
| max | 18.93ms |
| total | 287.69ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p50 | 14.25ms | 14.72ms | -0.48ms | -3.23% |
| p95 | 15.63ms | 15.81ms | -0.17ms | -1.11% |
| p99 | 18.27ms | 16.18ms | +2.09ms | +12.90% |
| mean | 14.38ms | 14.81ms | -0.42ms | -2.86% |
| min | 13.16ms | 13.84ms | -0.68ms | -4.91% |
| max | 18.93ms | 16.28ms | +2.65ms | +16.30% |
| total | 287.69ms | 296.16ms | -8.47ms | -2.86% |

### audit_error_handling (3 invalid-context throw + catch)

# Perf Report — audit_error_handling (3 invalid-context throw + catch).serial

| metric | value |
|---|---|
| iterations | 20 |
| warmup | 3 |
| p50 | 11.78ms |
| p95 | 12.72ms |
| p99 | 13.09ms |
| mean | 11.79ms |
| stdev | 0.72ms |
| min | 10.30ms |
| max | 13.18ms |
| total | 235.79ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p50 | 11.78ms | 12.44ms | -0.67ms | -5.35% |
| p95 | 12.72ms | 13.00ms | -0.28ms | -2.14% |
| p99 | 13.09ms | 13.32ms | -0.23ms | -1.73% |
| mean | 11.79ms | 12.19ms | -0.40ms | -3.27% |
| min | 10.30ms | 10.22ms | +0.08ms | +0.81% |
| max | 13.18ms | 13.40ms | -0.22ms | -1.63% |
| total | 235.79ms | 243.77ms | -7.98ms | -3.27% |

