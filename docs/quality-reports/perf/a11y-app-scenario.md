# Perf Suite — a11y-app-scenario

Threshold source: [docs/quality/perf-thresholds.md](../../quality/perf-thresholds)

測定系の分解能 = 0.00025ms (何もしない関数を同じ経路で呼んだ時の p10)。 回帰判定の絶対下限は既定でこの 2 倍 = 0.00050ms、 op ごとの実効値は下表の「下限」 列。

## Serial (concurrency = 1)

| op | p10 (回帰判定) | p95 (上限判定) | cap | 下限 | gate | regression |
|---|---|---|---|---|---|---|
| audit_workflow (3 fixture runAxe cycle) | 19.05ms | 22.44ms | 1200ms | 0.00050ms | PASS | improved — gate 無効 (regressionGate=false) |
| violation_report_batch (2 dirty runAxe + reportViolations) | 15.94ms | 25.04ms | 900ms | 0.00050ms | PASS | stable — gate 無効 (regressionGate=false) |
| audit_error_handling (3 invalid-context throw + catch) | 12.72ms | 44.49ms | 100ms | 0.00050ms | PASS | improved — gate 無効 (regressionGate=false) |

## Concurrent p95 (concurrency = 4, 5 iter each)

| op | p95 | cap | gate |
|---|---|---|---|
| audit_workflow (3 fixture runAxe cycle) | 82.89ms | 2400ms | PASS |
| violation_report_batch (2 dirty runAxe + reportViolations) | 92.98ms | 1800ms | PASS |
| audit_error_handling (3 invalid-context throw + catch) | 71.46ms | 200ms | PASS |

## Memory retention (20 iter, arrayBuffers axis is the gate; heap is informational)

| op | heapUsed Δ | arrayBuffers Δ | cap | gc exposed | verdict |
|---|---|---|---|---|---|
| audit_workflow (3 fixture runAxe cycle) | -295248 B | -16404 B | 102400 B | yes | PASS |
| violation_report_batch (2 dirty runAxe + reportViolations) | 7392 B | 8207 B | 102400 B | yes | PASS |
| audit_error_handling (3 invalid-context throw + catch) | -102040 B | -75 B | 102400 B | yes | PASS |

## Detailed serial reports

### audit_workflow (3 fixture runAxe cycle)

# Perf Report — audit_workflow (3 fixture runAxe cycle).serial

| metric | value |
|---|---|
| iterations | 20 |
| warmup | 3 |
| p10 | 19.05ms |
| p50 | 20.81ms |
| p95 | 22.44ms |
| p99 | 24.70ms |
| mean | 20.64ms |
| stdev | 1.77ms |
| min | 16.97ms |
| max | 25.27ms |
| total | 412.84ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 19.05ms | 25.70ms | -6.65ms | -25.88% |
| p50 | 20.81ms | 35.32ms | -14.51ms | -41.08% |
| p95 | 22.44ms | 123.96ms | -101.52ms | -81.89% |
| p99 | 24.70ms | 131.12ms | -106.42ms | -81.16% |
| mean | 20.64ms | 54.09ms | -33.45ms | -61.84% |
| min | 16.97ms | 22.21ms | -5.24ms | -23.61% |
| max | 25.27ms | 132.91ms | -107.64ms | -80.99% |
| total | 412.84ms | 1081.80ms | -668.96ms | -61.84% |

### violation_report_batch (2 dirty runAxe + reportViolations)

# Perf Report — violation_report_batch (2 dirty runAxe + reportViolations).serial

| metric | value |
|---|---|
| iterations | 20 |
| warmup | 3 |
| p10 | 15.94ms |
| p50 | 18.30ms |
| p95 | 25.04ms |
| p99 | 31.39ms |
| mean | 19.25ms |
| stdev | 3.98ms |
| min | 15.39ms |
| max | 32.97ms |
| total | 385.05ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 15.94ms | 16.57ms | -0.63ms | -3.81% |
| p50 | 18.30ms | 18.35ms | -0.05ms | -0.27% |
| p95 | 25.04ms | 23.78ms | +1.26ms | +5.31% |
| p99 | 31.39ms | 24.53ms | +6.86ms | +27.95% |
| mean | 19.25ms | 19.36ms | -0.11ms | -0.55% |
| min | 15.39ms | 15.86ms | -0.47ms | -2.95% |
| max | 32.97ms | 24.72ms | +8.26ms | +33.40% |
| total | 385.05ms | 387.18ms | -2.14ms | -0.55% |

### audit_error_handling (3 invalid-context throw + catch)

# Perf Report — audit_error_handling (3 invalid-context throw + catch).serial

| metric | value |
|---|---|
| iterations | 20 |
| warmup | 3 |
| p10 | 12.72ms |
| p50 | 14.87ms |
| p95 | 44.49ms |
| p99 | 47.98ms |
| mean | 18.40ms |
| stdev | 9.96ms |
| min | 11.55ms |
| max | 48.85ms |
| total | 367.95ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 12.72ms | 18.67ms | -5.94ms | -31.83% |
| p50 | 14.87ms | 21.23ms | -6.36ms | -29.97% |
| p95 | 44.49ms | 39.98ms | +4.52ms | +11.30% |
| p99 | 47.98ms | 44.57ms | +3.41ms | +7.65% |
| mean | 18.40ms | 23.64ms | -5.24ms | -22.17% |
| min | 11.55ms | 15.30ms | -3.75ms | -24.49% |
| max | 48.85ms | 45.71ms | +3.13ms | +6.86% |
| total | 367.95ms | 472.76ms | -104.81ms | -22.17% |

