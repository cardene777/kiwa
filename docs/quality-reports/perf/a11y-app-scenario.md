# Perf Suite — a11y-app-scenario

Threshold source: [docs/quality/perf-thresholds.md](../../quality/perf-thresholds)

## Serial p95 (concurrency = 1)

| op | p95 | cap | gate | regression |
|---|---|---|---|---|
| audit_workflow (3 fixture runAxe cycle) | 39.03ms | 1200ms | PASS | stable — gate 対象外 (jsdom + axe-core の実行時間が実行ごとに 2 倍以上動く (#1718)) |
| violation_report_batch (2 dirty runAxe + reportViolations) | 29.48ms | 900ms | PASS | improved — gate 対象外 (jsdom + axe-core の実行時間が実行ごとに 2 倍以上動く (#1718)) |
| audit_error_handling (3 invalid-context throw + catch) | 34.92ms | 100ms | PASS | stable — gate 対象外 (jsdom + axe-core の実行時間が実行ごとに 2 倍以上動く (#1718)) |

## Concurrent p95 (concurrency = 4, 5 iter each)

| op | p95 | cap | gate |
|---|---|---|---|
| audit_workflow (3 fixture runAxe cycle) | 137.11ms | 2400ms | PASS |
| violation_report_batch (2 dirty runAxe + reportViolations) | 110.06ms | 1800ms | PASS |
| audit_error_handling (3 invalid-context throw + catch) | 123.12ms | 200ms | PASS |

## Memory retention (20 iter, arrayBuffers axis is the gate; heap is informational)

| op | heapUsed Δ | arrayBuffers Δ | cap | gc exposed | verdict |
|---|---|---|---|---|---|
| audit_workflow (3 fixture runAxe cycle) | -316600 B | 0 B | 102400 B | yes | PASS |
| violation_report_batch (2 dirty runAxe + reportViolations) | -16880 B | 0 B | 102400 B | yes | PASS |
| audit_error_handling (3 invalid-context throw + catch) | -138728 B | 0 B | 102400 B | yes | PASS |

## Detailed serial reports

### audit_workflow (3 fixture runAxe cycle)

# Perf Report — audit_workflow (3 fixture runAxe cycle).serial

| metric | value |
|---|---|
| iterations | 20 |
| warmup | 3 |
| p50 | 29.42ms |
| p95 | 39.03ms |
| p99 | 44.08ms |
| mean | 30.39ms |
| stdev | 5.44ms |
| min | 24.66ms |
| max | 45.34ms |
| total | 607.83ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p50 | 29.42ms | 25.28ms | +4.15ms | +16.41% |
| p95 | 39.03ms | 39.77ms | -0.74ms | -1.86% |
| p99 | 44.08ms | 58.55ms | -14.48ms | -24.72% |
| mean | 30.39ms | 28.34ms | +2.06ms | +7.25% |
| min | 24.66ms | 18.12ms | +6.55ms | +36.14% |
| max | 45.34ms | 224.01ms | -178.67ms | -79.76% |
| total | 607.83ms | 3542.03ms | -2934.20ms | -82.84% |

### violation_report_batch (2 dirty runAxe + reportViolations)

# Perf Report — violation_report_batch (2 dirty runAxe + reportViolations).serial

| metric | value |
|---|---|
| iterations | 20 |
| warmup | 3 |
| p50 | 23.03ms |
| p95 | 29.48ms |
| p99 | 29.75ms |
| mean | 23.38ms |
| stdev | 3.08ms |
| min | 18.85ms |
| max | 29.82ms |
| total | 467.54ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p50 | 23.03ms | 27.39ms | -4.36ms | -15.92% |
| p95 | 29.48ms | 65.73ms | -36.25ms | -55.15% |
| p99 | 29.75ms | 217.12ms | -187.37ms | -86.30% |
| mean | 23.38ms | 36.08ms | -12.71ms | -35.21% |
| min | 18.85ms | 17.17ms | +1.68ms | +9.79% |
| max | 29.82ms | 256.64ms | -226.83ms | -88.38% |
| total | 467.54ms | 4510.27ms | -4042.73ms | -89.63% |

### audit_error_handling (3 invalid-context throw + catch)

# Perf Report — audit_error_handling (3 invalid-context throw + catch).serial

| metric | value |
|---|---|
| iterations | 20 |
| warmup | 3 |
| p50 | 27.04ms |
| p95 | 34.92ms |
| p99 | 36.11ms |
| mean | 26.41ms |
| stdev | 5.81ms |
| min | 16.41ms |
| max | 36.40ms |
| total | 528.16ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p50 | 27.04ms | 18.33ms | +8.71ms | +47.52% |
| p95 | 34.92ms | 34.05ms | +0.87ms | +2.55% |
| p99 | 36.11ms | 54.85ms | -18.74ms | -34.17% |
| mean | 26.41ms | 20.66ms | +5.75ms | +27.80% |
| min | 16.41ms | 11.31ms | +5.10ms | +45.07% |
| max | 36.40ms | 88.83ms | -52.42ms | -59.02% |
| total | 528.16ms | 2582.86ms | -2054.70ms | -79.55% |

