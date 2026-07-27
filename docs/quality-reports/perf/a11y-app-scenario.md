# Perf Suite — a11y-app-scenario

Threshold source: [docs/quality/perf-thresholds.md](../../quality/perf-thresholds)

## Serial p95 (concurrency = 1)

| op | p95 | cap | gate | regression |
|---|---|---|---|---|
| audit_workflow (3 fixture runAxe cycle) | 23.06ms | 1200ms | PASS | stable |
| violation_report_batch (2 dirty runAxe + reportViolations) | 16.79ms | 900ms | PASS | stable |
| audit_error_handling (3 invalid-context throw + catch) | 13.51ms | 100ms | PASS | stable |

## Concurrent p95 (concurrency = 4, 5 iter each)

| op | p95 | cap | gate |
|---|---|---|---|
| audit_workflow (3 fixture runAxe cycle) | 83.25ms | 2400ms | PASS |
| violation_report_batch (2 dirty runAxe + reportViolations) | 62.89ms | 1800ms | PASS |
| audit_error_handling (3 invalid-context throw + catch) | 52.84ms | 200ms | PASS |

## Memory retention (20 iter, arrayBuffers axis is the gate; heap is informational)

| op | heapUsed Δ | arrayBuffers Δ | cap | gc exposed | verdict |
|---|---|---|---|---|---|
| audit_workflow (3 fixture runAxe cycle) | -289784 B | -32813 B | 102400 B | yes | PASS |
| violation_report_batch (2 dirty runAxe + reportViolations) | 20352 B | 0 B | 102400 B | yes | PASS |
| audit_error_handling (3 invalid-context throw + catch) | 213920 B | 0 B | 102400 B | yes | PASS |

## Detailed serial reports

### audit_workflow (3 fixture runAxe cycle)

# Perf Report — audit_workflow (3 fixture runAxe cycle).serial

| metric | value |
|---|---|
| iterations | 20 |
| warmup | 3 |
| p50 | 20.64ms |
| p95 | 23.06ms |
| p99 | 25.82ms |
| mean | 20.59ms |
| stdev | 2.00ms |
| min | 17.22ms |
| max | 26.51ms |
| total | 411.71ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p50 | 20.64ms | 20.76ms | -0.12ms | -0.58% |
| p95 | 23.06ms | 22.67ms | +0.39ms | +1.71% |
| p99 | 25.82ms | 22.93ms | +2.89ms | +12.59% |
| mean | 20.59ms | 20.84ms | -0.25ms | -1.20% |
| min | 17.22ms | 18.30ms | -1.08ms | -5.90% |
| max | 26.51ms | 23.00ms | +3.51ms | +15.27% |
| total | 411.71ms | 416.73ms | -5.01ms | -1.20% |

### violation_report_batch (2 dirty runAxe + reportViolations)

# Perf Report — violation_report_batch (2 dirty runAxe + reportViolations).serial

| metric | value |
|---|---|
| iterations | 20 |
| warmup | 3 |
| p50 | 15.97ms |
| p95 | 16.79ms |
| p99 | 17.24ms |
| mean | 15.78ms |
| stdev | 0.95ms |
| min | 13.45ms |
| max | 17.35ms |
| total | 315.64ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p50 | 15.97ms | 14.72ms | +1.25ms | +8.48% |
| p95 | 16.79ms | 15.81ms | +0.98ms | +6.18% |
| p99 | 17.24ms | 16.18ms | +1.06ms | +6.53% |
| mean | 15.78ms | 14.81ms | +0.97ms | +6.58% |
| min | 13.45ms | 13.84ms | -0.39ms | -2.82% |
| max | 17.35ms | 16.28ms | +1.08ms | +6.61% |
| total | 315.64ms | 296.16ms | +19.48ms | +6.58% |

### audit_error_handling (3 invalid-context throw + catch)

# Perf Report — audit_error_handling (3 invalid-context throw + catch).serial

| metric | value |
|---|---|
| iterations | 20 |
| warmup | 3 |
| p50 | 12.38ms |
| p95 | 13.51ms |
| p99 | 13.90ms |
| mean | 12.23ms |
| stdev | 1.02ms |
| min | 10.30ms |
| max | 13.99ms |
| total | 244.55ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p50 | 12.38ms | 12.44ms | -0.06ms | -0.45% |
| p95 | 13.51ms | 13.00ms | +0.51ms | +3.92% |
| p99 | 13.90ms | 13.32ms | +0.58ms | +4.35% |
| mean | 12.23ms | 12.19ms | +0.04ms | +0.32% |
| min | 10.30ms | 10.22ms | +0.09ms | +0.85% |
| max | 13.99ms | 13.40ms | +0.60ms | +4.45% |
| total | 244.55ms | 243.77ms | +0.78ms | +0.32% |

