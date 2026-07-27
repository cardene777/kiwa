# Perf Suite — a11y-app-scenario

Threshold source: [docs/quality/perf-thresholds.md](../../quality/perf-thresholds)

## Serial p95 (concurrency = 1)

| op | p95 | cap | gate | regression |
|---|---|---|---|---|
| audit_workflow (3 fixture runAxe cycle) | 27.65ms | 1200ms | PASS | regressed |
| violation_report_batch (2 dirty runAxe + reportViolations) | 20.68ms | 900ms | PASS | regressed |
| audit_error_handling (3 invalid-context throw + catch) | 24.25ms | 100ms | PASS | regressed |

## Concurrent p95 (concurrency = 4, 5 iter each)

| op | p95 | cap | gate |
|---|---|---|---|
| audit_workflow (3 fixture runAxe cycle) | 90.44ms | 2400ms | PASS |
| violation_report_batch (2 dirty runAxe + reportViolations) | 72.19ms | 1800ms | PASS |
| audit_error_handling (3 invalid-context throw + catch) | 56.15ms | 200ms | PASS |

## Memory retention (20 iter, arrayBuffers axis is the gate; heap is informational)

| op | heapUsed Δ | arrayBuffers Δ | cap | gc exposed | verdict |
|---|---|---|---|---|---|
| audit_workflow (3 fixture runAxe cycle) | -311040 B | 0 B | 102400 B | yes | PASS |
| violation_report_batch (2 dirty runAxe + reportViolations) | 47608 B | 0 B | 102400 B | yes | PASS |
| audit_error_handling (3 invalid-context throw + catch) | 193992 B | 0 B | 102400 B | yes | PASS |

## Detailed serial reports

### audit_workflow (3 fixture runAxe cycle)

# Perf Report — audit_workflow (3 fixture runAxe cycle).serial

| metric | value |
|---|---|
| iterations | 20 |
| warmup | 3 |
| p50 | 21.96ms |
| p95 | 27.65ms |
| p99 | 30.58ms |
| mean | 22.94ms |
| stdev | 2.80ms |
| min | 19.63ms |
| max | 31.31ms |
| total | 458.72ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p50 | 21.96ms | 20.76ms | +1.20ms | +5.79% |
| p95 | 27.65ms | 22.67ms | +4.98ms | +21.97% |
| p99 | 30.58ms | 22.93ms | +7.65ms | +33.37% |
| mean | 22.94ms | 20.84ms | +2.10ms | +10.08% |
| min | 19.63ms | 18.30ms | +1.34ms | +7.30% |
| max | 31.31ms | 23.00ms | +8.32ms | +36.17% |
| total | 458.72ms | 416.73ms | +42.00ms | +10.08% |

### violation_report_batch (2 dirty runAxe + reportViolations)

# Perf Report — violation_report_batch (2 dirty runAxe + reportViolations).serial

| metric | value |
|---|---|
| iterations | 20 |
| warmup | 3 |
| p50 | 16.78ms |
| p95 | 20.68ms |
| p99 | 22.22ms |
| mean | 17.00ms |
| stdev | 1.79ms |
| min | 15.06ms |
| max | 22.60ms |
| total | 340.00ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p50 | 16.78ms | 14.72ms | +2.05ms | +13.95% |
| p95 | 20.68ms | 15.81ms | +4.87ms | +30.83% |
| p99 | 22.22ms | 16.18ms | +6.03ms | +37.29% |
| mean | 17.00ms | 14.81ms | +2.19ms | +14.80% |
| min | 15.06ms | 13.84ms | +1.22ms | +8.82% |
| max | 22.60ms | 16.28ms | +6.32ms | +38.86% |
| total | 340.00ms | 296.16ms | +43.84ms | +14.80% |

### audit_error_handling (3 invalid-context throw + catch)

# Perf Report — audit_error_handling (3 invalid-context throw + catch).serial

| metric | value |
|---|---|
| iterations | 20 |
| warmup | 3 |
| p50 | 14.91ms |
| p95 | 24.25ms |
| p99 | 27.97ms |
| mean | 16.54ms |
| stdev | 4.74ms |
| min | 11.13ms |
| max | 28.90ms |
| total | 330.71ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p50 | 14.91ms | 12.44ms | +2.47ms | +19.83% |
| p95 | 24.25ms | 13.00ms | +11.25ms | +86.53% |
| p99 | 27.97ms | 13.32ms | +14.66ms | +110.06% |
| mean | 16.54ms | 12.19ms | +4.35ms | +35.67% |
| min | 11.13ms | 10.22ms | +0.92ms | +8.98% |
| max | 28.90ms | 13.40ms | +15.51ms | +115.77% |
| total | 330.71ms | 243.77ms | +86.94ms | +35.67% |

